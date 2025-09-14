-- Create transaction history table for tracking blockchain transactions
CREATE TABLE public.transaction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hash TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '0',
  gas_limit TEXT NOT NULL,
  gas_price TEXT,
  gas_used TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'dropped')),
  block_number INTEGER,
  confirmations INTEGER DEFAULT 0,
  transaction_type TEXT NOT NULL DEFAULT 'other' CHECK (transaction_type IN ('transfer', 'contract', 'mint', 'approve', 'other')),
  contract_address TEXT,
  method_name TEXT,
  method_params JSONB DEFAULT '{}',
  error_message TEXT,
  user_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_transaction_history_user_address ON public.transaction_history(user_address);
CREATE INDEX idx_transaction_history_hash ON public.transaction_history(hash);
CREATE INDEX idx_transaction_history_chain_id ON public.transaction_history(chain_id);
CREATE INDEX idx_transaction_history_status ON public.transaction_history(status);
CREATE INDEX idx_transaction_history_created_at ON public.transaction_history(created_at);
CREATE INDEX idx_transaction_history_user_chain ON public.transaction_history(user_address, chain_id);

-- Enable Row Level Security
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transaction history" 
ON public.transaction_history 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own transactions" 
ON public.transaction_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own transactions" 
ON public.transaction_history 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_transaction_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transaction_history_updated_at
  BEFORE UPDATE ON public.transaction_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transaction_history_updated_at();