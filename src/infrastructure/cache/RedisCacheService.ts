import Redis from 'ioredis';
import { CacheService } from '../../domain/services/CacheService';

export class RedisCacheService implements CacheService {
  private redis: Redis | null = null;
  private fallbackCache: Map<string, { value: unknown; expiry: number }> = new Map();
  private connectionFailed: boolean = false;

  constructor(private readonly redisUrl: string = 'redis://localhost:6379') {}

  async connect(): Promise<void> {
    // Skip Redis connection if URL is not provided or is localhost in production
    if (!this.redisUrl || this.redisUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.connectionFailed = true;
      console.warn('⚠️  Redis URL not configured or using localhost in production, using in-memory fallback');
      return;
    }

    try {
      this.redis = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            this.connectionFailed = true;
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
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
        family: 4
      });

      // Register error handler IMMEDIATELY to catch all errors
      this.redis.on('error', (error) => {
        // Silently handle errors to prevent "Unhandled error event"
        if (!this.connectionFailed) {
          this.connectionFailed = true;
        }
      });
      
      // Handle connection errors specifically
      this.redis.on('close', () => {
        if (!this.connectionFailed) {
          this.connectionFailed = true;
        }
      });

      this.redis.on('connect', () => {
        console.log('✅ Connected to Redis');
        this.connectionFailed = false;
      });

      // Try to connect with timeout
      await Promise.race([
        this.redis.connect(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 2000)
        )
      ]);

      // Test connection
      await this.redis.ping();
      console.log('✅ Redis connection verified');
    } catch (error) {
      this.connectionFailed = true;
      console.warn('⚠️  Redis not available, using in-memory fallback');
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
      if (this.redis) {
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

      if (this.redis) {
        if (ttlSeconds) {
          await this.redis.setex(key, ttlSeconds, serialized);
        } else {
          await this.redis.set(key, serialized);
        }
      } else {
        // Fallback to in-memory cache
        const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : Number.MAX_SAFE_INTEGER;
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
      if (this.redis) {
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
      if (this.redis) {
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
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

