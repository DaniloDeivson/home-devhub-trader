-- Drop existing problematic objects
DROP VIEW IF EXISTS codes CASCADE;
DROP FUNCTION IF EXISTS delete_robot_safely(text) CASCADE;
DROP FUNCTION IF EXISTS delete_version_safely(uuid) CASCADE;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;
DROP FUNCTION IF EXISTS handle_robot_deletion() CASCADE;

-- Function to handle robot deletion cleanup
CREATE OR REPLACE FUNCTION handle_robot_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete shared access records
  DELETE FROM shared_robots
  WHERE robot_name = OLD.name
  AND created_by = OLD.owner_id;

  -- Delete sharing invites
  DELETE FROM sharing_invites
  WHERE robot_name = OLD.name
  AND created_by = OLD.owner_id;

  -- Mark all versions as deleted
  UPDATE robot_versions
  SET is_deleted = true
  WHERE robot_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for robot deletion
CREATE TRIGGER before_delete_robot
  BEFORE DELETE ON robots
  FOR EACH ROW
  EXECUTE FUNCTION handle_robot_deletion();

-- Function to safely delete robot
CREATE OR REPLACE FUNCTION delete_robot_safely(p_robot_name text)
RETURNS boolean AS $$
DECLARE
  v_robot_id uuid;
BEGIN
  -- Get robot ID and verify ownership
  SELECT id INTO v_robot_id
  FROM robots
  WHERE name = p_robot_name
  AND owner_id = auth.uid();

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Robot not found or permission denied';
  END IF;

  -- Delete robot (trigger will handle cleanup)
  DELETE FROM robots
  WHERE id = v_robot_id
  AND owner_id = auth.uid();

  RETURN FOUND;
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
  SELECT delete_robot_safely(OLD.robot_name);