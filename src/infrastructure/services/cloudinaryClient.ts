/**
 * Lazy Cloudinary client loader that is defensive about CLOUDINARY_URL.
 *
 * The Cloudinary SDK will throw at require-time if CLOUDINARY_URL is set
 * but does not start with "cloudinary://". This wrapper sanitizes that
 * environment variable before requiring the SDK so a bad value in the
 * environment does not crash the whole app.
 */
let cachedCloudinary: typeof import('cloudinary').v2 | null = null;

export function getCloudinary() {
  if (!cachedCloudinary) {
    const url = process.env.CLOUDINARY_URL;

    // If CLOUDINARY_URL is set but invalid, temporarily remove it so that
    // the Cloudinary SDK does not throw on require().
    const shouldIgnoreCloudinaryUrl = url && !url.trim().startsWith('cloudinary://');
    let originalUrl: string | undefined;

    if (shouldIgnoreCloudinaryUrl) {
      originalUrl = process.env.CLOUDINARY_URL;
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env.CLOUDINARY_URL;
      // Log once on first use so misconfiguration is visible in logs
      console.warn(
        '⚠️  Ignoring invalid CLOUDINARY_URL value. It must start with "cloudinary://".'
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cloudinaryModule = require('cloudinary') as typeof import('cloudinary');
    cachedCloudinary = cloudinaryModule.v2;

    // Restore original env var so other parts of the app can still inspect it if needed
    if (shouldIgnoreCloudinaryUrl && originalUrl !== undefined) {
      process.env.CLOUDINARY_URL = originalUrl;
    }
  }

  return cachedCloudinary;
}

