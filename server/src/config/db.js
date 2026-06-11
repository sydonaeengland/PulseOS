import mysql from 'mysql2/promise';
import env from './env.js';

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};

export default pool;
