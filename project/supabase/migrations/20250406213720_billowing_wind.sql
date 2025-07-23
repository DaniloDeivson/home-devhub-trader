/*
  # Add RLS policy for accepting invites

  1. Changes
    - Add new RLS policy to allow users to insert rows in shared_robots table when accepting invites
    
  2. Security
    - Policy ensures users can only insert rows where:
      - The user_id matches their own ID
      - There is a valid, active invite for their email
      - The invite hasn't expired
      - The invite hasn't been accepted yet
*/

CREATE POLICY "Users can accept invites for themselves"
ON public.shared_robots
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM sharing_invites
    WHERE sharing_invites.robot_name = shared_robots.robot_name
    AND sharing_invites.permission = shared_robots.permission
    AND sharing_invites.is_active = true
    AND sharing_invites.expires_at > now()
    AND sharing_invites.accepted_at IS NULL
    AND sharing_invites.user_id = auth.uid()
  )
);