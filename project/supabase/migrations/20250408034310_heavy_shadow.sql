/*
  # Add developer profiles table
  
  1. New Tables
    - `developer_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `specialty` (text)
      - `experience` (text)
      - `portfolio_url` (text)
      - `hourly_rate` (numeric)
      - `is_verified` (boolean)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create developer_profiles table
CREATE TABLE IF NOT EXISTS developer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  specialty text NOT NULL,
  experience text NOT NULL,
  portfolio_url text,
  hourly_rate numeric DEFAULT 99.90,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all developer profiles"
  ON developer_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage their own developer profile"
  ON developer_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE TRIGGER update_developer_profiles_updated_at
  BEFORE UPDATE ON developer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();