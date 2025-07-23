-- First disable RLS to avoid any conflicts
ALTER TABLE robots DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "robots_owner_policy" ON robots;
DROP POLICY IF EXISTS "robots_shared_policy" ON robots;
DROP POLICY IF EXISTS "robots_collaborator_policy" ON robots;

-- Re-enable RLS
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

-- Create a single, comprehensive read policy that combines all access patterns
CREATE POLICY "robots_access_policy"
ON robots
FOR ALL 
TO authenticated
USING (
  owner_id = auth.uid() OR
  name IN (
    SELECT robot_name 
    FROM shared_robots 
    WHERE user_id = auth.uid()
  ) OR
  id IN (
    SELECT robot_id
    FROM collaborators
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  owner_id = auth.uid() OR
  name IN (
    SELECT robot_name 
    FROM shared_robots 
    WHERE user_id = auth.uid()
    AND permission = 'edit'
  )
);

-- Update the create_robot_safely function to be more robust
CREATE OR REPLACE FUNCTION create_robot_safely(
  p_name text,
  p_owner_id uuid DEFAULT auth.uid()
)
RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
  v_version_id uuid;
BEGIN
  -- Validate input
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Robot name cannot be empty';
  END IF;

  -- Create robot
  INSERT INTO robots (
    owner_id,
    name
  ) VALUES (
    p_owner_id,
    p_name
  ) RETURNING id INTO v_robot_id;

  -- Create initial version
  INSERT INTO robot_versions (
    robot_id,
    version_name,
    code,
    created_by,
    description
  ) VALUES (
    v_robot_id,
    'Versão 1',
    '// ' || p_name || E'\n// Versão 1\n\nvar\n  precoEntrada, precoSaida: float;\nbegin\n  // Lógica principal do robô\n  // Clique para começar a editar\nend;',
    p_owner_id,
    'Versão inicial'
  ) RETURNING id INTO v_version_id;

  -- Update robot with current_version_id
  UPDATE robots
  SET current_version_id = v_version_id
  WHERE id = v_robot_id;

  RETURN v_robot_id;

EXCEPTION
  WHEN unique_violation THEN
    -- Clean up any partial creation
    IF v_robot_id IS NOT NULL THEN
      DELETE FROM robots WHERE id = v_robot_id;
    END IF;
    RAISE EXCEPTION 'A robot with this name already exists';
  WHEN OTHERS THEN
    -- Clean up any partial creation
    IF v_robot_id IS NOT NULL THEN
      DELETE FROM robots WHERE id = v_robot_id;
    END IF;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;