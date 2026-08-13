import { client } from './index';

async function setupDatabase() {
  console.log('Iniciando criação das tabelas no Turso...');

  try {
    // Tabela de Usuários (Operador, Entregador, Supervisor)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('OPERATOR', 'COURIER', 'SUPERVISOR')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Entregas
    await client.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        tracking_code TEXT UNIQUE NOT NULL,
        recipient_name TEXT NOT NULL,
        address TEXT NOT NULL,
        lat REAL,
        lng REAL,
        status TEXT CHECK(status IN ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')) DEFAULT 'PENDING',
        courier_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courier_id) REFERENCES users(id)
      );
    `);

    console.log('✅ Tabelas criadas com sucesso no Turso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

setupDatabase();