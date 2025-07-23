/*
  # Fix robot creation functionality

  1. Changes
    - Add validation for robot name
    - Ensure proper error handling
    - Fix version creation
    - Add proper RLS policies

  2. Security
    - Add proper ownership checks
    - Ensure atomic operations
*/

-- Function to validate robot name
CREATE OR REPLACE FUNCTION validate_robot_name(p_name text)
RETURNS boolean AS $$
BEGIN
  -- Name cannot be empty
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN false;
  END IF;

  -- Name must be between 3 and 50 characters
  IF length(trim(p_name)) < 3 OR length(trim(p_name)) > 50 THEN
    RETURN false;
  END IF;

  -- Name can only contain letters, numbers, and underscores
  IF NOT trim(p_name) ~ '^[a-zA-Z0-9_]+$' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create robot with owner validation
CREATE OR REPLACE FUNCTION create_robot_with_owner(
  p_name text,
  p_initial_code text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
  v_version_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate robot name
  IF NOT validate_robot_name(p_name) THEN
    RAISE EXCEPTION 'Invalid robot name. Use only letters, numbers, and underscores (3-50 characters).';
  END IF;

  -- Check if robot name already exists for this user
  IF EXISTS (
    SELECT 1 FROM robots
    WHERE owner_id = v_user_id
    AND name = p_name
  ) THEN
    RAISE EXCEPTION 'A robot with this name already exists';
  END IF;

  -- Create robot
  INSERT INTO robots (
    owner_id,
    name,
    current_version_id
  ) VALUES (
    v_user_id,
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
    v_user_id,
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
    DELETE FROM robots WHERE id = v_robot_id;
    RAISE EXCEPTION 'A robot with this name already exists';
  WHEN OTHERS THEN
    -- Clean up any partial creation
    IF v_robot_id IS NOT NULL THEN
      DELETE FROM robots WHERE id = v_robot_id;
    END IF;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies
DROP POLICY IF EXISTS "System can create robots" ON robots;
CREATE POLICY "System can create robots"
  ON robots
  FOR INSERT
  TO postgres
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can manage robots" ON robots;
CREATE POLICY "System can manage robots"
  ON robots
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Update codes view
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
WHERE rv.is_deleted = false;

-- Update insert rule
CREATE OR REPLACE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD
  SELECT create_robot_with_owner(NEW.robot_name, NEW.code_content);