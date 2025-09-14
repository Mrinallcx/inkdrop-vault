-- Check existing policies and recreate them properly
-- First drop all existing policies on file_uploads
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname 
               FROM pg_policies 
               WHERE schemaname = 'public' AND tablename = 'file_uploads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Create simple, effective policies
CREATE POLICY "Enable read for authenticated users" 
ON public.file_uploads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
ON public.file_uploads 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
ON public.file_uploads 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);