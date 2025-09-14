export interface ChainConfig {
  id: string;
  name: string;
  displayName: string;
  network: string;
  chainId: number | string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
  walletTypes: string[];
  color: string;
  icon: string;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'ethereum',
    displayName: 'Ethereum',
    network: 'mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: false,
    walletTypes: ['metamask', 'trustwallet'],
    color: '#627EEA',
    icon: '⟠',
  },
  polygon: {
    id: 'polygon',
    name: 'polygon',
    displayName: 'Polygon',
    network: 'mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com/',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    testnet: false,
    walletTypes: ['metamask', 'trustwallet'],
    color: '#8247E5',
    icon: '⬟',
  },
  solana: {
    id: 'solana',
    name: 'solana',
    displayName: 'Solana',
    network: 'mainnet-beta',
    chainId: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    testnet: false,
    walletTypes: ['phantom'],
    color: '#9945FF',
    icon: '◎',
  },
  cardano: {
    id: 'cardano',
    name: 'cardano',
    displayName: 'Cardano',
    network: 'mainnet',
    chainId: 'mainnet',
    rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
    explorerUrl: 'https://cardanoscan.io',
    nativeCurrency: {
      name: 'Cardano',
      symbol: 'ADA',
      decimals: 6,
    },
    testnet: false,
    walletTypes: ['lace'],
    color: '#0033AD',
    icon: '₳',
  },
  // Testnets
  sepolia: {
    id: 'sepolia',
    name: 'ethereum',
    displayName: 'Ethereum Sepolia',
    network: 'sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    testnet: true,
    walletTypes: ['metamask', 'trustwallet'],
    color: '#627EEA',
    icon: '⟠',
  },
  mumbai: {
    id: 'mumbai',
    name: 'polygon',
    displayName: 'Polygon Mumbai',
    network: 'testnet',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    testnet: true,
    walletTypes: ['metamask', 'trustwallet'],
    color: '#8247E5',
    icon: '⬟',
  },
  devnet: {
    id: 'devnet',
    name: 'solana',
    displayName: 'Solana Devnet',
    network: 'devnet',
    chainId: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    testnet: true,
    walletTypes: ['phantom'],
    color: '#9945FF',
    icon: '◎',
  },
  preview: {
    id: 'preview',
    name: 'cardano',
    displayName: 'Cardano Preview',
    network: 'preview',
    chainId: 'preview',
    rpcUrl: 'https://cardano-preview.blockfrost.io/api/v0',
    explorerUrl: 'https://preview.cardanoscan.io',
    nativeCurrency: {
      name: 'Cardano',
      symbol: 'ADA',
      decimals: 6,
    },
    testnet: true,
    walletTypes: ['lace'],
    color: '#0033AD',
    icon: '₳',
  },
};

export const getChainById = (chainId: string): ChainConfig | undefined => {
  return SUPPORTED_CHAINS[chainId];
};

export const getMainnetChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => !chain.testnet);
};

export const getTestnetChains = (): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.testnet);
};

export const getChainsByWalletType = (walletType: string): ChainConfig[] => {
  return Object.values(SUPPORTED_CHAINS).filter(chain => 
    chain.walletTypes.includes(walletType)
  );
};

export const isChainSupported = (chainId: string | number): boolean => {
  return Object.values(SUPPORTED_CHAINS).some(chain => 
    chain.chainId === chainId || chain.id === chainId
  );
};