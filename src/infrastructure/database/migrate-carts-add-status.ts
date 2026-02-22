/**
 * One-off migration:
 * - Drop the old TTL index on carts.expiresAt (if present)
 * - Backfill status and lastActivityAt for existing carts
 *
 * Run with:
 *   pnpm run migrate:carts-status
 */
import 'dotenv/config';
import { connectToMongoDB, closeMongoDBConnection, getConnection } from './mongodb';
import { CartStatus } from '../../domain/Cart';

async function migrate() {
  console.log('Starting cart status migration...');
  await connectToMongoDB();

  const db = getConnection().db;
  if (!db) {
    throw new Error('No MongoDB database connection');
  }

  const carts = db.collection('carts');

  // Drop old TTL index on expiresAt if it exists
  try {
    const indexes = await carts.indexes();
    const ttlIndex = indexes.find((idx) => idx.name === 'expiresAt_1');
    if (ttlIndex) {
      console.log('Dropping TTL index expiresAt_1 from carts collection...');
      await carts.dropIndex('expiresAt_1');
      console.log('Dropped TTL index expiresAt_1.');
    } else {
      console.log('No expiresAt_1 TTL index found on carts collection.');
    }
  } catch (error) {
    console.warn('Could not drop expiresAt_1 index (may not exist):', error);
  }

  const now = new Date();

  // Backfill status where missing
  const statusResult = await carts.updateMany(
    { status: { $exists: false } },
    { $set: { status: CartStatus.ACTIVE } }
  );
  console.log(`Updated status for ${statusResult.modifiedCount} cart(s).`);

  // Backfill lastActivityAt where missing
  const lastActivityResult = await carts.updateMany(
    { lastActivityAt: { $exists: false } },
    { $set: { lastActivityAt: now } }
  );
  console.log(`Updated lastActivityAt for ${lastActivityResult.modifiedCount} cart(s).`);

  console.log('Cart status migration completed.');
}

migrate()
  .then(() => closeMongoDBConnection())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Cart status migration failed:', err);
    process.exit(1);
  });

