// ─────────────────────────────────────────────────────────────────────────────
// email.service.js
//
// Sends a weekly mood report email to every registered user via SendGrid.
// Called by the cron job in server.js every Sunday at 9 AM IST.
//
// Requires these env vars (add to .env):
//   SENDGRID_API_KEY  → from SendGrid dashboard → Settings → API Keys
//   EMAIL_FROM        → your verified sender address (noreply@yadavsubham.dev)
//
// WHAT THE EMAIL CONTAINS (last 7 days of data):
//   - Average mood score  (colour-coded: green/yellow/red)
//   - Total entries logged
//   - Logging streak (consecutive days)
//   - Top 3 emotion tags
//   - Top 3 triggers
//   - Divergence flag count (if any)
//   - Helpline numbers in footer
// ─────────────────────────────────────────────────────────────────────────────

const sgMail  = require("@sendgrid/mail");
const User    = require("../models/User");
const MoodEntry = require("../models/MoodEntry");

// ── Set the API key once at module load time ──────────────────────────────────
// SendGrid reads it from the env at require-time; will throw on first send if missing
const initSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("[EmailService] Missing SENDGRID_API_KEY in environment.");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("[EmailService] Missing EMAIL_FROM in environment.");
  }
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: getWeeklyStats(userId)
//
// Runs a MongoDB aggregation for the last 7 days and returns:
// {
//   totalEntries, averageScore, streak,
//   divergenceCount, topEmotions, topTriggers
// }
// ─────────────────────────────────────────────────────────────────────────────
const getWeeklyStats = async (userId) => {
  const mongoose     = require("mongoose");
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [stats] = await MoodEntry.aggregate([
    {
      $match: {
        userId:    new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id:             null,
              avg:             { $avg: "$score" },
              count:           { $sum: 1 },
              divergenceTotal: { $sum: { $cond: ["$divergenceFlag", 1, 0] } },
            },
          },
        ],
        emotionFrequency: [
          { $unwind: "$emotionTags" },
          { $group: { _id: "$emotionTags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 },
        ],
        triggerFrequency: [
          { $unwind: "$triggers" },
          { $group: { _id: "$triggers", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 3 },
        ],
      },
    },
  ]);

  // ── Streak: consecutive logged days ──────────────────────────────────────
  const recentEntries = await MoodEntry.find({ userId })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean();

  let streak = 0;
  if (recentEntries.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate  = new Date(today);
    const entryDates = new Set(
      recentEntries.map((e) => {
        const d = new Date(e.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      })
    );
    while (entryDates.has(checkDate.toISOString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  const summary = stats.summary[0];

  return {
    totalEntries:    summary?.count          || 0,
    averageScore:    summary ? parseFloat(summary.avg.toFixed(1)) : null,
    streak,
    divergenceCount: summary?.divergenceTotal || 0,
    topEmotions:     stats.emotionFrequency.map((e) => ({ tag: e._id, count: e.count })),
    topTriggers:     stats.triggerFrequency.map((t) => ({ tag: t._id, count: t.count })),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: buildEmailHTML({ name, stats })
// Builds the HTML body of the weekly report email.
// ─────────────────────────────────────────────────────────────────────────────
const buildEmailHTML = ({ name, stats }) => {
  const { totalEntries, averageScore, streak, divergenceCount, topEmotions, topTriggers } = stats;

  const scoreColor =
    averageScore === null ? "#888888"
    : averageScore >= 7  ? "#22c55e"
    : averageScore >= 4  ? "#f59e0b"
    :                      "#ef4444";

  const emotionHTML =
    topEmotions.length > 0
      ? topEmotions.map((e) => `<li><b>${e.tag}</b> — ${e.count} time${e.count > 1 ? "s" : ""}</li>`).join("")
      : "<li>No emotion tags logged this week.</li>";

  const triggerHTML =
    topTriggers.length > 0
      ? topTriggers.map((t) => `<li><b>${t.tag.replace(/_/g, " ")}</b> — ${t.count} time${t.count > 1 ? "s" : ""}</li>`).join("")
      : "<li>No triggers logged this week.</li>";

  const divergenceNote =
    divergenceCount > 0
      ? `<p style="color:#f59e0b;margin-top:16px;">⚠️ We noticed <b>${divergenceCount}</b> instance${divergenceCount > 1 ? "s" : ""} where your mood score and journal tone didn't quite match. It's okay — just something to reflect on. 💙</p>`
      : "";

  // ── No entries this week ──────────────────────────────────────────────────
  if (totalEntries === 0) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#6366f1;">Your MindMap Weekly Report 🧠</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>You didn't log any mood entries this week. That's okay — life gets busy.</p>
        <p>Try logging even a quick entry this week. Consistency is what makes MindMap most helpful for you. 🌱</p>
        <p style="color:#6b7280;font-size:13px;margin-top:32px;">
          Need support? <b>iCall — 9152987821</b> | <b>Vandrevala Foundation — 1860-2662-345</b>
        </p>
      </div>
    `;
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">

      <h2 style="color:#6366f1;">Your MindMap Weekly Report 🧠</h2>
      <p>Hi <b>${name}</b>, here's how your week looked:</p>

      <!-- Stats Row -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          <td style="width:33%;padding:4px;">
            <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <p style="margin:0;font-size:12px;color:#6b7280;">Avg Mood Score</p>
              <p style="margin:4px 0 0;font-size:30px;font-weight:bold;color:${scoreColor};">
                ${averageScore !== null ? averageScore : "—"}<span style="font-size:14px;">/10</span>
              </p>
            </div>
          </td>
          <td style="width:33%;padding:4px;">
            <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <p style="margin:0;font-size:12px;color:#6b7280;">Entries Logged</p>
              <p style="margin:4px 0 0;font-size:30px;font-weight:bold;color:#6366f1;">${totalEntries}</p>
            </div>
          </td>
          <td style="width:33%;padding:4px;">
            <div style="background:#fff;border-radius:8px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <p style="margin:0;font-size:12px;color:#6b7280;">🔥 Streak</p>
              <p style="margin:4px 0 0;font-size:30px;font-weight:bold;color:#f59e0b;">${streak}d</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- Emotions -->
      <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 8px;color:#374151;font-size:15px;">Top Emotions This Week</h3>
        <ul style="margin:0;padding-left:20px;color:#374151;">${emotionHTML}</ul>
      </div>

      <!-- Triggers -->
      <div style="background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 8px;color:#374151;font-size:15px;">Top Triggers This Week</h3>
        <ul style="margin:0;padding-left:20px;color:#374151;">${triggerHTML}</ul>
      </div>

      ${divergenceNote}

      <p style="margin-top:24px;">Keep going — every entry is a step toward understanding yourself better. 🌱</p>

      <p style="color:#6b7280;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">
        Sent by MindMap · noreply@yadavsubham.dev<br>
        Need support? <b>iCall — 9152987821</b> | <b>Vandrevala Foundation — 1860-2662-345</b>
      </p>

    </div>
  `;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: sendWeeklyReports()
//
// Called by the Sunday 9 AM cron job in server.js.
// Sends one HTML email per user via SendGrid.
// ─────────────────────────────────────────────────────────────────────────────
const sendWeeklyReports = async () => {
  console.log("[EmailService] 📧 Starting weekly report emails via SendGrid...");

  try {
    initSendGrid();
  } catch (err) {
    console.error("[EmailService] ❌ SendGrid init failed:", err.message);
    return;
  }

  try {
    const users = await User.find({}).select("_id name email");

    if (users.length === 0) {
      console.log("[EmailService] No users found. Skipping.");
      return;
    }

    console.log(`[EmailService] Sending to ${users.length} user(s)...`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const stats = await getWeeklyStats(user._id.toString());
        const html  = buildEmailHTML({ name: user.name, stats });

        await sgMail.send({
          to:      user.email,
          from:    process.env.EMAIL_FROM,        // noreply@yadavsubham.dev
          subject: `Your MindMap Weekly Report 🧠 — ${new Date().toLocaleDateString("en-IN", {
            weekday: "long", month: "long", day: "numeric",
          })}`,
          html,
        });

        console.log(`[EmailService] ✅ Sent to ${user.name} (${user.email})`);
        sent++;

      } catch (err) {
        // One failure must NOT stop the rest
        console.error(
          `[EmailService] ❌ Failed for ${user.name} (${user.email}): ${err.message}`
        );
        failed++;
      }
    }

    console.log(`[EmailService] ✅ Done. Sent: ${sent} | Failed: ${failed} | Total: ${users.length}`);

  } catch (err) {
    console.error("[EmailService] ❌ Fatal error:", err.message);
  }
};

module.exports = { sendWeeklyReports };
