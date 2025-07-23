/*
  # Fix codes view and rules

  This migration fixes the codes view to properly map between the robots table
  and the codes view, ensuring all operations work correctly.

  1. Changes
    - Drop existing view and rules
    - Create new view mapping to robots table
    - Add rules for INSERT/UPDATE/DELETE operations
*/

-- Drop existing view and rules
DROP VIEW IF EXISTS codes CASCADE;

-- Create codes view with correct mapping
CREATE OR REPLACE VIEW codes AS 
SELECT 
  id,
  owner_id as user_id,
  name as robot_name,
  'main.ntsl' as filename,
  name as code_content,
  1 as version,
  created_at,
  updated_at
FROM robots;

-- Create insert rule
CREATE OR REPLACE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD (
  INSERT INTO robots (
    id,
    owner_id,
    name
  )
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.robot_name
  )
  RETURNING 
    id,
    owner_id as user_id,
    name as robot_name,
    'main.ntsl' as filename,
    name as code_content,
    1 as version,
    created_at,
    updated_at
);

-- Create update rule
CREATE OR REPLACE RULE codes_update AS
ON UPDATE TO codes
DO INSTEAD (
  UPDATE robots SET
    name = NEW.robot_name,
    updated_at = now()
  WHERE id = OLD.id AND owner_id = auth.uid()
  RETURNING 
    id,
    owner_id as user_id,
    name as robot_name,
    'main.ntsl' as filename,
    name as code_content,
    1 as version,
    created_at,
    updated_at
);

-- Create delete rule
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes
DO INSTEAD (
  DELETE FROM robots
  WHERE id = OLD.id AND owner_id = auth.uid()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON codes TO authenticated;