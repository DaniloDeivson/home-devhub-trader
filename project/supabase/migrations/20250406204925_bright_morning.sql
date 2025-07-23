/*
  # Add shared links table and functions
  
  1. New Tables
    - shared_links: Stores shareable links for robots
      - id (uuid, primary key)
      - robot_name (text)
      - permission (text)
      - created_by (uuid)
      - expires_at (timestamp)
      - token (text)
      - is_active (boolean)
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create shared_links table
CREATE TABLE IF NOT EXISTS shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_name text NOT NULL,
  permission text NOT NULL CHECK (permission IN ('view', 'edit')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  UNIQUE(robot_name, token)
);

-- Enable RLS
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their shared links"
  ON shared_links
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Function to create a shared link
CREATE OR REPLACE FUNCTION create_shared_link(
  p_robot_name text,
  p_permission text,
  p_token text,
  p_expires_at timestamptz DEFAULT (now() + interval '7 days')
)
RETURNS uuid AS $$
DECLARE
  v_link_id uuid;
BEGIN
  -- Validate inputs
  IF p_robot_name IS NULL OR p_permission IS NULL OR p_token IS NULL THEN
    RAISE EXCEPTION 'Missing required fields';
  END IF;

  -- Create link
  INSERT INTO shared_links (
    robot_name,
    permission,
    created_by,
    expires_at,
    token
  ) VALUES (
    p_robot_name,
    p_permission,
    auth.uid(),
    p_expires_at,
    p_token
  ) RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;