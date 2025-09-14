import { useEffect, useState } from 'react';
import FileUpload from '@/components/FileUpload';
import Navbar from '@/components/Navbar';
import WalletConnectionModal from '@/components/WalletConnectionModal';
import { useWallet } from '@/contexts/WalletContext';

const Index = () => {
  const { wallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <Navbar onConnectWallet={handleConnectWallet} />
      
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <FileUpload onRequireWallet={handleConnectWallet} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Built with modern web technologies for optimal performance and security
            </p>
          </div>
        </div>
      </footer>
      
      <WalletConnectionModal 
        open={showWalletModal} 
        onOpenChange={setShowWalletModal}
      />
    </div>
  );
};

export default Index;