/*
  # Fix infinite recursion in robots table RLS policies

  1. Changes
    - Remove duplicate and overlapping policies on the robots table
    - Consolidate policies into clearer, non-recursive rules
    - Maintain existing access control logic but eliminate circular references

  2. Security
    - Maintain RLS enabled on robots table
    - Ensure users can only access their own robots and shared robots
    - Preserve existing permissions model but with optimized policy structure
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Enable base access" ON robots;
DROP POLICY IF EXISTS "Enable user create" ON robots;
DROP POLICY IF EXISTS "Enable user delete" ON robots;
DROP POLICY IF EXISTS "Enable user read" ON robots;
DROP POLICY IF EXISTS "Enable user update" ON robots;
DROP POLICY IF EXISTS "System can manage robots" ON robots;
DROP POLICY IF EXISTS "Users can create robots" ON robots;
DROP POLICY IF EXISTS "Users can delete own robots" ON robots;
DROP POLICY IF EXISTS "Users can update own robots" ON robots;
DROP POLICY IF EXISTS "Users can update shared robots" ON robots;

-- Create new, optimized policies
CREATE POLICY "Enable read access" ON robots
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

CREATE POLICY "Enable insert access" ON robots
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable update access" ON robots
FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM shared_robots sr 
    WHERE sr.robot_name = robots.name 
    AND sr.user_id = auth.uid() 
    AND sr.permission = 'edit'
  )
)
WITH CHECK (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM shared_robots sr 
    WHERE sr.robot_name = robots.name 
    AND sr.user_id = auth.uid() 
    AND sr.permission = 'edit'
  )
);

CREATE POLICY "Enable delete access" ON robots
FOR DELETE TO authenticated
USING (owner_id = auth.uid());