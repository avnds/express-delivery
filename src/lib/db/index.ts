import { createClient } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});
export const db = client;