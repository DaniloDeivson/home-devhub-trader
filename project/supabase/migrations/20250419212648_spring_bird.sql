/*
  # Add phone field to profiles table
  
  1. Changes
    - Add phone column to profiles table
    - Set default to NULL
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add phone column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL;