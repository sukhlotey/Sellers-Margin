import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      maxLength: [20, "Name cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
       match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
       minLength: [8, "Password must be at least 8 characters"],
       match: [
        /^(?=.*[!@#$%^&*])/,
        "Password must contain at least one special character",
      ],
    },
   recoveryCode: {
      type: String,
      required: false, // Set after signup
    },
     lastResetSource: {
      type: String,
      enum: ["settings", "forgot-password", null],
      default: null,
    },
    lastLogin: {
    type: Date,
  },
    isSubscribed: { type: Boolean, default: false },
    plan: { type: String, enum: ["free","basic_monthly","all_monthly","annual"], default: "free" },
    planStart: { type: Date },
    planEnd: { type: Date },

    // Free usage tracking (5 free calculations)
    calcCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
