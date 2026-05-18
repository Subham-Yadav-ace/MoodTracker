const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries by default
    },
    trustedContact: {
      name: {
        type: String,
        trim: true,
        default: null,
      },
      phone: {
        type: String,
        trim: true,
        default: null,
        match: [/^\+?[1-9]\d{9,14}$/, "Enter valid phone number with country code"],
      },
    },
    refreshToken: {
      type: String,
      select: false, // Never returned in queries
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt
  }
);

// ── Pre-save hook: hash password before saving ──────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare passwords at login ─────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
