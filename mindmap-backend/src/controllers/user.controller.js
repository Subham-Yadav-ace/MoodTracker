const { validationResult } = require("express-validator");
const User = require("../models/User");
const MoodEntry = require("../models/MoodEntry");

// ────────────────────────────────────────────────────────────
// @route   GET /api/user/profile
// @access  Private
// ────────────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const totalEntries = await MoodEntry.countDocuments({ userId: req.user.userId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        while (
          i + 1 < entries.length &&
          new Date(entries[i + 1].createdAt).setHours(0, 0, 0, 0) === entryDate.getTime()
        ) {
          i++;
        }
      } else if (entryDate.getTime() < checkDate.getTime()) {
        break;
      }
    }

    res.status(200).json({
      success: true,
      user: {
        _id:           user._id,
        name:          user.name,
        email:         user.email,
        trustedContact: user.trustedContact,
        createdAt:     user.createdAt,
        updatedAt:     user.updatedAt,
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
// ────────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email } = req.body;

    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "Email is already in use by another account." });
      }
    }

    const updateFields = {};
    if (name)  updateFields.name  = name.trim();
    if (email) updateFields.email = email.toLowerCase().trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id:           updatedUser._id,
        name:          updatedUser.name,
        email:         updatedUser.email,
        trustedContact: updatedUser.trustedContact,
        updatedAt:     updatedUser.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   PUT /api/user/trusted-contact
// @access  Private
// ────────────────────────────────────────────────────────────
const updateTrustedContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          "trustedContact.name":  name.trim(),
          "trustedContact.phone": phone.trim(),
        },
      },
      { returnDocument: "after", runValidators: true }
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
// ────────────────────────────────────────────────────────────
const removeTrustedContact = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          "trustedContact.name":  null,
          "trustedContact.phone": null,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Trusted contact removed successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   DELETE /api/user/profile
// @access  Private
// @desc    Permanently delete user account and all associated mood entries
// ────────────────────────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Delete all mood entries first
    await MoodEntry.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Clear auth cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    res.status(200).json({
      success: true,
      message: "Account and all associated data permanently deleted.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateTrustedContact,
  removeTrustedContact,
  deleteAccount,
};
