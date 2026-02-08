import Redis from 'ioredis';
import type { CacheService } from '../../domain/services/CacheService';

export class RedisCacheService implements CacheService {
  private redis: Redis | null = null;
  private fallbackCache: Map<string, { value: unknown; expiry: number }> = new Map();
  private connectionFailed: boolean = false;

  constructor(private readonly redisUrl: string | undefined) {}

  async connect(): Promise<void> {
    // Skip Redis connection if URL is not provided
    if (!this.redisUrl) {
      this.connectionFailed = true;
      console.warn('⚠️  REDIS_URL is not configured, using in-memory fallback for cache.');
      return;
    }

    // Skip Redis connection if using localhost in production (not allowed)
    if (this.redisUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.connectionFailed = true;
      console.warn('⚠️  Redis URL uses localhost in production, using in-memory fallback');
      return;
    }

    // Log connection attempt
    console.log(`🔌 [Cache Service] Attempting to connect to Redis at: ${this.redisUrl}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

    try {
      this.redis = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            this.connectionFailed = true;
            console.warn(`⚠️  [Cache Service] Redis connection failed after ${times} attempts`);
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          console.log(`🔄 [Cache Service] Retrying Redis connection (attempt ${times})...`);
          return delay;
        },
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
        // Disable automatic reconnection to avoid error spam
        enableOfflineQueue: false,
        // Prevent connection attempts if Redis is not available
        connectTimeout: 2000,
        // Disable IPv6 to avoid ::1 connection attempts
        family: 4,
      });

      // Register error handler IMMEDIATELY to catch all errors
      this.redis.on('error', (error) => {
        console.error(`❌ [Cache Service] Redis connection error: ${error.message}`);
        if (!this.connectionFailed) {
          this.connectionFailed = true;
        }
      });

      // Handle connection errors specifically
      this.redis.on('close', () => {
        console.warn('⚠️  [Cache Service] Redis connection closed');
        if (!this.connectionFailed) {
          this.connectionFailed = true;
        }
      });

      this.redis.on('connect', () => {
        console.log('✅ [Cache Service] Connected to Redis');
        this.connectionFailed = false;
      });

      // Try to connect with timeout
      console.log('⏳ [Cache Service] Connecting to Redis...');
      await Promise.race([
        this.redis.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 2000)
        ),
      ]);

      // Test connection
      console.log('🏓 [Cache Service] Testing Redis connection with PING...');
      await this.redis.ping();
      console.log('✅ [Cache Service] Redis connection verified');
    } catch (error) {
      this.connectionFailed = true;
      console.warn('⚠️  [Cache Service] Redis not available, using in-memory fallback');
      console.warn(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
      if (this.redis) {
        try {
          // Remove all listeners to prevent error spam
          this.redis.removeAllListeners();
          await this.redis.quit();
        } catch {
          // Ignore quit errors
        }
      }
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis && !this.connectionFailed) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } else {
        // Fallback to in-memory cache
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value as T;
        }
        if (cached) {
          this.fallbackCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (this.redis && !this.connectionFailed) {
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
      } else {
        // Fallback to in-memory cache
        const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER;
        this.fallbackCache.set(key, { value, expiry });

        // Cleanup expired entries periodically
        this.cleanupExpiredEntries();
      }
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      // Don't throw - cache failures shouldn't break the application
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.redis && !this.connectionFailed) {
        await this.redis.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.redis && !this.connectionFailed) {
        await this.redis.flushdb();
      } else {
        this.fallbackCache.clear();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.fallbackCache.entries()) {
      if (entry.expiry <= now) {
        this.fallbackCache.delete(key);
      }
    }
  }

  async close(): Promise<void> {
    if (this.redis && !this.connectionFailed) {
      await this.redis.quit();
    }
  }
}
