/*
  # Add delete rule to codes view

  1. Changes
    - Add ON DELETE DO INSTEAD rule to codes view to allow deletion
    - Rule will delete the corresponding robot_version record
    - Rule includes RETURNING clause to satisfy PostgreSQL requirements

  2. Security
    - Rule maintains existing security model by only deleting if user has permission
*/

CREATE OR REPLACE RULE delete_codes AS
ON DELETE TO codes DO INSTEAD
  DELETE FROM robot_versions
  WHERE robot_versions.id = OLD.id
  RETURNING 
    robot_versions.id,
    robot_versions.robot_id as user_id,
    (SELECT name FROM robots WHERE robots.id = robot_versions.robot_id) as robot_name,
    robot_versions.version_name as filename,
    robot_versions.code as code_content,
    robot_versions.version_name as version,
    robot_versions.created_at,
    robot_versions.updated_at;