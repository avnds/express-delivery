import { client } from './index';

async function checkSchema() {
  const tables = await client.execute(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name;
  `);

  console.log('\n=== TABELAS ===');
  console.log(JSON.stringify(tables.rows, null, 2));

  const users = await client.execute(`
    PRAGMA table_info(users);
  `);

  console.log('\n=== USERS ===');
  console.log(JSON.stringify(users.rows, null, 2));

  const sessions = await client.execute(`
    PRAGMA table_info(sessions);
  `);

  console.log('\n=== SESSIONS ===');
  console.log(JSON.stringify(sessions.rows, null, 2));

  const earnings = await client.execute(`
    PRAGMA table_info(earnings);
  `);

  console.log('\n=== EARNINGS ===');
  console.log(JSON.stringify(earnings.rows, null, 2));

  const deliveries = await client.execute(`
    PRAGMA table_info(deliveries);
  `);

  console.log('\n=== DELIVERIES ===');
  console.log(JSON.stringify(deliveries.rows, null, 2));
}

checkSchema();