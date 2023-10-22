const { Pool } = require('pg');

require('dotenv').config()
const pool = new Pool({
  user: process.env["db_username"],
  password: process.env["db_password"],
  host: process.env["db_host"],
  port: process.env["db_port"], 
  database: process.env["database_name"]
});

module.exports = {
  query: (text : string, params? : any[]) => pool.query(text, params)
};