-- Add policies for shared robots access
CREATE POLICY "Users can read shared robots"
  ON robots
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_robots
      WHERE shared_robots.robot_name = robots.name
      AND shared_robots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shared robots with edit permission"
  ON robots
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_robots
      WHERE shared_robots.robot_name = robots.name
      AND shared_robots.user_id = auth.uid()
      AND shared_robots.permission = 'edit'
    )
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_robots
      WHERE shared_robots.robot_name = robots.name
      AND shared_robots.user_id = auth.uid()
      AND shared_robots.permission = 'edit'
    )
  );

-- Add policies for shared robot versions
CREATE POLICY "Users can read shared robot versions"
  ON robot_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = robot_versions.robot_id
      AND (
        robots.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM shared_robots
          WHERE shared_robots.robot_name = robots.name
          AND shared_robots.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update shared robot versions with edit permission"
  ON robot_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = robot_versions.robot_id
      AND (
        robots.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM shared_robots
          WHERE shared_robots.robot_name = robots.name
          AND shared_robots.user_id = auth.uid()
          AND shared_robots.permission = 'edit'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM robots
      WHERE robots.id = robot_versions.robot_id
      AND (
        robots.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM shared_robots
          WHERE shared_robots.robot_name = robots.name
          AND shared_robots.user_id = auth.uid()
          AND shared_robots.permission = 'edit'
        )
      )
    )
  );