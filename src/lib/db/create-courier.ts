import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { client } from './index';
import { hashPassword } from '../auth/password';

async function createCourier() {
  const username = 'entregador';
  const password = '123456';

  const existing = await client.execute({
    sql: 'SELECT id FROM users WHERE username = ? LIMIT 1',
    args: [username],
  });

  if (existing.rows.length > 0) {
    console.log('Usuário entregador já existe.');
    return;
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();

  await client.execute({
    sql: `
      INSERT INTO users (
        id,
        username,
        name,
        password_hash,
        role,
        active,
        must_change_password
      )
      VALUES (?, ?, ?, ?, 'COURIER', 1, 0)
    `,
    args: [
      id,
      username,
      'Entregador de Teste',
      passwordHash,
    ],
  });

  console.log('');
  console.log('======================================');
  console.log('ENTREGADOR CRIADO COM SUCESSO');
  console.log('======================================');
  console.log('Usuário: entregador');
  console.log('Senha:   123456');
  console.log('Perfil:  COURIER');
  console.log('======================================');
}

createCourier().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});