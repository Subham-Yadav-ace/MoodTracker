// ─────────────────────────────────────────────────────────────────────────────
// twilio.service.js  (uses Twilio SDK)
//
// Sends a crisis alert SMS via Twilio.
// Works for any number worldwide, including Indian (+91) numbers.
//
// SETUP (one time):
//   1. Sign up at https://www.twilio.com/try-twilio (free trial gives ~$15)
//   2. Console → Account Info → copy Account SID & Auth Token
//   3. Get a Twilio phone number (free trial number works)
//   4. Add to .env:
//        TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//        TWILIO_AUTH_TOKEN=your_auth_token_here
//        TWILIO_FROM_NUMBER=+1xxxxxxxxxx   ← your Twilio number
//
// NOTE (free trial):
//   On a free trial account, you can only send SMS to numbers you have
//   verified in the Twilio console (Console → Verified Caller IDs).
//   Upgrade to a paid account to send to any number.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: getConfig()
// Validates all required env vars and returns an initialised Twilio client.
// ─────────────────────────────────────────────────────────────────────────────
const getConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "[Twilio] Missing env vars. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are set in .env"
    );
  }

  const twilio = require("twilio");
  const client = twilio(accountSid, authToken);

  return { client, fromNumber };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: normalizePhone(phone)
//
// Ensures the number is in E.164 format (+countrycode + number).
// Twilio requires E.164 format for the `to` field.
//
// Examples:
//   "9876543210"    → "+919876543210"  (assumes India if 10 digits)
//   "+919876543210" → "+919876543210"  (already correct)
//   "919876543210"  → "+919876543210"  (adds leading +)
// ─────────────────────────────────────────────────────────────────────────────
const normalizePhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, ""); // strip spaces

  if (cleaned.startsWith("+")) return cleaned;          // already E.164
  if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`; // 91XXXXXXXXXX
  if (cleaned.length === 10) return `+91${cleaned}`;   // bare 10-digit → assume India
  return `+${cleaned}`;                                  // best-effort fallback
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: buildSMSBody({ toName, userName, reason })
//
// Builds the SMS text sent to the trusted contact.
// Keep it under 160 chars to avoid multi-segment billing.
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
// Twilio SDK call:
//   client.messages.create({
//     body: <text>,
//     from: <your Twilio number>,
//     to:   <recipient in E.164>,
//   })
//
// @param  {string}  toPhone   — trusted contact's number (any format)
// @param  {string}  toName    — trusted contact's name
// @param  {string}  userName  — the at-risk user's name
// @param  {string}  reason    — human-readable crisis reason
//
// @returns {Promise<{ success: boolean, sid: string }>}
// @throws  {Error}  if config missing or Twilio API call fails
// ─────────────────────────────────────────────────────────────────────────────
const sendCrisisSMS = async ({ toPhone, toName, userName, reason }) => {
  // ── Guard: all fields required ──────────────────────────────────────────
  if (!toPhone || !toName || !userName || !reason) {
    throw new Error(
      `[Twilio] Missing required fields. Got: toPhone=${toPhone}, toName=${toName}, userName=${userName}`
    );
  }

  const { client, fromNumber } = getConfig();
  const body = buildSMSBody({ toName, userName, reason });
  const to   = normalizePhone(toPhone);

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });

    console.log(
      `[Twilio] ✅ SMS sent to ${toName} (${to}) — SID: ${message.sid} | Status: ${message.status}`
    );

    return { success: true, sid: message.sid };

  } catch (err) {
    const code = err.code; // Twilio error codes: https://www.twilio.com/docs/api/errors

    if (code === 20003) {
      console.error("[Twilio] ❌ Authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    } else if (code === 21211) {
      console.error(`[Twilio] ❌ Invalid 'to' phone number: ${to}`);
    } else if (code === 21608) {
      console.error(
        `[Twilio] ❌ Number ${to} is not verified. On a free trial account, ` +
        "verify the number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
      );
    } else if (code === 21614) {
      console.error("[Twilio] ❌ 'To' number is not a mobile number capable of receiving SMS.");
    } else {
      console.error(`[Twilio] ❌ Failed (code ${code}): ${err.message}`);
    }

    throw err; // Re-throw → crisis.service.js catches and continues to next user
  }
};

module.exports = { sendCrisisSMS };
