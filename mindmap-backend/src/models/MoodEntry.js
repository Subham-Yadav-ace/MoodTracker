const mongoose = require("mongoose");

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: [true, "Mood score is required"],
      min: [1, "Score must be at least 1"],
      max: [10, "Score cannot exceed 10"],
    },
    emotionTags: {
      type: [String],
      enum: [
        "happy", "anxious", "sad", "angry", "calm", "exhausted",
        "hopeful", "overwhelmed", "lonely", "grateful", "irritated", "motivated",
      ],
      validate: {
        validator: (v) => v.length <= 5,
        message: "Maximum 5 emotion tags allowed",
      },
    },
    triggers: {
      type: [String],
      enum: [
        "poor_sleep", "work_stress", "social_interaction", "exercise", "diet",
        "loneliness", "financial_stress", "relationship", "health_issue", "academic_pressure",
      ],
      validate: {
        validator: (v) => v.length <= 5,
        message: "Maximum 5 triggers allowed",
      },
    },
    journalText: {
      type: String,
      maxlength: [5000, "Journal entry cannot exceed 5000 characters"],
      default: "",
    },

    // ── AI Sentiment (filled by HuggingFace API) ────────────
    sentiment: {
      label: {
        type: String,
        enum: ["POSITIVE", "NEGATIVE", "NEUTRAL", null],
        default: null,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },
      emotion: {
        type: String, // joy | sadness | anger | fear | disgust | surprise | neutral
        default: null,
      },
      compoundScore: {
        type: Number, // Reserved — was VADER specific, kept for future use
        default: null,
      },
    },

    // ── Divergence Flag (the killer feature) ───────────────
    divergenceFlag: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────
moodEntrySchema.index({ userId: 1, createdAt: -1 }); // User entries sorted by date (Dashboard, Analytics)
moodEntrySchema.index({ userId: 1, divergenceFlag: 1 }); // Fast divergence queries

module.exports = mongoose.model("MoodEntry", moodEntrySchema);
