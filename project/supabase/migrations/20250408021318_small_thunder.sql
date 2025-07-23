/*
  # Fix overlapping robot policies

  1. Changes
    - Remove redundant and overlapping policies on robots table
    - Create a single consolidated policy for SELECT operations
    - Keep simple policies for INSERT, UPDATE, and DELETE operations

  2. Security
    - Maintains same level of access control
    - Simplifies policy logic to prevent recursion
    - Users can still:
      - Read their own robots
      - Read shared robots
      - Read robots they collaborate on
      - Manage their own robots
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read robots" ON robots;
DROP POLICY IF EXISTS "Users can read robots as collaborator" ON robots;
DROP POLICY IF EXISTS "Users can read robots shared directly" ON robots;
DROP POLICY IF EXISTS "Users can view own and shared robots" ON robots;
DROP POLICY IF EXISTS "robots_select_policy" ON robots;
DROP POLICY IF EXISTS "robots_delete_policy" ON robots;
DROP POLICY IF EXISTS "robots_insert_policy" ON robots;
DROP POLICY IF EXISTS "robots_update_policy" ON robots;

-- Create new simplified policies
CREATE POLICY "robots_select_policy" ON robots
  FOR SELECT TO authenticated
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

CREATE POLICY "robots_insert_policy" ON robots
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_update_policy" ON robots
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_delete_policy" ON robots
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());