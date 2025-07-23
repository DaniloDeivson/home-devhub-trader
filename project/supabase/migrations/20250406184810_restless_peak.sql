/*
  # Fix version deletion functionality

  1. Changes
    - Add user-specific version deletion check
    - Ensure proper cleanup when deleting robots
    - Fix version count check to be per robot
    - Add proper cascading for robot deletion

  2. Security
    - Add ownership checks
    - Ensure proper RLS policies
*/

-- Drop existing problematic objects
DROP VIEW IF EXISTS codes CASCADE;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;
DROP FUNCTION IF EXISTS handle_robot_deletion() CASCADE;

-- Function to handle robot deletion cleanup
CREATE OR REPLACE FUNCTION handle_robot_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all versions as deleted first
  UPDATE robot_versions
  SET is_deleted = true
  WHERE robot_id = OLD.id;

  -- Delete shared access records
  DELETE FROM shared_robots
  WHERE robot_name = OLD.name
  AND created_by = OLD.owner_id;

  -- Delete sharing invites
  DELETE FROM sharing_invites
  WHERE robot_name = OLD.name
  AND created_by = OLD.owner_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for robot deletion
CREATE TRIGGER before_delete_robot
  BEFORE DELETE ON robots
  FOR EACH ROW
  EXECUTE FUNCTION handle_robot_deletion();

-- Function to check if version can be deleted
CREATE OR REPLACE FUNCTION can_delete_version(
  p_version_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_version_count integer;
  v_owner_id uuid;
BEGIN
  -- Get version info and verify ownership
  SELECT 
    rv.robot_id,
    r.owner_id,
    (
      SELECT COUNT(*)
      FROM robot_versions rv2
      WHERE rv2.robot_id = rv.robot_id
      AND rv2.is_deleted = false
    ) as version_count
  INTO v_robot_id, v_owner_id, v_version_count
  FROM robot_versions rv
  JOIN robots r ON r.id = rv.robot_id
  WHERE rv.id = p_version_id;

  -- Return false if:
  -- 1. Version not found
  -- 2. User doesn't own the robot
  -- 3. It's the last version
  RETURN v_robot_id IS NOT NULL 
    AND v_owner_id = p_user_id
    AND v_version_count > 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete version
CREATE OR REPLACE FUNCTION delete_version(p_version_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if version can be deleted
  IF NOT can_delete_version(p_version_id, auth.uid()) THEN
    RAISE EXCEPTION 'Cannot delete this version. A robot must always have at least one version.';
  END IF;

  -- Mark version as deleted
  UPDATE robot_versions
  SET is_deleted = true
  WHERE id = p_version_id
  AND EXISTS (
    SELECT 1 FROM robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create codes view
CREATE VIEW codes AS
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
WHERE rv.is_deleted = false;

-- Create DELETE rule for codes view
CREATE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_version(OLD.id);

-- Update RLS policies
ALTER TABLE robot_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage versions of owned robots" ON robot_versions;
CREATE POLICY "Users can manage versions of owned robots"
  ON robot_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = robot_versions.robot_id
      AND robots.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = robot_versions.robot_id
      AND robots.owner_id = auth.uid()
    )
  );