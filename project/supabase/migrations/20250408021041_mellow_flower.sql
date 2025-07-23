-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own robots" ON robots;
DROP POLICY IF EXISTS "Users can read shared robots" ON robots;
DROP POLICY IF EXISTS "Users can read collaborative robots" ON robots;
DROP POLICY IF EXISTS "robots_consolidated_access_policy" ON robots;
DROP POLICY IF EXISTS "Users can create own robots" ON robots;
DROP POLICY IF EXISTS "Users can update own robots" ON robots;
DROP POLICY IF EXISTS "Users can delete own robots" ON robots;

-- Create a single, simple policy for each operation type
CREATE POLICY "select_robots" ON robots
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid() OR
  name IN (SELECT robot_name FROM shared_robots WHERE user_id = auth.uid()) OR
  id IN (SELECT robot_id FROM collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "insert_robots" ON robots
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "update_robots" ON robots
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "delete_robots" ON robots
FOR DELETE TO authenticated
USING (owner_id = auth.uid());