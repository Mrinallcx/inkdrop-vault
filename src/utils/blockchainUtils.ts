import { ChainConfig, SUPPORTED_CHAINS, getChainById } from '@/config/chains';

// Network status types
export type NetworkStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'unknown';

export interface NetworkInfo {
  status: NetworkStatus;
  chainId: string | number;
  blockNumber?: number;
  gasPrice?: string;
  latency?: number;
  lastUpdated?: Date;
}

// Chain switching utilities
export const switchToChain = async (
  chainId: string | number,
  walletType: 'metamask' | 'trustwallet' | 'phantom' | 'lace'
): Promise<boolean> => {
  const chain = Object.values(SUPPORTED_CHAINS).find(c => 
    c.chainId === chainId || c.id === chainId
  );

  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  switch (walletType) {
    case 'metamask':
    case 'trustwallet':
      return switchEVMChain(chain);
    case 'phantom':
      return switchSolanaNetwork(chain);
    case 'lace':
      return switchCardanoNetwork(chain);
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }
};

// EVM chain switching (Metamask, Trust Wallet)
const switchEVMChain = async (chain: ChainConfig): Promise<boolean> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found');
  }

  try {
    // Try to switch to the chain
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${Number(chain.chainId).toString(16)}` }],
    });
    return true;
  } catch (switchError: any) {
    // Chain doesn't exist, try to add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${Number(chain.chainId).toString(16)}`,
              chainName: chain.displayName,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [chain.rpcUrl],
              blockExplorerUrls: [chain.explorerUrl],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add chain:', addError);
        return false;
      }
    }
    console.error('Failed to switch chain:', switchError);
    return false;
  }
};

// Solana network switching
const switchSolanaNetwork = async (chain: ChainConfig): Promise<boolean> => {
  // Solana network switching is typically handled by the wallet
  // This would need to be implemented based on wallet capabilities
  console.log(`Switching to Solana network: ${chain.network}`);
  return true;
};

// Cardano network switching
const switchCardanoNetwork = async (chain: ChainConfig): Promise<boolean> => {
  // Cardano network switching implementation
  console.log(`Switching to Cardano network: ${chain.network}`);
  return true;
};

// Network monitoring utilities
export class NetworkMonitor {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, ((info: NetworkInfo) => void)[]> = new Map();

  startMonitoring(chainId: string, callback: (info: NetworkInfo) => void) {
    if (!this.listeners.has(chainId)) {
      this.listeners.set(chainId, []);
    }
    this.listeners.get(chainId)!.push(callback);

    if (!this.intervals.has(chainId)) {
      const interval = setInterval(() => this.checkNetwork(chainId), 10000); // Check every 10 seconds
      this.intervals.set(chainId, interval);
      // Initial check
      this.checkNetwork(chainId);
    }
  }

  stopMonitoring(chainId: string, callback?: (info: NetworkInfo) => void) {
    if (callback && this.listeners.has(chainId)) {
      const callbacks = this.listeners.get(chainId)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.listeners.delete(chainId);
        const interval = this.intervals.get(chainId);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(chainId);
        }
      }
    }
  }

  private async checkNetwork(chainId: string) {
    const chain = getChainById(chainId);
    if (!chain) return;

    try {
      const startTime = Date.now();
      let networkInfo: NetworkInfo = {
        status: 'connecting',
        chainId: chain.chainId,
        lastUpdated: new Date(),
      };

      if (chain.name === 'ethereum' || chain.name === 'polygon') {
        networkInfo = await this.checkEVMNetwork(chain, startTime);
      } else if (chain.name === 'solana') {
        networkInfo = await this.checkSolanaNetwork(chain, startTime);
      } else if (chain.name === 'cardano') {
        networkInfo = await this.checkCardanoNetwork(chain, startTime);
      }

      // Notify all listeners
      const callbacks = this.listeners.get(chainId) || [];
      callbacks.forEach(callback => callback(networkInfo));
    } catch (error) {
      const errorInfo: NetworkInfo = {
        status: 'error',
        chainId: chain.chainId,
        lastUpdated: new Date(),
      };
      
      const callbacks = this.listeners.get(chainId) || [];
      callbacks.forEach(callback => callback(errorInfo));
    }
  }

  private async checkEVMNetwork(chain: ChainConfig, startTime: number): Promise<NetworkInfo> {
    try {
      const response = await fetch(chain.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

      if (data.result) {
        return {
          status: 'connected',
          chainId: chain.chainId,
          blockNumber: parseInt(data.result, 16),
          latency,
          lastUpdated: new Date(),
        };
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      return {
        status: 'error',
        chainId: chain.chainId,
        latency: Date.now() - startTime,
        lastUpdated: new Date(),
      };
    }
  }

  private async checkSolanaNetwork(chain: ChainConfig, startTime: number): Promise<NetworkInfo> {
    try {
      const response = await fetch(chain.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSlot',
        }),
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

      if (data.result !== undefined) {
        return {
          status: 'connected',
          chainId: chain.chainId,
          blockNumber: data.result,
          latency,
          lastUpdated: new Date(),
        };
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      return {
        status: 'error',
        chainId: chain.chainId,
        latency: Date.now() - startTime,
        lastUpdated: new Date(),
      };
    }
  }

  private async checkCardanoNetwork(chain: ChainConfig, startTime: number): Promise<NetworkInfo> {
    // Simplified Cardano network check
    return {
      status: 'connected',
      chainId: chain.chainId,
      latency: Date.now() - startTime,
      lastUpdated: new Date(),
    };
  }
}

// Utility functions
export const formatChainId = (chainId: string | number): string => {
  if (typeof chainId === 'number') {
    return `0x${chainId.toString(16)}`;
  }
  return chainId.toString();
};

export const parseChainId = (chainId: string): number | string => {
  if (chainId.startsWith('0x')) {
    return parseInt(chainId, 16);
  }
  // Handle non-numeric chain IDs (like Solana, Cardano)
  return isNaN(Number(chainId)) ? chainId : Number(chainId);
};

export const getChainExplorerUrl = (chainId: string, type: 'tx' | 'address', hash: string): string => {
  const chain = getChainById(chainId);
  if (!chain) return '';
  
  const baseUrl = chain.explorerUrl;
  if (chain.name === 'solana') {
    return `${baseUrl}/${type}/${hash}`;
  } else if (chain.name === 'cardano') {
    return `${baseUrl}/${type}/${hash}`;
  } else {
    // EVM chains
    return `${baseUrl}/${type}/${hash}`;
  }
};

// Create a singleton instance
export const networkMonitor = new NetworkMonitor();