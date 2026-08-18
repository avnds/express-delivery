import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { client } from './index';

const migrations = [
  {
    version: '001_auth_and_earnings',
    run: async () => {
      console.log('Aplicando Migration 001...');

      const usersTable = await client.execute(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name = 'users';
      `);

      if (usersTable.rows.length > 0) {
        console.log('Tabela users antiga encontrada. Removendo...');
        await client.execute(`DROP TABLE users;`);
      }

      await client.execute(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (
            role IN ('OPERATOR', 'SUPERVISOR', 'COURIER')
          ),
          active INTEGER NOT NULL DEFAULT 1,
          must_change_password INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_role
        ON users(role);
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_users_active
        ON users(active);
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          revoked_at DATETIME,

          FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
        );
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id
        ON sessions(user_id);
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
        ON sessions(expires_at);
      `);

      await client.execute(`
        CREATE TABLE IF NOT EXISTS earnings (
          id TEXT PRIMARY KEY,
          courier_id TEXT NOT NULL,
          delivery_id TEXT NOT NULL UNIQUE,
          amount REAL NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

          FOREIGN KEY (courier_id)
            REFERENCES users(id),

          FOREIGN KEY (delivery_id)
            REFERENCES deliveries(id)
        );
      `);

      await client.execute(`
        CREATE INDEX IF NOT EXISTS idx_earnings_courier_id
        ON earnings(courier_id);
      `);

      const deliveryColumns = await client.execute(`
        PRAGMA table_info(deliveries);
      `);

      const hasCourierId = deliveryColumns.rows.some(
        (column) => column.name === 'courier_id'
      );

      if (!hasCourierId) {
        await client.execute(`
          ALTER TABLE deliveries
          ADD COLUMN courier_id TEXT;
        `);

        console.log('✓ courier_id adicionada.');
      } else {
        console.log('✓ courier_id já existe.');
      }

      console.log('✓ Migration 001 concluída.');
    },
  },

  {
    version: '002_delivery_fields',
    run: async () => {
      console.log('Aplicando Migration 002...');

      const deliveryColumns = await client.execute(`
        PRAGMA table_info(deliveries);
      `);

      const columns = deliveryColumns.rows.map(
        (column) => column.name
      );

      if (!columns.includes('phone')) {
        await client.execute(`
          ALTER TABLE deliveries
          ADD COLUMN phone TEXT;
        `);
        console.log('✓ phone adicionada.');
      }

      if (!columns.includes('delivery_fee')) {
        await client.execute(`
          ALTER TABLE deliveries
          ADD COLUMN delivery_fee REAL DEFAULT 0.00;
        `);
        console.log('✓ delivery_fee adicionada.');
      }

      if (!columns.includes('completion_notes')) {
        await client.execute(`
          ALTER TABLE deliveries
          ADD COLUMN completion_notes TEXT;
        `);
        console.log('✓ completion_notes adicionada.');
      }

      if (!columns.includes('longitude')) {
        await client.execute(`
          ALTER TABLE deliveries
          ADD COLUMN longitude REAL;
        `);
        console.log('✓ longitude adicionada.');
      }

      console.log('✓ Migration 002 concluída.');
    },
  },
];

async function migrate() {
  console.log('\n=== Express Delivery — Migrations ===');

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const migration of migrations) {
      const result = await client.execute({
        sql: `
          SELECT version
          FROM schema_migrations
          WHERE version = ?
        `,
        args: [migration.version],
      });

      if (result.rows.length > 0) {
        console.log(`✓ ${migration.version} já aplicada.`);
        continue;
      }

      console.log(`\n→ Aplicando ${migration.version}...`);

      await migration.run();

      await client.execute({
        sql: `
          INSERT INTO schema_migrations (version)
          VALUES (?)
        `,
        args: [migration.version],
      });

      console.log(`✓ ${migration.version} registrada.`);
    }

    console.log('\n=== TODAS AS MIGRATIONS CONCLUÍDAS ===\n');
  } catch (error) {
    console.error('\n❌ ERRO DURANTE AS MIGRATIONS:');
    console.error(error);
    process.exitCode = 1;
  }
}

migrate();