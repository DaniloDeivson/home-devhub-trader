/*
  # Fix robot creation and version handling

  1. Changes
    - Add function to safely create robot with initial version
    - Ensure version is created before setting current_version_id
    - Add proper error handling and validation
    - Update codes view rules

  2. Security
    - Run with SECURITY DEFINER to ensure proper permissions
    - Validate inputs and ownership
*/

-- Function to safely create robot with initial version
CREATE OR REPLACE FUNCTION create_robot_with_version(
  p_name text,
  p_initial_code text DEFAULT NULL
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
    WHERE owner_id = auth.uid()
    AND name = p_name
  ) THEN
    RAISE EXCEPTION 'A robot with this name already exists';
  END IF;

  -- Create robot first without current_version_id
  INSERT INTO robots (
    owner_id,
    name,
    current_version_id
  ) VALUES (
    auth.uid(),
    p_name,
    NULL
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
    COALESCE(p_initial_code, '// ' || p_name || '
// Versão 1

var
  precoEntrada, precoSaida: float;
begin
  // Lógica principal do robô
  // Clique para começar a editar
end;'),
    auth.uid(),
    'Versão inicial'
  ) RETURNING id INTO v_version_id;

  -- Update robot with current_version_id
  UPDATE robots
  SET current_version_id = v_version_id
  WHERE id = v_robot_id;

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS create_initial_version_trigger ON robots;

-- Update codes view to use the new function
CREATE OR REPLACE VIEW codes AS 
SELECT 
  rv.id,
  r.owner_id as user_id,
  r.name as robot_name,
  rv.version_name as filename,
  rv.code as code_content,
  rv.version_name as version,
  rv.created_at,
  rv.updated_at
FROM robots r
JOIN robot_versions rv ON r.id = rv.robot_id
WHERE rv.id = r.current_version_id
  AND rv.is_deleted = false;

-- Update insert rule to use new function
CREATE OR REPLACE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD
  SELECT create_robot_with_version(NEW.robot_name, NEW.code_content);