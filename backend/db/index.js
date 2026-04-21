const { Pool } = require("pg");
require("../config/env");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database queries will fail until it is added.");
}

const pool = new Pool({
  connectionString,
});

module.exports = pool;
