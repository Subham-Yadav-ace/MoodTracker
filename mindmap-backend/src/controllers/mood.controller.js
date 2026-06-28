const { validationResult } = require("express-validator");
const MoodEntry = require("../models/MoodEntry");
const { analyzeSentiment } = require("../services/sentiment.service");
const { checkDivergence } = require("../services/divergence.service");

// ── Helpers ──────────────────────────────────────────────────

/** Top item (by count) from an array of { _id, count } */
const topItem = (arr) => (arr && arr.length > 0 ? arr[0]._id : null);

/** Build insight strings from aggregated data */
const buildInsights = (stats, streak) => {
  const insights = [];

  const avg = stats.averageScore[0]?.avg;
  if (avg != null) {
    if (avg >= 7) insights.push(`Great month! Your average mood score is ${avg.toFixed(1)}/10 — keep up the positive habits.`);
    else if (avg >= 5) insights.push(`Your average mood score is ${avg.toFixed(1)}/10. Small daily wins can help move this up.`);
    else insights.push(`Your average mood score is ${avg.toFixed(1)}/10. It's been a tough stretch — consider reaching out for support.`);
  }

  if (streak >= 7) insights.push(`🔥 ${streak}-day logging streak! Consistency is the foundation of self-awareness.`);
  else if (streak >= 3) insights.push(`${streak} days in a row — you're building a healthy habit. Keep it going!`);

  const topEmotion = stats.emotionFrequency[0];
  if (topEmotion) {
    insights.push(`Your most frequent emotion this period was "${topEmotion._id}" (${topEmotion.count}x). Awareness is the first step.`);
  }

  const topTrigger = stats.triggerFrequency[0];
  if (topTrigger) {
    const label = topTrigger._id.replace(/_/g, " ");
    insights.push(`"${label}" was your most common mood trigger. Tracking patterns helps you respond rather than react.`);
  }

  const divergenceTotal = stats.divergenceCount[0]?.total || 0;
  if (divergenceTotal > 0) {
    insights.push(`${divergenceTotal} entry${divergenceTotal > 1 ? "ies" : ""} showed a divergence between your score and writing tone — your journal reveals what numbers sometimes hide.`);
  }

  return insights;
};

// ────────────────────────────────────────────────────────────
// @route   POST /api/mood
// @access  Private
// @desc    Create a mood entry — runs sentiment analysis + divergence check
// ────────────────────────────────────────────────────────────
const createMoodEntry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { score, emotionTags, triggers, journalText } = req.body;

    if (!journalText || journalText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Journal text is required for mood analysis.",
      });
    }

    const sentiment = await analyzeSentiment(journalText.trim());
    const divergenceFlag = checkDivergence(score, sentiment.label);

    const entry = await MoodEntry.create({
      userId: req.user.userId,
      score,
      emotionTags: emotionTags || [],
      triggers:    triggers    || [],
      journalText: journalText.trim(),
      sentiment,
      divergenceFlag,
    });

    res.status(201).json({
      success: true,
      message: divergenceFlag
        ? "Mood logged. We noticed something — your words and score seem different. Take care of yourself. 💙"
        : "Mood logged successfully.",
      data: entry,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   GET /api/mood
// @access  Private
// @desc    Get all mood entries (paginated, newest first)
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
// @route   GET /api/mood/week
// @access  Private
// @desc    Last 7 days entries + weekly stats
// ────────────────────────────────────────────────────────────
const getWeekEntries = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [entries, prevWeekEntries] = await Promise.all([
      MoodEntry.find({ userId, createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .lean(),
      MoodEntry.find({
        userId,
        createdAt: { $gte: prevWeekStart, $lt: sevenDaysAgo },
      })
        .select("score")
        .lean(),
    ]);

    const avgScore = entries.length
      ? parseFloat((entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(2))
      : null;

    const prevWeekAvg = prevWeekEntries.length
      ? parseFloat((prevWeekEntries.reduce((s, e) => s + e.score, 0) / prevWeekEntries.length).toFixed(2))
      : null;

    // Top emotion tag (manual count)
    const emotionCount = {};
    const triggerCount = {};
    entries.forEach((e) => {
      (e.emotionTags || []).forEach((t) => { emotionCount[t] = (emotionCount[t] || 0) + 1; });
      (e.triggers    || []).forEach((t) => { triggerCount[t] = (triggerCount[t] || 0) + 1; });
    });
    const topEmotion = Object.keys(emotionCount).sort((a, b) => emotionCount[b] - emotionCount[a])[0] || null;
    const topTrigger = Object.keys(triggerCount).sort((a, b) => triggerCount[b] - triggerCount[a])[0] || null;

    res.status(200).json({
      success: true,
      entries,
      stats: {
        averageScore: avgScore,
        topEmotion,
        topTrigger,
        prevWeekAvg,
        entryCount: entries.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   GET /api/mood/month
// @access  Private
// @desc    Last 30 days entries + monthly stats
// ────────────────────────────────────────────────────────────
const getMonthEntries = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const prevMonthStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [entries, prevMonthEntries] = await Promise.all([
      MoodEntry.find({ userId, createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: -1 })
        .lean(),
      MoodEntry.find({
        userId,
        createdAt: { $gte: prevMonthStart, $lt: thirtyDaysAgo },
      })
        .select("score")
        .lean(),
    ]);

    const avgScore = entries.length
      ? parseFloat((entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(2))
      : null;

    const prevMonthAvg = prevMonthEntries.length
      ? parseFloat((prevMonthEntries.reduce((s, e) => s + e.score, 0) / prevMonthEntries.length).toFixed(2))
      : null;

    const emotionCount = {};
    const triggerCount = {};
    entries.forEach((e) => {
      (e.emotionTags || []).forEach((t) => { emotionCount[t] = (emotionCount[t] || 0) + 1; });
      (e.triggers    || []).forEach((t) => { triggerCount[t] = (triggerCount[t] || 0) + 1; });
    });
    const topEmotion = Object.keys(emotionCount).sort((a, b) => emotionCount[b] - emotionCount[a])[0] || null;
    const topTrigger = Object.keys(triggerCount).sort((a, b) => triggerCount[b] - triggerCount[a])[0] || null;

    res.status(200).json({
      success: true,
      entries,
      stats: {
        averageScore: avgScore,
        topEmotion,
        topTrigger,
        prevWeekAvg: prevMonthAvg, // reuse key so Dashboard/Analytics work uniformly
        entryCount: entries.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   GET /api/mood/:id
// @access  Private
// ────────────────────────────────────────────────────────────
const getMoodEntryById = async (req, res, next) => {
  try {
    const entry = await MoodEntry.findOne({
      _id:    req.params.id,
      userId: req.user.userId,
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
// @desc    Analytics — aggregated stats + generated insight strings (last 30 days)
// ────────────────────────────────────────────────────────────
const getMoodInsights = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [stats] = await MoodEntry.aggregate([
      {
        $match: {
          userId:    new (require("mongoose").Types.ObjectId)(userId),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $facet: {
          averageScore: [
            { $group: { _id: null, avg: { $avg: "$score" }, count: { $sum: 1 } } },
          ],
          emotionFrequency: [
            { $unwind: "$emotionTags" },
            { $group: { _id: "$emotionTags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          triggerFrequency: [
            { $unwind: "$triggers" },
            { $group: { _id: "$triggers", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          aiEmotionDistribution: [
            { $match: { "sentiment.emotion": { $ne: null } } },
            { $group: { _id: "$sentiment.emotion", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          divergenceCount: [
            { $match: { divergenceFlag: true } },
            { $count: "total" },
          ],
          dayOfWeekPattern: [
            {
              $group: {
                _id: { $dayOfWeek: "$createdAt" },
                avgScore: { $avg: "$score" },
                count:    { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Streak calculation
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

    const avgData = stats.averageScore[0];

    res.status(200).json({
      success: true,
      // Flat structure so frontend can do `insights.streak`, `insights.insights`, etc.
      streak,
      totalEntries:          avgData?.count || 0,
      averageScore:          avgData ? parseFloat(avgData.avg.toFixed(2)) : null,
      divergenceCount:       stats.divergenceCount[0]?.total || 0,
      emotionFrequency:      stats.emotionFrequency,
      triggerFrequency:      stats.triggerFrequency,
      aiEmotionDistribution: stats.aiEmotionDistribution,
      dayOfWeekPattern:      stats.dayOfWeekPattern,
      // Generated insight strings for InsightCard
      insights: buildInsights(stats, streak),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMoodEntry,
  getMoodEntries,
  getWeekEntries,
  getMonthEntries,
  getMoodEntryById,
  deleteMoodEntry,
  getMoodInsights,
};
