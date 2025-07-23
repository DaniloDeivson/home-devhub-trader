/*
  # Fix RLS policies for robots table

  1. Changes
    - Drop all existing policies to start fresh
    - Create simplified policies without recursion
    - Add proper access control for all operations
    - Fix policy conditions that were preventing robots from appearing

  2. Security
    - Maintain proper access control
    - Ensure users can only access their own robots and shared robots
*/

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE robots DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Owner full access" ON robots;
DROP POLICY IF EXISTS "Shared read access" ON robots;
DROP POLICY IF EXISTS "Collaborator read access" ON robots;
DROP POLICY IF EXISTS "Shared edit access" ON robots;

-- Re-enable RLS
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies
-- 1. Basic read access policy
CREATE POLICY "Users can read robots"
ON robots
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM shared_robots sr
    WHERE sr.robot_name = robots.name
    AND sr.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM collaborators c
    WHERE c.robot_id = robots.id
    AND c.user_id = auth.uid()
  )
);

-- 2. Create policy
CREATE POLICY "Users can create robots"
ON robots
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- 3. Update policy for owners
CREATE POLICY "Users can update own robots"
ON robots
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 4. Update policy for shared users with edit permission
CREATE POLICY "Users can update shared robots"
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

-- 5. Delete policy
CREATE POLICY "Users can delete own robots"
ON robots
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- 6. System-level policy for administrative access
CREATE POLICY "System can manage robots"
ON robots
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);