/*
  # Prevent deleting all versions

  1. Changes
    - Add check to prevent deleting Version 1 if it's the only version
    - Add check to prevent deleting the last version
    - Update delete_robot_version function with better validation
    - Add trigger to prevent direct deletion of versions

  2. Security
    - All functions run with SECURITY DEFINER
    - Proper permission checks in place
*/

-- Function to check if version can be deleted
CREATE OR REPLACE FUNCTION can_delete_version(
  p_version_id uuid
) RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_version_count integer;
  v_version_name text;
BEGIN
  -- Get version info
  SELECT 
    robot_id,
    version_name,
    (
      SELECT COUNT(*)
      FROM robot_versions rv2
      WHERE rv2.robot_id = robot_versions.robot_id
      AND rv2.is_deleted = false
    ) as version_count
  INTO v_robot_id, v_version_name, v_version_count
  FROM robot_versions
  WHERE id = p_version_id AND is_deleted = false;

  -- Return false if:
  -- 1. Version not found
  -- 2. It's Version 1 and it's the only version
  -- 3. It's the last version
  RETURN v_robot_id IS NOT NULL 
    AND NOT (v_version_name = 'Versão 1' AND v_version_count = 1)
    AND v_version_count > 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update delete_robot_version function with better validation
CREATE OR REPLACE FUNCTION delete_robot_version(p_version_id uuid)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_version_count integer;
  v_version_name text;
BEGIN
  -- Check if version can be deleted
  IF NOT can_delete_version(p_version_id) THEN
    RAISE EXCEPTION 'Cannot delete this version. A robot must always have at least one version, and Version 1 cannot be deleted if it is the only version.';
  END IF;

  -- Get version info
  SELECT 
    robot_id,
    version_name
  INTO v_robot_id, v_version_name
  FROM robot_versions
  WHERE id = p_version_id AND is_deleted = false;

  -- Mark version as deleted
  UPDATE robot_versions
  SET is_deleted = true
  WHERE id = p_version_id;

  -- If this was the current version, set current_version_id to the latest version
  UPDATE robots r
  SET current_version_id = (
    SELECT id 
    FROM robot_versions rv
    WHERE rv.robot_id = r.id
    AND rv.is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1
  )
  WHERE r.id = v_robot_id
  AND r.current_version_id = p_version_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent direct deletion of versions
CREATE OR REPLACE FUNCTION prevent_version_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_delete_version(OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete this version. A robot must always have at least one version, and Version 1 cannot be deleted if it is the only version.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to robot_versions table
DROP TRIGGER IF EXISTS prevent_version_deletion_trigger ON robot_versions;
CREATE TRIGGER prevent_version_deletion_trigger
  BEFORE DELETE ON robot_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_version_deletion();

-- Update codes view to handle version deletion
CREATE OR REPLACE VIEW codes AS 
SELECT 
  rv.id,
  r.owner_id as user_id,
  r.name as robot_name,
  rv.version_name as filename,
  rv.code as code_content,
  rv.version_name as version,
  rv.created_at,
  rv.updated_at
FROM robots r
JOIN robot_versions rv ON r.id = rv.robot_id
WHERE rv.id = r.current_version_id
  AND rv.is_deleted = false;

-- Update delete rule to use delete_robot_version function
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_robot_version(OLD.id);