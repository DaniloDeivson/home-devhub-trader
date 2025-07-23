/*
  # Fix Robot Policies and Add Helper Functions

  1. Changes
    - Add system policies for robot operations
    - Add helper function to ensure robot exists
    - Fix permission issues with robot operations

  2. Security
    - Add policies for system operations
    - Ensure proper permission checks
*/

-- Add helper function to ensure robot exists
CREATE OR REPLACE FUNCTION public.ensure_robot_exists(
  p_owner_id uuid,
  p_name text
) RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
BEGIN
  -- Try to find existing robot
  SELECT id INTO v_robot_id
  FROM public.robots
  WHERE owner_id = p_owner_id AND name = p_name;

  -- If not found, create it
  IF v_robot_id IS NULL THEN
    INSERT INTO public.robots (owner_id, name)
    VALUES (p_owner_id, p_name)
    RETURNING id INTO v_robot_id;
  END IF;

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add system policies for robots
DROP POLICY IF EXISTS "System can manage robots" ON public.robots;
CREATE POLICY "System can manage robots"
  ON public.robots
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Update existing robot policies
DROP POLICY IF EXISTS "Users can read own robots" ON public.robots;
CREATE POLICY "Users can read own robots"
  ON public.robots
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.shared_robots
      WHERE robot_name = robots.name
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own robots" ON public.robots;
CREATE POLICY "Users can insert own robots"
  ON public.robots
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own robots" ON public.robots;
CREATE POLICY "Users can update own robots"
  ON public.robots
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own robots" ON public.robots;
CREATE POLICY "Users can delete own robots"
  ON public.robots
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());