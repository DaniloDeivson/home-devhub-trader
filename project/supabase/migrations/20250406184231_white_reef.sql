/*
  # Fix Robot Storage and Deletion

  1. Changes
    - Drop existing problematic objects
    - Add proper user-scoped robot storage
    - Fix robot deletion functionality
    - Update codes view to handle user-scoped data

  2. Security
    - Ensure proper RLS policies
    - Add user-scoped constraints
*/

-- Drop existing problematic objects
DROP VIEW IF EXISTS codes CASCADE;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;
DROP FUNCTION IF EXISTS handle_robot_deletion() CASCADE;

-- Add unique constraint for robot names per user
DO $$ BEGIN
  ALTER TABLE robots DROP CONSTRAINT IF EXISTS robots_owner_id_name_key;
  ALTER TABLE robots ADD CONSTRAINT robots_owner_id_name_key UNIQUE (owner_id, name);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

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
CREATE OR REPLACE FUNCTION delete_robot(p_robot_name text)
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

-- Function to create robot
CREATE OR REPLACE FUNCTION create_robot(p_name text)
RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
BEGIN
  -- Check if robot name exists for this user
  IF EXISTS (
    SELECT 1 FROM robots
    WHERE owner_id = auth.uid()
    AND name = p_name
  ) THEN
    RETURN NULL;
  END IF;

  -- Create robot
  INSERT INTO robots (owner_id, name)
  VALUES (auth.uid(), p_name)
  RETURNING id INTO v_robot_id;

  RETURN v_robot_id;
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

-- Create DELETE rule for codes view
CREATE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  SELECT delete_robot(OLD.robot_name);

-- Update RLS policies
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own robots" ON robots;
CREATE POLICY "Users can read own robots"
  ON robots
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own robots" ON robots;
CREATE POLICY "Users can create own robots"
  ON robots
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own robots" ON robots;
CREATE POLICY "Users can update own robots"
  ON robots
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own robots" ON robots;
CREATE POLICY "Users can delete own robots"
  ON robots
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());