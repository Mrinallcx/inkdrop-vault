import React, { useState, useCallback } from 'react';
import { Upload, File, X, Image, Music, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import FileDetailsForm from './FileDetailsForm';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface FileUploadProps {
  onRequireWallet?: () => void;
}

const FileUpload = ({ onRequireWallet }: FileUploadProps) => {
  const { wallet } = useWallet();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showForm, setShowForm] = useState(false);

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

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const fileType = file.type.toLowerCase();
    const fileSize = file.size;
    
    // Define file type categories and size limits
    const isImage = fileType.startsWith('image/');
    const isAudio = fileType.startsWith('audio/');
    const isVideo = fileType.startsWith('video/');
    
    // Check if file type is supported
    if (!isImage && !isAudio && !isVideo) {
      return { isValid: false, error: 'Only image, audio, and video files are supported' };
    }
    
    // Check file size limits
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      audio: 50 * 1024 * 1024, // 50MB
      video: 1024 * 1024 * 1024, // 1GB
    };
    
    let maxSize = 0;
    let fileTypeText = '';
    
    if (isImage) {
      maxSize = maxSizes.image;
      fileTypeText = 'Image';
    } else if (isAudio) {
      maxSize = maxSizes.audio;
      fileTypeText = 'Audio';
    } else if (isVideo) {
      maxSize = maxSizes.video;
      fileTypeText = 'Video';
    }
    
    if (fileSize > maxSize) {
      const maxSizeText = formatFileSize(maxSize);
      return { isValid: false, error: `${fileTypeText} files must be smaller than ${maxSizeText}` };
    }
    
    return { isValid: true };
  };

  const getFileIcon = (file: File) => {
    const fileType = file.type.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (fileType.startsWith('audio/')) {
      return <Music className="w-5 h-5 text-green-500" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const handleFiles = (fileList: FileList) => {
    // Check if wallet is connected before processing files
    if (!wallet) {
      onRequireWallet?.();
      return;
    }

    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];
    
    Array.from(fileList).forEach(file => {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        validFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          progress: 0,
          status: 'uploading'
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    // Show errors if any
    if (errors.length > 0) {
      alert(`Some files were rejected:\n${errors.join('\n')}`);
    }
    
    // Add valid files
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // Simulate upload progress
      validFiles.forEach(uploadedFile => {
        simulateUpload(uploadedFile.id);
      });
    }
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
    // Hide form if no files left
    if (files.length <= 1) {
      setShowForm(false);
    }
  };

  const handleFormSubmit = (data: any) => {
    // Check if wallet is connected before submitting form
    if (!wallet) {
      onRequireWallet?.();
      return;
    }

    console.log('Form data:', data);
    // Here you would typically send the data to your backend
    alert('Form submitted successfully!');
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Check if we have any completed files to show the form button
  const hasCompletedFiles = files.some(file => file.status === 'completed');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show form if requested and we have files
  if (showForm && files.length > 0) {
    return (
      <FileDetailsForm 
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    );
  }

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
          accept="image/*,audio/*,video/*"
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
              Images (up to 10MB) • Audio (up to 50MB) • Video (up to 1GB)
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
                  {getFileIcon(uploadedFile.file)}
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

      {/* Form Button - Show when files are completed */}
      {hasCompletedFiles && !showForm && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Add File Details
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;