/*
  # Fix infinite recursion in robots table RLS policies

  1. Changes
    - Drop existing policies on robots table
    - Create new, simplified policies that avoid recursion
    - Maintain same security model but with optimized policy conditions

  2. Security
    - Enable RLS on robots table (already enabled)
    - Add policies for:
      - Owner full access
      - Shared access via shared_robots table
      - Collaborator access
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable delete access" ON robots;
DROP POLICY IF EXISTS "Enable insert access" ON robots;
DROP POLICY IF EXISTS "Enable read access" ON robots;
DROP POLICY IF EXISTS "Enable update access" ON robots;

-- Create new policies without recursion
CREATE POLICY "Owner full access"
ON robots
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Shared robots read access"
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

CREATE POLICY "Shared robots edit access"
ON robots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shared_robots sr
    WHERE sr.robot_name = robots.name
    AND sr.user_id = auth.uid()
    AND sr.permission = 'edit'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shared_robots sr
    WHERE sr.robot_name = robots.name
    AND sr.user_id = auth.uid()
    AND sr.permission = 'edit'
  )
);

CREATE POLICY "Collaborator access"
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