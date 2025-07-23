/*
  # Fix robot creation functionality

  1. Changes
    - Simplify robot creation process
    - Fix view rules for proper creation
    - Add proper error handling
    - Ensure proper cascading
    
  2. Security
    - Maintain RLS policies
    - Add proper ownership checks
*/

-- Drop existing problematic objects
DROP VIEW IF EXISTS codes CASCADE;
DROP FUNCTION IF EXISTS create_robot_with_owner(text, text) CASCADE;

-- Function to create robot with initial version
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
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Robot name cannot be empty';
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
    name
  ) VALUES (
    v_user_id,
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

-- Create codes view
CREATE VIEW codes AS
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

-- Create rules for the codes view
CREATE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD
  SELECT create_robot_with_owner(NEW.robot_name, NEW.code_content);

CREATE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  DELETE FROM robots 
  WHERE id = (
    SELECT robot_id 
    FROM robot_versions 
    WHERE id = OLD.id
  )
  AND owner_id = auth.uid()
  RETURNING 
    OLD.id,
    OLD.user_id,
    OLD.robot_name,
    OLD.filename,
    OLD.code_content,
    OLD.version,
    OLD.created_at,
    OLD.updated_at;

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