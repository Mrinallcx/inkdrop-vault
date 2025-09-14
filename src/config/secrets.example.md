# Secrets Configuration Guide

This document explains how to manage API keys and sensitive configuration in Lovable projects.

## 🔐 Supabase Secrets Management

Lovable uses Supabase's secure secrets management system instead of traditional `.env` files.

### Adding Secrets

1. **Through Lovable Interface**: Use the secrets management tool in chat
2. **Supabase Dashboard**: Navigate to Project Settings → Edge Functions → Secrets
3. **CLI**: Use Supabase CLI for batch secret management

### Common Secrets You Might Need:

```bash
# Blockchain API Keys (add these via Supabase Secrets)
INFURA_API_KEY=your_infura_key_here
ALCHEMY_API_KEY=your_alchemy_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here
POLYGONSCAN_API_KEY=your_polygonscan_key_here

# Third-party Services
COINGECKO_API_KEY=your_coingecko_key_here
IPFS_API_KEY=your_ipfs_key_here
PINATA_API_KEY=your_pinata_key_here
PINATA_SECRET_KEY=your_pinata_secret_here

# NFT Marketplace APIs
OPENSEA_API_KEY=your_opensea_key_here
RARIBLE_API_KEY=your_rarible_key_here

# Analytics and Monitoring
MIXPANEL_TOKEN=your_mixpanel_token_here
SENTRY_DSN=your_sentry_dsn_here

# Email Services
SENDGRID_API_KEY=your_sendgrid_key_here
RESEND_API_KEY=your_resend_key_here

# Payment Processors
STRIPE_SECRET_KEY=your_stripe_secret_key_here
# Note: Stripe publishable key can be in code as it's public
```

### Using Secrets in Edge Functions

```typescript
// In Supabase Edge Functions, secrets are available as environment variables
const infuraKey = Deno.env.get('INFURA_API_KEY');
const alchemyKey = Deno.env.get('ALCHEMY_API_KEY');

// Example Edge Function using secrets
export async function handler(req: Request) {
  const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
  
  if (!etherscanKey) {
    return new Response('Missing API key', { status: 500 });
  }
  
  // Use the key in your API calls
  const response = await fetch(
    `https://api.etherscan.io/api?module=account&action=balance&address=${address}&apikey=${etherscanKey}`
  );
  
  return Response.json(await response.json());
}
```

## 🌍 Environment-Specific Configuration

### Development vs Production

Instead of different `.env` files, use:

1. **Feature Flags**: Enable/disable features per environment
2. **Configuration Objects**: Environment-specific settings in code
3. **Supabase Projects**: Separate Supabase projects for dev/staging/prod

### Configuration Strategy:

```typescript
// Use the environment configuration
import { getEnvironmentConfig } from '@/config/environment';

const config = getEnvironmentConfig();

// Different behavior based on environment
if (config.isDevelopment) {
  console.log('Running in development mode');
  // Use testnet endpoints
}

if (config.isProduction) {
  // Use mainnet endpoints
  // Enable analytics
}
```

## 🔍 Security Best Practices

### ✅ Safe to Store in Code:
- Public API endpoints
- Feature flags
- UI configuration
- Public keys (like Stripe publishable key)
- Application constants

### ❌ Never Store in Code:
- Private API keys
- Secret keys
- Database passwords
- JWT secrets
- Webhook secrets

### 🛡️ Additional Security:

1. **Rotate Keys Regularly**: Update API keys periodically
2. **Principle of Least Privilege**: Only give keys necessary permissions
3. **Monitor Usage**: Track API key usage for anomalies
4. **Use Different Keys**: Separate keys for development and production

## 📱 Client-Side Configuration

For public configuration that needs to be available in the browser:

```typescript
// This is safe as it contains only public information
export const CLIENT_CONFIG = {
  apiBaseUrl: '/api',
  supportedChains: ['ethereum', 'polygon'],
  features: {
    darkMode: true,
    multiChain: true,
  }
};
```

Remember: Never expose sensitive secrets to the client-side code!