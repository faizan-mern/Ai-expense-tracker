const path = require("path");
const dotenv = require("dotenv");

if (!global.__expenseTrackerEnvLoaded) {
  dotenv.config({
    path: path.join(__dirname, "..", ".env"),
    quiet: true,
  });

  global.__expenseTrackerEnvLoaded = true;
}

module.exports = process.env;
