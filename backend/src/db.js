const mongoose = require("mongoose");
const { config } = require("./config");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDbOnce = async () => {
  mongoose.set("strictQuery", true);

  // Keep the connection attempt snappy so we can retry.
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    // Some hosts/environments have flaky IPv6 egress.
    family: 4,
  });

  return mongoose.connection;
};

// Single-shot connect helper (useful for serverless cold-starts).
const connectDb = async () => {
  return await connectDbOnce();
};

const connectDbWithRetry = async ({
  maxRetries = Infinity,
  initialDelayMs = 750,
  maxDelayMs = 10_000,
} = {}) => {
  let attempt = 0;
  let delayMs = initialDelayMs;

  // Avoid adding multiple listeners in dev reloads.
  mongoose.connection.removeAllListeners("connected");
  mongoose.connection.removeAllListeners("disconnected");
  mongoose.connection.removeAllListeners("error");

  mongoose.connection.on("connected", () => {
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  });
  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.warn("MongoDB disconnected");
  });
  mongoose.connection.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error", err);
  });

  while (true) {
    try {
      attempt += 1;
      // eslint-disable-next-line no-console
      console.log(`MongoDB connect attempt ${attempt}...`);
      return await connectDbOnce();
    } catch (err) {
      const message = String(err?.message || err);
      // eslint-disable-next-line no-console
      console.error(
        `MongoDB connect failed (attempt ${attempt}). ${message}. ` +
          "Common causes on Render: Atlas Network Access IP allowlist blocks Render, wrong credentials, or cluster paused."
      );

      if (attempt >= maxRetries) {
        throw err;
      }

      await sleep(delayMs);
      delayMs = Math.min(maxDelayMs, delayMs * 2);
    }
  }
};

module.exports = { connectDb, connectDbWithRetry };
