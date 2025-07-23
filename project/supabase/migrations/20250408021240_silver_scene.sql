-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "select_robots" ON robots;
DROP POLICY IF EXISTS "insert_robots" ON robots;
DROP POLICY IF EXISTS "update_robots" ON robots;
DROP POLICY IF EXISTS "delete_robots" ON robots;
DROP POLICY IF EXISTS "robots_consolidated_access_policy" ON robots;

-- Create separate, non-recursive policies for each operation
CREATE POLICY "robots_select_policy" ON robots
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid() OR
  name IN (SELECT robot_name FROM shared_robots WHERE user_id = auth.uid()) OR
  id IN (SELECT robot_id FROM collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "robots_insert_policy" ON robots
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_update_policy" ON robots
FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "robots_delete_policy" ON robots
FOR DELETE TO authenticated
USING (owner_id = auth.uid());