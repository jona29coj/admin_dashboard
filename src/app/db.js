import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true   // 👈 this forces DATE, DATETIME, TIMESTAMP to come as plain strings
});

export async function query(sql, params) {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connected to the MySQL database');

    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
