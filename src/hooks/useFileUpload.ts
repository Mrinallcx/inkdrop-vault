import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { toast } from '@/hooks/use-toast';
import { validateFile, performSecurityChecks, getBucketForFile, ValidationResult } from '@/utils/fileValidation';

export interface FileUploadData {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url?: string;
  thumbnail_url?: string;
  metadata?: any;
  processing_status: string;
  is_compressed: boolean;
  compression_ratio?: number;
  uploader_id: string;
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  warnings?: string[];
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const { profile } = useUserProfile();

  const validateAndPrepareFile = (file: File): ValidationResult & { warnings?: string[] } => {
    // Basic validation
    const validation = validateFile(file);
    if (!validation.isValid) {
      return validation;
    }

    // Security checks
    const securityCheck = performSecurityChecks(file);
    if (!securityCheck.isValid) {
      return securityCheck;
    }

    return {
      isValid: true,
      warnings: validation.warnings
    };
  };

  const uploadSingleFile = async (
    file: File,
    bucketName?: 'nft-images' | 'nft-animations' | 'collection-assets' | 'user-avatars'
  ): Promise<FileUploadData | null> => {
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet before uploading files",
        variant: "destructive",
      });
      throw new Error('User profile not found. Please connect your wallet first.');
    }

    console.log('Starting file upload for profile:', profile.id);
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to upload files",
        variant: "destructive",
      });
      return null;
    }

    // Validate file
    const validation = validateAndPrepareFile(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return null;
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast({
          title: "Upload Warning",
          description: warning,
        });
      });
    }

    const bucket = bucketName || getBucketForFile(file);
    const fileId = crypto.randomUUID();
    
    // Add to upload queue
    const uploadProgress: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'queued',
      warnings: validation.warnings
    };

    setUploadQueue(prev => [...prev, uploadProgress]);

    try {
      // Update status to uploading
      setUploadQueue(prev => prev.map(item => 
        item.fileId === fileId 
          ? { ...item, status: 'uploading' as const }
          : item
      ));

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${bucket}/${fileName}`;

      // Upload file to Supabase Storage with progress tracking
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Update progress
      setUploadQueue(prev => prev.map(item => 
        item.fileId === fileId 
          ? { ...item, progress: 70 }
          : item
      ));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Create file upload record in database
      if (!profile?.id) {
        console.error('uploadSingleFile: No profile ID available');
        throw new Error('User profile not found. Please connect your wallet first.');
      }

      console.log('uploadSingleFile: Creating database record for file:', fileName);
      console.log('uploadSingleFile: Profile ID:', profile.id);
      console.log('uploadSingleFile: Insert data:', {
        uploader_id: profile.id,
        filename: fileName,
        original_filename: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath
      });

      const { data: fileData, error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          uploader_id: profile.id,
          filename: fileName,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          public_url: publicUrl,
          processing_status: 'pending',
          metadata: {
            bucket,
            upload_date: new Date().toISOString(),
            validation_warnings: validation.warnings,
            category: getBucketForFile(file) === 'nft-images' ? 'image' : 
                     getBucketForFile(file) === 'nft-animations' ? 'media' : 'asset'
          },
        })
        .select()
        .single();
      
      console.log('uploadSingleFile: Database insert result:', { success: !!fileData, error: dbError });

      console.log('uploadSingleFile: Database insert result:', { fileData, dbError });

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
        
        console.error('Database error during file upload:', dbError);
        throw new Error(`Upload failed: ${dbError.message}. Please ensure you are connected with your wallet.`);
      }

      // Update progress
      setUploadQueue(prev => prev.map(item => 
        item.fileId === fileId 
          ? { ...item, progress: 90, status: 'processing' as const }
          : item
      ));

      // Start background processing
      const { error: processError } = await supabase.functions.invoke('process-file', {
        body: {
          fileId: fileData.id,
          originalPath: filePath,
          fileType: file.type,
          optimize: true,
          generateThumbnail: true,
        }
      });

      if (processError) {
        console.warn('Background processing failed to start:', processError);
        // Continue anyway, file is uploaded successfully
      }

      // Complete upload
      setUploadQueue(prev => prev.map(item => 
        item.fileId === fileId 
          ? { ...item, progress: 100, status: 'completed' as const }
          : item
      ));

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully`,
      });

      return fileData;

    } catch (error: any) {
      console.error('File upload error:', error);
      
      setUploadQueue(prev => prev.map(item => 
        item.fileId === fileId 
          ? { ...item, status: 'failed' as const, error: error.message }
          : item
      ));

      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadMultipleFiles = async (
    files: FileList | File[],
    bucketName?: 'nft-images' | 'nft-animations' | 'collection-assets' | 'user-avatars'
  ): Promise<FileUploadData[]> => {
    setUploading(true);
    const fileArray = Array.from(files);
    const results: FileUploadData[] = [];

    try {
      for (const file of fileArray) {
        const result = await uploadSingleFile(file, bucketName);
        if (result) {
          results.push(result);
        }
      }
      return results;
    } finally {
      setUploading(false);
    }
  };

  const clearUploadQueue = () => {
    setUploadQueue([]);
  };

  const removeFromQueue = (fileId: string) => {
    setUploadQueue(prev => prev.filter(item => item.fileId !== fileId));
  };

  const retryUpload = async (fileId: string, file: File) => {
    // Remove failed upload from queue
    setUploadQueue(prev => prev.filter(item => item.fileId !== fileId));
    // Retry upload
    return await uploadSingleFile(file);
  };

  const deleteFile = async (fileId: string, storagePath: string) => {
    if (!profile) return false;

    try {
      // Extract bucket name from storage path
      const bucketName = storagePath.split('/')[0];
      const filePath = storagePath.substring(bucketName.length + 1);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast({
        title: "File Deleted",
        description: "File has been deleted successfully",
      });

      return true;
    } catch (error: any) {
      console.error('File deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
      return false;
    }
  };

  const getUserFiles = async () => {
    if (!profile) return [];

    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('uploader_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching user files:', error);
      return [];
    }
  };

  return {
    uploading,
    uploadQueue,
    uploadFile: uploadSingleFile,
    uploadMultipleFiles,
    deleteFile,
    getUserFiles,
    clearUploadQueue,
    removeFromQueue,
    retryUpload,
  };
};