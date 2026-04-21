const fs = require("fs");
const path = require("path");
require("../config/env");
const pool = require("../db");

async function runSqlFile() {
  const relativeFilePath = process.argv[2];

  if (!relativeFilePath) {
    throw new Error("Please provide a SQL file path. Example: node scripts/runSqlFile.js sql/schema.sql");
  }

  const absoluteFilePath = path.join(__dirname, "..", relativeFilePath);

  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`SQL file not found: ${absoluteFilePath}`);
  }

  const sql = fs.readFileSync(absoluteFilePath, "utf8");

  await pool.query(sql);
  console.log(`Successfully ran ${relativeFilePath}`);
}

runSqlFile()
  .catch((error) => {
    console.error("Failed to run SQL file.");
    console.error(error.message || error.toString());
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
