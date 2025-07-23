/*
  # Fix Robot User Association

  1. Changes
    - Add system policies for robot operations
    - Add helper function to ensure robot exists
    - Fix permission issues with robot operations
    - Add trigger to handle user profile creation
    - Add trigger to handle robot creation

  2. Security
    - Add policies for system operations
    - Ensure proper permission checks
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "System can create robots" ON robots;
DROP POLICY IF EXISTS "System can manage robots" ON robots;

-- Create system policies for robots
CREATE POLICY "System can create robots"
  ON robots
  FOR INSERT
  TO postgres
  WITH CHECK (true);

CREATE POLICY "System can manage robots"
  ON robots
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to create robot with owner validation
CREATE OR REPLACE FUNCTION create_robot_with_owner(
  p_name text,
  p_initial_code text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
  v_version_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Verify user exists in profiles
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if robot name already exists for this user
  IF EXISTS (
    SELECT 1 FROM robots
    WHERE owner_id = v_user_id
    AND name = p_name
  ) THEN
    RAISE EXCEPTION 'A robot with this name already exists';
  END IF;

  -- Create robot
  INSERT INTO robots (
    owner_id,
    name,
    current_version_id
  ) VALUES (
    v_user_id,
    p_name,
    NULL
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
    COALESCE(p_initial_code, '// ' || p_name || '
// Versão 1

var
  precoEntrada, precoSaida: float;
begin
  // Lógica principal do robô
  // Clique para começar a editar
end;'),
    v_user_id,
    'Versão inicial'
  ) RETURNING id INTO v_version_id;

  -- Update robot with current_version_id
  UPDATE robots
  SET current_version_id = v_version_id
  WHERE id = v_robot_id;

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update codes view to use new function
CREATE OR REPLACE VIEW codes AS
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

-- Update insert rule to use new function
CREATE OR REPLACE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD
  SELECT create_robot_with_owner(NEW.robot_name, NEW.code_content);