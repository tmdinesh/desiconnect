import { Pool } from 'pg'; // Use pg not neon
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Validate DATABASE_URL is present (injected by Vercel)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in Vercel Project Settings.");
}

// Set up the PostgreSQL pool and Drizzle ORM
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
