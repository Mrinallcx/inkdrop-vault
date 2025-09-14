export interface FileValidationConfig {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

const FILE_CONFIGS: Record<string, FileValidationConfig> = {
  image: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  },
  video: {
    maxSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'],
    allowedExtensions: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv']
  },
  audio: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mpeg'],
    allowedExtensions: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a']
  }
};

export const validateFile = (file: File): ValidationResult => {
  const warnings: string[] = [];
  
  // Determine file category
  let category: keyof typeof FILE_CONFIGS;
  if (file.type.startsWith('image/')) {
    category = 'image';
  } else if (file.type.startsWith('video/')) {
    category = 'video';
  } else if (file.type.startsWith('audio/')) {
    category = 'audio';
  } else {
    return {
      isValid: false,
      error: 'Unsupported file type. Only images, videos, and audio files are allowed.'
    };
  }

  const config = FILE_CONFIGS[category];
  
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `${category} files must be smaller than ${maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
    };
  }
  
  // Check MIME type
  if (!config.allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: `Unsupported ${category} format: ${file.type}. Allowed formats: ${config.allowedTypes.join(', ')}`
    };
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    warnings.push(`File extension ${extension} is unusual for ${file.type}. Expected: ${config.allowedExtensions.join(', ')}`);
  }
  
  // File size warnings
  if (category === 'image' && file.size > 10 * 1024 * 1024) {
    warnings.push('Large image file detected. Consider optimizing for better performance.');
  }
  
  if (category === 'video' && file.size > 100 * 1024 * 1024) {
    warnings.push('Large video file detected. Upload may take longer.');
  }
  
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

export const getFileCategory = (file: File): 'image' | 'video' | 'audio' | 'unknown' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'unknown';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getBucketForFile = (file: File): 'nft-images' | 'nft-animations' | 'collection-assets' => {
  const category = getFileCategory(file);
  
  switch (category) {
    case 'image':
      return 'nft-images';
    case 'video':
    case 'audio':
      return 'nft-animations';
    default:
      return 'collection-assets';
  }
};

// Security checks
export const performSecurityChecks = (file: File): ValidationResult => {
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
    /\.js$/i,
    /\.html$/i,
    /\.htm$/i,
    /script/i,
    /javascript/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name) || pattern.test(file.type)) {
      return {
        isValid: false,
        error: 'File appears to contain executable code or scripts which are not allowed.'
      };
    }
  }
  
  // Check for null bytes (potential security issue)
  if (file.name.includes('\0')) {
    return {
      isValid: false,
      error: 'File name contains invalid characters.'
    };
  }
  
  return { isValid: true };
};