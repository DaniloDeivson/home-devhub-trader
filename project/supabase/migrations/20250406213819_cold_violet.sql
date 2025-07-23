/*
  # Fix RLS policy for shared robots

  1. Changes
    - Drop existing problematic policy
    - Create new policy with proper conditions for accepting invites
    - Add policy for system operations
    
  2. Security
    - Ensure proper permission checks
    - Maintain data integrity
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can accept invites for themselves" ON public.shared_robots;

-- Create new policy for accepting invites
CREATE POLICY "Users can accept invites for themselves"
ON public.shared_robots
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert rows for themselves
  user_id = auth.uid() 
  AND
  -- Must have a valid, active invite
  EXISTS (
    SELECT 1 
    FROM sharing_invites
    WHERE sharing_invites.robot_name = shared_robots.robot_name
    AND sharing_invites.permission = shared_robots.permission
    AND sharing_invites.is_active = true
    AND sharing_invites.expires_at > now()
    AND sharing_invites.accepted_at IS NULL
    AND sharing_invites.email = (
      SELECT email 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  )
);

-- Add system-level policy for administrative operations
CREATE POLICY "System can manage shared robots"
ON public.shared_robots
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);