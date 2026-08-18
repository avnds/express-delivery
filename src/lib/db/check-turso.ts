import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { client } from './index';

async function check() {
  console.log('=== VERIFICANDO BANCO TURSO ===');

  const result = await client.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name;
  `);

  console.log(result.rows);
}

check().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});