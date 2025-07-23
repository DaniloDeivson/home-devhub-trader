/*
  # Add DELETE rule to codes view

  1. Changes
    - Add ON DELETE DO INSTEAD rule to the codes view to handle DELETE RETURNING operations
    - The rule will delete from the underlying "Robôs Versão Master" table and return the deleted data

  2. Security
    - The rule maintains existing RLS policies as it operates through the base table
*/

CREATE OR REPLACE RULE delete_codes AS
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