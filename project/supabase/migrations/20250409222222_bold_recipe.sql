/*
  # Add tags column to robot_versions table

  1. Changes
    - Add tags column to robot_versions table
    - Set default tags for existing versions
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add tags column to robot_versions table if it doesn't exist
ALTER TABLE robot_versions 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT NULL;

-- Update existing versions to have default tags
UPDATE robot_versions
SET tags = ARRAY['tendencia']
WHERE tags IS NULL;