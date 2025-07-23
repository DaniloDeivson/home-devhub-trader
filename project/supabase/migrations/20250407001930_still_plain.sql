-- Function to prevent deletion of robots with only one version
CREATE OR REPLACE FUNCTION prevent_robot_deletion()
RETURNS TRIGGER AS $$
DECLARE
  version_count integer;
BEGIN
  -- Count active versions for this robot
  SELECT COUNT(*)
  INTO version_count
  FROM robot_versions
  WHERE robot_id = OLD.id
  AND is_deleted = false;

  -- Don't allow deleting if it's the last version
  IF version_count <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the last version of a robot';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent robot deletion with single version
DROP TRIGGER IF EXISTS prevent_robot_deletion_trigger ON robots;
CREATE TRIGGER prevent_robot_deletion_trigger
  BEFORE DELETE ON robots
  FOR EACH ROW
  EXECUTE FUNCTION prevent_robot_deletion();

-- Update the handle_robot_deletion function to check version count
CREATE OR REPLACE FUNCTION handle_robot_deletion()
RETURNS TRIGGER AS $$
DECLARE
  version_count integer;
BEGIN
  -- Count active versions
  SELECT COUNT(*)
  INTO version_count
  FROM robot_versions
  WHERE robot_id = OLD.id
  AND is_deleted = false;

  -- Don't allow deleting if it's the last version
  IF version_count <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the last version of a robot';
  END IF;

  -- Delete shared access records
  DELETE FROM shared_robots
  WHERE robot_name = OLD.name
  AND created_by = OLD.owner_id;

  -- Delete sharing invites
  DELETE FROM sharing_invites
  WHERE robot_name = OLD.name
  AND created_by = OLD.owner_id;

  -- Mark all versions as deleted
  UPDATE robot_versions
  SET is_deleted = true
  WHERE robot_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS before_delete_robot ON robots;
CREATE TRIGGER before_delete_robot
  BEFORE DELETE ON robots
  FOR EACH ROW
  EXECUTE FUNCTION handle_robot_deletion();