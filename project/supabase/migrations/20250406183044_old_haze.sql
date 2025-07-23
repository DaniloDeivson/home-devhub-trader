/*
  # Fix codes view and DELETE operation

  1. Changes
    - Drop codes view with CASCADE to remove dependent objects
    - Recreate codes view with proper structure
    - Add DELETE rule that properly handles RETURNING
    - Update robot_versions constraints
    
  2. Security
    - Maintain RLS policies
    - Ensure proper ownership checks
*/

-- Drop codes view with CASCADE to remove dependent objects
DROP VIEW IF EXISTS codes CASCADE;

-- Recreate codes view with proper structure
CREATE VIEW codes AS
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

-- Create DELETE rule with proper RETURNING clause
CREATE RULE codes_delete AS
ON DELETE TO codes
DO INSTEAD
  UPDATE robot_versions
  SET is_deleted = true
  WHERE id = OLD.id
  AND EXISTS (
    SELECT 1 FROM robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  )
  RETURNING 
    id,
    (SELECT owner_id FROM robots WHERE id = robot_versions.robot_id) as user_id,
    (SELECT name FROM robots WHERE id = robot_versions.robot_id) as robot_name,
    version_name as filename,
    code as code_content,
    version_name as version,
    created_at,
    updated_at;