const serverless = require("serverless-http");
const { validateConfig } = require("../src/config");
const { connectDb } = require("../src/db");
const { createApp } = require("../src/app");

let handler;

module.exports = async (req, res) => {
  try {
    if (!handler) {
      validateConfig();
      await connectDb();
      const app = createApp();
      handler = serverless(app);
    }
    return handler(req, res);
  } catch (err) {
    console.error("Vercel function error:", err);
    res.statusCode = 500;
    res.end("SERVER_ERROR");
  }
};
