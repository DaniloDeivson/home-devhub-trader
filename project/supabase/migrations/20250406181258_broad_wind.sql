/*
  # Fix robot deletion functionality

  1. Changes
    - Remove complex multi-statement DO INSTEAD rules
    - Create separate triggers for handling robot deletion
    - Ensure proper cascading deletion order

  2. Security
    - Maintain RLS policies
    - Ensure proper access control
*/

-- First, drop any existing triggers that might conflict
DROP TRIGGER IF EXISTS delete_robot_safely ON robots;

-- Create a function to handle robot deletion
CREATE OR REPLACE FUNCTION handle_robot_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete associated codes
  DELETE FROM codes WHERE robot_name = OLD.name AND user_id = OLD.owner_id;
  
  -- Delete shared access records
  DELETE FROM shared_robots WHERE robot_name = OLD.name AND created_by = OLD.owner_id;
  
  -- Delete robot versions (this will cascade to current_version_id)
  DELETE FROM robot_versions WHERE robot_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create a BEFORE DELETE trigger
CREATE TRIGGER before_delete_robot
  BEFORE DELETE ON robots
  FOR EACH ROW
  EXECUTE FUNCTION handle_robot_deletion();

-- Ensure proper cascading for robot_versions
ALTER TABLE robots
  DROP CONSTRAINT IF EXISTS robots_current_version_id_fkey,
  ADD CONSTRAINT robots_current_version_id_fkey 
  FOREIGN KEY (current_version_id) 
  REFERENCES robot_versions(id) 
  ON DELETE SET NULL;