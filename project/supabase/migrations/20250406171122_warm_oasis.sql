/*
  # Fix Robot Creation and Deletion

  1. Changes
    - Add proper error handling for robot creation
    - Ensure version 1 is created before returning
    - Fix cascade deletion of versions
    - Add proper validation and error messages

  2. Security
    - All functions run with SECURITY DEFINER
    - Proper permission checks in place
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

  -- Create robot
  INSERT INTO robots (
    owner_id,
    name
  ) VALUES (
    auth.uid(),
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

  -- Set as current version
  UPDATE robots
  SET current_version_id = v_version_id
  WHERE id = v_robot_id;

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete robot and all its versions
CREATE OR REPLACE FUNCTION delete_robot_cascade(p_robot_id uuid)
RETURNS boolean AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Get robot owner
  SELECT owner_id INTO v_owner_id
  FROM robots
  WHERE id = p_robot_id;

  -- Verify ownership
  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Delete robot (versions will be deleted via CASCADE)
  DELETE FROM robots
  WHERE id = p_robot_id
  AND owner_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update codes view to handle deleted robots
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

-- Create rules for the codes view
CREATE OR REPLACE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD
  SELECT create_robot_with_version(NEW.robot_name, NEW.code_content);

CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes
DO INSTEAD
  SELECT delete_robot_cascade(
    (SELECT id FROM robots WHERE owner_id = auth.uid() AND name = OLD.robot_name)
  );