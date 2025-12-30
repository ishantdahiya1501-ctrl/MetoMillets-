const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const { config } = require("../config");
const { User } = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(6).max(200),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(200),
});

const signToken = (userId) =>
  jwt.sign(
    {
      sub: String(userId),
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

const setAuthCookie = (res, token) => {
  const sameSite = String(config.cookieSameSite).toLowerCase();

  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (align with JWT_EXPIRES_IN)
    ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
  });
};

const clearAuthCookie = (res) => {
  const sameSite = String(config.cookieSameSite).toLowerCase();

  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite,
    path: "/",
    ...(config.cookieDomain ? { domain: config.cookieDomain } : {}),
  });
};

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await User.create({ name, email, passwordHash });
      return res.status(201).json({ user: user.toSafeJSON() });
    } catch (err) {
      // Handle unique constraint race
      if (err?.code === 11000) {
        return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
      }
      throw err;
    }
  })
);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "VALIDATION_ERROR" });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }

    const token = signToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({ user: user.toSafeJSON() });
  })
);

/**
 * GET /api/auth/me
 * Returns the currently logged-in user.
 */
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.status(200).json({ user: req.user.toSafeJSON() });
  })
);

/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  })
);

module.exports = { authRouter: router };
