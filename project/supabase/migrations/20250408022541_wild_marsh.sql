/*
  # Fix infinite recursion in robots RLS policy

  1. Changes
    - Drop the problematic SELECT policy on robots table
    - Create new SELECT policy with non-recursive conditions
    
  2. Security
    - Maintains same security level but eliminates infinite recursion
    - Users can still access:
      - Their own robots
      - Robots they are collaborators on
      - Robots shared with them
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "robots_select_policy" ON robots;

-- Create new policy without recursive conditions
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