/*
  # Add strategy_analyses table
  
  1. New Tables
    - `strategy_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `analysis_data` (jsonb)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create strategy_analyses table
CREATE TABLE IF NOT EXISTS strategy_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE strategy_analyses ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can delete their own strategy analyses"
  ON strategy_analyses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());