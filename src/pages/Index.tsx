import { useState, useEffect } from 'react';
import { MinioConfig, loadConfig, hasStoredConfig } from '@/lib/crypto';
import { ConfigForm } from '@/components/ConfigForm';
import { FileUploader } from '@/components/FileUploader';
import { FileList } from '@/components/FileList';
import { Database, Sparkles } from 'lucide-react';

const Index = () => {
  const [config, setConfig] = useState<MinioConfig | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (hasStoredConfig()) {
      const storedConfig = loadConfig();
      if (storedConfig) {
        setConfig(storedConfig);
      }
    }
  }, []);

  const handleConfigSaved = (newConfig: MinioConfig) => {
    setConfig(newConfig);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">S3-Compatible Storage</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-primary/10 glow-effect animate-pulse-glow">
              <Database className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">MinIO</span>{' '}
            <span className="text-foreground">File Manager</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Upload, download, and manage your files with encrypted credential storage
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          <ConfigForm 
            onConfigSaved={handleConfigSaved} 
            existingConfig={config}
          />
          
          {config && (
            <>
              <FileUploader 
                config={config} 
                onUploadComplete={handleUploadComplete} 
              />
              <FileList 
                config={config} 
                refreshTrigger={refreshTrigger} 
              />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-muted-foreground/60">
            Your credentials are encrypted and stored locally in your browser
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
