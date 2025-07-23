-- Create strategy_analyses table if it doesn't exist
CREATE TABLE IF NOT EXISTS strategy_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE strategy_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies safely using DO blocks to check if they exist first
DO $$ 
BEGIN
  -- Check if the SELECT policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'strategy_analyses' 
    AND policyname = 'Users can read their own strategy analyses'
  ) THEN
    CREATE POLICY "Users can read their own strategy analyses"
      ON strategy_analyses
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- Check if the INSERT policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'strategy_analyses' 
    AND policyname = 'Users can create their own strategy analyses'
  ) THEN
    CREATE POLICY "Users can create their own strategy analyses"
      ON strategy_analyses
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Check if the DELETE policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'strategy_analyses' 
    AND policyname = 'Users can delete their own strategy analyses'
  ) THEN
    CREATE POLICY "Users can delete their own strategy analyses"
      ON strategy_analyses
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;