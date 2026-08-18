-- Express Delivery
-- Migration 001
-- Autenticação, multiusuário e earnings
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- ============================================
-- USUÁRIOS
-- ============================================


CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE INDEX IF NOT EXISTS idx_users_active
ON users(active);


-- ============================================
-- SESSÕES
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions(expires_at);


-- ============================================
-- GANHOS DOS ENTREGADORES
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_earnings_courier_id
ON earnings(courier_id);


-- ============================================
-- VÍNCULO DA ENTREGA COM O ENTREGADOR
-- ============================================

ALTER TABLE deliveries
ADD COLUMN courier_id TEXT;