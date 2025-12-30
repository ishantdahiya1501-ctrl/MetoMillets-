const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { User } = require("../models/User");

const getTokenFromRequest = (req) => {
  // We use an HTTP-only cookie for the auth token.
  // This prevents JS access (mitigates XSS token theft).
  return req.cookies?.[config.cookieName] || null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
};

module.exports = { requireAuth, getTokenFromRequest };
