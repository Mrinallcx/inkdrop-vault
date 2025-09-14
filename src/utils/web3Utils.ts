import { ethers } from 'ethers';
import { ChainConfig, getChainById } from '@/config/chains';
import { WalletConnection } from '@/contexts/MultiChainWalletContext';

export interface Web3Provider {
  provider: any;
  signer?: any;
  chainId: string;
  type: 'ethereum' | 'solana' | 'cardano';
}

export class Web3ConnectionManager {
  private providers: Map<string, Web3Provider> = new Map();
  private listeners: Map<string, ((provider: Web3Provider) => void)[]> = new Map();

  // Get Web3 provider for a specific chain
  async getProvider(chainId: string, connection?: WalletConnection): Promise<Web3Provider | null> {
    const chain = getChainById(chainId);
    if (!chain) return null;

    // Check if we already have a provider for this chain
    let provider = this.providers.get(chainId);
    if (provider && !connection) {
      return provider;
    }

    // Create new provider based on chain type
    switch (chain.name) {
      case 'ethereum':
      case 'polygon':
        provider = await this.createEthereumProvider(chain, connection);
        break;
      case 'solana':
        provider = await this.createSolanaProvider(chain, connection);
        break;
      case 'cardano':
        provider = await this.createCardanoProvider(chain, connection);
        break;
      default:
        return null;
    }

    if (provider) {
      this.providers.set(chainId, provider);
      this.notifyListeners(chainId, provider);
    }

    return provider;
  }

  // Create Ethereum/Polygon provider
  private async createEthereumProvider(
    chain: ChainConfig, 
    connection?: WalletConnection
  ): Promise<Web3Provider> {
    let provider: ethers.Provider;
    let signer: ethers.Signer | undefined;

    if (connection && window.ethereum) {
      // Use connected wallet as provider
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      provider = ethProvider;
      signer = await ethProvider.getSigner();
    } else {
      // Use RPC provider for read-only operations
      provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    }

    return {
      provider,
      signer,
      chainId: chain.id,
      type: 'ethereum',
    };
  }

  // Create Solana provider
  private async createSolanaProvider(
    chain: ChainConfig, 
    connection?: WalletConnection
  ): Promise<Web3Provider> {
    // For Solana, we'll use @solana/web3.js
    const { Connection, clusterApiUrl } = await import('@solana/web3.js');
    
    const rpcUrl = chain.rpcUrl;
    const provider = new Connection(rpcUrl, 'confirmed');

    return {
      provider,
      signer: connection ? window.solana : undefined,
      chainId: chain.id,
      type: 'solana',
    };
  }

  // Create Cardano provider
  private async createCardanoProvider(
    chain: ChainConfig, 
    connection?: WalletConnection
  ): Promise<Web3Provider> {
    // Cardano provider implementation
    return {
      provider: { rpcUrl: chain.rpcUrl },
      signer: connection ? window.cardano?.lace : undefined,
      chainId: chain.id,
      type: 'cardano',
    };
  }

  // Add listener for provider changes
  addProviderListener(chainId: string, callback: (provider: Web3Provider) => void) {
    if (!this.listeners.has(chainId)) {
      this.listeners.set(chainId, []);
    }
    this.listeners.get(chainId)!.push(callback);
  }

  // Remove provider listener
  removeProviderListener(chainId: string, callback: (provider: Web3Provider) => void) {
    const callbacks = this.listeners.get(chainId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify listeners of provider changes
  private notifyListeners(chainId: string, provider: Web3Provider) {
    const callbacks = this.listeners.get(chainId) || [];
    callbacks.forEach(callback => callback(provider));
  }

  // Clear provider for a chain
  clearProvider(chainId: string) {
    this.providers.delete(chainId);
  }

  // Clear all providers
  clearAllProviders() {
    this.providers.clear();
  }

  // Get current provider without creating a new one
  getCurrentProvider(chainId: string): Web3Provider | null {
    return this.providers.get(chainId) || null;
  }

  // Check if provider is connected and ready
  async isProviderReady(chainId: string): Promise<boolean> {
    const provider = this.providers.get(chainId);
    if (!provider) return false;

    try {
      if (provider.type === 'ethereum') {
        const network = await provider.provider.getNetwork();
        return network !== null;
      } else if (provider.type === 'solana') {
        const version = await provider.provider.getVersion();
        return version !== null;
      } else if (provider.type === 'cardano') {
        return true; // Simplified check for Cardano
      }
    } catch (error) {
      console.error('Provider readiness check failed:', error);
      return false;
    }

    return false;
  }

  // Get network info from provider
  async getNetworkInfo(chainId: string): Promise<{
    blockNumber?: number;
    gasPrice?: string;
    chainId: string | number;
  } | null> {
    const provider = this.providers.get(chainId);
    if (!provider) return null;

    try {
      if (provider.type === 'ethereum') {
        const [blockNumber, feeData] = await Promise.all([
          provider.provider.getBlockNumber(),
          provider.provider.getFeeData(),
        ]);

        return {
          blockNumber,
          gasPrice: feeData.gasPrice?.toString(),
          chainId: (await provider.provider.getNetwork()).chainId,
        };
      } else if (provider.type === 'solana') {
        const slot = await provider.provider.getSlot();
        return {
          blockNumber: slot,
          chainId: chainId,
        };
      } else if (provider.type === 'cardano') {
        return {
          chainId: chainId,
        };
      }
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }

    return null;
  }
}

// Utility functions
export const formatWei = (wei: string | bigint, decimals = 18): string => {
  try {
    return ethers.formatUnits(wei, decimals);
  } catch {
    return '0';
  }
};

export const parseWei = (ether: string, decimals = 18): bigint => {
  try {
    return ethers.parseUnits(ether, decimals);
  } catch {
    return BigInt(0);
  }
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidAddress = (address: string, type: 'ethereum' | 'solana' | 'cardano'): boolean => {
  try {
    switch (type) {
      case 'ethereum':
        return ethers.isAddress(address);
      case 'solana':
        // Basic Solana address validation (Base58, length check)
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      case 'cardano':
        // Basic Cardano address validation
        return address.startsWith('addr') && address.length > 50;
      default:
        return false;
    }
  } catch {
    return false;
  }
};

// Export singleton instance
export const web3ConnectionManager = new Web3ConnectionManager();