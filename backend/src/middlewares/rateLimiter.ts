import rateLimit from "express-rate-limit";

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

export const authPublicLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many authentication requests. Please try again later.",
    },
  },
});

export const authSensitiveLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many password or token requests. Please try again later.",
    },
  },
});
