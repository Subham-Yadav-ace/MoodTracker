const { validationResult } = require("express-validator");
const User = require("../models/User");
const MoodEntry = require("../models/MoodEntry");

// ────────────────────────────────────────────────────────────
// @route   GET /api/user/profile
// @access  Private
// @desc    Get the logged-in user's full profile + account stats
// ────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // ── Account stats: total entries + streak ───────────────
    const totalEntries = await MoodEntry.countDocuments({ userId: req.user.userId });

    // Current streak: count consecutive days (from today backwards) that have ≥1 entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch entries sorted newest → oldest to calculate streak
    const entries = await MoodEntry.find({ userId: req.user.userId })
      .select("createdAt")
      .sort({ createdAt: -1 })
      .lean();

    let streak = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].createdAt);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate.getTime() === checkDate.getTime()) {
        // Entry matches the day we're checking
        streak++;
        // Move check date back one day
        checkDate.setDate(checkDate.getDate() - 1);
        // Skip remaining entries on the same day
        while (
          i + 1 < entries.length &&
          new Date(entries[i + 1].createdAt).setHours(0, 0, 0, 0) === entryDate.getTime()
        ) {
          i++;
        }
      } else if (entryDate.getTime() < checkDate.getTime()) {
        // Gap found — streak is broken
        break;
      }
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        trustedContact: user.trustedContact,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: {
        totalEntries,
        currentStreak: streak,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   PUT /api/user/profile
// @access  Private
// @desc    Update name and/or email
// ────────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email } = req.body;

    // If email is being changed, ensure it's not already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email is already in use by another account." });
      }
    }

    // Build update object — only include provided fields
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.toLowerCase().trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        trustedContact: updatedUser.trustedContact,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   PUT /api/user/trusted-contact
// @access  Private
// @desc    Set or update trusted contact (name + phone)
//          Used by crisis detection to send SMS alerts
// ────────────────────────────────────────────────────────────
const updateTrustedContact = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          "trustedContact.name": name.trim(),
          "trustedContact.phone": phone.trim(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Trusted contact updated successfully",
      trustedContact: updatedUser.trustedContact,
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   DELETE /api/user/trusted-contact
// @access  Private
// @desc    Remove trusted contact (sets both fields to null)
// ────────────────────────────────────────────────────────────
const removeTrustedContact = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          "trustedContact.name": null,
          "trustedContact.phone": null,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Trusted contact removed successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, updateTrustedContact, removeTrustedContact };
