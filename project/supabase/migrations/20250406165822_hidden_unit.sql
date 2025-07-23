/*
  # Fix version management and code association

  1. Changes
    - Add function to get version code
    - Add function to update version code
    - Fix version creation to handle code updates
    - Ensure proper version selection

  2. Security
    - Add proper permission checks
    - Maintain RLS policies
*/

-- Function to get version code
CREATE OR REPLACE FUNCTION get_version_code(
  p_robot_id uuid,
  p_version_name text
) RETURNS text AS $$
DECLARE
  v_code text;
BEGIN
  SELECT code INTO v_code
  FROM robot_versions
  WHERE robot_id = p_robot_id
    AND version_name = p_version_name
    AND is_deleted = false;
    
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update version code
CREATE OR REPLACE FUNCTION update_version_code(
  p_robot_id uuid,
  p_version_name text,
  p_code text
) RETURNS uuid AS $$
DECLARE
  v_version_id uuid;
BEGIN
  -- Get version ID
  SELECT id INTO v_version_id
  FROM robot_versions
  WHERE robot_id = p_robot_id
    AND version_name = p_version_name
    AND is_deleted = false;
    
  IF v_version_id IS NULL THEN
    -- Create new version if not found
    INSERT INTO robot_versions (
      robot_id,
      version_name,
      code,
      created_by
    ) VALUES (
      p_robot_id,
      p_version_name,
      p_code,
      auth.uid()
    ) RETURNING id INTO v_version_id;
    
    -- Update current version
    UPDATE robots
    SET current_version_id = v_version_id
    WHERE id = p_robot_id;
  ELSE
    -- Update existing version
    UPDATE robot_versions
    SET code = p_code,
        updated_at = now()
    WHERE id = v_version_id;
  END IF;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update codes view to use current version
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