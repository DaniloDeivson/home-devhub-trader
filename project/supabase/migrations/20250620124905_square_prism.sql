/*
  # Add backtest_analyses table
  
  1. New Tables
    - `backtest_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `data` (jsonb)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create backtest_analyses table
CREATE TABLE IF NOT EXISTS backtest_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE backtest_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own backtest analyses"
  ON backtest_analyses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own backtest analyses"
  ON backtest_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own backtest analyses"
  ON backtest_analyses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own backtest analyses"
  ON backtest_analyses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());