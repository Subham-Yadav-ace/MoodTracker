// ─────────────────────────────────────────────────────────────────────────────
// crisisKeywords.js
//
// A curated list of phrases and words that signal a user may be in crisis.
// Used in two places:
//   1. crisis.service.js  → scans journal text of mood entries nightly
//   2. socket.js          → scans peer support chat messages in real-time
//
// HOW IT WORKS:
//   When a message/journal is checked, it is lowercased and then tested
//   against each keyword/phrase in this array using String.includes().
//   If ANY match is found → crisisFlag = true → alert is triggered.
//
// IMPORTANT:
//   Keep phrases specific enough to avoid false positives but broad enough
//   to catch genuine distress signals. Review and expand periodically.
// ─────────────────────────────────────────────────────────────────────────────

const CRISIS_KEYWORDS = [
  // ── Direct suicidal ideation ──────────────────────────────
  "want to die",
  "wanna die",
  "i want to kill myself",
  "i wanna kill myself",
  "going to kill myself",
  "gonna kill myself",
  "thinking about suicide",
  "suicidal",
  "end my life",
  "ending my life",
  "take my own life",
  "taking my own life",
  "don't want to live",
  "dont want to live",
  "no reason to live",
  "rather be dead",
  "better off dead",
  "better off without me",

  // ── Self-harm ─────────────────────────────────────────────
  "hurt myself",
  "hurting myself",
  "cut myself",
  "cutting myself",
  "self harm",
  "self-harm",
  "harming myself",

  // ── Hopelessness / giving up ──────────────────────────────
  "can't go on",
  "cannot go on",
  "can't take it anymore",
  "cannot take it anymore",
  "can't do this anymore",
  "cannot do this anymore",
  "no point anymore",
  "nothing matters anymore",
  "see no way out",
  "no way out",
  "giving up on life",
  "i give up on life",

  // ── Goodbye / farewell signals ────────────────────────────
  "goodbye everyone",
  "goodbye forever",
  "this is the end",
  "my final",
  "last goodbye",
  "won't be here anymore",

  // ── Feeling like a burden ─────────────────────────────────
  "everyone would be better off",
  "nobody cares if i die",
  "no one cares if i die",
  "nobody would miss me",
  "no one would miss me",
  "i'm a burden",
  "i am a burden",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: check if a given text contains any crisis keyword
//
// @param  {string} text  — journal entry or chat message to scan
// @returns {boolean}     — true if crisis keyword found, false otherwise
// ─────────────────────────────────────────────────────────────────────────────
const containsCrisisKeyword = (text) => {
  if (!text || typeof text !== "string") return false;
  const lowered = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lowered.includes(keyword));
};

module.exports = { CRISIS_KEYWORDS, containsCrisisKeyword };
