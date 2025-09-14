import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address, wallet_type, network } = await req.json();
    
    if (!wallet_address || !wallet_type) {
      return new Response(
        JSON.stringify({ error: 'Wallet address and type are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create or update user profile
    const { data: profileData, error: profileError } = await supabase
      .rpc('upsert_user_profile', {
        p_wallet_address: wallet_address,
        p_wallet_type: wallet_type,
        p_network: network
      });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the full profile
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    if (fetchError) {
      console.error('Profile fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a temporary user in auth.users for session management
    let authUser;
    try {
      // Try to create user with wallet address as email (for session purposes)
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: `${wallet_address}@wallet.local`,
        password: Math.random().toString(36),
        email_confirm: true,
      });

      if (userError && !userError.message.includes('already registered')) {
        throw userError;
      }
      
      authUser = userData?.user;
    } catch (error) {
      // User might already exist, try to get them
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      authUser = existingUsers?.users?.find(u => u.email === `${wallet_address}@wallet.local`);
    }

    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate access token
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateAccessToken(authUser.id);

    if (tokenError) {
      console.error('Token generation error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate access token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        profile,
        session: {
          access_token: tokenData,
          user: authUser
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Wallet auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});