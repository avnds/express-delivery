import { client } from './index';

async function checkDeliveries() {
  const result = await client.execute('PRAGMA table_info(deliveries)');

  console.log(JSON.stringify(result.rows, null, 2));
}

checkDeliveries();