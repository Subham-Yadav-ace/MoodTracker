const express = require("express");
const { body, param } = require("express-validator");

const {
  createMoodEntry,
  getMoodEntries,
  getWeekEntries,
  getMonthEntries,
  getMoodEntryById,
  deleteMoodEntry,
  getMoodInsights,
} = require("../controllers/mood.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// ── All mood routes require authentication ───────────────────
router.use(protect);

// ── Validation rules ─────────────────────────────────────────
const createMoodValidation = [
  body("score")
    .isInt({ min: 1, max: 10 })
    .withMessage("Score must be a whole number between 1 and 10"),

  body("emotionTags")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Maximum 5 emotion tags allowed")
    .custom((tags) => {
      const valid = [
        "happy", "anxious", "sad", "angry", "calm", "exhausted",
        "hopeful", "overwhelmed", "lonely", "grateful", "irritated", "motivated",
      ];
      return tags.every((t) => valid.includes(t));
    })
    .withMessage("One or more emotion tags are invalid"),

  body("triggers")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Maximum 5 triggers allowed")
    .custom((tags) => {
      const valid = [
        "poor_sleep", "work_stress", "social_interaction", "exercise", "diet",
        "loneliness", "financial_stress", "relationship", "health_issue", "academic_pressure",
      ];
      return tags.every((t) => valid.includes(t));
    })
    .withMessage("One or more triggers are invalid"),

  body("journalText")
    .notEmpty()
    .withMessage("Journal text is required")
    .isLength({ max: 5000 })
    .withMessage("Journal text cannot exceed 5000 characters"),
];

const mongoIdValidation = [
  param("id").isMongoId().withMessage("Invalid entry ID"),
];

// ── Routes ───────────────────────────────────────────────────
// NOTE: Static named routes MUST be defined BEFORE /:id to avoid "insights"
// being matched as an ID param.

// GET  /api/mood/insights  → analytics + generated insight strings
router.get("/insights", getMoodInsights);

// GET  /api/mood/week     → last 7 days entries + stats
router.get("/week", getWeekEntries);

// GET  /api/mood/month    → last 30 days entries + stats
router.get("/month", getMonthEntries);

// POST /api/mood
router.post("/", ...createMoodValidation, createMoodEntry);

// GET  /api/mood
router.get("/", getMoodEntries);

// GET  /api/mood/:id
router.get("/:id", ...mongoIdValidation, getMoodEntryById);

// DELETE /api/mood/:id
router.delete("/:id", ...mongoIdValidation, deleteMoodEntry);

module.exports = router;
