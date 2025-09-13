import React, { useState, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const FileUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Simulate upload progress
    newFiles.forEach(uploadedFile => {
      simulateUpload(uploadedFile.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 20, 100);
          const status = newProgress === 100 ? 'completed' : 'uploading';
          return { ...file, progress: newProgress, status };
        }
        return file;
      }));
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, progress: 100, status: 'completed' } : file
      ));
    }, 2000);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300",
          dragActive 
            ? "border-primary bg-upload-active scale-[1.02]" 
            : "border-upload-border bg-upload-hover hover:border-muted-foreground hover:bg-upload-active"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className={cn(
            "w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300",
            dragActive ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"
          )}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {dragActive ? "Drop files here" : "Upload your files"}
            </h3>
            <p className="text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports all file types • Up to 10MB per file
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Uploaded Files ({files.length})</h4>
          
          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate pr-2">{uploadedFile.file.name}</p>
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    
                    {uploadedFile.status === 'uploading' && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(uploadedFile.progress)}% uploaded
                        </p>
                      </>
                    )}
                    
                    {uploadedFile.status === 'completed' && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-primary font-medium">Completed</p>
                      </>
                    )}
                  </div>
                  
                  {uploadedFile.status === 'uploading' && (
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;