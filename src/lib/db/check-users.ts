import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { client } from './index';

async function checkUsers() {
  const result = await client.execute(`
    SELECT
      id,
      username,
      name,
      role,
      active,
      must_change_password
    FROM users
  `);

  console.log(JSON.stringify(result.rows, null, 2));
}

checkUsers().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});