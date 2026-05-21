const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");

const { register, login, refresh, logout } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// ── Rate limiter: applies to all auth routes ────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter); // Apply to every route in this file

// ── Validation rules ─────────────────────────────────────────
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ── Routes ───────────────────────────────────────────────────
// POST /api/auth/register
router.post("/register", ...registerValidation, register);

// POST /api/auth/login
router.post("/login", ...loginValidation, login);

// POST /api/auth/refresh
router.post("/refresh", refresh);//-->used for the retreiving the new access token 

// POST /api/auth/logout  (protected — must be logged in to log out)
router.post("/logout", protect, logout);

module.exports = router;
