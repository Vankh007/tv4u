-- Allow admins to upload site logos to the logos folder
CREATE POLICY "Admins can upload site logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update site logos
CREATE POLICY "Admins can update site logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete site logos
CREATE POLICY "Admins can delete site logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);