import type {
  CloudinaryService,
  CloudinaryUploadOptions,
  CloudinaryUploadResult,
} from '../../domain/services/CloudinaryService';
import { getCloudinary } from './cloudinaryClient';

export class CloudinaryImageService implements CloudinaryService {
  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    if (!cloudName?.trim()) {
      throw new Error('Cloudinary cloud_name is required');
    }
    if (!apiKey?.trim()) {
      throw new Error('Cloudinary api_key is required');
    }
    if (!apiSecret?.trim()) {
      throw new Error('Cloudinary api_secret is required');
    }
    const cloudinary = getCloudinary();
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async upload(
    source: string | Buffer,
    options?: CloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult> {
    const uploadOptions: Record<string, string | undefined> = {};
    if (options?.folder) uploadOptions.folder = options.folder;
    if (options?.public_id) uploadOptions.public_id = options.public_id;

    const sourceValue =
      typeof source === 'string'
        ? source
        : `data:image/jpeg;base64,${(source as Buffer).toString('base64')}`;

    const cloudinary = getCloudinary();
    const result = await cloudinary.uploader.upload(sourceValue, uploadOptions);
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  }

  async delete(publicId: string): Promise<void> {
    if (!publicId?.trim()) {
      throw new Error('public_id is required to delete an asset');
    }
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(publicId);
  }
}
