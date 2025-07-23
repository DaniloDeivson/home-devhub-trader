-- Add user_id column to sharing_invites table
ALTER TABLE sharing_invites 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing invites with user_id if possible
DO $$ 
BEGIN
  UPDATE sharing_invites si
  SET user_id = au.id
  FROM auth.users au
  WHERE si.email = au.email
  AND si.user_id IS NULL;
END $$;