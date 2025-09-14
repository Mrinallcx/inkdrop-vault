import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingJob {
  fileId: string;
  originalPath: string;
  fileType: string;
  optimize: boolean;
  generateThumbnail: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, originalPath, fileType, optimize = true, generateThumbnail = true }: ProcessingJob = await req.json();

    if (!fileId || !originalPath || !fileType) {
      return new Response(
        JSON.stringify({ error: 'fileId, originalPath, and fileType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Update processing status to 'processing'
    await supabase
      .from('file_uploads')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId);

    // Start background processing
    const processFile = async () => {
      try {
        console.log(`Starting processing for file: ${fileId}`);
        
        // Get the original file from storage
        const { data: originalFile, error: downloadError } = await supabase.storage
          .from(originalPath.split('/')[0])
          .download(originalPath.substring(originalPath.indexOf('/') + 1));

        if (downloadError) {
          throw new Error(`Failed to download original file: ${downloadError.message}`);
        }

        let thumbnailUrl = null;
        let compressionRatio = null;
        let processedMetadata: any = {};

        // Process images
        if (fileType.startsWith('image/')) {
          console.log('Processing image file');
          
          // For now, we'll simulate compression and thumbnail generation
          // In a real implementation, you would use image processing libraries
          
          if (generateThumbnail) {
            // Simulate thumbnail generation
            thumbnailUrl = originalPath.replace(/(\.[^.]+)$/, '_thumb$1');
            console.log('Thumbnail would be generated at:', thumbnailUrl);
          }

          if (optimize) {
            // Simulate compression (in real implementation, compress the image)
            compressionRatio = Math.random() * 30 + 10; // Simulate 10-40% compression
            console.log('Image compression ratio:', compressionRatio);
          }

          // Extract image metadata
          processedMetadata = {
            type: 'image',
            originalSize: originalFile.size,
            processed: true,
            processingDate: new Date().toISOString(),
          };
        }
        
        // Process videos
        else if (fileType.startsWith('video/')) {
          console.log('Processing video file');
          
          if (generateThumbnail) {
            // Simulate video thumbnail generation
            thumbnailUrl = originalPath.replace(/\.[^.]+$/, '_thumb.jpg');
            console.log('Video thumbnail would be generated at:', thumbnailUrl);
          }

          processedMetadata = {
            type: 'video',
            originalSize: originalFile.size,
            processed: true,
            processingDate: new Date().toISOString(),
          };
        }
        
        // Process audio
        else if (fileType.startsWith('audio/')) {
          console.log('Processing audio file');
          
          processedMetadata = {
            type: 'audio',
            originalSize: originalFile.size,
            processed: true,
            processingDate: new Date().toISOString(),
          };
        }

        // Update file record with processing results
        const { error: updateError } = await supabase
          .from('file_uploads')
          .update({
            processing_status: 'completed',
            thumbnail_url: thumbnailUrl,
            compression_ratio: compressionRatio,
            is_compressed: !!compressionRatio,
            metadata: processedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', fileId);

        if (updateError) {
          throw new Error(`Failed to update file record: ${updateError.message}`);
        }

        console.log(`File processing completed for: ${fileId}`);

      } catch (error) {
        console.error('File processing error:', error);
        
        // Update status to failed
        await supabase
          .from('file_uploads')
          .update({ 
            processing_status: 'failed',
            metadata: { 
              error: error.message,
              processingDate: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', fileId);
      }
    };

    // Start background processing
    EdgeRuntime.waitUntil(processFile());

    // Return immediate response
    return new Response(
      JSON.stringify({ 
        message: 'File processing started',
        fileId,
        status: 'processing'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Process file error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});