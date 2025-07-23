/*
  # Fix recursive policy for robots table

  1. Changes
    - Drop the problematic recursive policy
    - Create new, optimized policies for shared robot access
    - Separate policies for different access patterns to prevent recursion

  2. Security
    - Maintains RLS protection
    - Ensures proper access control for shared robots
    - Prevents infinite recursion while maintaining security
*/

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Users can read shared robots" ON robots;

-- Create separate, non-recursive policies for different access patterns
CREATE POLICY "Users can read own robots"
ON robots
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can read robots shared directly"
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

CREATE POLICY "Users can read robots as collaborator"
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