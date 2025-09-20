import Feedback from "../models/Feedback.js";

// @desc Submit user feedback
export const submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const user = req.user; // From authMiddleware

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const newFeedback = await Feedback.create({
      userId: user.id,
      email: user.email,
      name: user.name,
      rating,
      feedback: feedback || "",
    });

    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("submitFeedback error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all feedback (for admin dashboard later)
export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error("getFeedbacks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};