import heic2any from 'heic2any';

const WEB_FRIENDLY_FORMATS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg'
]);

const NEEDS_CONVERSION_FORMATS = new Set([
  'heic',
  'heif',
  'tiff',
  'tif',
  'bmp',
  'mpo',
  'avif'
]);

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function needsImageConversion(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return NEEDS_CONVERSION_FORMATS.has(ext);
}

export function isImageFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return WEB_FRIENDLY_FORMATS.has(ext) || NEEDS_CONVERSION_FORMATS.has(ext);
}

export async function convertToWebFriendlyFormat(
  file: File
): Promise<{ file: File; dataUrl: string; converted: boolean }> {
  const ext = getFileExtension(file.name);

  // If already web-friendly, just read and return
  if (!NEEDS_CONVERSION_FORMATS.has(ext)) {
    const dataUrl = await fileToDataUrl(file);
    return { file, dataUrl, converted: true };
  }

  try {
    // Handle HEIC/HEIF with heic2any
    if (ext === 'heic' || ext === 'heif') {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });

      // heic2any can return an array of blobs for multi-image HEIC
      const blob = Array.isArray(convertedBlob)
        ? convertedBlob[0]
        : convertedBlob;

      const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      const convertedFile = new File([blob], newFileName, {
        type: 'image/jpeg'
      });
      const dataUrl = await fileToDataUrl(convertedFile);
      return { file: convertedFile, dataUrl, converted: true };
    }

    const dataUrl = await fileToDataUrl(file);
    const convertedDataUrl = await convertViaCanvas(dataUrl);

    if (convertedDataUrl) {
      const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
      const convertedFile = dataUrlToFile(convertedDataUrl, newFileName);
      return {
        file: convertedFile,
        dataUrl: convertedDataUrl,
        converted: true
      };
    }

    return { file, dataUrl, converted: false };
  } catch (error) {
    console.warn('Image conversion failed:', error);
    const dataUrl = await fileToDataUrl(file);
    return { file, dataUrl, converted: false };
  }
}

async function convertViaCanvas(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const byteString = atob(parts[1]);
  const mimeString = parts[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

export function extractBase64FromDataUrl(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], fileName, { type: blob.type });
}

export function downloadImage(src: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = src;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function imageUrlToDataUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}
