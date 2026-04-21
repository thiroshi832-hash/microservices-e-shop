const { Pool } = require('pg');
require('dotenv').config();

const maxRetries = 5;
let retryCount = 0;

const createPool = () => {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'ecommerce',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit, let the app handle reconnection
});

const connectWithRetry = async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log('PostgreSQL connected successfully');
    return true;
  } catch (err) {
    retryCount++;
    if (retryCount >= maxRetries) {
      console.error('PostgreSQL connection failed after max retries', err);
      return false;
    }
    console.log(`PostgreSQL connection failed, retrying in ${retryCount * 2}s...`);
    await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
    return connectWithRetry();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
  connectWithRetry
};
