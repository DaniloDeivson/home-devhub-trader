/*
  # Add Robot Master and Version Tables

  1. New Tables
    - `robot_masters`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `current_version_id` (uuid, references robot_versions)
    
    - `robot_versions`
      - `id` (uuid, primary key)
      - `robot_id` (uuid, references robot_masters)
      - `version_number` (integer)
      - `name` (text)
      - `code` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `is_deleted` (boolean)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read versions of owned robots" ON public.robot_versions;
DROP POLICY IF EXISTS "Users can create versions for owned robots" ON public.robot_versions;
DROP POLICY IF EXISTS "Users can update versions of owned robots" ON public.robot_versions;
DROP POLICY IF EXISTS "System can manage robot versions" ON public.robot_versions;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.robot_versions CASCADE;
DROP TABLE IF EXISTS public.robot_masters CASCADE;

-- Create robot_masters table
CREATE TABLE public.robot_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  current_version_id uuid,
  UNIQUE(owner_id, name)
);

-- Create robot_versions table
CREATE TABLE public.robot_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id uuid REFERENCES public.robot_masters(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false,
  UNIQUE(robot_id, version_number),
  UNIQUE(robot_id, name)
);

-- Add foreign key constraint for current_version_id
ALTER TABLE public.robot_masters
  ADD CONSTRAINT robot_masters_current_version_id_fkey
  FOREIGN KEY (current_version_id) REFERENCES public.robot_versions(id)
  ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.robot_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robot_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for robot_masters
CREATE POLICY "Users can manage own robot masters"
  ON public.robot_masters
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Create policies for robot_versions
CREATE POLICY "Users can manage versions of owned robots"
  ON public.robot_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.robot_masters
      WHERE robot_masters.id = robot_versions.robot_id
      AND robot_masters.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.robot_masters
      WHERE robot_masters.id = robot_versions.robot_id
      AND robot_masters.owner_id = auth.uid()
    )
  );

-- Create helper functions
CREATE OR REPLACE FUNCTION get_next_version_number(p_robot_id uuid)
RETURNS integer AS $$
DECLARE
  v_next_number integer;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_number
  FROM public.robot_versions
  WHERE robot_id = p_robot_id;
  
  RETURN v_next_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new version
CREATE OR REPLACE FUNCTION create_robot_version(
  p_robot_id uuid,
  p_code text,
  p_name text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_version_number integer;
  v_version_id uuid;
  v_version_name text;
BEGIN
  -- Get next version number
  v_version_number := get_next_version_number(p_robot_id);
  
  -- Generate version name if not provided
  v_version_name := COALESCE(p_name, 'Versão ' || v_version_number);

  -- Create new version
  INSERT INTO public.robot_versions (
    robot_id,
    version_number,
    name,
    code,
    created_by
  )
  VALUES (
    p_robot_id,
    v_version_number,
    v_version_name,
    p_code,
    auth.uid()
  )
  RETURNING id INTO v_version_id;

  -- Update master's current version
  UPDATE public.robot_masters
  SET current_version_id = v_version_id,
      updated_at = now()
  WHERE id = p_robot_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update robot master
CREATE OR REPLACE FUNCTION update_robot_master(
  p_owner_id uuid,
  p_name text,
  p_code text,
  p_version_name text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
  v_version_id uuid;
BEGIN
  -- Get or create master
  SELECT id INTO v_robot_id
  FROM public.robot_masters
  WHERE owner_id = p_owner_id AND name = p_name;

  IF v_robot_id IS NULL THEN
    INSERT INTO public.robot_masters (owner_id, name)
    VALUES (p_owner_id, p_name)
    RETURNING id INTO v_robot_id;
  END IF;

  -- Create new version
  v_version_id := create_robot_version(v_robot_id, p_code, p_version_name);

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;