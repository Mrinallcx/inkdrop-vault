// Environment Configuration for Lovable Projects
// Note: This file manages public configuration and constants
// For sensitive API keys, use Supabase Secrets Management

export const APP_CONFIG = {
  // App Information
  name: 'Multi-Chain NFT Platform',
  version: '1.0.0',
  description: 'Create, mint, and manage NFTs across multiple blockchains',
  
  // Public API Endpoints (these can be stored in code as they're public)
  api: {
    // Example public API endpoints
    coingecko: 'https://api.coingecko.com/api/v3',
    etherscan: 'https://api.etherscan.io/api',
    polygonscan: 'https://api.polygonscan.com/api',
    // For private API keys, use Supabase secrets instead
  },
  
  // Blockchain Configuration
  blockchain: {
    // Default network settings
    defaultNetwork: 'ethereum',
    supportedNetworks: ['ethereum', 'polygon', 'solana', 'cardano'],
    
    // Public RPC endpoints (can be in code)
    publicRpcs: {
      ethereum: 'https://cloudflare-eth.com',
      polygon: 'https://polygon-rpc.com',
    },
  },
  
  // UI Configuration
  ui: {
    theme: {
      defaultMode: 'light' as 'light' | 'dark' | 'system',
      supportedModes: ['light', 'dark', 'system'],
    },
    
    // Feature flags
    features: {
      multiChainSupport: true,
      gasEstimation: true,
      transactionMonitoring: true,
      nftMarketplace: false, // Coming soon
    },
    
    // Pagination and limits
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 100,
    },
  },
  
  // Development Configuration
  development: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    enableTestnetsByDefault: true,
    mockTransactions: false,
  },
  
  // Production Configuration
  production: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
  },
} as const;

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    isTest: process.env.NODE_ENV === 'test',
    
    // Merge base config with environment-specific settings
    ...APP_CONFIG,
    
    // Override settings based on environment
    ...(isDevelopment && {
      api: {
        ...APP_CONFIG.api,
        // Use testnet endpoints in development
        baseUrl: '/api/dev',
      },
    }),
    
    ...(isProduction && {
      api: {
        ...APP_CONFIG.api,
        // Use production endpoints
        baseUrl: '/api/v1',
      },
    }),
  };
};

// Type-safe environment configuration
export type EnvironmentConfig = ReturnType<typeof getEnvironmentConfig>;

// Helper functions for common environment checks
export const isClient = () => typeof window !== 'undefined';
export const isServer = () => typeof window === 'undefined';

// Public configuration that can be safely exposed to the client
export const PUBLIC_CONFIG = {
  appName: APP_CONFIG.name,
  version: APP_CONFIG.version,
  supportedNetworks: APP_CONFIG.blockchain.supportedNetworks,
  features: APP_CONFIG.ui.features,
} as const;