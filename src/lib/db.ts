import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.error('⚠️ DATABASE_URL не найден в файле .env.local!');
}

export const sql = neon(databaseUrl);