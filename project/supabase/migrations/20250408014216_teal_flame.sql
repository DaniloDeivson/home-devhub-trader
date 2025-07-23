/*
  # Fix infinite recursion in robots table policies

  1. Changes
    - Remove redundant INSERT policies that cause recursion
    - Consolidate INSERT policies into a single clear policy
    - Keep existing SELECT, UPDATE, and DELETE policies unchanged

  2. Security
    - Maintains existing security model where:
      - Users can only create robots for themselves
      - System (postgres role) maintains full access
*/

-- Drop the conflicting policies
DROP POLICY IF EXISTS "System can create robots" ON robots;
DROP POLICY IF EXISTS "Users can create own robots" ON robots;
DROP POLICY IF EXISTS "Users can insert own robots" ON robots;

-- Create a single, clear INSERT policy
CREATE POLICY "Users can create robots" ON robots
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = owner_id
);

-- Note: Other policies remain unchanged as they are not causing issues:
-- - "System can manage robots"
-- - "Users can delete own robots"
-- - "Users can read own robots"
-- - "Users can read shared robots"
-- - "Users can update own robots"
-- - "Users can update shared robots with edit permission"