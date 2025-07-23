/*
  # Add version management functions

  1. New Functions
    - rename_robot_version: Safely rename a robot version
    - delete_robot_version: Safely mark a version as deleted
    
  2. Updates
    - Add validation for version names
    - Ensure unique version names per robot
*/

-- Function to rename a robot version
CREATE OR REPLACE FUNCTION rename_robot_version(
  p_version_id uuid,
  p_new_name text
) RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_existing_version_id uuid;
BEGIN
  -- Get robot_id for the version
  SELECT robot_id INTO v_robot_id
  FROM public.robot_versions
  WHERE id = p_version_id AND is_deleted = false;

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Check if new name already exists for this robot
  SELECT id INTO v_existing_version_id
  FROM public.robot_versions
  WHERE robot_id = v_robot_id 
    AND version_name = p_new_name 
    AND id != p_version_id
    AND is_deleted = false;

  IF v_existing_version_id IS NOT NULL THEN
    RAISE EXCEPTION 'A version with this name already exists';
  END IF;

  -- Update version name
  UPDATE public.robot_versions
  SET version_name = p_new_name
  WHERE id = p_version_id
  AND EXISTS (
    SELECT 1 FROM public.robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a robot version
CREATE OR REPLACE FUNCTION delete_robot_version(
  p_version_id uuid
) RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_version_count integer;
BEGIN
  -- Get robot_id and check version count
  SELECT 
    robot_id,
    (
      SELECT COUNT(*)
      FROM public.robot_versions rv2
      WHERE rv2.robot_id = robot_versions.robot_id
      AND rv2.is_deleted = false
    ) as version_count
  INTO v_robot_id, v_version_count
  FROM public.robot_versions
  WHERE id = p_version_id AND is_deleted = false;

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Don't allow deleting the last version
  IF v_version_count <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the only remaining version';
  END IF;

  -- Mark version as deleted
  UPDATE public.robot_versions
  SET is_deleted = true
  WHERE id = p_version_id
  AND EXISTS (
    SELECT 1 FROM public.robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;