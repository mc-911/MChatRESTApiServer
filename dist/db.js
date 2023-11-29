"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
require('dotenv').config();
const pool = process.env.DATABASE_URL ? new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
}) : new pg_1.Pool({
    user: process.env["db_username"],
    password: process.env["db_password"],
    host: process.env["db_host"],
    port: parseInt(process.env["db_port"]),
    database: process.env["database_name"]
});
module.exports = {
    query: (text, params) => pool.query(text, params)
};
