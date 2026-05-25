const { validationResult } = require("express-validator");
const MoodEntry = require("../models/MoodEntry");
const { analyzeSentiment } = require("../services/sentiment.service");
const { checkDivergence } = require("../services/divergence.service");

// ────────────────────────────────────────────────────────────
// @route   POST /api/mood
// @access  Private
// @desc    Create a mood entry — runs sentiment analysis + divergence check
// ────────────────────────────────────────────────────────────
const createMoodEntry = async (req, res, next) => {
  try {
    // ── 1. Validate input ──────────────────────────────────
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { score, emotionTags, triggers, journalText } = req.body;

    // journalText is required (confirmed by user — needed for sentiment)
    if (!journalText || journalText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Journal text is required for mood analysis.",
      });
    }

    // ── 2. Run HuggingFace sentiment analysis ──────────────
    // NOTE: throws if API is down (per design choice — don't save without sentiment)
    const sentiment = await analyzeSentiment(journalText.trim());

    // ── 3. Check divergence (pure function) ───────────────
    const divergenceFlag = checkDivergence(score, sentiment.label);

    // ── 4. Save to DB ─────────────────────────────────────
    const entry = await MoodEntry.create({
      userId: req.user.userId,
      score,
      emotionTags: emotionTags || [],
      triggers:    triggers    || [],
      journalText: journalText.trim(),
      sentiment,
      divergenceFlag,
    });

    // ── 5. Respond ────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: divergenceFlag
        ? "Mood logged. We noticed something — your words and score seem different. Take care of yourself. 💙"
        : "Mood logged successfully.",
      data: entry,
    });
  } catch (err) {
    // Surface HuggingFace service errors with their statusCode (503)
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   GET /api/mood
// @access  Private
// @desc    Get all mood entries for the logged-in user (paginated, newest first)
// ────────────────────────────────────────────────────────────
const getMoodEntries = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      MoodEntry.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MoodEntry.countDocuments({ userId: req.user.userId }),
    ]);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   GET /api/mood/:id
// @access  Private
// @desc    Get a single mood entry (must belong to logged-in user)
// ────────────────────────────────────────────────────────────
const getMoodEntryById = async (req, res, next) => {
  try {
    const entry = await MoodEntry.findOne({
      _id:    req.params.id,
      userId: req.user.userId, // ← prevents accessing other users' entries
    }).lean();

    if (!entry) {
      return res.status(404).json({ success: false, message: "Mood entry not found." });
    }

    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   DELETE /api/mood/:id
// @access  Private
// @desc    Delete a mood entry (must belong to logged-in user)
// ────────────────────────────────────────────────────────────
const deleteMoodEntry = async (req, res, next) => {
  try {
    const entry = await MoodEntry.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user.userId,
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Mood entry not found." });
    }

    res.status(200).json({ success: true, message: "Mood entry deleted." });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   GET /api/mood/insights
// @access  Private
// @desc    Analytics — avg score, emotion frequency, trigger heatmap,
//          streak counter, divergence count (last 30 days)
// ────────────────────────────────────────────────────────────
const getMoodInsights = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Aggregation pipeline ───────────────────────────────
    const [stats] = await MoodEntry.aggregate([
      {
        $match: {
          userId:    new (require("mongoose").Types.ObjectId)(userId),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $facet: {
          // Average mood score
          
          averageScore: [
            { $group: { _id: null, avg: { $avg: "$score" }, count: { $sum: 1 } } },
          ],

          // Emotion tag frequency (how often each tag appears)
          emotionFrequency: [
            { $unwind: "$emotionTags" },
            { $group: { _id: "$emotionTags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // Trigger frequency (what causes mood changes)
          triggerFrequency: [
            { $unwind: "$triggers" },
            { $group: { _id: "$triggers", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // AI emotion distribution
          aiEmotionDistribution: [
            { $match: { "sentiment.emotion": { $ne: null } } },
            { $group: { _id: "$sentiment.emotion", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],

          // Divergence count
          divergenceCount: [
            { $match: { divergenceFlag: true } },
            { $count: "total" },
          ],

          // Day-of-week mood pattern
          dayOfWeekPattern: [
            {
              $group: {
                _id: { $dayOfWeek: "$createdAt" }, // 1=Sun, 7=Sat
                avgScore: { $avg: "$score" },
                count:    { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // ── Streak counter (consecutive days with entries) ─────
    const recentEntries = await MoodEntry.find({ userId })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();

    let streak = 0;
    if (recentEntries.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let checkDate = new Date(today);
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

    // ── Build response ─────────────────────────────────────
    const avgData = stats.averageScore[0];

    res.status(200).json({
      success: true,
      data: {
        period:              "Last 30 days",
        totalEntries:        avgData?.count          || 0,
        averageScore:        avgData ? parseFloat(avgData.avg.toFixed(2)) : null,
        streak:              streak,
        divergenceCount:     stats.divergenceCount[0]?.total || 0,
        emotionFrequency:    stats.emotionFrequency,
        triggerFrequency:    stats.triggerFrequency,
        aiEmotionDistribution: stats.aiEmotionDistribution,
        dayOfWeekPattern:    stats.dayOfWeekPattern,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMoodEntry,
  getMoodEntries,
  getMoodEntryById,
  deleteMoodEntry,
  getMoodInsights,
};
