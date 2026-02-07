import cors from 'cors';

/**
 * Normalize URL by removing trailing slashes
 */
function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Get allowed CORS origins
 * - Development: http://localhost:5173
 * - Production: Uses FRONTEND_URL environment variable
 * - Supports multiple origins if FRONTEND_URL contains comma-separated values
 */
function getAllowedOrigins(): string[] {
  const frontendUrl = process.env.FRONTEND_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Default origins for development
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  
  if (!frontendUrl) {
    console.log('🌐 CORS: Using default development origins:', defaultOrigins);
    return defaultOrigins;
  }
  
  // Support multiple origins (comma-separated)
  const origins = frontendUrl.includes(',')
    ? frontendUrl.split(',').map(normalizeUrl)
    : [normalizeUrl(frontendUrl)];
  
  // In development, also allow localhost even if FRONTEND_URL is set
  if (nodeEnv === 'development') {
    const allOrigins = [...new Set([...defaultOrigins, ...origins])];
    console.log('🌐 CORS: Allowed origins (development):', allOrigins);
    return allOrigins;
  }
  
  console.log('🌐 CORS: Allowed origins (production):', origins);
  return origins;
}

/**
 * CORS origin validation function
 * Checks if the request origin is in the allowed list
 */
function originValidator(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return callback(null, true);
  }
  
  const allowedOrigins = getAllowedOrigins();
  const normalizedOrigin = normalizeUrl(origin);
  
  // Check if origin matches any allowed origin (exact match)
  const isAllowed = allowedOrigins.some(allowed => {
    const normalizedAllowed = normalizeUrl(allowed);
    return normalizedOrigin === normalizedAllowed;
  });
  
  if (isAllowed) {
    console.log(`✅ CORS: Allowing origin: ${normalizedOrigin}`);
    callback(null, true);
  } else {
    console.warn(`❌ CORS: Blocked origin: ${normalizedOrigin}`);
    console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
    callback(null, false);
  }
}

export const corsMiddleware = cors({
  origin: originValidator,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
});

