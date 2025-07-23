/*
  # Remove master code concept and use versions only
  
  1. Changes
    - Drop master code table and view
    - Update codes view to use robot_versions
    - Ensure codes view returns latest version by default
    - Update rules to handle version management
*/

-- Drop existing view and table
DROP VIEW IF EXISTS codes CASCADE;
DROP TABLE IF EXISTS "Robôs Versão Master" CASCADE;

-- Create codes view that shows latest version for each robot
CREATE OR REPLACE VIEW codes AS 
SELECT 
  rv.id,
  r.owner_id as user_id,
  r.name as robot_name,
  'main.ntsl' as filename,
  rv.code as code_content,
  rv.version_name as version,
  rv.created_at,
  rv.updated_at
FROM public.robots r
JOIN public.robot_versions rv ON r.id = rv.robot_id
WHERE rv.id = r.current_version_id
  AND rv.is_deleted = false;

-- Function to handle robot creation with initial version
CREATE OR REPLACE FUNCTION handle_robot_creation(
  p_user_id uuid,
  p_robot_name text,
  p_code text,
  p_description text DEFAULT 'Versão inicial'
) RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
  v_version_id uuid;
BEGIN
  -- Create robot
  INSERT INTO robots (owner_id, name)
  VALUES (p_user_id, p_robot_name)
  RETURNING id INTO v_robot_id;

  -- Create initial version
  INSERT INTO robot_versions (
    robot_id,
    version_name,
    code,
    description,
    created_by
  ) VALUES (
    v_robot_id,
    'Versão 1',
    p_code,
    p_description,
    p_user_id
  ) RETURNING id INTO v_version_id;

  -- Set current version
  UPDATE robots 
  SET current_version_id = v_version_id
  WHERE id = v_robot_id;

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle version creation
CREATE OR REPLACE FUNCTION handle_version_creation(
  p_robot_id uuid,
  p_version_name text,
  p_code text,
  p_description text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_version_id uuid;
BEGIN
  -- Create new version
  INSERT INTO robot_versions (
    robot_id,
    version_name,
    code,
    description,
    created_by
  ) VALUES (
    p_robot_id,
    p_version_name,
    p_code,
    COALESCE(p_description, 'Nova versão'),
    auth.uid()
  ) RETURNING id INTO v_version_id;

  -- Set as current version
  UPDATE robots 
  SET current_version_id = v_version_id
  WHERE id = p_robot_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create insert rule
CREATE OR REPLACE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD
  SELECT handle_robot_creation(NEW.user_id, NEW.robot_name, NEW.code_content);

-- Create update rule that creates new version
CREATE OR REPLACE RULE codes_update AS
ON UPDATE TO codes
DO INSTEAD
  SELECT handle_version_creation(
    (SELECT id FROM robots WHERE owner_id = auth.uid() AND name = OLD.robot_name),
    'Versão ' || (get_next_version_number(
      (SELECT id FROM robots WHERE owner_id = auth.uid() AND name = OLD.robot_name)
    ))::text,
    NEW.code_content
  );

-- Create delete rule
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes
DO INSTEAD
  DELETE FROM robots
  WHERE owner_id = auth.uid()
    AND name = OLD.robot_name;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON codes TO authenticated;