require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");
const { errorHandler } = require("./src/middleware/error.middleware");

// ── Initialize Express ──────────────────────────────────────
const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));
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
// app.use("/api/user", require("./src/routes/user.routes"));

// ── Global Error Handler (must be last) ─────────────────────
app.use(errorHandler);

// ── Create HTTP Server + Attach Socket.io ───────────────────
const httpServer = createServer(app);   // Wrap Express — never use app.listen()
initSocket(httpServer);                 // Socket.io attached from Day 1

// ── Connect DB → then start server ──────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
