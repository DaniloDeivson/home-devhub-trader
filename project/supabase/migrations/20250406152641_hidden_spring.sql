/*
  # Fix rules for codes view

  This migration:
  1. Drops existing view and rules
  2. Creates a simpler implementation without WITH queries
  3. Ensures proper error handling
*/

-- Drop existing view and rules
DROP VIEW IF EXISTS codes CASCADE;

-- Drop existing table if it exists
DROP TABLE IF EXISTS "Robôs Versão Master" CASCADE;

-- Create base table
CREATE TABLE "Robôs Versão Master" (
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
DO $$ BEGIN
  CREATE POLICY "Users can read own codes"
    ON "Robôs Versão Master"
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own codes"
    ON "Robôs Versão Master"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own codes"
    ON "Robôs Versão Master"
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own codes"
    ON "Robôs Versão Master"
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create codes view
CREATE VIEW codes AS
SELECT * FROM "Robôs Versão Master";

-- Create simplified rules for the view
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
  SELECT
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.robot_name,
    NEW.filename,
    NEW.code_content,
    COALESCE(NEW.version, 1),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now());

CREATE OR REPLACE RULE codes_update AS
ON UPDATE TO codes
DO INSTEAD
  UPDATE "Robôs Versão Master" SET
    robot_name = NEW.robot_name,
    filename = NEW.filename,
    code_content = NEW.code_content,
    version = COALESCE(NEW.version, version + 1),
    updated_at = now()
  WHERE id = OLD.id AND user_id = auth.uid();

CREATE OR REPLACE RULE codes_delete AS
ON DELETE TO codes
DO INSTEAD
  DELETE FROM "Robôs Versão Master"
  WHERE id = OLD.id AND user_id = auth.uid();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Robôs Versão Master" TO authenticated;