import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiOptions, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { randomBytes } from 'crypto';
import { createReadStream, existsSync } from 'fs';

const IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
];

const AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/x-m4a',
  'audio/aac',
];

const DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

@Injectable()
export class UploadFileService {
  private readonly catboxApiUrl = 'https://catbox.moe/user/api.php';
  private readonly catboxUserhash: string;

  constructor(private readonly configService: ConfigService) {
    this.catboxUserhash = this.configService.get<string>('CATBOX_USERHASH') || '';

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Thiếu cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  private generateFileId(): string {
    const now = new Date();
    const random = randomBytes(6).toString('hex');
    return `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}-${random}`;
  }

  private detectFileCategory(mimetype: string): 'image' | 'audio' | 'document' | 'other' {
    if (IMAGE_MIMES.includes(mimetype)) return 'image';
    if (AUDIO_MIMES.includes(mimetype)) return 'audio';
    if (DOCUMENT_MIMES.includes(mimetype)) return 'document';
    return 'other';
  }

  private getExtension(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/avif': 'avif',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/webm': 'webm',
      'audio/x-m4a': 'm4a',
      'audio/aac': 'aac',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
      'text/csv': 'csv',
    };
    return map[mimetype] || 'bin';
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ fileName: string; fileUrl: string }> {
    const folderName = folder || 'pic-images';
    const fileId = this.generateFileId();
    const ext = this.getExtension(file.mimetype);

    const options: UploadApiOptions = {
      folder: folderName,
      public_id: fileId,
      resource_type: 'auto',
    };

    try {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result: UploadApiResponse = await cloudinary.uploader.upload(base64, options);
      return { fileName: `${fileId}.${ext}`, fileUrl: result.secure_url };
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null
            ? err?.error?.message || err?.message || JSON.stringify(err)
            : String(err);
      throw new InternalServerErrorException(`Upload Cloudinary thất bại: ${errorMessage}`);
    }
  }

  private async uploadToCatbox(
    file: Express.Multer.File,
  ): Promise<{ fileName: string; fileUrl: string }> {
    const ext = this.getExtension(file.mimetype);
    const fileName = `${this.generateFileId()}.${ext}`;

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    if (this.catboxUserhash) {
      formData.append('userhash', this.catboxUserhash);
    }
    const blob = new Blob([new Uint8Array(file.buffer)], {
      type: file.mimetype,
    });
    formData.append('fileToUpload', blob, file.originalname);

    try {
      const response = await fetch(this.catboxApiUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Catbox API returned status ${response.status}`);
      }
      const fileUrl = (await response.text()).trim();
      return { fileName, fileUrl };
    } catch (err) {
      throw new InternalServerErrorException(
        `Upload Catbox thất bại: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async uploadToCatboxFromUrl(
    url: string,
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!url) throw new BadRequestException('URL is required');

    const formData = new FormData();
    formData.append('reqtype', 'urlupload');
    if (this.catboxUserhash) {
      formData.append('userhash', this.catboxUserhash);
    }
    formData.append('url', url);

    try {
      const response = await fetch(this.catboxApiUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Catbox API returned status ${response.status}`);
      }
      const fileUrl = (await response.text()).trim();
      const fileName = url.split('/').pop() || `${this.generateFileId()}.bin`;
      return { fileName, fileUrl, storage: 'catbox' };
    } catch (err) {
      throw new InternalServerErrorException(
        `Upload URL to Catbox thất bại: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async uploadCatbox(
    file: Express.Multer.File,
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.uploadToCatbox(file);
    return { ...result, storage: 'catbox' };
  }

  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.uploadToCloudinary(file, folder);
    return { ...result, storage: 'cloudinary' };
  }

  async uploadAudio(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.uploadToCloudinary(file, folder || 'lingoarena-audio');
    return { ...result, storage: 'cloudinary' };
  }

  async uploadBuffer(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
    folder?: string,
  ): Promise<{ fileName: string; fileUrl: string; storage: string; sizeBytes: number }> {
    if (!buffer?.length) throw new BadRequestException('Audio buffer trống');
    const fakeFile = {
      buffer,
      mimetype: mimeType,
      originalname: originalName,
    } as Express.Multer.File;
    const uploaded = await this.uploadAudio(fakeFile, folder);
    return { ...uploaded, sizeBytes: buffer.length };
  }

  async uploadAudioFromStream(
    stream: NodeJS.ReadableStream,
    folder?: string,
    mimeType = 'audio/webm',
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!stream) throw new BadRequestException('Stream is required');
    const result = await this.uploadStreamToCloudinary(
      stream,
      folder || 'lingoarena-audio-background',
      mimeType,
    );
    return { ...result, storage: 'cloudinary' };
  }

  async uploadAudioFromFilePath(
    filePath: string,
    folder?: string,
    mimeType = 'audio/mpeg',
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!filePath) throw new BadRequestException('File path is required');
    if (!existsSync(filePath)) {
      throw new BadRequestException(`File không tồn tại: ${filePath}`);
    }

    const stream = createReadStream(filePath);
    const result = await this.uploadStreamToCloudinary(
      stream,
      folder || 'lingoarena-audio-background',
      mimeType,
    );
    return { ...result, storage: 'cloudinary' };
  }

  private uploadStreamToCloudinary(
    stream: NodeJS.ReadableStream,
    folder: string,
    mimeType: string,
  ): Promise<{ fileName: string; fileUrl: string }> {
    return new Promise((resolve, reject) => {
      const fileId = this.generateFileId();
      const ext = this.getExtension(mimeType);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: fileId,
          resource_type: 'video',
          format: ext,
        },
        (error, result) => {
          if (error) {
            return reject(
              new InternalServerErrorException(
                `Upload Cloudinary stream thất bại: ${error.message}`,
              ),
            );
          }
          if (!result) {
            return reject(new InternalServerErrorException('Cloudinary returned empty result'));
          }
          resolve({ fileName: `${fileId}.${ext}`, fileUrl: result.secure_url });
        },
      );

      stream.on('error', err => {
        reject(new InternalServerErrorException(`Stream error: ${err.message}`));
      });

      stream.pipe(uploadStream);
    });
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.uploadToCloudinary(file, folder || 'lingoarena-documents');
    return { ...result, storage: 'cloudinary' };
  }

  async uploadSingle(
    file: Express.Multer.File,
  ): Promise<{ fileName: string; fileUrl: string; storage: string }> {
    if (!file) throw new BadRequestException('File is required');
    const category = this.detectFileCategory(file.mimetype);

    switch (category) {
      case 'image':
        return this.uploadImage(file);
      case 'audio':
        return this.uploadAudio(file);
      case 'document':
        return this.uploadDocument(file);
      default:
        return this.uploadDocument(file);
    }
  }

  async uploadMulti(
    files: Array<Express.Multer.File>,
  ): Promise<Array<{ fileName: string; fileUrl: string; storage: string }>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Danh sách file trống');
    }
    return Promise.all(files.map(f => this.uploadSingle(f)));
  }
}
