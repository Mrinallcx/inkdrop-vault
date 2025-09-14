import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadProgress } from '@/hooks/useFileUpload';

interface FileUploadProgressProps {
  uploads: UploadProgress[];
  onRemove: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onClear?: () => void;
}

const FileUploadProgress = ({ uploads, onRemove, onRetry, onClear }: FileUploadProgressProps) => {
  if (uploads.length === 0) return null;

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'queued':
        return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground animate-pulse" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: UploadProgress['status']) => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'uploading':
        return 'Uploading';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getProgressColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-destructive';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-primary';
    }
  };

  const completedUploads = uploads.filter(u => u.status === 'completed').length;
  const failedUploads = uploads.filter(u => u.status === 'failed').length;
  const inProgressUploads = uploads.filter(u => ['queued', 'uploading', 'processing'].includes(u.status)).length;

  return (
    <div className="w-full space-y-4 p-4 bg-card border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium text-sm">File Uploads</h3>
          <p className="text-xs text-muted-foreground">
            {completedUploads} completed • {failedUploads} failed • {inProgressUploads} in progress
          </p>
        </div>
        {onClear && uploads.every(u => ['completed', 'failed'].includes(u.status)) && (
          <Button 
            onClick={onClear}
            variant="ghost" 
            size="sm"
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Upload Items */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {uploads.map((upload) => (
          <div
            key={upload.fileId}
            className={cn(
              "flex items-center gap-3 p-3 rounded-md border transition-colors",
              upload.status === 'failed' && "border-destructive/50 bg-destructive/5",
              upload.status === 'completed' && "border-green-500/50 bg-green-500/5"
            )}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(upload.status)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm truncate">{upload.fileName}</p>
                <span className="text-xs text-muted-foreground">
                  {getStatusText(upload.status)}
                </span>
              </div>

              {/* Progress Bar */}
              {(upload.status === 'uploading' || upload.status === 'processing') && (
                <div className="space-y-1">
                  <Progress 
                    value={upload.progress} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {upload.progress}% • {upload.status === 'processing' ? 'Processing file...' : 'Uploading...'}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {upload.status === 'failed' && upload.error && (
                <p className="text-xs text-destructive">{upload.error}</p>
              )}

              {/* Warnings */}
              {upload.warnings && upload.warnings.length > 0 && (
                <div className="flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {upload.warnings.map((warning, index) => (
                      <p key={index} className="text-xs text-amber-600">{warning}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {upload.status === 'failed' && onRetry && (
                <Button
                  onClick={() => onRetry(upload.fileId)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
              {['completed', 'failed'].includes(upload.status) && (
                <Button
                  onClick={() => onRemove(upload.fileId)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploadProgress;