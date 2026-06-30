// ─────────────────────────────────────────────────────────────────────────────
// crisis.service.js
//
// Nightly crisis detection engine for MindMap.
// Called by the cron job in server.js every day at 11 PM IST.
//
// TWO independent triggers flag a user as "at risk":
//
//   Trigger A — Consecutive Low Mood Days
//     → User had CRISIS_CONSECUTIVE_DAYS (3) or more days in a row
//       where their mood score was ≤ CRISIS_LOW_SCORE_THRESHOLD (3)
//
//   Trigger B — High Sadness Confidence
//     → Any entry today where HuggingFace detected "sadness" with
//       confidence ≥ CRISIS_SADNESS_CONFIDENCE (85%)
//
//   Trigger C — Crisis Keyword in Journal
//     → Any entry today whose journalText contains a phrase from crisisKeywords.js
//       e.g. "I want to end it all" → flag immediately
//
// If ANY trigger fires → log a warning + (future) send SMS to trustedContact
// ─────────────────────────────────────────────────────────────────────────────

const MoodEntry = require("../models/MoodEntry");
const User      = require("../models/User");

const {
  CRISIS_CONSECUTIVE_DAYS,    // 3   → how many days in a row count as a streak
  CRISIS_LOW_SCORE_THRESHOLD, // 3   → score ≤ this is a "low mood" day
  CRISIS_SADNESS_CONFIDENCE,  // 0.85 → sadness confidence ≥ this triggers alert
} = require("../utils/constants");

const { containsCrisisKeyword } = require("../utils/crisisKeywords");
const { sendCrisisSMS }        = require("./twilio.service");

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: isConsecutiveLowMoodStreak(entries)
//
// Given a list of MoodEntry documents sorted newest → oldest,
// checks if the most recent CRISIS_CONSECUTIVE_DAYS entries all have
// a score ≤ CRISIS_LOW_SCORE_THRESHOLD.
//
// Why sort-based instead of date-gap-based?
//   Users may skip a day. We only care about their last N logged entries,
//   not calendar continuity. If they log 3 entries all with score ≤ 3 → alert.
//
// @param  {Array}   entries  — MoodEntry docs, sorted newest first
// @returns {boolean}
// ─────────────────────────────────────────────────────────────────────────────
const isConsecutiveLowMoodStreak = (entries) => {
  if (entries.length < CRISIS_CONSECUTIVE_DAYS) return false;

  // Check only the most recent N entries
  const recentEntries = entries.slice(0, CRISIS_CONSECUTIVE_DAYS);

  return recentEntries.every((entry) => entry.score <= CRISIS_LOW_SCORE_THRESHOLD);
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: hasSadnessSpike(entries)
//
// Checks if any entry in today's mood logs detected "sadness" from HuggingFace
// with a confidence ≥ CRISIS_SADNESS_CONFIDENCE (0.85 → 85%).
//
// "today's entries" = entries created in the last 24 hours
//
// @param  {Array}   entries  — MoodEntry docs, sorted newest first
// @returns {boolean}
// ─────────────────────────────────────────────────────────────────────────────
const hasSadnessSpike = (entries) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return entries.some((entry) => {
    const isToday      = entry.createdAt >= oneDayAgo;
    const isSadness    = entry.sentiment?.emotion === "sadness";
    const highConfidence = entry.sentiment?.confidence >= CRISIS_SADNESS_CONFIDENCE;

    return isToday && isSadness && highConfidence;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: hasJournalKeyword(entries)
//
// Scans today's journal entries for crisis keywords using crisisKeywords.js.
// Only scans entries from the last 24 hours to avoid re-alerting on old entries.
//
// @param  {Array}   entries  — MoodEntry docs, sorted newest first
// @returns {boolean}
// ─────────────────────────────────────────────────────────────────────────────
const hasJournalKeyword = (entries) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return entries.some((entry) => {
    const isToday     = entry.createdAt >= oneDayAgo;
    const hasKeyword  = containsCrisisKeyword(entry.journalText);

    return isToday && hasKeyword;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: buildCrisisReasons(triggers)
//
// Builds a human-readable reason string for logging/SMS.
// e.g. "3 consecutive low-mood days; sadness confidence ≥ 85%"
//
// @param  {{ streak: boolean, sadness: boolean, keyword: boolean }} triggers
// @returns {string}
// ─────────────────────────────────────────────────────────────────────────────
const buildCrisisReasons = ({ streak, sadness, keyword }) => {
  const reasons = [];

  if (streak)  reasons.push(`${CRISIS_CONSECUTIVE_DAYS} consecutive low-mood days`);
  if (sadness) reasons.push(`sadness confidence ≥ ${CRISIS_SADNESS_CONFIDENCE * 100}%`);
  if (keyword) reasons.push("crisis keyword detected in journal");

  return reasons.join("; ");
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: runCrisisCheck()
//
// Entry point — called by cron job in server.js every day at 11 PM IST.
//
// Flow:
//   1. Fetch all users who have a trustedContact.phone set
//      (no point alerting if there's no one to call)
//   2. For each user, fetch their last N+1 mood entries (newest first)
//   3. Run all 3 trigger checks
//   4. If any trigger fires → log + (Twilio SMS — wired in next step)
//
// @returns {Promise<void>}
// ─────────────────────────────────────────────────────────────────────────────
const runCrisisCheck = async () => {
  console.log("[CrisisService] 🔍 Starting nightly crisis check...");

  try {
    // Step 1: Only check users who have a trusted contact phone number
    // (If there's no one to notify, we still log but can't send SMS)
    const users = await User.find({
      "trustedContact.phone": { $exists: true, $ne: null },
    }).select("_id name trustedContact");

    if (users.length === 0) {
      console.log("[CrisisService] No users with trusted contacts found. Skipping.");
      return;
    }

    console.log(`[CrisisService] Scanning ${users.length} user(s)...`);

    const flaggedUsers = [];

    // Step 2: Check each user's recent mood entries
    for (const user of users) {
      // Fetch last CRISIS_CONSECUTIVE_DAYS + 2 entries (buffer for safety)
      // Sorted newest first so slice(0, N) gives the most recent N
      const entries = await MoodEntry.find({ userId: user._id })
        .sort({ createdAt: -1 })    
        .limit(CRISIS_CONSECUTIVE_DAYS + 2)
        .select("score sentiment journalText createdAt");

      if (entries.length === 0) continue; // User hasn't logged any mood yet

      // Step 3: Run all 3 triggers independently
      const triggers = {
        streak:  isConsecutiveLowMoodStreak(entries),
        sadness: hasSadnessSpike(entries),
        keyword: hasJournalKeyword(entries),
      };

      const isFlagged = triggers.streak || triggers.sadness || triggers.keyword;

      if (!isFlagged) continue;

      // Step 4: Build reason string + collect for logging/SMS
      const reason = buildCrisisReasons(triggers);

      flaggedUsers.push({ user, reason, triggers });

      console.warn(
        `[CrisisService] ⚠️  CRISIS FLAG — User: ${user.name} (${user._id}) | Reason: ${reason}`
      );

      // ── Send SMS to trusted contact via Twilio ─────────────
      try {
        await sendCrisisSMS({
          toPhone:  user.trustedContact.phone,
          toName:   user.trustedContact.name,
          userName: user.name,
          reason,
        });
      } catch (smsErr) {
        // SMS failure should NOT stop us from checking other users
        console.error(
          `[CrisisService] SMS failed for ${user.name}: ${smsErr.message}`
        );
      }
    }

    // Summary log
    console.log(
      `[CrisisService] ✅ Check complete. ${flaggedUsers.length} / ${users.length} user(s) flagged.`
    );
  } catch (err) {
    // Don't crash the cron job — log and move on
    console.error("[CrisisService] ❌ Error during crisis check:", err.message);
  }
};

module.exports = { runCrisisCheck };
