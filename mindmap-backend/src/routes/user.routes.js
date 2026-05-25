const express = require("express");
const { body } = require("express-validator");

const {
  getProfile,
  updateProfile,
  updateTrustedContact,
  removeTrustedContact,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// ── All user routes require authentication ───────────────────
router.use(protect);

// ── Validation rules ─────────────────────────────────────────
const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
];

const trustedContactValidation = [
  body("name")
    .notEmpty()
    .withMessage("Trusted contact name is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Trusted contact name must be between 2 and 50 characters"),

  body("phone")
    .notEmpty()
    .withMessage("Trusted contact phone is required")
    .trim()
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage("Enter a valid phone number with country code (e.g. +911234567890)"),
];

// ── Routes ───────────────────────────────────────────────────

// GET  /api/user/profile     → get profile + account stats
router.get("/profile", getProfile);

// PUT  /api/user/profile     → update name and/or email
router.put("/profile", updateProfileValidation, updateProfile);

// PUT  /api/user/trusted-contact   → set/update trusted contact
router.put("/trusted-contact", trustedContactValidation, updateTrustedContact);

// DELETE /api/user/trusted-contact → remove trusted contact
router.delete("/trusted-contact", removeTrustedContact);

module.exports = router;
