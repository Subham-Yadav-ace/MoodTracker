// ─────────────────────────────────────────────────────────────────────────────
// twilio.service.js  (uses Fast2SMS — Indian SMS API)
//
// Sends a crisis alert SMS via Fast2SMS REST API.
// Works for any Indian mobile number. No DLT registration needed for dev.
// ₹50 free credits on signup (~250 SMS).
//
// SETUP (one time):
//   1. Sign up at https://www.fast2sms.com
//   2. Dashboard → Dev API → copy your API Key
//   3. Add to .env:
//        FAST2SMS_API_KEY=your_api_key_here
//
// API docs: https://docs.fast2sms.com
//
// NOTE: Works only for Indian numbers (+91xxxxxxxxxx).
//       For international numbers, switch to a global provider.
// ─────────────────────────────────────────────────────────────────────────────

const axios = require("axios");

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: getConfig()
// Validates the required env var.
// ─────────────────────────────────────────────────────────────────────────────
const getConfig = () => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    throw new Error("[Fast2SMS] Missing FAST2SMS_API_KEY in environment.");
  }

  return { apiKey };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: sanitizePhone(phone)
//
// Fast2SMS expects the number WITHOUT the country code prefix.
// Strips +91 or 91 from the start if present.
//
// Examples:
//   "+919876543210" → "9876543210"
//   "919876543210"  → "9876543210"
//   "9876543210"    → "9876543210"  (already clean)
// ─────────────────────────────────────────────────────────────────────────────
const sanitizePhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, "");          // remove spaces
  if (cleaned.startsWith("+91")) return cleaned.slice(3);
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned.slice(2);
  return cleaned;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: buildSMSBody({ toName, userName, reason })
//
// Builds the SMS text. Fast2SMS has a 160 char limit per segment.
// ─────────────────────────────────────────────────────────────────────────────
const buildSMSBody = ({ toName, userName, reason }) => {
  return (
    `Hi ${toName}, MindMap alert: ${userName} may need support right now. ` +
    `Reason: ${reason}. Please check in with them.`
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: sendCrisisSMS({ toPhone, toName, userName, reason })
//
// Called by crisis.service.js when a user is flagged.
//
// Fast2SMS API call:
//   POST https://www.fast2sms.com/dev/bulkV2
//   Headers: authorization: <api_key>
//   Body (form):
//     route=q               → "Quick Transactional" route (no template needed)
//     message=<text>        → your SMS body
//     numbers=9876543210    → recipient (10-digit, no country code)
//
// @param  {string}  toPhone   — trusted contact's number ("+919876543210" or "9876543210")
// @param  {string}  toName    — trusted contact's name
// @param  {string}  userName  — the at-risk user's name
// @param  {string}  reason    — human-readable crisis reason
//
// @returns {Promise<{ success: boolean, message: string }>}
// @throws  {Error}  if config missing or API call fails
// ─────────────────────────────────────────────────────────────────────────────
const sendCrisisSMS = async ({ toPhone, toName, userName, reason }) => {
  // ── Guard: all fields required ────────────────────────────────────────────
  if (!toPhone || !toName || !userName || !reason) {
    throw new Error(
      `[Fast2SMS] Missing required fields. Got: toPhone=${toPhone}, toName=${toName}, userName=${userName}`
    );
  }

  const { apiKey } = getConfig();
  const message    = buildSMSBody({ toName, userName, reason });
  const numbers    = sanitizePhone(toPhone); // Fast2SMS needs 10-digit number

  try {
    const response = await axios.post(
      FAST2SMS_URL,
      {
        route:   "q",       // Quick route — no pre-approved template needed
        message,
        numbers,            // 10-digit Indian mobile number
        flash:   0,         // 0 = regular SMS, 1 = flash SMS (pops up on screen)
      },
      {
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15s
      }
    );

    if (response.data?.return === true) {
      console.log(
        `[Fast2SMS] ✅ SMS sent to ${toName} (${numbers}) — Request ID: ${response.data?.request_id}`
      );
      return { success: true, message: response.data?.message?.[0] || "Sent" };
    } else {
      throw new Error(response.data?.message || "Fast2SMS returned failure");
    }

  } catch (err) {
    const status  = err.response?.status;
    const errData = err.response?.data;

    if (status === 401) {
      console.error("[Fast2SMS] ❌ Invalid API key. Check FAST2SMS_API_KEY in .env");
    } else if (status === 400) {
      console.error("[Fast2SMS] ❌ Bad request:", errData);
    } else if (err.code === "ECONNABORTED") {
      console.error("[Fast2SMS] ❌ Request timed out.");
    } else {
      console.error(`[Fast2SMS] ❌ Failed: ${err.message}`);
    }

    throw err; // Re-throw → crisis.service.js logs and continues to next user
  }
};

module.exports = { sendCrisisSMS };
