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

function summarizeParams(params) {
  if (!Array.isArray(params)) {
    return {
      isArray: false,
      type: typeof params,
      value: params,
    };
  }

  return {
    isArray: true,
    length: params.length,
    values: params.map((value, index) => ({
      index,
      type: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value,
      value,
    })),
  };
}

/**
 * Execute a query with optional audit user context.
 * Sets @current_user_id session variable before the query so
 * DB triggers can populate created_by / updated_by.
 */
async function query(sql, params = [], userId = null) {
  const conn = await pool.getConnection();
  try {
    const startedAt = Date.now();
    console.log('[DB] query:start', {
      sql,
      userId,
      params: summarizeParams(params),
    });

    if (userId) {
      console.log('[DB] query:set-current-user', {
        userId,
      });
      await conn.execute('SET @current_user_id = ?', [userId]);
    }

    const [rows] = await conn.execute(sql, params);
    console.log('[DB] query:success', {
      sql,
      durationMs: Date.now() - startedAt,
      rowSummary: Array.isArray(rows)
        ? { type: 'array', length: rows.length }
        : { type: typeof rows, affectedRows: rows?.affectedRows, insertId: rows?.insertId },
    });
    return rows;
  } catch (error) {
    console.error('[DB] query:error', {
      sql,
      userId,
      params: summarizeParams(params),
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack,
      },
    });
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query };
