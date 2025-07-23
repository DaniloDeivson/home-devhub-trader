/*
  # Add token balance and subscription fields to profiles

  1. Changes
    - Add token_balance column to profiles table
    - Add plan column to profiles table
    - Add plan_status column to profiles table
    - Add plan_renewal_date column to profiles table
    - Set default token balance to 200 for all users
    - Set default plan to 'Free Forever' for all users
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add token_balance column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS token_balance integer DEFAULT 200;

-- Add plan column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Free Forever';

-- Add plan_status column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_status text DEFAULT 'active';

-- Add plan_renewal_date column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_renewal_date timestamptz DEFAULT (now() + interval '30 days');

-- Update all existing users to have 200 tokens if they don't have any
UPDATE profiles
SET token_balance = 200
WHERE token_balance IS NULL OR token_balance = 0;

-- Update all existing users to have 'Free Forever' plan if they don't have one
UPDATE profiles
SET plan = 'Free Forever'
WHERE plan IS NULL;

-- Update all existing users to have 'active' plan_status if they don't have one
UPDATE profiles
SET plan_status = 'active'
WHERE plan_status IS NULL;