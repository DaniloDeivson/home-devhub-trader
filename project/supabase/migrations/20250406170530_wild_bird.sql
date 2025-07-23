/*
  # Fix version management functionality

  1. Changes
    - Add trigger to create initial version 1 for new robots
    - Prevent deletion of version 1 if it's the only version
    - Ensure version 1 is always selected by default
    - Fix version numbering to start from 1
    - Add function to get next version number
*/

-- Function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_robot_id uuid)
RETURNS integer AS $$
DECLARE
  v_next_number integer;
BEGIN
  SELECT COALESCE(MAX(
    CASE 
      WHEN version_name ~ '^Versão \d+$' 
      THEN (regexp_matches(version_name, 'Versão (\d+)'))[1]::integer
      ELSE 0
    END
  ), 0) + 1
  INTO v_next_number
  FROM robot_versions
  WHERE robot_id = p_robot_id
    AND is_deleted = false;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create initial version
CREATE OR REPLACE FUNCTION create_initial_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Create version 1
  INSERT INTO robot_versions (
    robot_id,
    version_name,
    code,
    created_by,
    description
  ) VALUES (
    NEW.id,
    'Versão 1',
    '// ' || NEW.name || '
// Versão 1

var
  precoEntrada, precoSaida: float;
begin
  // Lógica principal do robô
  // Clique para começar a editar
end;',
    NEW.owner_id,
    'Versão inicial'
  ) RETURNING id INTO NEW.current_version_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete version
CREATE OR REPLACE FUNCTION delete_robot_version(p_version_id uuid)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_version_count integer;
  v_version_name text;
BEGIN
  -- Get version info
  SELECT 
    robot_id,
    version_name,
    (
      SELECT COUNT(*)
      FROM robot_versions rv2
      WHERE rv2.robot_id = robot_versions.robot_id
      AND rv2.is_deleted = false
    ) as version_count
  INTO v_robot_id, v_version_name, v_version_count
  FROM robot_versions
  WHERE id = p_version_id AND is_deleted = false;

  -- Validate version exists
  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Don't allow deleting version 1 if it's the only version
  IF v_version_name = 'Versão 1' AND v_version_count = 1 THEN
    RAISE EXCEPTION 'Cannot delete Version 1 when it is the only version';
  END IF;

  -- Mark version as deleted
  UPDATE robot_versions
  SET is_deleted = true
  WHERE id = p_version_id;

  -- If this was the current version, set current_version_id to the latest version
  UPDATE robots r
  SET current_version_id = (
    SELECT id 
    FROM robot_versions rv
    WHERE rv.robot_id = r.id
    AND rv.is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1
  )
  WHERE r.id = v_robot_id
  AND r.current_version_id = p_version_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_initial_version_trigger ON robots;

-- Create trigger for automatic version creation
CREATE TRIGGER create_initial_version_trigger
  BEFORE INSERT ON robots
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_version();

-- Update codes view to always show current version
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