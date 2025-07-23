/*
  # Fix version renaming functionality

  1. Changes
    - Add updated_at column to robot_versions table
    - Add trigger to update updated_at timestamp
    - Update rename_robot_version function to handle timestamps
    - Add security definer to ensure proper permissions

  2. Security
    - Function runs with elevated privileges
    - Checks user permissions before allowing changes
*/

-- Add updated_at column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.robot_versions 
  ADD COLUMN updated_at timestamptz DEFAULT now();
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_robot_versions_updated_at ON public.robot_versions;
CREATE TRIGGER update_robot_versions_updated_at
  BEFORE UPDATE ON public.robot_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop and recreate the rename function with proper error handling
CREATE OR REPLACE FUNCTION rename_robot_version(
  p_version_id uuid,
  p_new_name text
) RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_existing_version_id uuid;
  v_owner_id uuid;
BEGIN
  -- Input validation
  IF p_new_name IS NULL OR trim(p_new_name) = '' THEN
    RAISE EXCEPTION 'Version name cannot be empty';
  END IF;

  -- Get robot_id and verify ownership
  SELECT 
    rv.robot_id,
    r.owner_id
  INTO v_robot_id, v_owner_id
  FROM public.robot_versions rv
  JOIN public.robots r ON r.id = rv.robot_id
  WHERE rv.id = p_version_id 
  AND rv.is_deleted = false;

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Verify user owns the robot
  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Check if new name already exists
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
  SET 
    version_name = p_new_name,
    updated_at = now()
  WHERE id = p_version_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;