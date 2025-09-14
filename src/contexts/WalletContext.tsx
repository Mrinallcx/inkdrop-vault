import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface WalletInfo {
  address: string;
  type: 'metamask' | 'phantom' | 'trustwallet' | 'lace';
  network?: string;
}

interface WalletContextType {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  connectMetamask: () => Promise<void>;
  connectPhantom: () => Promise<void>;
  connectTrustWallet: () => Promise<void>;
  connectLace: () => Promise<void>;
  disconnect: () => void;
  isWalletInstalled: (type: string) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for existing wallet connection on load
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      try {
        const walletInfo = JSON.parse(savedWallet);
        setWallet(walletInfo);
      } catch (error) {
        console.error('Failed to parse saved wallet:', error);
        localStorage.removeItem('connectedWallet');
      }
    }
  }, []);

  const isWalletInstalled = (type: string) => {
    switch (type) {
      case 'metamask':
        return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
      case 'phantom':
        return typeof window !== 'undefined' && window.solana?.isPhantom;
      case 'trustwallet':
        return typeof window !== 'undefined' && window.ethereum?.isTrust;
      case 'lace':
        return typeof window !== 'undefined' && window.cardano?.lace;
      default:
        return false;
    }
  };

  const connectMetamask = async () => {
    if (!window.ethereum?.isMetaMask) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask browser extension",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        const walletInfo: WalletInfo = {
          address: accounts[0],
          type: 'metamask',
          network: 'ethereum'
        };
        setWallet(walletInfo);
        localStorage.setItem('connectedWallet', JSON.stringify(walletInfo));
        
        toast({
          title: "Wallet Connected",
          description: `Connected to MetaMask: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectPhantom = async () => {
    if (!window.solana?.isPhantom) {
      toast({
        title: "Phantom not found",
        description: "Please install Phantom browser extension",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await window.solana.connect();
      if (response.publicKey) {
        const walletInfo: WalletInfo = {
          address: response.publicKey.toString(),
          type: 'phantom',
          network: 'solana'
        };
        setWallet(walletInfo);
        localStorage.setItem('connectedWallet', JSON.stringify(walletInfo));
        
        toast({
          title: "Wallet Connected",
          description: `Connected to Phantom: ${response.publicKey.toString().slice(0, 6)}...${response.publicKey.toString().slice(-4)}`,
        });
      }
    } catch (error) {
      console.error('Phantom connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Phantom",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectTrustWallet = async () => {
    if (!window.ethereum?.isTrust) {
      toast({
        title: "Trust Wallet not found",
        description: "Please install Trust Wallet browser extension",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        const walletInfo: WalletInfo = {
          address: accounts[0],
          type: 'trustwallet',
          network: 'ethereum'
        };
        setWallet(walletInfo);
        localStorage.setItem('connectedWallet', JSON.stringify(walletInfo));
        
        toast({
          title: "Wallet Connected",
          description: `Connected to Trust Wallet: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error) {
      console.error('Trust Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Trust Wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectLace = async () => {
    if (!window.cardano?.lace) {
      toast({
        title: "Lace not found",
        description: "Please install Lace browser extension",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const api = await window.cardano.lace.enable();
      const addresses = await api.getUsedAddresses();
      
      if (addresses.length > 0) {
        const walletInfo: WalletInfo = {
          address: addresses[0],
          type: 'lace',
          network: 'cardano'
        };
        setWallet(walletInfo);
        localStorage.setItem('connectedWallet', JSON.stringify(walletInfo));
        
        toast({
          title: "Wallet Connected",
          description: `Connected to Lace: ${addresses[0].slice(0, 6)}...${addresses[0].slice(-4)}`,
        });
      }
    } catch (error) {
      console.error('Lace connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Lace",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWallet(null);
    localStorage.removeItem('connectedWallet');
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isConnecting,
        connectMetamask,
        connectPhantom,
        connectTrustWallet,
        connectLace,
        disconnect,
        isWalletInstalled,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Extend window interface for wallet types
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    cardano?: any;
  }
}