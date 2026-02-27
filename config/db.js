const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');

// Read the CA certificate
const ca = fs.readFileSync(process.env.DB_CA_PATH);

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: ca,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // ✅ Increased timeout for TiDB cold start
  connectTimeout: 15000,

  // ✅ Keep connections alive (prevents idle disconnect)
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Export the pool for use in other files
module.exports = pool.promise();