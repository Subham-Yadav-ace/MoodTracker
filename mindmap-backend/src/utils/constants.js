// ─────────────────────────────────────────────────────────────────────────────
// constants.js
//
// Centralized constants for the MindMap backend.
// Imported by models, controllers, services, and socket handlers.
//
// Keeping these in one place means:
//   - Changing an option (e.g. adding a new emotion tag) = change in ONE file
//   - No magic strings scattered across the codebase
//   - Easy to import only what you need
// ─────────────────────────────────────────────────────────────────────────────

// ── Emotion Tags ─────────────────────────────────────────────────────────────
// Used in: MoodEntry.js schema, mood.routes.js validation, MoodForm.jsx (frontend)
const EMOTION_TAGS = [
  "happy",
  "anxious",
  "sad",
  "angry",
  "calm",
  "exhausted",
  "hopeful",
  "overwhelmed",
  "lonely",
  "grateful",
  "irritated",
  "motivated",
];

// ── Triggers ──────────────────────────────────────────────────────────────────
// Used in: MoodEntry.js schema, mood.routes.js validation, MoodForm.jsx (frontend)
const TRIGGERS = [
  "poor_sleep",
  "work_stress",
  "social_interaction",
  "exercise",
  "diet",
  "loneliness",
  "financial_stress",
  "relationship",
  "health_issue",
  "academic_pressure",
];

// ── Peer Support Chat Rooms ───────────────────────────────────────────────────
// Used in: ChatMessage.js schema, socket.js room join logic, PeerSupport.jsx (frontend)
const CHAT_ROOMS = ["anxiety", "loneliness", "stress", "wellness"];

// ── Sentiment Labels ──────────────────────────────────────────────────────────
// Used in: divergence.service.js, MoodEntry.js schema
const SENTIMENT_LABELS = {
  POSITIVE: "POSITIVE",
  NEGATIVE: "NEGATIVE",
  NEUTRAL: "NEUTRAL",
};

// ── HuggingFace Emotion → Sentiment Mapping ───────────────────────────────────
// Used in: sentiment.service.js
// Maps the 7 emotions returned by distilroberta to a simplified sentiment label
const EMOTION_TO_SENTIMENT = {
  joy: SENTIMENT_LABELS.POSITIVE,
  surprise: SENTIMENT_LABELS.POSITIVE,  // can be positive in context
  neutral: SENTIMENT_LABELS.NEUTRAL,
  sadness: SENTIMENT_LABELS.NEGATIVE,
  anger: SENTIMENT_LABELS.NEGATIVE,
  fear: SENTIMENT_LABELS.NEGATIVE,
  disgust: SENTIMENT_LABELS.NEGATIVE,
};

// ── Divergence Detection Thresholds ──────────────────────────────────────────
// Used in: divergence.service.js
// A mood score ≥ this value is considered "self-reported positive"
const DIVERGENCE_SCORE_THRESHOLD = 6; // scores 1-5 = negative, 6-10 = positive

// ── Crisis Detection Thresholds ───────────────────────────────────────────────
// Used in: crisis.service.js
// Number of consecutive low-mood days before an alert fires
const CRISIS_CONSECUTIVE_DAYS = 3;

// A mood score at or below this value counts as a "low mood day"
const CRISIS_LOW_SCORE_THRESHOLD = 3;

// Confidence % at or above which a "sadness" emotion triggers crisis concern
const CRISIS_SADNESS_CONFIDENCE = 0.85; // 85%

// ── Cron Schedules (node-cron syntax) ────────────────────────────────────────
// Used in: server.js
// "0 20 * * *"  → every day at 8:00 PM IST (20:00)
const CRON_CRISIS_CHECK = "0 20 * * *";

// "0 9 * * 0"   → every Sunday at 9:00 AM IST
const CRON_WEEKLY_EMAIL = "0 9 * * 0";

// ── Chat Message Limits ───────────────────────────────────────────────────────
// Used in: socket.js
// Max number of recent messages loaded when a user joins a room
const CHAT_HISTORY_LIMIT = 50;

module.exports = {
  EMOTION_TAGS,
  TRIGGERS,
  CHAT_ROOMS,
  SENTIMENT_LABELS,
  EMOTION_TO_SENTIMENT,
  DIVERGENCE_SCORE_THRESHOLD,
  CRISIS_CONSECUTIVE_DAYS,
  CRISIS_LOW_SCORE_THRESHOLD,
  CRISIS_SADNESS_CONFIDENCE,
  CRON_CRISIS_CHECK,
  CRON_WEEKLY_EMAIL,
  CHAT_HISTORY_LIMIT,
};
