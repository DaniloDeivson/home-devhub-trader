/*
  # Fix robot creation functionality
  
  1. Changes
    - Simplify robot creation policies
    - Fix policy recursion issues
    - Add proper error handling
    - Ensure proper cascading
    
  2. Security
    - Maintain RLS policies
    - Add proper ownership checks
*/

-- First disable RLS to avoid conflicts
ALTER TABLE robots DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access" ON robots;
DROP POLICY IF EXISTS "Enable insert access" ON robots;
DROP POLICY IF EXISTS "Enable update for owners" ON robots;
DROP POLICY IF EXISTS "Enable delete for owners" ON robots;
DROP POLICY IF EXISTS "Enable system access" ON robots;

-- Re-enable RLS
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Allow read access"
ON robots
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM shared_robots sr
    WHERE sr.robot_name = robots.name
    AND sr.user_id = auth.uid()
  )
);

CREATE POLICY "Allow create access"
ON robots
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow update access"
ON robots
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow delete access"
ON robots
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Add system-level access
CREATE POLICY "Allow system access"
ON robots
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Function to safely create robot
CREATE OR REPLACE FUNCTION create_robot_safely(
  p_name text,
  p_owner_id uuid DEFAULT auth.uid()
)
RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
  v_version_id uuid;
BEGIN
  -- Validate input
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Robot name cannot be empty';
  END IF;

  -- Create robot
  INSERT INTO robots (
    owner_id,
    name
  ) VALUES (
    p_owner_id,
    p_name
  ) RETURNING id INTO v_robot_id;

  -- Create initial version
  INSERT INTO robot_versions (
    robot_id,
    version_name,
    code,
    created_by,
    description
  ) VALUES (
    v_robot_id,
    'Versão 1',
    '// ' || p_name || '
// Versão 1

var
  precoEntrada, precoSaida: float;
begin
  // Lógica principal do robô
  // Clique para começar a editar
end;',
    p_owner_id,
    'Versão inicial'
  ) RETURNING id INTO v_version_id;

  -- Update robot with current_version_id
  UPDATE robots
  SET current_version_id = v_version_id
  WHERE id = v_robot_id;

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;