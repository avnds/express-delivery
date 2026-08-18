import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config({ path: '.env.local' });

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  throw new Error('TURSO_DATABASE_URL não encontrada.');
}

if (!tursoAuthToken) {
  throw new Error('TURSO_AUTH_TOKEN não encontrado.');
}

export const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

export const db = client;