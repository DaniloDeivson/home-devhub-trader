/*
  # Fix robot deletion and version management

  1. Changes
    - Drop existing problematic objects
    - Add proper cascading for robot deletion
    - Prevent deletion of last version
    - Fix codes view and rules
    - Add proper cleanup for shared resources

  2. Security
    - Maintain RLS policies
    - Ensure proper ownership checks
*/

-- Drop existing problematic objects
DROP VIEW IF EXISTS codes CASCADE;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;
DROP TRIGGER IF EXISTS prevent_version_deletion_trigger ON robot_versions;
DROP FUNCTION IF EXISTS handle_robot_deletion() CASCADE;
DROP FUNCTION IF EXISTS prevent_version_deletion() CASCADE;

-- Function to handle robot deletion cleanup
CREATE OR REPLACE FUNCTION handle_robot_deletion()
RETURNS TRIGGER AS $$
BEGIN
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

-- Function to prevent version deletion
CREATE OR REPLACE FUNCTION prevent_version_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_version_count integer;
BEGIN
  -- Count active versions for this robot
  SELECT COUNT(*)
  INTO v_version_count
  FROM robot_versions
  WHERE robot_id = OLD.robot_id
  AND is_deleted = false;

  -- Don't allow deleting if it's the last version
  IF v_version_count <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the last version of a robot';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent version deletion
CREATE TRIGGER prevent_version_deletion_trigger
  BEFORE DELETE ON robot_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_version_deletion();

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
  DELETE FROM robots 
  WHERE id = (
    SELECT robot_id 
    FROM robot_versions 
    WHERE id = OLD.id
  )
  AND owner_id = auth.uid()
  RETURNING 
    OLD.id as id,
    OLD.user_id,
    OLD.robot_name,
    OLD.filename,
    OLD.code_content,
    OLD.version,
    OLD.created_at,
    OLD.updated_at;