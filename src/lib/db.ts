import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL!;

const sql = neon(connectionString);
export const db = drizzle(sql);