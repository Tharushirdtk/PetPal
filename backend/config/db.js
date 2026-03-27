const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'petpal',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  supportBigNumbers: true,
  bigNumberStrings: false,
});

/**
 * Execute a query with optional audit user context.
 * Sets @current_user_id session variable before the query so
 * DB triggers can populate created_by / updated_by.
 */
async function query(sql, params = [], userId = null) {
  const conn = await pool.getConnection();
  try {
    if (userId) {
      await conn.execute('SET @current_user_id = ?', [userId]);
    }
    const [rows] = await conn.execute(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query };
