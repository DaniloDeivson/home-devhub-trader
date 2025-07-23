/*
  # Fix robot deletion functionality

  1. Changes
    - Simplify robot deletion by using a single DELETE statement
    - Remove complex DO INSTEAD rules
    - Ensure proper cascading of deletions
    
  2. Security
    - Maintain RLS policies
    - Ensure proper ownership checks
*/

-- Drop existing rules and triggers that might conflict
DROP RULE IF EXISTS codes_delete ON codes;
DROP TRIGGER IF EXISTS before_delete_robot ON robots;

-- Create a simpler view for codes
CREATE OR REPLACE VIEW codes AS 
SELECT 
  r.id,
  r.owner_id as user_id,
  r.name as robot_name,
  'main.ntsl' as filename,
  COALESCE(rv.code, '') as code_content,
  COALESCE(rv.version_name, '1') as version,
  r.created_at,
  r.updated_at
FROM robots r
LEFT JOIN robot_versions rv ON rv.id = r.current_version_id;

-- Create a simple delete rule that maps to the robots table
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes DO INSTEAD
  DELETE FROM robots 
  WHERE id = OLD.id 
  AND owner_id = auth.uid();