const { Pool, Client } = require('pg');

require('dotenv').config()
if (process.env.DATABASE_URL) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  module.exports = {
    query: (text: string, params?: any[]) => client.query(text, params)
  };
} else {
  const pool = new Pool({
    user: process.env["db_username"],
    password: process.env["db_password"],
    host: process.env["db_host"],
    port: process.env["db_port"],
    database: process.env["database_name"]
  });
  module.exports = {
    query: (text: string, params?: any[]) => pool.query(text, params)
  };
}
