/*
  # Fix codes table and insert rule

  1. Changes
    - Create "Robôs Versão Master" table
    - Add rule for INSERT operations on codes view
    - Maintain RLS policies

  2. Security
    - Enable RLS on table
    - Add appropriate policies
*/

-- Create the table first
CREATE TABLE IF NOT EXISTS "Robôs Versão Master" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  robot_name text NOT NULL,
  filename text NOT NULL,
  code_content text,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, robot_name, filename)
);

-- Enable RLS
ALTER TABLE "Robôs Versão Master" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own codes"
  ON "Robôs Versão Master"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own codes"
  ON "Robôs Versão Master"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own codes"
  ON "Robôs Versão Master"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own codes"
  ON "Robôs Versão Master"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create or replace the view
CREATE OR REPLACE VIEW codes AS
SELECT * FROM "Robôs Versão Master";

-- Create the insert rule
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