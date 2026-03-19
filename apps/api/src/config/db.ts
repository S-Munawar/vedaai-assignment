import mongoose from 'mongoose';
import { env } from '@/config/env';

export async function connectToDatabase() {
  if (!env.mongoUri) {
    throw new Error('Missing MONGODB_URI');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(env.mongoUri);
}
