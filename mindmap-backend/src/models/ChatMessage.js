const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      enum: ["anxiety", "loneliness", "stress", "wellness"],
      index: true,
    },
    anonUsername: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    crisisFlag: {
      type: Boolean,
      default: false, // Set to true if crisis keywords detected
    },

    // ── Chat Sentiment (filled by HuggingFace on each message) ──
    sentiment: {
      emotion: {
        type: String,
        default: null,
      },
      confidence: {
        type: Number,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ── TTL Index: auto-delete messages after 30 days (privacy) ─
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// ── Compound Index: fetch recent messages per room ───────────
chatMessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
