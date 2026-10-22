import pg from 'pg';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

// Set pg type parser for DATE (OID 1082) to return raw string instead of local Date object
pg.types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: String(process.env.DB_PASSWORD || ''),
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 20, // Maximum number of connection clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 5000, // Return an error after 5s if connection cannot be established
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err.stack);
  } else {
    console.log(`✅ Successfully connected to database: ${process.env.DB_DATABASE} at ${res.rows[0].now}`);
  }
});

export default pool;
