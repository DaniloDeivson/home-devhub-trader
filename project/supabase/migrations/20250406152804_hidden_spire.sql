/*
  # Add rules to codes view

  1. Changes
    - Drop existing codes view
    - Recreate codes view with proper rules for INSERT and DELETE operations
    - Add INSTEAD OF rules to handle INSERT and DELETE operations with RETURNING

  2. Security
    - Maintains existing security model
    - View inherits RLS policies from base table
*/

-- Drop the existing view
DROP VIEW IF EXISTS codes;

-- Recreate the view
CREATE VIEW codes AS
SELECT 
  id,
  user_id,
  robot_name,
  filename,
  code_content,
  version,
  created_at,
  updated_at
FROM "Robôs Versão Master";

-- Add INSTEAD OF INSERT rule
CREATE OR REPLACE RULE codes_insert AS
ON INSERT TO codes
DO INSTEAD
  INSERT INTO "Robôs Versão Master" (
    id,
    user_id,
    robot_name,
    filename,
    code_content,
    version,
    created_at,
    updated_at
  )
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.robot_name,
    NEW.filename,
    NEW.code_content,
    COALESCE(NEW.version, 1),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  RETURNING 
    id,
    user_id,
    robot_name,
    filename,
    code_content,
    version,
    created_at,
    updated_at;

-- Add INSTEAD OF DELETE rule
CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes
DO INSTEAD
  DELETE FROM "Robôs Versão Master"
  WHERE id = OLD.id
  RETURNING 
    id,
    user_id,
    robot_name,
    filename,
    code_content,
    version,
    created_at,
    updated_at;