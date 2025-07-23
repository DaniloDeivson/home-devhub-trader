/*
  # Remove version deletion restriction

  1. Changes
    - Drop triggers and functions with proper CASCADE
    - Create new function to handle robot deletion cleanup
    - Update RLS policies
    
  2. Security
    - Maintain ownership checks
    - Keep proper cascading deletion
*/

-- Drop existing triggers and functions with CASCADE
DROP TRIGGER IF EXISTS before_delete_robot ON robots CASCADE;
DROP TRIGGER IF EXISTS prevent_version_deletion_trigger ON robot_versions CASCADE;
DROP FUNCTION IF EXISTS prevent_robot_deletion() CASCADE;
DROP FUNCTION IF EXISTS prevent_version_deletion() CASCADE;
DROP FUNCTION IF EXISTS handle_robot_deletion() CASCADE;

-- Create new function to handle robot deletion cleanup without version check
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

  -- Mark all versions as deleted
  UPDATE robot_versions
  SET is_deleted = true
  WHERE robot_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for robot deletion
CREATE TRIGGER before_delete_robot
  BEFORE DELETE ON robots
  FOR EACH ROW
  EXECUTE FUNCTION handle_robot_deletion();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can delete own robots" ON robots;
CREATE POLICY "Users can delete own robots"
  ON robots
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());