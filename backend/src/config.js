const assertRequired = (name, value) => {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
};

const getEnv = (name, fallback) => {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
};

const nodeEnv = getEnv("NODE_ENV", "development");

const config = {
  nodeEnv,
  port: Number(getEnv("PORT", "8080")),
  mongoUri: getEnv("MONGODB_URI", ""),
  jwtSecret: getEnv("JWT_SECRET", ""),
  jwtExpiresIn: getEnv("JWT_EXPIRES_IN", "7d"),

  corsOrigin: getEnv("CORS_ORIGIN", "http://localhost:5500"),

  cookieName: getEnv("AUTH_COOKIE_NAME", "mtm_auth"),
  cookieSecure: getEnv("COOKIE_SECURE", nodeEnv === "production" ? "true" : "false") === "true",
  cookieSameSite: getEnv("COOKIE_SAMESITE", nodeEnv === "production" ? "none" : "lax"),
  cookieDomain: getEnv("COOKIE_DOMAIN", ""),
};

const validateConfig = () => {
  assertRequired("MONGODB_URI", config.mongoUri);
  assertRequired("JWT_SECRET", config.jwtSecret);

  // cookieSameSite must be one of: lax, strict, none
  const allowedSameSite = new Set(["lax", "strict", "none"]);
  if (!allowedSameSite.has(String(config.cookieSameSite).toLowerCase())) {
    throw new Error(`COOKIE_SAMESITE must be one of lax|strict|none. Got: ${config.cookieSameSite}`);
  }

  // If SameSite=None, Secure must be true in modern browsers.
  if (String(config.cookieSameSite).toLowerCase() === "none" && !config.cookieSecure) {
    throw new Error("COOKIE_SECURE must be true when COOKIE_SAMESITE=none");
  }
};

module.exports = { config, validateConfig };
