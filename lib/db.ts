import mongoose from 'mongoose';

const MONGO_URL = process.env.MONGO_URL as string;
const DB_NAME = process.env.DB_NAME as string;

if (!MONGO_URL) throw new Error('MONGO_URL is not set');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any)._mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any)._mongoose = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URL, {
      dbName: DB_NAME,
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
