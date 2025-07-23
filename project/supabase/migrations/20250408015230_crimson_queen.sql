/*
  # Fix robot creation and policies
  
  1. Changes
    - Drop all existing policies to start fresh
    - Create simplified policies with proper permissions
    - Add function to safely create robots with initial version
    - Fix policy conflicts
    
  2. Security
    - Maintain RLS policies
    - Add proper ownership checks
*/

-- First disable RLS to avoid conflicts
ALTER TABLE robots DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow read access" ON robots;
DROP POLICY IF EXISTS "Allow create access" ON robots;
DROP POLICY IF EXISTS "Allow update access" ON robots;
DROP POLICY IF EXISTS "Allow delete access" ON robots;
DROP POLICY IF EXISTS "Allow system access" ON robots;
DROP POLICY IF EXISTS "Users can read robots" ON robots;

-- Re-enable RLS
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

-- Create base policies
CREATE POLICY "Enable base access"
ON robots
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Create user policies
CREATE POLICY "Enable user read"
ON robots
FOR SELECT
TO authenticated
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

CREATE POLICY "Enable user create"
ON robots
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable user update"
ON robots
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable user delete"
ON robots
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Function to safely create robot with initial version
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

  -- Check if robot name already exists for this user
  IF EXISTS (
    SELECT 1 FROM robots
    WHERE owner_id = p_owner_id
    AND name = p_name
  ) THEN
    RAISE EXCEPTION 'A robot with this name already exists';
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
EXCEPTION
  WHEN unique_violation THEN
    -- Clean up any partial creation
    IF v_robot_id IS NOT NULL THEN
      DELETE FROM robots WHERE id = v_robot_id;
    END IF;
    RAISE EXCEPTION 'A robot with this name already exists';
  WHEN OTHERS THEN
    -- Clean up any partial creation
    IF v_robot_id IS NOT NULL THEN
      DELETE FROM robots WHERE id = v_robot_id;
    END IF;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;