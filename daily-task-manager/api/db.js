require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const path = require('path');

let queryFn;
let poolObj;

if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL is set. Using PostgreSQL...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle pg client', err);
  });

  queryFn = (text, params) => pool.query(text, params);
  poolObj = pool;

  // Initialize tables (pg)
  const initDB = async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          email_time VARCHAR(255) NOT NULL DEFAULT '09:00',
          timezone VARCHAR(255) NOT NULL DEFAULT 'Asia/Kolkata'
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
          title TEXT NOT NULL,
          text TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          date VARCHAR(50) NOT NULL,
          sort_order INTEGER NOT NULL
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS visit_logs (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          path VARCHAR(255) NOT NULL,
          user_agent TEXT,
          timestamp VARCHAR(255) NOT NULL
        );
      `);
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_time VARCHAR(255) NOT NULL DEFAULT '09:00';`);
      } catch (alterErr) {
        console.log('Postgres migration note: email_time column might already exist.');
      }
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(255) NOT NULL DEFAULT 'Asia/Kolkata';`);
      } catch (alterErr) {
        console.log('Postgres migration note: timezone column might already exist.');
      }
      console.log('PostgreSQL database connected and initialized successfully!');
    } catch (err) {
      console.error('Error initializing PostgreSQL tables:', err);
    }
  };
  initDB();

} else {
  console.warn('DATABASE_URL is not set. Falling back to local SQLite database (database.sqlite)...');
  const Database = require('better-sqlite3');
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      email_time TEXT NOT NULL DEFAULT '09:00',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata'
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS visit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      path TEXT NOT NULL,
      user_agent TEXT,
      timestamp TEXT NOT NULL
    );
  `);
  try {
    db.exec(`ALTER TABLE users ADD COLUMN email_time TEXT NOT NULL DEFAULT '09:00';`);
  } catch (alterErr) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';`);
  } catch (alterErr) {
    // Column already exists
  }
  console.log('SQLite database initialized successfully!');

  // Helper to convert $1, $2 to ?
  const convertSql = (sql) => sql.replace(/\$\d+/g, '?');

  queryFn = async (text, params = []) => {
    const converted = convertSql(text);
    const stmt = db.prepare(converted);
    if (text.trim().toUpperCase().startsWith('SELECT')) {
      const rows = stmt.all(params);
      return { rows };
    } else {
      const info = stmt.run(params);
      return { rows: [], info };
    }
  };

  poolObj = {
    connect: async () => {
      return {
        query: async (text, params = []) => queryFn(text, params),
        release: () => {}
      };
    }
  };
}

module.exports = {
  pool: poolObj,
  query: queryFn,
};
