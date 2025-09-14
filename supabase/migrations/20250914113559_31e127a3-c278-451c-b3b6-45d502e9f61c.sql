-- Create user profiles table linked to wallet addresses
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('metamask', 'phantom', 'trustwallet', 'lace')),
  network TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  total_nfts_created INTEGER DEFAULT 0,
  total_nfts_owned INTEGER DEFAULT 0,
  total_collections INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NFT collections table
CREATE TABLE public.nft_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  symbol TEXT,
  cover_image_url TEXT,
  banner_image_url TEXT,
  website_url TEXT,
  discord_url TEXT,
  twitter_url TEXT,
  total_supply INTEGER DEFAULT 0,
  floor_price DECIMAL(18, 8),
  volume_traded DECIMAL(18, 8) DEFAULT 0,
  blockchain TEXT NOT NULL DEFAULT 'ethereum',
  contract_address TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file uploads table
CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  is_compressed BOOLEAN DEFAULT false,
  compression_ratio DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NFT tokens table
CREATE TABLE public.nft_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.nft_collections(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  image_file_id UUID REFERENCES public.file_uploads(id) ON DELETE SET NULL,
  animation_file_id UUID REFERENCES public.file_uploads(id) ON DELETE SET NULL,
  external_url TEXT,
  attributes JSONB DEFAULT '[]'::jsonb,
  properties JSONB DEFAULT '{}'::jsonb,
  levels JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  blockchain TEXT NOT NULL DEFAULT 'ethereum',
  contract_address TEXT,
  token_standard TEXT DEFAULT 'ERC721' CHECK (token_standard IN ('ERC721', 'ERC1155', 'SPL')),
  mint_price DECIMAL(18, 8),
  current_price DECIMAL(18, 8),
  last_sale_price DECIMAL(18, 8),
  royalty_percentage DECIMAL(5, 2) DEFAULT 0,
  royalty_recipient TEXT,
  is_minted BOOLEAN DEFAULT false,
  is_listed BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create minting transactions table
CREATE TABLE public.minting_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_token_id UUID NOT NULL REFERENCES public.nft_tokens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  transaction_hash TEXT,
  blockchain TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'failed', 'cancelled')),
  gas_fee DECIMAL(18, 8),
  gas_limit INTEGER,
  gas_price DECIMAL(18, 8),
  block_number INTEGER,
  confirmation_count INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user activity table for tracking user actions
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('mint', 'list', 'purchase', 'transfer', 'like', 'follow', 'create_collection')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('nft', 'collection', 'user')),
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX idx_nft_collections_creator_id ON public.nft_collections(creator_id);
CREATE INDEX idx_nft_collections_blockchain ON public.nft_collections(blockchain);
CREATE INDEX idx_file_uploads_uploader_id ON public.file_uploads(uploader_id);
CREATE INDEX idx_file_uploads_storage_path ON public.file_uploads(storage_path);
CREATE INDEX idx_nft_tokens_collection_id ON public.nft_tokens(collection_id);
CREATE INDEX idx_nft_tokens_creator_id ON public.nft_tokens(creator_id);
CREATE INDEX idx_nft_tokens_owner_id ON public.nft_tokens(owner_id);
CREATE INDEX idx_nft_tokens_blockchain ON public.nft_tokens(blockchain);
CREATE INDEX idx_nft_tokens_is_listed ON public.nft_tokens(is_listed);
CREATE INDEX idx_minting_transactions_nft_token_id ON public.minting_transactions(nft_token_id);
CREATE INDEX idx_minting_transactions_user_id ON public.minting_transactions(user_id);
CREATE INDEX idx_minting_transactions_status ON public.minting_transactions(status);
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_entity_type_id ON public.user_activity(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (wallet_address = current_setting('app.current_wallet_address', true));

-- RLS Policies for nft_collections
CREATE POLICY "Anyone can view collections" ON public.nft_collections FOR SELECT USING (true);
CREATE POLICY "Users can create collections" ON public.nft_collections FOR INSERT WITH CHECK (
  creator_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);
CREATE POLICY "Users can update their own collections" ON public.nft_collections FOR UPDATE USING (
  creator_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);

-- RLS Policies for file_uploads
CREATE POLICY "Users can view their own files" ON public.file_uploads FOR SELECT USING (
  uploader_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);
CREATE POLICY "Users can upload files" ON public.file_uploads FOR INSERT WITH CHECK (
  uploader_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);
CREATE POLICY "Users can update their own files" ON public.file_uploads FOR UPDATE USING (
  uploader_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);

-- RLS Policies for nft_tokens
CREATE POLICY "Anyone can view NFTs" ON public.nft_tokens FOR SELECT USING (true);
CREATE POLICY "Users can create NFTs" ON public.nft_tokens FOR INSERT WITH CHECK (
  creator_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);
CREATE POLICY "Owners and creators can update NFTs" ON public.nft_tokens FOR UPDATE USING (
  creator_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
  OR owner_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);

-- RLS Policies for minting_transactions
CREATE POLICY "Users can view their own transactions" ON public.minting_transactions FOR SELECT USING (
  user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);
CREATE POLICY "Users can create their own transactions" ON public.minting_transactions FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);
CREATE POLICY "Users can update their own transactions" ON public.minting_transactions FOR UPDATE USING (
  user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);

-- RLS Policies for user_activity
CREATE POLICY "Users can view activity" ON public.user_activity FOR SELECT USING (true);
CREATE POLICY "Users can create activity" ON public.user_activity FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('app.current_wallet_address', true))
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('nft-images', 'nft-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('nft-animations', 'nft-animations', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('collection-assets', 'collection-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true);

-- Storage policies for nft-images bucket
CREATE POLICY "Anyone can view NFT images" ON storage.objects FOR SELECT USING (bucket_id = 'nft-images');
CREATE POLICY "Authenticated users can upload NFT images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'nft-images' AND
  auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their own NFT images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'nft-images' AND
  auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete their own NFT images" ON storage.objects FOR DELETE USING (
  bucket_id = 'nft-images' AND
  auth.role() = 'authenticated'
);

-- Storage policies for nft-animations bucket
CREATE POLICY "Anyone can view NFT animations" ON storage.objects FOR SELECT USING (bucket_id = 'nft-animations');
CREATE POLICY "Authenticated users can upload NFT animations" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'nft-animations' AND
  auth.role() = 'authenticated'
);

-- Storage policies for collection-assets bucket
CREATE POLICY "Anyone can view collection assets" ON storage.objects FOR SELECT USING (bucket_id = 'collection-assets');
CREATE POLICY "Authenticated users can upload collection assets" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'collection-assets' AND
  auth.role() = 'authenticated'
);

-- Storage policies for user-avatars bucket
CREATE POLICY "Anyone can view user avatars" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "Authenticated users can upload user avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated'
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nft_collections_updated_at
  BEFORE UPDATE ON public.nft_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at
  BEFORE UPDATE ON public.file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nft_tokens_updated_at
  BEFORE UPDATE ON public.nft_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_minting_transactions_updated_at
  BEFORE UPDATE ON public.minting_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create or update user profile when wallet connects
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  p_wallet_address TEXT,
  p_wallet_type TEXT,
  p_network TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Try to update existing profile
  UPDATE public.user_profiles 
  SET 
    wallet_type = p_wallet_type,
    network = COALESCE(p_network, network),
    updated_at = now()
  WHERE wallet_address = p_wallet_address
  RETURNING id INTO user_id;
  
  -- If no existing profile, create new one
  IF user_id IS NULL THEN
    INSERT INTO public.user_profiles (
      wallet_address,
      wallet_type,
      network
    ) VALUES (
      p_wallet_address,
      p_wallet_type,
      p_network
    ) RETURNING id INTO user_id;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;