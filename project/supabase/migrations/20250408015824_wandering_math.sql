/*
  # Fix infinite recursion in robots table policies

  1. Changes
    - Remove duplicate policies that were causing infinite recursion
    - Consolidate read access policies into a single, optimized policy
    - Simplify policy conditions to prevent circular references
  
  2. Security
    - Maintains existing security model where users can:
      - Read their own robots
      - Read robots shared with them
      - Read robots they collaborate on
    - Prevents infinite recursion while maintaining security
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access" ON robots;
DROP POLICY IF EXISTS "Users can read shared robots" ON robots;

-- Create new consolidated read policy that avoids recursion
CREATE POLICY "Users can read robots" ON robots
FOR SELECT TO authenticated
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