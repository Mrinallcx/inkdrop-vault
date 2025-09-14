import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { toast } from '@/hooks/use-toast';

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

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { profile } = useUserProfile();

  const uploadFile = async (
    file: File,
    bucketName: 'nft-images' | 'nft-animations' | 'collection-assets' | 'user-avatars'
  ): Promise<FileUploadData | null> => {
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to upload files",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${bucketName}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setUploadProgress(50);

      // Create file upload record in database
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
          processing_status: 'completed',
          metadata: {
            bucket: bucketName,
            upload_date: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully`,
      });

      return fileData;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
    uploadProgress,
    uploadFile,
    deleteFile,
    getUserFiles,
  };
};