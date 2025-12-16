-- Create storage bucket for community photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-photos', 'community-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow lifetime members to upload photos
CREATE POLICY "Lifetime members can upload community photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-photos' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_lifetime = true
  )
);

-- Allow lifetime members to view community photos
CREATE POLICY "Lifetime members can view community photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'community-photos'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_lifetime = true
  )
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own community photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);