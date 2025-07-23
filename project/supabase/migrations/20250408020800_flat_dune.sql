/*
  # Fix recursive RLS policies for robots table

  1. Changes
    - Remove overlapping RLS policies on robots table
    - Create new consolidated policy that avoids recursion
    - Maintain same access control logic but with optimized conditions

  2. Security
    - Users can still manage their own robots
    - Users can still access shared robots
    - Users can still access robots they collaborate on
    - Prevents infinite recursion by avoiding self-referential queries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own robots" ON robots;
DROP POLICY IF EXISTS "robots_access_policy" ON robots;

-- Create new consolidated policy
CREATE POLICY "robots_consolidated_access_policy" ON robots
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
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_robots
      WHERE shared_robots.robot_name = robots.name
      AND shared_robots.user_id = auth.uid()
      AND shared_robots.permission = 'edit'
    ) OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.robot_id = robots.id
      AND collaborators.user_id = auth.uid()
      AND collaborators.permission = 'edit'
    )
  );