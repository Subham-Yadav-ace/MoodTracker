// ─────────────────────────────────────────────────────────────────────────────
// twilio.service.js
//
// Sends an SMS to a user's trusted contact when a crisis is detected.
// Called by crisis.service.js after any trigger fires.
//
// Requires these env vars (already in .env):
//   TWILIO_ACCOUNT_SID   → your Twilio Account SID  (ACxxx...)
//   TWILIO_AUTH_TOKEN    → your Twilio Auth Token
//   TWILIO_PHONE_NUMBER  → your Twilio number (e.g. +1xxxxxxxxxx)
//
// HOW IT WORKS:
//   1. crisis.service.js detects a flagged user
//   2. Calls sendCrisisSMS({ toPhone, toName, userName, reason })
//   3. This file builds the message text and fires it via Twilio REST API
//   4. Returns { success: true, sid } or throws with a clear error message
// ─────────────────────────────────────────────────────────────────────────────

const twilio = require("twilio");

// ── Lazy-initialize the Twilio client ────────────────────────────────────────
// We initialize inside the function (not at module load time) so that:
//   - Missing env vars don't crash the server on startup
//   - Tests can stub the env vars without module-level side effects
const getClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "[TwilioService] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in environment."
    );
  }

  return twilio(accountSid, authToken);
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: buildSMSBody({ toName, userName, reason })
//
// Builds the human-readable SMS text sent to the trusted contact.
// Kept short — SMS messages should be under 160 characters when possible.
//
// Example output:
//   "Hi Priya, this is MindMap. Your contact Rahul may need support right now.
//    Reason: 3 consecutive low-mood days. Please check in with them. 💙"
//
// @param  {{ toName: string, userName: string, reason: string }}
// @returns {string}
// ─────────────────────────────────────────────────────────────────────────────
const buildSMSBody = ({ toName, userName, reason }) => {
  return (
    `Hi ${toName}, this is MindMap. ` +
    `Your contact ${userName} may need support right now.\n` +
    `Reason: ${reason}.\n` +
    `Please check in with them. 💙`
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: sendCrisisSMS({ toPhone, toName, userName, reason })
//
// Sends one SMS to the trusted contact.
//
// @param  {object}  opts
// @param  {string}  opts.toPhone   — trusted contact's phone (e.g. "+919876543210")
// @param  {string}  opts.toName    — trusted contact's name  (e.g. "Priya")
// @param  {string}  opts.userName  — the at-risk user's name (e.g. "Rahul")
// @param  {string}  opts.reason    — human-readable crisis reason from buildCrisisReasons()
//
// @returns {Promise<{ success: boolean, sid: string }>}
// @throws  {Error}  if env vars missing or Twilio API call fails
// ─────────────────────────────────────────────────────────────────────────────
const sendCrisisSMS = async ({ toPhone, toName, userName, reason }) => {
  // ── Guard: all fields are required ───────────────────────────────────────
  if (!toPhone || !toName || !userName || !reason) {
    throw new Error(
      "[TwilioService] sendCrisisSMS called with missing fields. " +
      `Received: toPhone=${toPhone}, toName=${toName}, userName=${userName}`
    );
  }

  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!fromPhone) {
    throw new Error("[TwilioService] Missing TWILIO_PHONE_NUMBER in environment.");
  }

  const client = getClient();
  const body   = buildSMSBody({ toName, userName, reason });

  try {
    const message = await client.messages.create({
      body,
      from: fromPhone,
      to:   toPhone,
    });

    console.log(
      `[TwilioService] ✅ SMS sent to ${toName} (${toPhone}) — SID: ${message.sid}`
    );

    return { success: true, sid: message.sid };

  } catch (err) {
    // Twilio errors have a .code and .message — log both for debugging
    console.error(
      `[TwilioService] ❌ Failed to send SMS to ${toPhone} — ` +
      `Code: ${err.code} | Message: ${err.message}`
    );

    // Re-throw so crisis.service.js can decide whether to continue or halt
    throw err;
  }
};

module.exports = { sendCrisisSMS };
