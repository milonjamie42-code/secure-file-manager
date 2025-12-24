import { useState, useEffect } from 'react';
import { FileObject, listFiles, downloadFile, deleteFile, formatFileSize } from '@/lib/minio';
import { MinioConfig } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Download, 
  Trash2, 
  RefreshCw, 
  File, 
  FileImage, 
  FileText, 
  FileVideo, 
  FileAudio,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FileListProps {
  config: MinioConfig;
  refreshTrigger: number;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return <FileImage className="w-5 h-5 text-primary" />;
  }
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
    return <FileVideo className="w-5 h-5 text-warning" />;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return <FileAudio className="w-5 h-5 text-accent" />;
  }
  if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'pdf', 'doc', 'docx'].includes(ext)) {
    return <FileText className="w-5 h-5 text-secondary-foreground" />;
  }
  return <File className="w-5 h-5 text-muted-foreground" />;
};

export const FileList = ({ config, refreshTrigger }: FileListProps) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fileList = await listFiles(config);
      setFiles(fileList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [config, refreshTrigger]);

  const handleDownload = async (fileName: string) => {
    setDownloadingFile(fileName);
    try {
      const blob = await downloadFile(config, fileName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${fileName}`,
      });
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: err instanceof Error ? err.message : 'Failed to download file',
        variant: 'destructive',
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    
    setDeletingFile(fileToDelete);
    try {
      await deleteFile(config, fileToDelete);
      toast({
        title: 'File Deleted',
        description: `Successfully deleted ${fileToDelete}`,
      });
      fetchFiles();
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Failed to delete file',
        variant: 'destructive',
      });
    } finally {
      setDeletingFile(null);
      setFileToDelete(null);
    }
  };

  return (
    <>
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Files in Bucket</h3>
              <p className="text-sm text-muted-foreground font-mono">{config.bucket}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchFiles}
            disabled={isLoading}
            className="border-border/50 hover:bg-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 py-8 justify-center text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && files.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No files in this bucket</p>
            <p className="text-sm text-muted-foreground/70">Upload some files to get started</p>
          </div>
        )}

        {!isLoading && !error && files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={file.name}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all group animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-mono">{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.lastModified.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(file.name)}
                    disabled={downloadingFile === file.name}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    {downloadingFile === file.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFileToDelete(file.name)}
                    disabled={deletingFile === file.name}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    {deletingFile === file.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete File</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete <span className="font-mono text-foreground">{fileToDelete}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
