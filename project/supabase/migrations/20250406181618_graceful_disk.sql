/*
  # Fix robot deletion functionality
  
  1. Changes
    - Add proper cascading delete for robots
    - Fix deletion rules and constraints
    - Add helper functions for safe deletion
    
  2. Security
    - Maintain RLS policies
    - Ensure proper ownership checks
*/

-- Drop existing rules and triggers that might conflict
DROP RULE IF EXISTS codes_delete ON codes;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;

-- Function to safely delete a robot
CREATE OR REPLACE FUNCTION delete_robot_safely(p_robot_name text)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
  v_owner_id uuid;
BEGIN
  -- Get robot info and verify ownership
  SELECT id, owner_id INTO v_robot_id, v_owner_id
  FROM robots
  WHERE name = p_robot_name
  AND owner_id = auth.uid();

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Robot not found or permission denied';
  END IF;

  -- Delete robot (versions will be deleted via CASCADE)
  DELETE FROM robots
  WHERE id = v_robot_id
  AND owner_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler view for codes
CREATE OR REPLACE VIEW codes AS 
SELECT 
  r.id,
  r.owner_id as user_id,
  r.name as robot_name,
  'main.ntsl' as filename,
  COALESCE(rv.code, '') as code_content,
  COALESCE(rv.version_name, '1') as version,
  r.created_at,
  r.updated_at
FROM robots r
LEFT JOIN robot_versions rv ON rv.id = r.current_version_id
WHERE rv.is_deleted = false OR rv.is_deleted IS NULL;

-- Create a simple delete rule that uses robot name
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_robot_safely(OLD.robot_name);