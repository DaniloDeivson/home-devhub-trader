/*
  # Fix RLS policies for robots table
  
  1. Changes
    - Drop existing policies
    - Create new policies with unique names
    - Split read access into distinct policies
    
  2. Security
    - Maintain same access control
    - Avoid policy name conflicts
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read shared robots" ON robots;
DROP POLICY IF EXISTS "Users can read own robots" ON robots;
DROP POLICY IF EXISTS "Users can read robots shared via shared_robots" ON robots;
DROP POLICY IF EXISTS "Users can read robots via collaborators" ON robots;

-- Create new read policies with unique names
CREATE POLICY "Users can read robots via ownership"
ON robots
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can read robots via sharing"
ON robots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_robots
    WHERE shared_robots.robot_name = robots.name
    AND shared_robots.user_id = auth.uid()
  )
);

CREATE POLICY "Users can read robots via collaboration"
ON robots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM collaborators
    WHERE collaborators.robot_id = robots.id
    AND collaborators.user_id = auth.uid()
  )
);