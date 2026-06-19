import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  validateFile(file: Express.Multer.File) {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG and WebP images are allowed');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File size must not exceed 5 MB');
    }
  }

  async uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        })
        .end(buffer);
    });
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
      if (match) {
        await cloudinary.uploader.destroy(match[1]);
      }
    } catch {
      // Ignore delete errors
    }
  }
}
