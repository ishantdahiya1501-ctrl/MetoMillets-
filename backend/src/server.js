const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env"),
});

const { validateConfig, config } = require("./config");
const { connectDbWithRetry } = require("./db");
const { createApp } = require("./app");

const main = async () => {
  validateConfig();
  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Auth API listening on :${config.port}`);
  });

  // Connect after we start listening so deploys don't hard-fail.
  // Auth endpoints will return 503 until Mongo is connected.
  connectDbWithRetry().catch((err) => {
    console.error("MongoDB failed to connect after retries", err);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
