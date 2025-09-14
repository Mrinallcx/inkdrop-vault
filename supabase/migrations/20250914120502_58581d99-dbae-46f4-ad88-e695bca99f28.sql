-- Update RLS policies for file_uploads to work with wallet-based authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view files" ON public.file_uploads;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON public.file_uploads;
DROP POLICY IF EXISTS "Authenticated users can update files" ON public.file_uploads;

-- Create new policies that work with both auth.uid() and profile linking
CREATE POLICY "Users can view their own files" 
ON public.file_uploads 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    uploader_id IN (
      SELECT id FROM public.user_profiles 
      WHERE id = uploader_id
    )
  )
);

CREATE POLICY "Users can insert their own files" 
ON public.file_uploads 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    uploader_id IN (
      SELECT id FROM public.user_profiles 
      WHERE id = uploader_id
    )
  )
);

CREATE POLICY "Users can update their own files" 
ON public.file_uploads 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    uploader_id IN (
      SELECT id FROM public.user_profiles 
      WHERE id = uploader_id
    )
  )
);