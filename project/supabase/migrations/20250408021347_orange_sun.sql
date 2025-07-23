/*
  # Fix infinite recursion in robots policies

  1. Changes
    - Remove redundant policies that were causing infinite recursion
    - Simplify and consolidate SELECT policies into a single policy
    - Keep other policies (INSERT, UPDATE, DELETE) unchanged
    
  2. Security
    - Maintains same level of access control
    - Users can still:
      - Read their own robots
      - Read robots shared with them
      - Read robots they collaborate on
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read robots" ON robots;
DROP POLICY IF EXISTS "Users can read robots as collaborator" ON robots;
DROP POLICY IF EXISTS "Users can read robots shared directly" ON robots;
DROP POLICY IF EXISTS "Users can view own and shared robots" ON robots;
DROP POLICY IF EXISTS "robots_select_policy" ON robots;

-- Create a single, simplified SELECT policy
CREATE POLICY "robots_select_policy" ON robots
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