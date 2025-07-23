/*
  # Fix recursive RLS policies for robots table

  1. Changes
    - Remove redundant and potentially recursive RLS policies
    - Consolidate overlapping policies into simpler, non-recursive ones
    - Ensure clear separation between different access patterns

  2. Security
    - Maintain existing security model while eliminating recursion
    - Keep policies for owner access, shared access, and collaboration
    - Ensure proper authorization checks without circular references
*/

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE robots DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that may be causing recursion
DROP POLICY IF EXISTS "System can manage robots" ON robots;
DROP POLICY IF EXISTS "System can manage robots base" ON robots;
DROP POLICY IF EXISTS "Users can create robots" ON robots;
DROP POLICY IF EXISTS "Users can create robots base" ON robots;
DROP POLICY IF EXISTS "Users can delete own robots" ON robots;
DROP POLICY IF EXISTS "Users can delete own robots base" ON robots;
DROP POLICY IF EXISTS "Users can read collaborated robots base" ON robots;
DROP POLICY IF EXISTS "Users can read own robots base" ON robots;
DROP POLICY IF EXISTS "Users can read robots" ON robots;
DROP POLICY IF EXISTS "Users can read robots via collaboration" ON robots;
DROP POLICY IF EXISTS "Users can read robots via ownership" ON robots;
DROP POLICY IF EXISTS "Users can read robots via sharing" ON robots;
DROP POLICY IF EXISTS "Users can read shared robots base" ON robots;
DROP POLICY IF EXISTS "Users can update own robots" ON robots;
DROP POLICY IF EXISTS "Users can update own robots base" ON robots;
DROP POLICY IF EXISTS "Users can update shared robots base" ON robots;
DROP POLICY IF EXISTS "Users can update shared robots with edit" ON robots;

-- Re-enable RLS
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies without recursion
-- 1. Owner access policy (covers all operations for robot owners)
CREATE POLICY "Owner full access"
ON robots
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 2. Shared access policy (read-only for users with shared access)
CREATE POLICY "Shared read access"
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

-- 3. Collaborator access policy (read-only for collaborators)
CREATE POLICY "Collaborator read access"
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

-- 4. Shared edit policy (update for users with edit permission)
CREATE POLICY "Shared edit access"
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