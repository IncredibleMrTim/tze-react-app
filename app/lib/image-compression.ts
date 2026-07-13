/**
 * Image compression utilities
 * Compresses images for PO documents and parts photos to reduce upload size
 * while maintaining readability for Claude AI and mobile viewing
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, where 1 is highest quality
  outputFormat?: 'jpeg' | 'webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1600,
  quality: 0.75,
  outputFormat: 'jpeg',
};

// Detect if running on iOS/Safari
const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Compress an image for PO scanning (readable by Claude AI)
 */
export const PO_COMPRESSION: CompressionOptions = {
  maxWidth: isIOS ? 1000 : 1200, // Lower for iOS memory limits
  maxHeight: isIOS ? 1333 : 1600,
  quality: isIOS ? 0.65 : 0.75, // Lower quality for iOS
  outputFormat: 'jpeg',
};

/**
 * Compress an image for parts photos (mobile viewing quality)
 */
export const PARTS_COMPRESSION: CompressionOptions = {
  maxWidth: isIOS ? 600 : 800, // Lower for iOS
  maxHeight: isIOS ? 800 : 1067,
  quality: isIOS ? 0.6 : 0.7, // Lower quality for iOS
  outputFormat: 'jpeg',
};

/**
 * Compress an image file or data URL
 * @param source - File object or base64 data URL
 * @param options - Compression options
 * @returns Compressed base64 data URL
 */
export async function compressImage(
  source: File | string,
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Load image
  const img = await loadImage(source);

  // Calculate new dimensions maintaining aspect ratio
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    opts.maxWidth!,
    opts.maxHeight!
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', {
    willReadFrequently: false,
    alpha: false // No transparency for JPEG
  });

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  try {
    // Use better image quality settings (skip on iOS if causing issues)
    if (!isIOS) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    // Draw image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to data URL with compression
    const mimeType = opts.outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, opts.quality);

    // Verify the result isn't too large
    const sizeMB = (dataUrl.length * 0.75) / (1024 * 1024);
    if (sizeMB > 5) {
      throw new Error(`Compressed image too large: ${sizeMB.toFixed(1)}MB`);
    }

    return dataUrl;
  } finally {
    // Clean up canvas to free memory (important for iOS)
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Load an image from File or data URL
 */
function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Only resize if image is larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;

    if (width > height) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);

      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
    } else {
      height = maxHeight;
      width = Math.round(height * aspectRatio);

      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }
    }
  }

  return { width, height };
}

/**
 * Get compressed size estimate in KB
 */
export function getImageSizeKB(dataUrl: string): number {
  // Remove data URL prefix
  const base64 = dataUrl.split(',')[1] || dataUrl;
  // Base64 is ~33% larger than binary, so divide by 1.33
  return (base64.length * 0.75) / 1024;
}
