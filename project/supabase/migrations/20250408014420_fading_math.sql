/*
  # Fix robot policies to avoid conflicts
  
  1. Changes
    - Drop all existing policies on robots table
    - Recreate policies in correct order without conflicts
    - Ensure proper policy hierarchy
    
  2. Security
    - Maintain existing security model
    - Fix policy recursion issues
*/

-- Drop all existing policies on robots table
DROP POLICY IF EXISTS "System can manage robots" ON robots;
DROP POLICY IF EXISTS "Users can create robots" ON robots;
DROP POLICY IF EXISTS "Users can read own robots" ON robots;
DROP POLICY IF EXISTS "Users can read shared robots" ON robots;
DROP POLICY IF EXISTS "Users can update own robots" ON robots;
DROP POLICY IF EXISTS "Users can update shared robots" ON robots;
DROP POLICY IF EXISTS "Users can delete own robots" ON robots;

-- Create base policies for robot management
CREATE POLICY "System can manage robots"
ON robots
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Create user-specific policies
CREATE POLICY "Users can read own robots"
ON robots
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM shared_robots
    WHERE shared_robots.robot_name = robots.name
    AND shared_robots.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM collaborators
    WHERE collaborators.robot_id = robots.id
    AND collaborators.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create robots"
ON robots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own robots"
ON robots
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update shared robots"
ON robots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_robots
    WHERE shared_robots.robot_name = robots.name
    AND shared_robots.user_id = auth.uid()
    AND shared_robots.permission = 'edit'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shared_robots
    WHERE shared_robots.robot_name = robots.name
    AND shared_robots.user_id = auth.uid()
    AND shared_robots.permission = 'edit'
  )
);

CREATE POLICY "Users can delete own robots"
ON robots
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());