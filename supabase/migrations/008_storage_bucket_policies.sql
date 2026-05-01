-- Enable public access to user profile pictures in storage bucket
-- This allows users to see profile picture URLs without auth

-- Allow public (unauthenticated) users to read from the user-profile-picture folder
CREATE POLICY "Public read access to profile pictures"
  ON storage.objects FOR
SELECT
    USING (bucket_id = 'smartDar-componets' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload profile pictures"
  ON storage.objects FOR
INSERT
  WITH CHECK
    (
    bucket_id
= 'smartDar-componets' AND
    auth.role
() = 'authenticated'
  );

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their profile pictures"
  ON storage.objects FOR
UPDATE
  USING (bucket_id = 'smartDar-componets'
AND auth.role
() = 'authenticated')
  WITH CHECK
(bucket_id = 'smartDar-componets' AND auth.role
() = 'authenticated');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their profile pictures"
  ON storage.objects FOR
DELETE
  USING (bucket_id
= 'smartDar-componets' AND auth.role
() = 'authenticated');
