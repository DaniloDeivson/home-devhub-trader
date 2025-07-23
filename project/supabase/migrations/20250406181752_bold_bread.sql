/*
  # Fix robot creation and deletion operations

  1. Changes
    - Simplify robot deletion by using CASCADE
    - Fix version handling during deletion
    - Add proper ownership checks
    - Ensure clean deletion of all related data

  2. Security
    - Maintain RLS policies
    - Add proper ownership verification
*/

-- Drop existing problematic objects
DROP RULE IF EXISTS codes_delete ON codes;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;
DROP VIEW IF EXISTS codes;

-- Function to safely delete a robot
CREATE OR REPLACE FUNCTION delete_robot_safely(p_robot_name text)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
BEGIN
  -- Get robot ID and verify ownership
  SELECT id INTO v_robot_id
  FROM robots
  WHERE name = p_robot_name
  AND owner_id = auth.uid();

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Robot not found or permission denied';
  END IF;

  -- Delete robot (versions will be deleted via CASCADE)
  DELETE FROM robots
  WHERE id = v_robot_id
  AND owner_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Create trigger for robot deletion cleanup
CREATE TRIGGER before_delete_robot
  BEFORE DELETE ON robots
  FOR EACH ROW
  EXECUTE FUNCTION handle_robot_deletion();

-- Create a simpler view for codes
CREATE VIEW codes AS 
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
WHERE (rv.is_deleted = false OR rv.is_deleted IS NULL);

-- Create a simple delete rule that uses robot name
CREATE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_robot_safely(OLD.robot_name);