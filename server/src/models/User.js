import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
    },
recoveryCode: {
      type: String,
      required: false, // Set after signup
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
