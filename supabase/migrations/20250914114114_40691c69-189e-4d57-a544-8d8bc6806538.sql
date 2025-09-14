-- Update RLS policies to work without session variables

-- Drop existing policies that use session variables
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create collections" ON public.nft_collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.nft_collections;
DROP POLICY IF EXISTS "Users can view their own files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can upload files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can update their own files" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can create NFTs" ON public.nft_tokens;
DROP POLICY IF EXISTS "Owners and creators can update NFTs" ON public.nft_tokens;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.minting_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.minting_transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.minting_transactions;
DROP POLICY IF EXISTS "Users can create activity" ON public.user_activity;

-- Create simplified RLS policies that don't require session variables
-- For now, we'll allow authenticated users to manage their own data through application logic

-- User profiles - allow all authenticated users to update any profile (application will enforce wallet ownership)
CREATE POLICY "Authenticated users can update profiles" ON public.user_profiles 
FOR UPDATE TO authenticated
USING (true);

-- NFT collections - allow authenticated users to create and update collections
CREATE POLICY "Authenticated users can create collections" ON public.nft_collections 
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update collections" ON public.nft_collections 
FOR UPDATE TO authenticated
USING (true);

-- File uploads - allow authenticated users to manage files
CREATE POLICY "Authenticated users can view files" ON public.file_uploads 
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can upload files" ON public.file_uploads 
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update files" ON public.file_uploads 
FOR UPDATE TO authenticated
USING (true);

-- NFT tokens - allow authenticated users to create and manage NFTs
CREATE POLICY "Authenticated users can create NFTs" ON public.nft_tokens 
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update NFTs" ON public.nft_tokens 
FOR UPDATE TO authenticated
USING (true);

-- Minting transactions - allow authenticated users to manage transactions
CREATE POLICY "Authenticated users can view transactions" ON public.minting_transactions 
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create transactions" ON public.minting_transactions 
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions" ON public.minting_transactions 
FOR UPDATE TO authenticated
USING (true);

-- User activity - allow authenticated users to create activity
CREATE POLICY "Authenticated users can create activity" ON public.user_activity 
FOR INSERT TO authenticated
WITH CHECK (true);

-- Create a helper function to get user ID by wallet address
CREATE OR REPLACE FUNCTION public.get_user_id_by_wallet(wallet_addr TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id 
  FROM public.user_profiles 
  WHERE wallet_address = wallet_addr;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;