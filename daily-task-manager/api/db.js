require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please add it to your .env file or Vercel dashboard.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize tables
const initDB = async () => {
  try {
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
    console.log('Database connected and initialized successfully!');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

initDB();

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
