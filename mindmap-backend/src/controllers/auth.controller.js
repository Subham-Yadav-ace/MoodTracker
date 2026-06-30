const { validationResult } = require("express-validator");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  accessCookieOptions,
  refreshCookieOptions,
} = require("../utils/generateToken");

// ── Helper: send tokens as httpOnly cookies ──────────────────
const sendTokens = (res, user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  return refreshToken;
};

// ────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    // Create user (pre-save hook hashes password)
    const user = await User.create({ name, email, password });

    // Issue tokens
    const refreshToken = sendTokens(res, user);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Fetch user + password (select:false by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Issue tokens
    const refreshToken = sendTokens(res, user);

    // Rotate refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id:       user._id,
        name:      user.name,
        email:     user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   POST /api/auth/refresh
// @access  Public (uses httpOnly refreshToken cookie)
// ────────────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token provided." });
    }

    // Verify token signature
    const jwt = require("jsonwebtoken");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
    }

    // Match token with DB (rotation guard)
    const user = await User.findById(decoded.userId).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: "Refresh token reuse detected. Please log in again." });
    }

    // Issue new access token only
    const newAccessToken = generateAccessToken(user._id);
    res.cookie("accessToken", newAccessToken, accessCookieOptions);

    res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (err) {
    next(err);
  }
};

// ────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Private
// ────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Clear refresh token in DB
    await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });

    // Clear both cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout };
