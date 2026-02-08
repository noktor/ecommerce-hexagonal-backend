import mongoose from 'mongoose';

export async function connectToMongoDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  const connectionString = process.env.MONGODB_URI;

  // Note: Validation is done in env-validator.ts before this function is called
  if (!connectionString) {
    throw new Error('MONGODB_URI is not set. This should have been caught by validation.');
  }

  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error;
  }
}

export async function closeMongoDBConnection(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

export function getConnection() {
  return mongoose.connection;
}
