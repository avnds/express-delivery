import { createClient } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// Wrapper com métodos auxiliares
export const db = {
  ...client,

  // Busca todas as entregas
  async getDeliveries() {
    try {
      const result = await client.execute('SELECT * FROM deliveries ORDER BY created_at DESC');
      return result.rows.map((row: any) => ({
        id: row.id,
        tracking_code: row.tracking_code,
        recipient_name: row.recipient_name,
        address: row.address,
        lat: row.latitude,
        lng: row.longitude,
        status: row.status,
        phone: row.phone,
        completion_notes: row.completion_notes,
        delivery_fee: row.delivery_fee,
      }));
    } catch (error) {
      console.error('Erro ao buscar entregas:', error);
      return [];
    }
  },

  // Apaga todas as entregas
  async clearDeliveries() {
    try {
      await client.execute('DELETE FROM deliveries');
    } catch (error) {
      console.error('Erro ao apagar entregas:', error);
      throw error;
    }
  },
};