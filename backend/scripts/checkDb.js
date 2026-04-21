require("../config/env");
const pool = require("../db");

async function checkDb() {
  const result = await pool.query(
    "select current_database() as db, current_user as user, version() as version"
  );

  const row = result.rows[0];

  console.log("Database connection successful.");
  console.log(`Database: ${row.db}`);
  console.log(`User: ${row.user}`);
  console.log(`Version: ${row.version.split(",")[0]}`);
}

checkDb()
  .catch((error) => {
    console.error("Database connection failed.");
    console.error(error.message || error.toString());
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
