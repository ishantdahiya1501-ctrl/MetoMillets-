const rateLimit = require("express-rate-limit");

// Conservative defaults (tune as needed). These protect login/register from brute force.
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_ATTEMPTS" },
});

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_ATTEMPTS" },
});

module.exports = { loginLimiter, registerLimiter };
