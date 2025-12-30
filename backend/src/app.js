const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoose = require("mongoose");

const { config } = require("./config");
const { authRouter } = require("./routes/auth");
const { wishlistRouter } = require("./routes/wishlist");
const { cartRouter } = require("./routes/cart");
const { reviewsRouter } = require("./routes/reviews");
const { ordersRouter } = require("./routes/orders");
const { paymentRouter } = require("./routes/payment");

const buildCorsOptions = () => {
  const allowed = String(config.corsOrigin || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isDevLocalOrigin = (origin) => {
    if (config.nodeEnv === "production") return false;
    if (!origin) return false;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  };

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowed.length === 0) return callback(null, true);
      if (isDevLocalOrigin(origin)) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
};

const createApp = () => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(cors(buildCorsOptions()));
  app.use(cookieParser());
  app.use(express.json({ limit: "20kb" }));

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/", (_req, res) => res.status(200).send("Backend is running"));

  // If Mongo isn't reachable (common during misconfigured deploys), don't hang requests.
  app.use("/api/auth", (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "DB_UNAVAILABLE" });
    }
    return next();
  });
  app.use("/api/auth", authRouter);

  app.use(["/api/wishlist", "/api/cart", "/api/reviews", "/api/orders", "/api/referrals"], (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "DB_UNAVAILABLE" });
    }
    return next();
  });

  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/orders", ordersRouter);
  const { referralsRouter } = require('./routes/referrals');
  app.use('/api/referrals', referralsRouter);
  app.use('/api/payment', paymentRouter);

  // Central error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (String(err?.message || "").startsWith("CORS blocked")) {
      return res.status(403).json({ error: "CORS_BLOCKED" });
    }

    // Avoid leaking internals to clients, but log for operators.
    // eslint-disable-next-line no-console
    console.error("Unhandled error", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  });

  return app;
};

module.exports = { createApp };
