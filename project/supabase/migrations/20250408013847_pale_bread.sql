/*
  # Fix collaboration system and permissions

  1. Changes
    - Add proper cascading for robot deletion
    - Fix collaboration session handling
    - Add better permission checks
    - Update RLS policies
*/

-- Drop existing problematic objects
DROP TRIGGER IF EXISTS before_delete_robot ON robots CASCADE;
DROP FUNCTION IF EXISTS handle_robot_deletion() CASCADE;

-- Create function to handle robot deletion cleanup
CREATE OR REPLACE FUNCTION handle_robot_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- End all active collaboration sessions
  UPDATE collaboration_sessions
  SET 
    is_active = false,
    last_activity = now()
  WHERE robot_id = OLD.id;

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

-- Update RLS policies for robots
DROP POLICY IF EXISTS "Users can read shared robots" ON robots;
CREATE POLICY "Users can read shared robots"
  ON robots
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_robots
      WHERE shared_robots.robot_name = robots.name
      AND shared_robots.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE collaborators.robot_id = robots.id
      AND collaborators.user_id = auth.uid()
    )
  );

-- Update RLS policies for robot versions
DROP POLICY IF EXISTS "Users can read shared robot versions" ON robot_versions;
CREATE POLICY "Users can read shared robot versions"
  ON robot_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = robot_versions.robot_id
      AND (
        robots.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM shared_robots
          WHERE shared_robots.robot_name = robots.name
          AND shared_robots.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM collaborators
          WHERE collaborators.robot_id = robots.id
          AND collaborators.user_id = auth.uid()
        )
      )
    )
  );

-- Function to check collaboration access
CREATE OR REPLACE FUNCTION check_collaboration_access(
  p_robot_id uuid,
  p_permission text DEFAULT 'view'
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM robots r
    LEFT JOIN collaborators c ON c.robot_id = r.id
    WHERE r.id = p_robot_id
    AND (
      r.owner_id = auth.uid() OR
      (
        c.user_id = auth.uid() AND
        CASE 
          WHEN p_permission = 'edit' THEN c.permission = 'edit'
          ELSE c.permission IN ('view', 'edit')
        END
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start collaboration session with access check
CREATE OR REPLACE FUNCTION start_collaboration_session(
  p_robot_id uuid,
  p_version_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Verify user has access
  IF NOT check_collaboration_access(p_robot_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Create or update session
  INSERT INTO collaboration_sessions (
    robot_id,
    version_id,
    user_id
  )
  VALUES (
    p_robot_id,
    p_version_id,
    auth.uid()
  )
  ON CONFLICT (robot_id, user_id) WHERE is_active = true
  DO UPDATE SET
    last_activity = now()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;