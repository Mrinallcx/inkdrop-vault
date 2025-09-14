import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChainConfig, SUPPORTED_CHAINS, getChainById } from '@/config/chains';
import { NetworkInfo, NetworkStatus, networkMonitor, switchToChain } from '@/utils/blockchainUtils';
import { toast } from '@/hooks/use-toast';

export interface WalletConnection {
  address: string;
  chainId: string;
  walletType: 'metamask' | 'phantom' | 'trustwallet' | 'lace';
  connected: boolean;
}

export interface MultiChainWalletContextType {
  // Wallet connections
  connections: Record<string, WalletConnection>;
  activeConnection: WalletConnection | null;
  
  // Chain management
  currentChain: ChainConfig | null;
  supportedChains: ChainConfig[];
  
  // Network status
  networkStatus: Record<string, NetworkInfo>;
  
  // Actions
  connectWallet: (chainId: string, walletType: string) => Promise<boolean>;
  disconnectWallet: (chainId: string) => void;
  switchChain: (chainId: string) => Promise<boolean>;
  setActiveChain: (chainId: string) => void;
  
  // Status
  isConnecting: boolean;
  error: string | null;
}

const MultiChainWalletContext = createContext<MultiChainWalletContextType | undefined>(undefined);

export const useMultiChainWallet = () => {
  const context = useContext(MultiChainWalletContext);
  if (!context) {
    throw new Error('useMultiChainWallet must be used within a MultiChainWalletProvider');
  }
  return context;
};

interface MultiChainWalletProviderProps {
  children: ReactNode;
}

export const MultiChainWalletProvider = ({ children }: MultiChainWalletProviderProps) => {
  const [connections, setConnections] = useState<Record<string, WalletConnection>>({});
  const [activeConnection, setActiveConnection] = useState<WalletConnection | null>(null);
  const [currentChain, setCurrentChain] = useState<ChainConfig | null>(null);
  const [networkStatus, setNetworkStatus] = useState<Record<string, NetworkInfo>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedConnections = localStorage.getItem('multichain-connections');
    const savedActiveChain = localStorage.getItem('active-chain');

    if (savedConnections) {
      try {
        const parsedConnections = JSON.parse(savedConnections);
        setConnections(parsedConnections);
        
        // Find and set active connection
        if (savedActiveChain) {
          const activeConn = parsedConnections[savedActiveChain];
          if (activeConn) {
            setActiveConnection(activeConn);
            setCurrentChain(getChainById(savedActiveChain) || null);
          }
        }
      } catch (err) {
        console.error('Failed to parse saved connections:', err);
      }
    }
  }, []);

  // Save to localStorage when connections change
  useEffect(() => {
    localStorage.setItem('multichain-connections', JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    if (currentChain) {
      localStorage.setItem('active-chain', currentChain.id);
    }
  }, [currentChain]);

  // Start network monitoring for connected chains
  useEffect(() => {
    const connectedChainIds = Object.keys(connections);
    
    connectedChainIds.forEach(chainId => {
      networkMonitor.startMonitoring(chainId, (info: NetworkInfo) => {
        setNetworkStatus(prev => ({
          ...prev,
          [chainId]: info,
        }));
      });
    });

    return () => {
      connectedChainIds.forEach(chainId => {
        networkMonitor.stopMonitoring(chainId);
      });
    };
  }, [connections]);

  const connectWallet = async (chainId: string, walletType: string): Promise<boolean> => {
    const chain = getChainById(chainId);
    if (!chain) {
      setError(`Unsupported chain: ${chainId}`);
      return false;
    }

    if (!chain.walletTypes.includes(walletType)) {
      setError(`${walletType} does not support ${chain.displayName}`);
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      let address = '';

      switch (walletType) {
        case 'metamask':
        case 'trustwallet':
          address = await connectEVMWallet(chain, walletType);
          break;
        case 'phantom':
          address = await connectPhantomWallet(chain);
          break;
        case 'lace':
          address = await connectLaceWallet(chain);
          break;
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      if (address) {
        const connection: WalletConnection = {
          address,
          chainId: chain.id,
          walletType: walletType as any,
          connected: true,
        };

        setConnections(prev => ({
          ...prev,
          [chain.id]: connection,
        }));

        // Set as active if no current active connection
        if (!activeConnection) {
          setActiveConnection(connection);
          setCurrentChain(chain);
        }

        toast({
          title: 'Wallet Connected',
          description: `Connected to ${chain.displayName} via ${walletType}`,
        });

        return true;
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Connection Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }

    return false;
  };

  const disconnectWallet = (chainId: string) => {
    setConnections(prev => {
      const newConnections = { ...prev };
      delete newConnections[chainId];
      return newConnections;
    });

    if (activeConnection?.chainId === chainId) {
      const remainingConnections = Object.values(connections);
      if (remainingConnections.length > 0) {
        const newActive = remainingConnections[0];
        setActiveConnection(newActive);
        setCurrentChain(getChainById(newActive.chainId) || null);
      } else {
        setActiveConnection(null);
        setCurrentChain(null);
      }
    }

    networkMonitor.stopMonitoring(chainId);

    toast({
      title: 'Wallet Disconnected',
      description: `Disconnected from ${getChainById(chainId)?.displayName}`,
    });
  };

  const switchChain = async (chainId: string): Promise<boolean> => {
    const chain = getChainById(chainId);
    const connection = connections[chainId];

    if (!chain || !connection) {
      setError('Chain or connection not found');
      return false;
    }

    try {
      const success = await switchToChain(chain.chainId, connection.walletType);
      if (success) {
        setActiveConnection(connection);
        setCurrentChain(chain);
        toast({
          title: 'Chain Switched',
          description: `Switched to ${chain.displayName}`,
        });
      }
      return success;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Switch Failed',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const setActiveChain = (chainId: string) => {
    const connection = connections[chainId];
    const chain = getChainById(chainId);

    if (connection && chain) {
      setActiveConnection(connection);
      setCurrentChain(chain);
    }
  };

  // EVM wallet connection
  const connectEVMWallet = async (chain: ChainConfig, walletType: string): Promise<string> => {
    if (!window.ethereum) {
      throw new Error(`${walletType} not installed`);
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Switch to the correct chain
    await switchToChain(chain.chainId, walletType as any);

    return accounts[0];
  };

  // Phantom wallet connection
  const connectPhantomWallet = async (chain: ChainConfig): Promise<string> => {
    if (!window.solana?.isPhantom) {
      throw new Error('Phantom wallet not installed');
    }

    const response = await window.solana.connect();
    return response.publicKey.toString();
  };

  // Lace wallet connection
  const connectLaceWallet = async (chain: ChainConfig): Promise<string> => {
    if (!window.cardano?.lace) {
      throw new Error('Lace wallet not installed');
    }

    const api = await window.cardano.lace.enable();
    const addresses = await api.getUsedAddresses();
    
    if (addresses.length === 0) {
      throw new Error('No addresses found');
    }

    return addresses[0];
  };

  const supportedChains = Object.values(SUPPORTED_CHAINS);

  const contextValue: MultiChainWalletContextType = {
    connections,
    activeConnection,
    currentChain,
    supportedChains,
    networkStatus,
    connectWallet,
    disconnectWallet,
    switchChain,
    setActiveChain,
    isConnecting,
    error,
  };

  return (
    <MultiChainWalletContext.Provider value={contextValue}>
      {children}
    </MultiChainWalletContext.Provider>
  );
};

// Extend window object for wallet types
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    cardano?: any;
  }
}