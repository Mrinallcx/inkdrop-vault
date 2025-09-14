import { useEffect, useState } from 'react';
import FileUpload from '@/components/FileUpload';
import Navbar from '@/components/Navbar';
import WalletConnectionModal from '@/components/WalletConnectionModal';
import { useWallet } from '@/contexts/WalletContext';

const Index = () => {
  const { wallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Show wallet modal if no wallet is connected
  useEffect(() => {
    if (!wallet) {
      setShowWalletModal(true);
    } else {
      setShowWalletModal(false);
    }
  }, [wallet]);

  // If no wallet is connected, only show the modal
  if (!wallet) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Welcome to Tokenization Platform</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect your Web3 wallet to start tokenizing your digital assets and unlock the power of blockchain technology.
              </p>
            </div>
            <button 
              onClick={() => setShowWalletModal(true)}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-lg"
            >
              Connect Wallet to Get Started
            </button>
          </div>
        </main>
        
        <WalletConnectionModal 
          open={showWalletModal} 
          onOpenChange={setShowWalletModal}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <FileUpload />
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