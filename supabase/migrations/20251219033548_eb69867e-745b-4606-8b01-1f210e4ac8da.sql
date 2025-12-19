-- Fix voice-notes storage policy to restrict access to only the owner's files
DROP POLICY IF EXISTS "Users can view their voice notes" ON storage.objects;

-- Create properly scoped SELECT policy that checks user ownership via folder structure
CREATE POLICY "Users can view their own voice notes" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'voice-notes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);