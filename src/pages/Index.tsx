import FileUpload from '@/components/FileUpload';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">File Upload</h1>
            <p className="text-muted-foreground">
              Securely upload and manage your files with our modern interface
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <FileUpload />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Built with modern web technologies for optimal performance and security
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;