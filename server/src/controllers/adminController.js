import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Feedback from "../models/Feedback.js";
import jwt from "jsonwebtoken";

// Hardcoded security answers
const SECRET_CODE = "123456";
const FAVORITE_COLOR = "Black";
const FAVORITE_CHARACTER = "Harry Potter";

// Generate admin JWT token
const generateAdminToken = (id) => {
  return jwt.sign({ adminId: id }, process.env.JWT_SECRET_ADMIN, {
    expiresIn: "7d",
  });
};

// @desc Login admin
export const loginAdmin = async (req, res) => {
  try {
    const { name, email, favoriteColor, favoriteCharacter, secretCode } = req.body;

    if (!name || !email || !favoriteColor || !favoriteCharacter || !secretCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (
      favoriteColor !== FAVORITE_COLOR ||
      favoriteCharacter !== FAVORITE_CHARACTER ||
      secretCode !== SECRET_CODE
    ) {
      return res.status(401).json({ message: "Invalid security answers" });
    }

    let admin = await Admin.findOne({ email });
    if (!admin) {
      admin = await Admin.create({ name, email });
    } else {
      admin.name = name; // Update name if changed
      await admin.save();
    }

    const token = generateAdminToken(admin._id);
    res.json({ token, name: admin.name, email: admin.email });
  } catch (error) {
    console.error("loginAdmin error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get admin dashboard data
export const getDashboardData = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // Active users (last login within 30 days)
    const activeUsers = await User.find({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).select("name email lastLogin");

    // User subscriptions
    const subscriptions = await Subscription.find()
      .populate("userId", "name email")
      .select("plan amount startDate endDate orderId");

    // User feedback
    const feedbacks = await Feedback.find()
      .populate("userId", "name email")
      .select("userId name email rating feedback createdAt")
      .sort({ createdAt: -1 });

    // Log raw feedback data before formatting
    console.log("Raw feedbacks from database in getDashboardData:", JSON.stringify(feedbacks.map(fb => ({
      _id: fb._id.toString(),
      userId: fb.userId ? { _id: fb.userId._id.toString(), name: fb.userId.name, email: fb.userId.email } : null,
      name: fb.name,
      email: fb.email,
      rating: fb.rating,
      feedback: fb.feedback,
      createdAt: fb.createdAt
    }), null, 2)));

    // Format feedbacks to prioritize stored name and email
    const formattedFeedbacks = feedbacks.map((fb) => {
      const feedbackData = {
        _id: fb._id,
        userId: fb.userId ? { _id: fb.userId._id, name: fb.userId.name, email: fb.userId.email } : null,
        name: fb.name || fb.userId?.name || "N/A",
        email: fb.email || fb.userId?.email || "N/A",
        rating: fb.rating,
        feedback: fb.feedback,
        createdAt: fb.createdAt,
      };
      console.log("Formatted feedback for response:", JSON.stringify(feedbackData, null, 2));
      return feedbackData;
    });

    // Log final response data
    console.log("Final dashboard response (feedbacks only):", JSON.stringify(formattedFeedbacks, null, 2));

    res.json({
      totalUsers,
      activeUsers,
      subscriptions,
      feedbacks: formattedFeedbacks,
      upcomingExpirations: await Subscription.find({
        endDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      })
        .populate("userId", "name email")
        .select("plan endDate")
        .sort({ endDate: 1 }),
    });
  } catch (error) {
    console.error("getDashboardData error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};