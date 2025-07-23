/*
  # Fix robot versions schema and functionality

  1. Changes
    - Drop existing robot_versions table
    - Create new robot_versions table with correct schema
    - Add proper RLS policies
    - Add helper functions for version management

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.robot_versions CASCADE;

-- Create robot_versions table
CREATE TABLE public.robot_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id uuid REFERENCES public.robots(id) ON DELETE CASCADE NOT NULL,
  version_name text NOT NULL,
  code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_deleted boolean DEFAULT false,
  UNIQUE(robot_id, version_name)
);

-- Enable RLS
ALTER TABLE public.robot_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for robot_versions
CREATE POLICY "Users can manage versions of owned robots"
  ON public.robot_versions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  ));

-- Create helper function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_robot_id uuid)
RETURNS integer AS $$
DECLARE
  v_next_number integer;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_number
  FROM (
    SELECT (regexp_matches(version_name, '^v(\d+)\.0\.0$'))[1]::integer as version_number
    FROM public.robot_versions
    WHERE robot_id = p_robot_id
    AND is_deleted = false
  ) v;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create a new version
CREATE OR REPLACE FUNCTION create_robot_version(
  p_robot_id uuid,
  p_version_name text,
  p_code text,
  p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_version_id uuid;
BEGIN
  -- Create new version
  INSERT INTO public.robot_versions (
    robot_id,
    version_name,
    code,
    description,
    created_by
  )
  VALUES (
    p_robot_id,
    p_version_name,
    p_code,
    p_description,
    auth.uid()
  )
  RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;