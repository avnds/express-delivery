import { createHash, randomBytes, randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const SESSION_COOKIE = 'express_delivery_session';
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const sessionId = randomUUID();

  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Apenas uma sessão ativa por usuário.
  await db.execute({
    sql: `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND revoked_at IS NULL
    `,
    args: [userId],
  });

  await db.execute({
    sql: `
      INSERT INTO sessions (
        id,
        user_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?, ?)
    `,
    args: [sessionId, userId, tokenHash, expiresAt],
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });

  return sessionId;
}
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const result = await db.execute({
    sql: `
      SELECT
        sessions.id AS session_id,
        sessions.user_id,
        sessions.expires_at,
        users.username,
        users.name,
        users.role,
        users.active,
        users.must_change_password
      FROM sessions
      INNER JOIN users
        ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.revoked_at IS NULL
        AND users.active = 1
      LIMIT 1
    `,
    args: [tokenHash],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const session = result.rows[0];

  if (new Date(session.expires_at as string) <= new Date()) {
    await db.execute({
      sql: `
        UPDATE sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [session.session_id],
    });

    return null;
  }

  await db.execute({
    sql: `
      UPDATE sessions
      SET last_activity_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    args: [session.session_id],
  });

  return {
    sessionId: session.session_id,
    userId: session.user_id,
    username: session.username,
    name: session.name,
    role: session.role,
    mustChangePassword: Boolean(session.must_change_password),
  };
}
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashToken(token);

    await db.execute({
      sql: `
        UPDATE sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE token_hash = ?
          AND revoked_at IS NULL
      `,
      args: [tokenHash],
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}