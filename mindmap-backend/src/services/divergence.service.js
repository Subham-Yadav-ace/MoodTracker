// ────────────────────────────────────────────────────────────
// checkDivergence(score, sentimentLabel)
//
// The "killer feature" — detects mismatch between:
//   - User's self-reported mood score  (subjective)
//   - AI-detected sentiment label       (objective)
//
// Thresholds (confirmed by user):
//   score >= 7  → user is reporting HIGH mood
//   score <= 3  → user is reporting LOW mood
//
// Divergence triggers when:
//   HIGH score  + NEGATIVE sentiment  (says happy, AI sees sadness/anger)
//   LOW score   + POSITIVE sentiment  (says bad,   AI sees joy)
//
// Returns: boolean
// ────────────────────────────────────────────────────────────
const checkDivergence = (score, sentimentLabel) => {
  if (!sentimentLabel) return false; // no AI result → no divergence flag

  const highMood = score >= 7;
  const lowMood  = score <= 3;

  if (highMood && sentimentLabel === "NEGATIVE") return true;
  if (lowMood  && sentimentLabel === "POSITIVE") return true;

  return false;
};

module.exports = { checkDivergence };
