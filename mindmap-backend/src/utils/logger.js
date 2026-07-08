const { createLogger, format, transports } = require("winston");

const { combine, timestamp, json, colorize, printf, errors } = format;

// ── Dev-friendly format ──────────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
  })
);

// ── Production JSON format (CloudWatch Insights friendly) ────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [
    new transports.Console({
      stderrLevels: ["error"],   // errors → stderr, rest → stdout
    }),
  ],
});

// ── Morgan stream — pipes HTTP logs into Winston ─────────────────────────────
logger.morganStream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
