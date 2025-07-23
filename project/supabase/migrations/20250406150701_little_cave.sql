/*
  # Create codes view and handlers

  This migration creates a view that maps the robot_masters and robot_versions tables
  to maintain compatibility with the old codes table structure.

  1. Create codes view
    - Maps data from robot_masters and robot_versions tables
    - Maintains backward compatibility
    
  2. Security
    - Add policies for authenticated users
*/

-- Create codes view
CREATE OR REPLACE VIEW public.codes AS
SELECT 
  rv.id,
  rm.owner_id as user_id,
  rm.name as robot_name,
  rv.name as filename,
  rv.code as code_content,
  rv.version_number as version,
  rv.created_at,
  rm.updated_at
FROM public.robot_masters rm
JOIN public.robot_versions rv ON rm.id = rv.robot_id
WHERE rv.is_deleted = false;

-- Create rules to handle INSERT/UPDATE/DELETE operations on the view
CREATE OR REPLACE RULE codes_insert AS ON INSERT TO public.codes
DO INSTEAD (
  SELECT update_robot_master(NEW.user_id, NEW.robot_name, NEW.code_content, NEW.filename)
);

CREATE OR REPLACE RULE codes_update AS ON UPDATE TO public.codes
DO INSTEAD (
  SELECT update_robot_master(NEW.user_id, NEW.robot_name, NEW.code_content, NEW.filename)
);

CREATE OR REPLACE RULE codes_delete AS ON DELETE TO public.codes
DO INSTEAD (
  UPDATE public.robot_versions
  SET is_deleted = true
  FROM public.robot_masters
  WHERE robot_versions.robot_id = robot_masters.id
    AND robot_masters.owner_id = OLD.user_id
    AND robot_masters.name = OLD.robot_name
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.codes TO authenticated;