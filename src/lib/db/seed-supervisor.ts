import { randomUUID } from 'crypto';
import { client } from './index';
import { hashPassword } from '@/lib/auth/password';

async function seedSupervisor() {
  const username = 'supervisor';
  const name = 'Supervisor';

  const password = '123456';

  try {
    const existing = await client.execute({
      sql: `
        SELECT id
        FROM users
        WHERE username = ?
        LIMIT 1
      `,
      args: [username],
    });

    if (existing.rows.length > 0) {
      console.log('Usuário supervisor já existe.');
      return;
    }

    const passwordHash = await hashPassword(password);

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
        VALUES (?, ?, ?, ?, 'SUPERVISOR', 1, 1)
      `,
      args: [
        randomUUID(),
        username,
        name,
        passwordHash,
      ],
    });

    console.log('');
    console.log('======================================');
    console.log('SUPERVISOR CRIADO COM SUCESSO');
    console.log('======================================');
    console.log(`Usuário: ${username}`);
    console.log(`Senha:   ${password}`);
    console.log('Perfil:  SUPERVISOR');
    console.log('======================================');
    console.log('');
  } catch (error) {
    console.error('Erro ao criar supervisor:', error);
    process.exitCode = 1;
  }
}

seedSupervisor();