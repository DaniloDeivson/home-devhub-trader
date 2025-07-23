/*
  # Add automatic version creation and default version selection

  1. Changes
    - Add trigger to automatically create version 1 when a robot is created
    - Add function to get latest version for a robot
    - Add column to track current version
    - Add helper functions for version management

  2. Security
    - All functions run with SECURITY DEFINER
    - Proper permission checks in place
*/

-- Add current_version_id to robots if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.robots
  ADD COLUMN current_version_id uuid REFERENCES public.robot_versions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Function to create initial version
CREATE OR REPLACE FUNCTION create_initial_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_id uuid;
BEGIN
  -- Create version 1
  INSERT INTO public.robot_versions (
    robot_id,
    version_name,
    code,
    created_by,
    description
  ) VALUES (
    NEW.id,
    'Versão 1',
    '// ' || NEW.name || '
// Versão 1.0.0

var
  precoEntrada, precoSaida: float;
begin
  // Lógica principal do robô
  // Clique para começar a editar
end;',
    NEW.owner_id,
    'Versão inicial'
  ) RETURNING id INTO v_version_id;

  -- Set as current version
  UPDATE public.robots
  SET current_version_id = v_version_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic version creation
DROP TRIGGER IF EXISTS create_initial_version_trigger ON public.robots;
CREATE TRIGGER create_initial_version_trigger
  AFTER INSERT ON public.robots
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_version();

-- Function to get latest version
CREATE OR REPLACE FUNCTION get_latest_version(p_robot_id uuid)
RETURNS uuid AS $$
DECLARE
  v_version_id uuid;
BEGIN
  SELECT id INTO v_version_id
  FROM public.robot_versions
  WHERE robot_id = p_robot_id
    AND is_deleted = false
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update current version
CREATE OR REPLACE FUNCTION update_current_version(
  p_robot_id uuid,
  p_version_id uuid
)
RETURNS boolean AS $$
BEGIN
  -- Verify ownership and version exists
  IF NOT EXISTS (
    SELECT 1 
    FROM public.robots r
    JOIN public.robot_versions rv ON rv.robot_id = r.id
    WHERE r.id = p_robot_id
      AND rv.id = p_version_id
      AND r.owner_id = auth.uid()
      AND rv.is_deleted = false
  ) THEN
    RETURN false;
  END IF;

  -- Update current version
  UPDATE public.robots
  SET current_version_id = p_version_id
  WHERE id = p_robot_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify create_version function to set as current
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

  -- Set as current version
  PERFORM update_current_version(p_robot_id, v_version_id);

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;