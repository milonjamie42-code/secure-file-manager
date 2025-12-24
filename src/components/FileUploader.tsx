import { useState, useCallback } from 'react';
import { Upload, FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MinioConfig } from '@/lib/crypto';
import { uploadFile } from '@/lib/minio';
import { toast } from '@/hooks/use-toast';

interface FileUploaderProps {
  config: MinioConfig;
  onUploadComplete: () => void;
}

export const FileUploader = ({ config, onUploadComplete }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1}/${totalFiles}: ${file.name}`);
        await uploadFile(config, file);
      }
      
      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${totalFiles} file${totalFiles > 1 ? 's' : ''}`,
      });
      onUploadComplete();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [config]);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Upload Files</h3>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 text-center
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border/50 hover:border-primary/50 hover:bg-secondary/30'
          }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{uploadProgress}</p>
          </div>
        ) : (
          <>
            <FileUp className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-foreground font-medium mb-1">
              {isDragging ? 'Drop files here' : 'Drag & drop files'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input
              type="file"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="pointer-events-none border-border/50">
              Select Files
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
