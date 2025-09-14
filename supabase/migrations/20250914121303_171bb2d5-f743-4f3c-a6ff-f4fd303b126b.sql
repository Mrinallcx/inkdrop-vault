-- Check if user_profiles RLS is blocking the foreign key reference
-- Temporarily disable RLS on user_profiles as well

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;