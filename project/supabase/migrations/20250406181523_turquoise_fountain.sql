/*
  # Fix robot and version deletion functionality
  
  1. Changes
    - Add proper cascading delete for robots and versions
    - Fix deletion rules and constraints
    - Add helper functions for safe deletion
    
  2. Security
    - Maintain RLS policies
    - Ensure proper ownership checks
*/

-- Drop existing rules and triggers that might conflict
DROP RULE IF EXISTS codes_delete ON codes;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;

-- Function to safely delete a robot
CREATE OR REPLACE FUNCTION delete_robot_safely(p_robot_id uuid)
RETURNS boolean AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Get robot info and verify ownership
  SELECT owner_id INTO v_owner_id
  FROM robots
  WHERE id = p_robot_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Robot not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Delete robot (versions will be deleted via CASCADE)
  DELETE FROM robots
  WHERE id = p_robot_id
  AND owner_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete a version
CREATE OR REPLACE FUNCTION delete_version_safely(p_version_id uuid)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_version_count integer;
BEGIN
  -- Get version info
  SELECT 
    robot_id,
    (SELECT COUNT(*) FROM robot_versions WHERE robot_id = rv.robot_id AND is_deleted = false)
  INTO v_robot_id, v_version_count
  FROM robot_versions rv
  WHERE id = p_version_id;

  -- Check if this is the last version
  IF v_version_count <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the last version of a robot';
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

  -- Update current_version_id if needed
  UPDATE robots
  SET current_version_id = (
    SELECT id FROM robot_versions
    WHERE robot_id = v_robot_id
    AND is_deleted = false
    AND id != p_version_id
    ORDER BY created_at DESC
    LIMIT 1
  )
  WHERE id = v_robot_id
  AND current_version_id = p_version_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler view for codes
CREATE OR REPLACE VIEW codes AS 
SELECT 
  r.id,
  r.owner_id as user_id,
  r.name as robot_name,
  'main.ntsl' as filename,
  COALESCE(rv.code, '') as code_content,
  COALESCE(rv.version_name, '1') as version,
  r.created_at,
  r.updated_at
FROM robots r
LEFT JOIN robot_versions rv ON rv.id = r.current_version_id
WHERE rv.is_deleted = false OR rv.is_deleted IS NULL;

-- Create a simple delete rule that maps to the robots table
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_robot_safely(OLD.id);