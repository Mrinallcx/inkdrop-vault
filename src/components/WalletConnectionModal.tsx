import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, Download, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface WalletConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WalletConnectionModal = ({ open, onOpenChange }: WalletConnectionModalProps) => {
  const {
    isConnecting,
    connectMetamask,
    connectPhantom,
    connectTrustWallet,
    connectLace,
    isWalletInstalled,
  } = useWallet();

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask wallet',
      installUrl: 'https://metamask.io/download/',
      connect: connectMetamask,
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Connect using Phantom wallet',
      installUrl: 'https://phantom.app/',
      connect: connectPhantom,
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Connect using Trust Wallet',
      installUrl: 'https://trustwallet.com/',
      connect: connectTrustWallet,
    },
    {
      id: 'lace',
      name: 'Lace',
      icon: '🎴',
      description: 'Connect using Lace wallet',
      installUrl: 'https://www.lace.io/',
      connect: connectLace,
    },
  ];

  const handleWalletConnect = async (wallet: typeof wallets[0]) => {
    if (!isWalletInstalled(wallet.id)) {
      window.open(wallet.installUrl, '_blank');
      return;
    }
    await wallet.connect();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Connect Your Wallet</DialogTitle>
          <DialogDescription>
            To access the tokenization platform, please connect one of the supported wallets below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {wallets.map((wallet) => {
            const installed = isWalletInstalled(wallet.id);
            
            return (
              <Button
                key={wallet.id}
                variant="outline"
                className={cn(
                  "w-full h-auto p-4 justify-start gap-4 hover:bg-accent/50",
                  !installed && "opacity-75"
                )}
                onClick={() => handleWalletConnect(wallet)}
                disabled={isConnecting}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
                  {wallet.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{wallet.name}</span>
                    {!installed && (
                      <Download className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {installed ? wallet.description : 'Click to install'}
                  </p>
                </div>
                {isConnecting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            );
          })}
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            New to crypto wallets?{' '}
            <a
              href="https://ethereum.org/en/wallets/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectionModal;