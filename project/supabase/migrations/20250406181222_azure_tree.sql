/*
  # Fix robot deletion functionality

  1. Changes
    - Add function to safely delete robot and all related data
    - Update codes view to handle deletion properly
    - Add proper error handling and validation

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
  r.id,
  r.owner_id as user_id,
  r.name as robot_name,
  'main.ntsl' as filename,
  r.name as code_content,
  '1' as version,
  r.created_at,
  r.updated_at
FROM robots r;

-- Update delete rule to use safe deletion
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_robot_safely(OLD.id);