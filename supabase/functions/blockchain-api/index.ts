import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlockchainRequest {
  chain: 'ethereum' | 'polygon';
  method: 'getBalance' | 'getTransaction' | 'getGasPrice' | 'getBlockNumber';
  address?: string;
  txHash?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API keys from Supabase secrets (environment variables)
    const infuraKey = Deno.env.get('INFURA_API_KEY')
    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY')
    const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY')

    if (!infuraKey || !alchemyKey || !etherscanKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required API keys' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request
    const { chain, method, address, txHash }: BlockchainRequest = await req.json()

    // Configure RPC URLs using the secure API keys
    const rpcUrls = {
      ethereum: `https://mainnet.infura.io/v3/${infuraKey}`,
      polygon: `https://polygon-mainnet.infura.io/v3/${infuraKey}`,
    }

    // Configure explorer APIs
    const explorerApis = {
      ethereum: `https://api.etherscan.io/api?apikey=${etherscanKey}`,
      polygon: `https://api.polygonscan.com/api?apikey=${etherscanKey}`,
    }

    let result;

    switch (method) {
      case 'getBalance':
        if (!address) {
          throw new Error('Address is required for getBalance')
        }
        
        // Use Infura RPC for balance check
        const balanceResponse = await fetch(rpcUrls[chain], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        })
        
        result = await balanceResponse.json()
        break

      case 'getTransaction':
        if (!txHash) {
          throw new Error('Transaction hash is required')
        }
        
        // Use explorer API for transaction details
        const txResponse = await fetch(
          `${explorerApis[chain]}&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}`
        )
        
        result = await txResponse.json()
        break

      case 'getGasPrice':
        // Use Infura for current gas price
        const gasPriceResponse = await fetch(rpcUrls[chain], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1,
          }),
        })
        
        result = await gasPriceResponse.json()
        break

      case 'getBlockNumber':
        // Use Alchemy for block number
        const alchemyUrl = chain === 'ethereum' 
          ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
          : `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`

        const blockResponse = await fetch(alchemyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        })
        
        result = await blockResponse.json()
        break

      default:
        throw new Error(`Unsupported method: ${method}`)
    }

    // Log the API usage for monitoring
    console.log(`Blockchain API called: ${chain}.${method}`, {
      timestamp: new Date().toISOString(),
      chain,
      method,
      hasAddress: !!address,
      hasTxHash: !!txHash,
    })

    return new Response(
      JSON.stringify({
        success: true,
        chain,
        method,
        data: result,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Blockchain API Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})