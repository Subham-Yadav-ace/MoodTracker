const {
  DIVERGENCE_SCORE_THRESHOLD, // 6  → score ≥ 6 = user is reporting HIGH mood
  CRISIS_LOW_SCORE_THRESHOLD, // 3  → score ≤ 3 = user is reporting LOW mood
  SENTIMENT_LABELS,           // { POSITIVE, NEGATIVE, NEUTRAL }
} = require("../utils/constants");

// ────────────────────────────────────────────────────────────
// checkDivergence(score, sentimentLabel)
//
// The "killer feature" — detects mismatch between:
//   - User's self-reported mood score  (subjective)
//   - AI-detected sentiment label       (objective)
//
// Thresholds (pulled from constants.js — single source of truth):
//   score >= DIVERGENCE_SCORE_THRESHOLD (6) → user is reporting HIGH mood
//   score <= CRISIS_LOW_SCORE_THRESHOLD (3) → user is reporting LOW mood
//
// Divergence triggers when:
//   HIGH score  + NEGATIVE sentiment  (says happy, AI sees sadness/anger)
//   LOW score   + POSITIVE sentiment  (says bad,   AI sees joy)
//
// Returns: boolean
// ────────────────────────────────────────────────────────────
const checkDivergence = (score, sentimentLabel) => {
  if (!sentimentLabel) return false; // no AI result → no divergence flag

  const highMood = score >= DIVERGENCE_SCORE_THRESHOLD; // score ≥ 6
  const lowMood  = score <= CRISIS_LOW_SCORE_THRESHOLD; // score ≤ 3

  if (highMood && sentimentLabel === SENTIMENT_LABELS.NEGATIVE) return true;
  if (lowMood  && sentimentLabel === SENTIMENT_LABELS.POSITIVE) return true;

  return false;
};

module.exports = { checkDivergence };
