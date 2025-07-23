/*
  # Fix strategy_analyses table and policies
  
  1. Changes
    - Add index on user_id for better query performance
    - Ensure proper RLS policies exist
    - Add updated_at column for tracking changes
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper user isolation
*/

-- Add index on user_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'strategy_analyses' 
    AND indexname = 'strategy_analyses_user_id_idx'
  ) THEN
    CREATE INDEX strategy_analyses_user_id_idx ON strategy_analyses(user_id);
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
ALTER TABLE strategy_analyses 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace trigger for updated_at
CREATE OR REPLACE FUNCTION update_strategy_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_strategy_analyses_updated_at ON strategy_analyses;
CREATE TRIGGER update_strategy_analyses_updated_at
  BEFORE UPDATE ON strategy_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_analyses_updated_at();

-- Ensure RLS is enabled
ALTER TABLE strategy_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can read their own strategy analyses" ON strategy_analyses;
DROP POLICY IF EXISTS "Users can create their own strategy analyses" ON strategy_analyses;
DROP POLICY IF EXISTS "Users can update their own strategy analyses" ON strategy_analyses;
DROP POLICY IF EXISTS "Users can delete their own strategy analyses" ON strategy_analyses;

-- Create policies
CREATE POLICY "Users can read their own strategy analyses"
  ON strategy_analyses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own strategy analyses"
  ON strategy_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own strategy analyses"
  ON strategy_analyses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own strategy analyses"
  ON strategy_analyses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());