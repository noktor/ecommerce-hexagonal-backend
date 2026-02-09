import express, { Router } from 'express';
import type { TokenService } from '../../domain/services/TokenService';
import type { CloudinaryService } from '../../domain/services/CloudinaryService';
import { CloudinaryImageService } from '../../infrastructure/services/CloudinaryImageService';
import { createAuthMiddleware, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

let cachedCloudinaryService: CloudinaryService | null = null;

function getCloudinaryService(): CloudinaryService {
  if (cachedCloudinaryService) return cachedCloudinaryService;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not fully configured. Please set CLOUDINARY_CLOUD_NAME (or CLOUDINARY_URL), CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
  }

  cachedCloudinaryService = new CloudinaryImageService(cloudName, apiKey, apiSecret);
  return cachedCloudinaryService;
}

export function createUploadsRouter(tokenService: TokenService): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  // Use a higher JSON limit only for upload routes.
  // Default is 2mb but can be tuned via UPLOAD_JSON_LIMIT.
  router.use(
    express.json({
      limit: process.env.UPLOAD_JSON_LIMIT || '2mb',
    })
  );

  // Upload product images for retailers.
  // Exposed as POST /api/backoffice/uploads/products
  router.post(
    '/uploads/products',
    authMiddleware,
    requireRole('retailer'),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { imageDataUrl } = req.body as { imageDataUrl?: string };

        if (!imageDataUrl || typeof imageDataUrl !== 'string') {
          throw new AppError(400, 'imageDataUrl is required');
        }

        if (!imageDataUrl.startsWith('data:image/')) {
          throw new AppError(
            400,
            'imageDataUrl must be a data URL starting with data:image/... (base64 encoded image)'
          );
        }

        // Optional safety check: reject extremely large data URLs before hitting Cloudinary.
        // Roughly corresponds to a couple of megabytes when base64-encoded.
        const maxLength =
          Number(process.env.UPLOAD_IMAGE_DATAURL_MAX_LENGTH) || 3_000_000;
        if (imageDataUrl.length > maxLength) {
          throw new AppError(413, 'Uploaded image is too large');
        }

        const cloudinary = getCloudinaryService();
        const result = await cloudinary.upload(imageDataUrl);

        // For now, thumbnailUrl is the same as imageUrl. Later we can add transforms.
        res.status(201).json({
          success: true,
          data: {
            imageUrl: result.secure_url,
            thumbnailUrl: result.secure_url,
            publicId: result.public_id,
          },
        });
      } catch (error) {
        if (error instanceof AppError) {
          return next(error);
        }
        console.error('❌ Cloudinary upload error:', error);
        next(new AppError(500, 'Failed to upload image'));
      }
    }
  );

  return router;
}

