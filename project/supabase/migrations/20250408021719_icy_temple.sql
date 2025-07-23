/*
  # Fix infinite recursion in RLS policies
  
  1. Changes
    - Drop existing policies that may cause recursion
    - Create new simplified policies with direct conditions
    - Avoid nested EXISTS clauses
    
  2. Security
    - Maintain same security model but with optimized implementation
*/

-- First disable RLS to avoid conflicts
ALTER TABLE robots DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "robots_select_policy" ON robots;
DROP POLICY IF EXISTS "robots_insert_policy" ON robots;
DROP POLICY IF EXISTS "robots_update_policy" ON robots;
DROP POLICY IF EXISTS "robots_delete_policy" ON robots;

-- Re-enable RLS
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "robots_select_policy" ON robots
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT robot_id FROM collaborators WHERE user_id = auth.uid()
    ) OR
    name IN (
      SELECT robot_name FROM shared_robots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "robots_insert_policy" ON robots
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_update_policy" ON robots
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_delete_policy" ON robots
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());