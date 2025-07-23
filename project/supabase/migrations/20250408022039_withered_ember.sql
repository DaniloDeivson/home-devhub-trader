/*
  # Fix infinite recursion in robots table policy

  1. Changes
    - Drop and recreate the robots select policy to fix infinite recursion
    - Simplify the policy logic to avoid circular references
    - Maintain the same access control rules but with optimized conditions

  2. Security
    - Users can still view:
      - Their own robots
      - Robots they are collaborators on
      - Robots shared with them
    - No change to other policies (insert, update, delete)
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "robots_select_policy" ON robots;

-- Create new optimized policy
CREATE POLICY "robots_select_policy" ON robots
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT robot_id 
      FROM collaborators 
      WHERE user_id = auth.uid()
    ) OR
    name IN (
      SELECT robot_name 
      FROM shared_robots 
      WHERE user_id = auth.uid()
    )
  );