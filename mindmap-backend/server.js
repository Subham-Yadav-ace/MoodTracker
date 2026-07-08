require("dotenv").config();
const express    = require("express");
const { createServer } = require("http");
const cors       = require("cors");
const cookieParser = require("cookie-parser");
const helmet     = require("helmet");
const morgan     = require("morgan");
const cron       = require("node-cron");

const logger     = require("./src/utils/logger");

const connectDB  = require("./src/config/db");
const { initSocket }  = require("./src/config/socket");
const { errorHandler } = require("./src/middleware/error.middleware");

const { CRON_CRISIS_CHECK, CRON_WEEKLY_EMAIL } = require("./src/utils/constants");
const { runCrisisCheck }   = require("./src/services/crisis.service");
const { sendWeeklyReports } = require("./src/services/email.service");

// ── Initialize Express ──────────────────────────────────────
const app = express();
app.set("trust proxy", 1);   // Trust Nginx reverse proxy (fixes X-Forwarded-For warning)

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(morgan("combined", { stream: logger.morganStream }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,           // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// ── Health Check ────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "MindMap API is running 🚀" });
});

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/mood", require("./src/routes/mood.routes"));
app.use("/api/user", require("./src/routes/user.routes"));

// ── Global Error Handler (must be last) ─────────────────────
app.use(errorHandler);

// ── Create HTTP Server + Attach Socket.io ───────────────────
const httpServer = createServer(app);   // Wrap Express — never use app.listen()
initSocket(httpServer);                 // Socket.io attached from Day 1

// ── Connect DB → then start server ──────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });

  // ── Cron: Nightly crisis check — every day at 8 PM IST ──────
  cron.schedule(CRON_CRISIS_CHECK, () => {
    logger.info("[Cron] Running nightly crisis check...");
    runCrisisCheck();
  });

  // ── Cron: Weekly email report — every Sunday at 9 AM IST ────
  cron.schedule(CRON_WEEKLY_EMAIL, () => {
    logger.info("[Cron] Running weekly email report...");
    sendWeeklyReports();
  });
});
