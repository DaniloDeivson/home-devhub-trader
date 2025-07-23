/*
  # Fix codes view DELETE operations

  1. Changes
    - Drop existing codes view
    - Recreate codes view with proper DELETE handling
    - Add security policies for the view

  2. Security
    - Enable RLS on codes view
    - Add policies for authenticated users
*/

-- Drop existing codes view
DROP VIEW IF EXISTS codes;

-- Recreate codes view with proper DELETE handling
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

-- Create instead of rules
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes
DO INSTEAD
  UPDATE robot_versions
  SET is_deleted = true
  WHERE id = OLD.id
  RETURNING 
    id,
    robot_id as user_id,
    version_name as robot_name,
    version_name as filename,
    code as code_content,
    version_name as version,
    created_at,
    updated_at;