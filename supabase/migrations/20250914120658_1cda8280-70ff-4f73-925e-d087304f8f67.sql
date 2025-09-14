-- Create a better RLS system that properly links auth users to profiles

-- First, add a user_id column to user_profiles to link to auth.users
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create function to get current user's profile ID
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Try to get profile by user_id first (proper auth link)
  SELECT id INTO profile_id 
  FROM public.user_profiles 
  WHERE user_id = auth.uid();
  
  -- If not found, try to find by auth email matching wallet pattern
  IF profile_id IS NULL THEN
    SELECT id INTO profile_id 
    FROM public.user_profiles p
    WHERE EXISTS (
      SELECT 1 FROM auth.users u 
      WHERE u.id = auth.uid() 
      AND u.email = p.wallet_address || '@wallet.local'
    );
  END IF;
  
  RETURN profile_id;
END;
$$;

-- Update RLS policies to use the new function
DROP POLICY IF EXISTS "Users can view their own files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.file_uploads;  
DROP POLICY IF EXISTS "Users can update their own files" ON public.file_uploads;

CREATE POLICY "Users can view their own files" 
ON public.file_uploads 
FOR SELECT 
USING (uploader_id = public.get_current_user_profile_id());

CREATE POLICY "Users can insert their own files" 
ON public.file_uploads 
FOR INSERT 
WITH CHECK (uploader_id = public.get_current_user_profile_id());

CREATE POLICY "Users can update their own files" 
ON public.file_uploads 
FOR UPDATE 
USING (uploader_id = public.get_current_user_profile_id());