import mysql from 'mysql2/promise';

export const pool = mysql.createPool(process.env.DATABASE_URL + '?waitForConnections=true&connectionLimit=10&queueLimit=0');

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