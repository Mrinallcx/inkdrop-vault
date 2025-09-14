-- Remove ALL remaining policies from file_uploads table
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.file_uploads;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.file_uploads;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.file_uploads;

-- Also remove any other policies that might exist
DROP POLICY IF EXISTS "Users can view files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can insert files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can update files" ON public.file_uploads;