import Redis from 'ioredis';
import { LockService } from '../../domain/services/LockService';

export class RedisLockService implements LockService {
  private redis: Redis | null = null;
  private fallbackLocks: Map<string, { expiry: number }> = new Map();
  private connectionFailed: boolean = false;

  constructor(private readonly redisUrl: string | undefined) {}

  async connect(): Promise<void> {
    // Skip Redis connection if URL is not provided
    if (!this.redisUrl) {
      this.connectionFailed = true;
      console.warn('⚠️  REDIS_URL is not configured, using in-memory fallback for lock service.');
      return;
    }

    // Skip Redis connection if using localhost in production (not allowed)
    if (this.redisUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      this.connectionFailed = true;
      console.warn('⚠️  Redis URL uses localhost in production, using in-memory fallback');
      return;
    }

    // Log connection attempt
    console.log(`🔌 [Lock Service] Attempting to connect to Redis at: ${this.redisUrl}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

    try {
      this.redis = new Redis(this.redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            this.connectionFailed = true;
            console.warn(`⚠️  [Lock Service] Redis connection failed after ${times} attempts`);
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          console.log(`🔄 [Lock Service] Retrying Redis connection (attempt ${times})...`);
          return delay;
        },
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
        enableOfflineQueue: false,
        // Prevent connection attempts if Redis is not available
        connectTimeout: 2000,
        // Disable IPv6 to avoid ::1 connection attempts
        family: 4
      });

      // Register error handler IMMEDIATELY to catch all errors
      this.redis.on('error', (error) => {
        console.error(`❌ [Lock Service] Redis connection error: ${error.message}`);
        if (!this.connectionFailed) {
          this.connectionFailed = true;
        }
      });
      
      // Handle connection errors specifically
      this.redis.on('close', () => {
        console.warn('⚠️  [Lock Service] Redis connection closed');
        if (!this.connectionFailed) {
          this.connectionFailed = true;
        }
      });

      this.redis.on('connect', () => {
        console.log('✅ [Lock Service] Redis Lock Service connected');
        this.connectionFailed = false;
      });

      console.log('⏳ [Lock Service] Connecting to Redis...');
      await Promise.race([
        this.redis.connect(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 2000)
        )
      ]);

      console.log('🏓 [Lock Service] Testing Redis connection with PING...');
      await this.redis.ping();
      console.log('✅ [Lock Service] Redis connection verified');
    } catch (error) {
      this.connectionFailed = true;
      console.warn('⚠️  [Lock Service] Redis Lock Service not available, using in-memory fallback');
      console.warn(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
      if (this.redis) {
        try {
          this.redis.removeAllListeners();
          await this.redis.quit();
        } catch {
          // Ignore quit errors
        }
      }
      this.redis = null;
    }
  }

  /**
   * Acquire a distributed lock (implements SET NX EX pattern)
   * Returns true if lock was acquired, false if already locked
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    
    try {
      if (this.redis && !this.connectionFailed) {
        // SET key value NX EX ttl - atomic operation
        const result = await this.redis.set(lockKey, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } else {
        // Fallback to in-memory locks
        const existing = this.fallbackLocks.get(lockKey);
        if (existing && existing.expiry > Date.now()) {
          return false; // Lock already held
        }
        this.fallbackLocks.set(lockKey, {
          expiry: Date.now() + (ttlSeconds * 1000)
        });
        this.cleanupExpiredLocks();
        return true;
      }
    } catch (error) {
      console.error(`Error acquiring lock ${lockKey}:`, error);
      return false; // Fail open - allow operation if lock service fails
    }
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    
    try {
      if (this.redis && !this.connectionFailed) {
        await this.redis.del(lockKey);
      } else {
        this.fallbackLocks.delete(lockKey);
      }
    } catch (error) {
      console.error(`Error releasing lock ${lockKey}:`, error);
    }
  }

  /**
   * Extend lock TTL
   */
  async extendLock(key: string, ttlSeconds: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    
    try {
      if (this.redis && !this.connectionFailed) {
        const result = await this.redis.expire(lockKey, ttlSeconds);
        return result === 1;
      } else {
        const existing = this.fallbackLocks.get(lockKey);
        if (existing && existing.expiry > Date.now()) {
          existing.expiry = Date.now() + (ttlSeconds * 1000);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error(`Error extending lock ${lockKey}:`, error);
      return false;
    }
  }

  private cleanupExpiredLocks(): void {
    const now = Date.now();
    for (const [key, lock] of this.fallbackLocks.entries()) {
      if (lock.expiry <= now) {
        this.fallbackLocks.delete(key);
      }
    }
  }

  async close(): Promise<void> {
    if (this.redis && !this.connectionFailed) {
      await this.redis.quit();
    }
  }
}

