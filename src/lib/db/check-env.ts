import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('=== VERIFICANDO ENV ===');

console.log(
  'TURSO_DATABASE_URL:',
  process.env.TURSO_DATABASE_URL ? 'ENCONTRADA' : 'NAO ENCONTRADA'
);

console.log(
  'TURSO_AUTH_TOKEN:',
  process.env.TURSO_AUTH_TOKEN ? 'ENCONTRADO' : 'NAO ENCONTRADO'
);