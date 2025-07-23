/*
  # Fix RLS policies for robots table
  
  1. Changes
    - Drop all existing policies
    - Create simpler, non-recursive policies
    - Separate read access into distinct policies
    
  2. Security
    - Maintain same access control but avoid recursion
    - Keep proper permission checks
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "System can manage robots" ON robots;
DROP POLICY IF EXISTS "Users can create robots" ON robots;
DROP POLICY IF EXISTS "Users can read own robots" ON robots;
DROP POLICY IF EXISTS "Users can read shared robots" ON robots;
DROP POLICY IF EXISTS "Users can read collaborated robots" ON robots;
DROP POLICY IF EXISTS "Users can update own robots" ON robots;
DROP POLICY IF EXISTS "Users can update shared robots with edit" ON robots;
DROP POLICY IF EXISTS "Users can delete own robots" ON robots;

-- Create base system policy
CREATE POLICY "System can manage robots base"
ON robots
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Create user policies with simpler conditions
CREATE POLICY "Users can create robots base"
ON robots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can read own robots base"
ON robots
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can read shared robots base"
ON robots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_robots sr
    WHERE sr.robot_name = robots.name
    AND sr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read collaborated robots base"
ON robots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM collaborators c
    WHERE c.robot_id = robots.id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own robots base"
ON robots
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update shared robots base"
ON robots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_robots sr
    WHERE sr.robot_name = robots.name
    AND sr.user_id = auth.uid()
    AND sr.permission = 'edit'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shared_robots sr
    WHERE sr.robot_name = robots.name
    AND sr.user_id = auth.uid()
    AND sr.permission = 'edit'
  )
);

CREATE POLICY "Users can delete own robots base"
ON robots
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());