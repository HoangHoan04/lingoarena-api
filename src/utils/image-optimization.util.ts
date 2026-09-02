import sharp from 'sharp';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'auto';
  progressive?: boolean;
  stripMetadata?: boolean;
}

export interface OptimizedImageResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

export class ImageOptimizationUtil {
  private static readonly DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'auto',
    progressive: true,
    stripMetadata: true,
  };

  static async optimizeBase64Image(
    base64Data: string,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizedImageResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const inputBuffer = Buffer.from(cleanBase64, 'base64');
    const originalSize = inputBuffer.length;

    let sharpInstance = sharp(inputBuffer);

    const metadata = await sharpInstance.metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const originalFormat = metadata.format || 'jpeg';

    let outputFormat = opts.format;
    if (outputFormat === 'auto') {
      outputFormat = this.shouldUseWebP(originalFormat)
        ? 'webp'
        : (originalFormat as 'jpeg' | 'png');
    }

    const { newWidth, newHeight } = this.calculateOptimalDimensions(
      originalWidth,
      originalHeight,
      opts.maxWidth,
      opts.maxHeight,
    );

    if (newWidth !== originalWidth || newHeight !== originalHeight) {
      sharpInstance = sharpInstance.resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    switch (outputFormat) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality: opts.quality,
          progressive: opts.progressive,
          mozjpeg: true,
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality: opts.quality,
          progressive: opts.progressive,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality: opts.quality,
          effort: 6,
        });
        break;
    }

    if (opts.stripMetadata) {
      sharpInstance = sharpInstance.withMetadata({
        exif: {},
        icc: 'srgb',
      });
    }

    const optimizedBuffer = await sharpInstance.toBuffer();
    const finalMetadata = await sharp(optimizedBuffer).metadata();

    return {
      buffer: optimizedBuffer,
      format: outputFormat,
      width: finalMetadata.width || newWidth,
      height: finalMetadata.height || newHeight,
      size: optimizedBuffer.length,
      originalSize,
      compressionRatio: Math.round((1 - optimizedBuffer.length / originalSize) * 100),
    };
  }

  static bufferToBase64DataUrl(result: OptimizedImageResult): string {
    const mimeType = this.formatToMimeType(result.format);
    return `data:${mimeType};base64,${result.buffer.toString('base64')}`;
  }

  static async optimizeBase64ToDataUrl(
    base64Data: string,
    options: ImageOptimizationOptions = {},
  ): Promise<{ dataUrl: string; metadata: OptimizedImageResult }> {
    const result = await this.optimizeBase64Image(base64Data, options);
    const dataUrl = this.bufferToBase64DataUrl(result);
    return { dataUrl, metadata: result };
  }

  private static calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): { newWidth: number; newHeight: number } {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { newWidth: originalWidth, newHeight: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    let newWidth = maxWidth;
    let newHeight = Math.round(maxWidth / aspectRatio);

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(maxHeight * aspectRatio);
    }

    return { newWidth, newHeight };
  }

  x;
  private static shouldUseWebP(originalFormat: string): boolean {
    return ['jpeg', 'jpg', 'png'].includes(originalFormat.toLowerCase());
  }

  private static formatToMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    return mimeTypes[format.toLowerCase()] || 'image/jpeg';
  }

  static async optimizeBuffer(
    buffer: Buffer,
    options: ImageOptimizationOptions = {},
  ): Promise<OptimizedImageResult> {
    return this.optimizeBase64Image(buffer.toString('base64'), options);
  }

  static getPresets() {
    return {
      highQuality: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 90,
        format: 'auto' as const,
      },
      standard: {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 85,
        format: 'auto' as const,
      },
      preserveDimensions: {
        maxWidth: Number.MAX_SAFE_INTEGER,
        maxHeight: Number.MAX_SAFE_INTEGER,
        quality: 85,
        format: 'auto' as const,
      },
      mobile: {
        maxWidth: 800,
        maxHeight: 600,
        quality: 80,
        format: 'webp' as const,
      },
      thumbnail: {
        maxWidth: 300,
        maxHeight: 300,
        quality: 75,
        format: 'webp' as const,
      },
    };
  }
}
