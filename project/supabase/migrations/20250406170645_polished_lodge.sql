/*
  # Add cascade deletion for robot versions

  1. Changes
    - Add ON DELETE CASCADE to robot_versions foreign key
    - Add function to handle robot deletion
    - Update robot deletion policy
*/

-- Drop existing foreign key if it exists
ALTER TABLE robot_versions
DROP CONSTRAINT IF EXISTS robot_versions_robot_id_fkey;

-- Add foreign key with cascade delete
ALTER TABLE robot_versions
ADD CONSTRAINT robot_versions_robot_id_fkey
FOREIGN KEY (robot_id) REFERENCES robots(id)
ON DELETE CASCADE;

-- Function to handle robot deletion
CREATE OR REPLACE FUNCTION delete_robot(p_robot_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Delete the robot (versions will be deleted automatically via CASCADE)
  DELETE FROM robots
  WHERE id = p_robot_id
  AND owner_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update robot deletion policy to use the function
DROP POLICY IF EXISTS "Users can delete own robots" ON robots;
CREATE POLICY "Users can delete own robots"
  ON robots
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());