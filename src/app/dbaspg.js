import pkg from 'pg';
const { Pool } = pkg;

export const pgPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME_AS,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export async function pgQuery(sql, params) {
  let client;
  try {
    client = await pgPool.connect();
    console.log('Connected to the Postgres database');
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Postgres query error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}