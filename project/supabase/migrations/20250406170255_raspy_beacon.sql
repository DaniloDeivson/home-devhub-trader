/*
  # Fix codes view update rule

  1. Changes
    - Add proper UPDATE rule for codes view
    - Fix RETURNING clause syntax
    - Ensure proper join between robots and versions
    
  2. Technical Details
    - Uses subquery for RETURNING to handle joins correctly
    - Maintains data consistency with robot_versions table
*/

CREATE OR REPLACE RULE codes_update AS
ON UPDATE TO codes DO INSTEAD
UPDATE robot_versions
SET 
  code = NEW.code_content,
  version_name = NEW.version,
  updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id
RETURNING 
  id,
  (SELECT owner_id FROM robots WHERE id = robot_versions.robot_id) as user_id,
  (SELECT name FROM robots WHERE id = robot_versions.robot_id) as robot_name,
  version_name as filename,
  code as code_content,
  version_name as version,
  created_at,
  updated_at;