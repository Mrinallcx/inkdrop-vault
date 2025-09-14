import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Copy, LogOut, Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const WalletConnectedNav = () => {
  const { wallet, disconnect } = useWallet();

  if (!wallet) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const getWalletIcon = () => {
    switch (wallet.type) {
      case 'metamask':
        return '🦊';
      case 'phantom':
        return '👻';
      case 'trustwallet':
        return '🛡️';
      case 'lace':
        return '🎴';
      default:
        return '👛';
    }
  };

  const getWalletName = () => {
    switch (wallet.type) {
      case 'metamask':
        return 'MetaMask';
      case 'phantom':
        return 'Phantom';
      case 'trustwallet':
        return 'Trust Wallet';
      case 'lace':
        return 'Lace';
      default:
        return 'Wallet';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">{getWalletIcon()}</span>
            <div className="hidden sm:block">
              <div className="text-xs text-muted-foreground">{getWalletName()}</div>
              <div className="text-sm font-mono">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2 mb-1">
            <span>{getWalletIcon()}</span>
            <span className="font-medium">{getWalletName()}</span>
          </div>
          <div className="text-sm font-mono text-muted-foreground break-all">
            {wallet.address}
          </div>
          {wallet.network && (
            <div className="text-xs text-muted-foreground mt-1 capitalize">
              {wallet.network} Network
            </div>
          )}
        </div>
        
        <DropdownMenuItem onClick={copyAddress} className="gap-2">
          <Copy className="h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={disconnect} className="gap-2 text-destructive">
          <LogOut className="h-4 w-4" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletConnectedNav;