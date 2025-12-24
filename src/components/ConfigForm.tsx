import { useState } from 'react';
import { MinioConfig, saveConfig, hasStoredConfig, clearConfig } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database, Lock, Shield, Trash2, Eye, EyeOff } from 'lucide-react';

interface ConfigFormProps {
  onConfigSaved: (config: MinioConfig) => void;
  existingConfig: MinioConfig | null;
}

export const ConfigForm = ({ onConfigSaved, existingConfig }: ConfigFormProps) => {
  const [showForm, setShowForm] = useState(!hasStoredConfig());
  const [showSecrets, setShowSecrets] = useState(false);
  const [config, setConfig] = useState<MinioConfig>(existingConfig || {
    endpoint: '',
    accessKey: '',
    secretKey: '',
    bucket: '',
    useSSL: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    setShowForm(false);
    onConfigSaved(config);
  };

  const handleClearConfig = () => {
    clearConfig();
    setConfig({
      endpoint: '',
      accessKey: '',
      secretKey: '',
      bucket: '',
      useSSL: true,
    });
    setShowForm(true);
  };

  if (!showForm && hasStoredConfig()) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">MinIO Connected</h3>
              <p className="text-sm text-muted-foreground">Credentials securely stored</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowForm(true)}
              className="border-border/50 hover:bg-secondary"
            >
              <Eye className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleClearConfig}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 glow-effect">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">MinIO Configuration</h2>
          <p className="text-sm text-muted-foreground">Enter your credentials (encrypted locally)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="endpoint" className="text-foreground/90">Endpoint</Label>
            <Input
              id="endpoint"
              placeholder="minio.example.com:9000"
              value={config.endpoint}
              onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              className="bg-input/50 border-border/50 focus:border-primary"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bucket" className="text-foreground/90">Bucket Name</Label>
            <Input
              id="bucket"
              placeholder="my-bucket"
              value={config.bucket}
              onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
              className="bg-input/50 border-border/50 focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accessKey" className="text-foreground/90">Access Key</Label>
            <div className="relative">
              <Input
                id="accessKey"
                type={showSecrets ? 'text' : 'password'}
                placeholder="••••••••"
                value={config.accessKey}
                onChange={(e) => setConfig({ ...config, accessKey: e.target.value })}
                className="bg-input/50 border-border/50 focus:border-primary pr-10"
                required
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretKey" className="text-foreground/90">Secret Key</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecrets ? 'text' : 'password'}
                placeholder="••••••••"
                value={config.secretKey}
                onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                className="bg-input/50 border-border/50 focus:border-primary pr-10"
                required
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <Switch
              id="showSecrets"
              checked={showSecrets}
              onCheckedChange={setShowSecrets}
            />
            <Label htmlFor="showSecrets" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2">
              {showSecrets ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showSecrets ? 'Hide' : 'Show'} credentials
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="useSSL"
              checked={config.useSSL}
              onCheckedChange={(checked) => setConfig({ ...config, useSSL: checked })}
            />
            <Label htmlFor="useSSL" className="text-sm text-muted-foreground cursor-pointer">Use SSL/TLS</Label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
            <Shield className="w-4 h-4 mr-2" />
            Save & Connect
          </Button>
          {hasStoredConfig() && (
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-border/50">
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
