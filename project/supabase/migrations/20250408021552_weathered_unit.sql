/*
  # Fix infinite recursion in robots table RLS policies

  1. Changes
    - Remove recursive conditions from robots table RLS policies
    - Simplify the SELECT policy to avoid self-referential queries
    - Update policies to use direct conditions instead of subqueries where possible

  2. Security
    - Maintain existing security model where:
      - Users can only access their own robots
      - Users can access shared robots
      - Users can access robots they collaborate on
    - All operations still require authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "robots_select_policy" ON robots;
DROP POLICY IF EXISTS "robots_insert_policy" ON robots;
DROP POLICY IF EXISTS "robots_update_policy" ON robots;
DROP POLICY IF EXISTS "robots_delete_policy" ON robots;

-- Create new, optimized policies
CREATE POLICY "robots_select_policy" ON robots
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT robot_id FROM collaborators WHERE user_id = auth.uid()
    ) OR
    name IN (
      SELECT robot_name FROM shared_robots WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "robots_insert_policy" ON robots
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_update_policy" ON robots
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_delete_policy" ON robots
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());