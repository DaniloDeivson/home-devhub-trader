/*
  # Fix version deletion and name reuse

  1. Changes
    - Allow reusing version names after deletion
    - Ensure Version 1 cannot be deleted if it's the only version
    - Update version deletion to properly handle name reuse

  2. Security
    - Maintain existing RLS policies
    - Keep version history integrity
*/

-- Function to check if version can be deleted
CREATE OR REPLACE FUNCTION can_delete_version(
  p_version_id uuid
) RETURNS boolean AS $$
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
  WHERE id = p_version_id;

  -- Return false if:
  -- 1. Version not found
  -- 2. It's Version 1 and it's the only version
  -- 3. It's the last version
  RETURN v_robot_id IS NOT NULL 
    AND NOT (v_version_name = 'Versão 1' AND v_version_count = 1)
    AND v_version_count > 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if version name is available
CREATE OR REPLACE FUNCTION is_version_name_available(
  p_robot_id uuid,
  p_version_name text,
  p_exclude_version_id uuid DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM robot_versions
    WHERE robot_id = p_robot_id
    AND version_name = p_version_name
    AND is_deleted = false
    AND (p_exclude_version_id IS NULL OR id != p_exclude_version_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update delete_robot_version function to handle name reuse
CREATE OR REPLACE FUNCTION delete_robot_version(p_version_id uuid)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_version_name text;
BEGIN
  -- Check if version can be deleted
  IF NOT can_delete_version(p_version_id) THEN
    RAISE EXCEPTION 'Cannot delete this version. A robot must always have at least one version, and Version 1 cannot be deleted if it is the only version.';
  END IF;

  -- Get version info
  SELECT 
    robot_id,
    version_name
  INTO v_robot_id, v_version_name
  FROM robot_versions
  WHERE id = p_version_id;

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

-- Update create_version function to check name availability
CREATE OR REPLACE FUNCTION create_version(
  p_robot_id uuid,
  p_version_name text,
  p_code text,
  p_description text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_version_id uuid;
BEGIN
  -- Check if version name is available
  IF NOT is_version_name_available(p_robot_id, p_version_name) THEN
    RAISE EXCEPTION 'Version name "%" is already in use', p_version_name;
  END IF;

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
    p_description,
    auth.uid()
  ) RETURNING id INTO v_version_id;

  -- Update current version
  UPDATE robots
  SET current_version_id = v_version_id
  WHERE id = p_robot_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update rename_version function to check name availability
CREATE OR REPLACE FUNCTION rename_version(
  p_version_id uuid,
  p_new_name text
) RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
BEGIN
  -- Get robot_id
  SELECT robot_id INTO v_robot_id
  FROM robot_versions
  WHERE id = p_version_id;

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Check if new name is available
  IF NOT is_version_name_available(v_robot_id, p_new_name, p_version_id) THEN
    RAISE EXCEPTION 'Version name "%" is already in use', p_new_name;
  END IF;

  -- Update version name
  UPDATE robot_versions
  SET version_name = p_new_name
  WHERE id = p_version_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;