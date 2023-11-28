import { Pool } from 'pg'

require('dotenv').config()
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
}) : new Pool({
  user: process.env["db_username"],
  password: process.env["db_password"],
  host: process.env["db_host"],
  port: parseInt(process.env["db_port"]!),
  database: process.env["database_name"]
})

module.exports = {
  query: (text: string, params?: any[]) => pool.query(text, params)
};