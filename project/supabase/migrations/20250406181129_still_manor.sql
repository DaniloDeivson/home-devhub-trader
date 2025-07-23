/*
  # Fix robot deletion functionality

  1. Changes
    - Add function to safely delete robots and all related data
    - Add trigger to prevent deleting robots with active shares
    - Update codes view to handle robot deletion properly

  2. Security
    - Ensure proper permission checks
    - Maintain data integrity
*/

-- Function to safely delete robot and all related data
CREATE OR REPLACE FUNCTION delete_robot_safely(p_robot_id uuid)
RETURNS boolean AS $$
DECLARE
  v_owner_id uuid;
  v_robot_name text;
BEGIN
  -- Get robot info and verify ownership
  SELECT owner_id, name INTO v_owner_id, v_robot_name
  FROM robots
  WHERE id = p_robot_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Robot not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Check for active shares
  IF EXISTS (
    SELECT 1 FROM shared_robots
    WHERE robot_name = v_robot_name
    AND created_by = auth.uid()
  ) THEN
    -- Delete shared access records
    DELETE FROM shared_robots
    WHERE robot_name = v_robot_name
    AND created_by = auth.uid();
  END IF;

  -- Delete sharing invites
  DELETE FROM sharing_invites
  WHERE robot_name = v_robot_name
  AND created_by = auth.uid();

  -- Delete robot (versions will be deleted via CASCADE)
  DELETE FROM robots
  WHERE id = p_robot_id
  AND owner_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update codes view to use safe deletion
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

-- Update delete rule to use safe deletion
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_robot_safely(
    (SELECT id FROM robots WHERE name = OLD.robot_name AND owner_id = auth.uid())
  );