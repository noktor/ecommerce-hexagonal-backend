/**
 * Script to test Redis connection and functionality
 * Run with: pnpm ts-node scripts/test-redis.ts
 */

import 'dotenv/config';
import { RedisCacheService } from '../src/infrastructure/cache/RedisCacheService';
import { RedisLockService } from '../src/infrastructure/locks/RedisLockService';

async function testRedis() {
  console.log('🧪 Testing Redis Connection...\n');

  // Get Redis URL from environment or use default for development
  // If REDIS_URL contains 'redis:' (Docker container name), use localhost instead for local testing
  let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // If running outside Docker, replace container name with localhost
  if (redisUrl.includes('redis://redis:') && !process.env.DOCKER_ENV) {
    redisUrl = 'redis://localhost:6379';
    console.log('ℹ️  Running outside Docker, using localhost instead of container name\n');
  }

  console.log(`📡 Redis URL: ${redisUrl}\n`);

  // Test Cache Service
  console.log('1️⃣ Testing Redis Cache Service...');
  const cacheService = new RedisCacheService(redisUrl);

  try {
    await cacheService.connect();
    console.log('   ✅ Cache service connected\n');

    // Test cache operations
    console.log('   Testing cache operations...');

    // Set a value
    await cacheService.set('test:key', { message: 'Hello Redis!', timestamp: Date.now() }, 60);
    console.log('   ✅ Set cache value');

    // Get the value
    const cached = await cacheService.get<{ message: string; timestamp: number }>('test:key');
    if (cached) {
      console.log(`   ✅ Retrieved cache value: ${cached.message}`);
      console.log(`   ✅ Timestamp: ${new Date(cached.timestamp).toISOString()}`);
    } else {
      console.log('   ❌ Failed to retrieve cache value');
    }

    // Delete the value
    await cacheService.delete('test:key');
    console.log('   ✅ Deleted cache value');

    // Verify deletion
    const deleted = await cacheService.get('test:key');
    if (!deleted) {
      console.log('   ✅ Verified deletion\n');
    } else {
      console.log('   ❌ Value still exists after deletion\n');
    }

    await cacheService.close();
  } catch (error) {
    console.error('   ❌ Cache service test failed:', error);
    console.log('   ⚠️  Using in-memory fallback\n');
  }

  // Test Lock Service
  console.log('2️⃣ Testing Redis Lock Service...');
  const lockService = new RedisLockService(redisUrl);

  try {
    await lockService.connect();
    console.log('   ✅ Lock service connected\n');

    // Test lock operations
    console.log('   Testing lock operations...');

    // Acquire a lock
    const lockAcquired = await lockService.acquireLock('test:lock', 10);
    if (lockAcquired) {
      console.log('   ✅ Acquired lock');
    } else {
      console.log('   ❌ Failed to acquire lock');
    }

    // Try to acquire the same lock again (should fail)
    const lockAcquiredAgain = await lockService.acquireLock('test:lock', 10);
    if (!lockAcquiredAgain) {
      console.log('   ✅ Correctly prevented duplicate lock');
    } else {
      console.log('   ❌ Lock was acquired twice (should not happen)');
    }

    // Release the lock
    await lockService.releaseLock('test:lock');
    console.log('   ✅ Released lock');

    // Try to acquire the lock again (should succeed now)
    const lockAcquiredAfterRelease = await lockService.acquireLock('test:lock', 10);
    if (lockAcquiredAfterRelease) {
      console.log('   ✅ Successfully acquired lock after release\n');
    } else {
      console.log('   ❌ Failed to acquire lock after release\n');
    }

    await lockService.close();
  } catch (error) {
    console.error('   ❌ Lock service test failed:', error);
    console.log('   ⚠️  Using in-memory fallback\n');
  }

  console.log('✨ Redis test completed!');
  process.exit(0);
}

testRedis().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
