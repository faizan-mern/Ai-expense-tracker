const path = require("path");
const dotenv = require("dotenv");

if (!global.__expenseTrackerEnvLoaded) {
  dotenv.config({
    path: path.join(__dirname, "..", ".env"),
  });

  global.__expenseTrackerEnvLoaded = true;
}

module.exports = process.env;
