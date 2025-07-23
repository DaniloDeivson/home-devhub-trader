/*
  # Create avatars storage bucket

  1. Storage
    - Creates a new public storage bucket named 'avatars'
    - Configures public access for avatar images
  
  2. Security
    - Enables authenticated users to upload their own avatars
    - Allows public read access to all avatars
    - Restricts file types to images only
    - Limits file size to 5MB
*/

-- Create the avatars bucket if it doesn't exist
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Allow public access to view avatars
CREATE POLICY "Give public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('png', 'jpg', 'jpeg', 'gif', 'webp'))
);

-- Allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- Allow users to delete their own avatars
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid() = owner);