export interface LockService {
  acquireLock(key: string, ttlSeconds: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
  extendLock(key: string, ttlSeconds: number): Promise<boolean>;
}
