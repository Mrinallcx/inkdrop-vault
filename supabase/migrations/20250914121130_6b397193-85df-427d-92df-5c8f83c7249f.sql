-- Temporarily disable RLS on file_uploads to allow uploads to work
-- This removes the authentication barrier while we fix the wallet auth flow

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can update their own files" ON public.file_uploads;

-- Disable RLS entirely on file_uploads table
ALTER TABLE public.file_uploads DISABLE ROW LEVEL SECURITY;