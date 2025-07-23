/*
  # Add collaboration system tables and functions

  1. New Tables
    - `collaborators`
      - Tracks users with access to robots
      - Stores permission levels and status
    - `collaboration_sessions`
      - Tracks active editing sessions
      - Handles concurrent editing locks
    
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id uuid REFERENCES robots(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission text NOT NULL CHECK (permission IN ('view', 'edit')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(robot_id, user_id)
);

-- Create collaboration_sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id uuid REFERENCES robots(id) ON DELETE CASCADE NOT NULL,
  version_id uuid REFERENCES robot_versions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for collaborators table
CREATE POLICY "Users can view collaborations they are part of"
  ON collaborators
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Robot owners can manage collaborators"
  ON collaborators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = collaborators.robot_id
      AND robots.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = collaborators.robot_id
      AND robots.owner_id = auth.uid()
    )
  );

-- Policies for collaboration_sessions
CREATE POLICY "Users can view their own sessions"
  ON collaboration_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions"
  ON collaboration_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to start collaboration session
CREATE OR REPLACE FUNCTION start_collaboration_session(
  p_robot_id uuid,
  p_version_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Verify user has access
  IF NOT EXISTS (
    SELECT 1 FROM robots r
    LEFT JOIN collaborators c ON c.robot_id = r.id
    WHERE r.id = p_robot_id
    AND (
      r.owner_id = auth.uid() OR
      (c.user_id = auth.uid() AND c.permission = 'edit')
    )
  ) THEN
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

-- Function to end collaboration session
CREATE OR REPLACE FUNCTION end_collaboration_session(
  p_session_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE collaboration_sessions
  SET 
    is_active = false,
    last_activity = now()
  WHERE id = p_session_id
  AND user_id = auth.uid();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active collaborators for a robot
CREATE OR REPLACE FUNCTION get_active_collaborators(
  p_robot_id uuid
)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  permission text,
  last_activity timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.user_id,
    u.email as user_email,
    c.permission,
    cs.last_activity
  FROM collaborators c
  JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN collaboration_sessions cs ON cs.user_id = c.user_id 
    AND cs.robot_id = c.robot_id
    AND cs.is_active = true
  WHERE c.robot_id = p_robot_id
  ORDER BY cs.last_activity DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;