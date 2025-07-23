/*
  # Add DELETE rule for codes view

  1. Changes
    - Add INSTEAD OF DELETE rule to codes view to handle DELETE RETURNING operations
    
  2. Purpose
    - Enables proper deletion of records through the codes view
    - Allows DELETE operations to return deleted record data
    - Fixes application errors when deleting robots
*/

CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  DELETE FROM robot_versions
  WHERE robot_versions.id = OLD.id
  RETURNING 
    robot_versions.id,
    (SELECT owner_id FROM robots WHERE robots.id = robot_versions.robot_id) as user_id,
    (SELECT name FROM robots WHERE robots.id = robot_versions.robot_id) as robot_name,
    robot_versions.version_name as filename,
    robot_versions.code as code_content,
    robot_versions.version_name as version,
    robot_versions.created_at,
    robot_versions.updated_at;