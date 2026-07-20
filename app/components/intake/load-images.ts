import { fixOrientation } from "@/lib/helpers";
import { uploadImageToBlob } from "@/lib/blob-upload";
import {
  compressImage,
  getImageSizeKB,
  type CompressionOptions,
} from "@/lib/image-compression";

const MAX_FILE_SIZE_MB = 20;

interface LoadImagesResult {
  images: string[];
  oversizedMessages: string[];
}

/**
 * Load image files, fix EXIF orientation, compress each one, and upload the
 * result to Vercel Blob.
 *
 * Files over 20MB are skipped and reported via `oversizedMessages` so the
 * caller can surface them as toasts.
 *
 * @param files - Files selected from a file input
 * @param compression - Compression preset (PO vs parts photos)
 * @param logLabel - Label used in console logs (e.g. "PO page")
 * @param blobFolder - Blob storage folder prefix (e.g. "po-pages")
 * @returns Blob URLs plus messages for any skipped files
 */
export async function loadCompressedImages(
  files: FileList,
  compression: CompressionOptions,
  logLabel: string,
  blobFolder: string,
): Promise<LoadImagesResult> {
  const images: string[] = [];
  const oversizedMessages: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Check file size before processing
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`Loading ${logLabel} ${i + 1}: ${fileSizeMB.toFixed(1)}MB`);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      oversizedMessages.push(
        `Image ${i + 1} too large (${fileSizeMB.toFixed(1)}MB). Max ${MAX_FILE_SIZE_MB}MB.`,
      );
      continue;
    }

    // Load and fix orientation
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        fixOrientation(result, resolve);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const compressed = await compressImage(dataUrl, compression);
    const sizeKB = Math.round(getImageSizeKB(compressed));
    console.log(`${logLabel} ${i + 1} compressed to ${sizeKB}KB`);

    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const pathname = `intake/${blobFolder}/${Date.now()}-${randomSuffix}.jpg`;
    const url = await uploadImageToBlob(compressed, pathname);

    images.push(url);
  }

  return { images, oversizedMessages };
}
