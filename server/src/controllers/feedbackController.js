import Feedback from "../models/Feedback.js";

// @desc Submit user feedback
export const submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const user = req.user; // From authMiddleware

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    console.log("Submitting feedback for user:", JSON.stringify({ id: user.id, name: user.name, email: user.email }, null, 2));

    const newFeedback = await Feedback.create({
      userId: user.id,
      email: user.email,
      name: user.name,
      rating,
      feedback: feedback || "",
    });

    console.log("Created feedback:", JSON.stringify(newFeedback, null, 2));

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
      .select("userId name email rating feedback createdAt")
      .sort({ createdAt: -1 });

    console.log("Raw feedbacks from getFeedbacks:", JSON.stringify(feedbacks.map(fb => ({
      _id: fb._id.toString(),
      userId: fb.userId ? { _id: fb.userId._id.toString(), name: fb.userId.name, email: fb.userId.email } : null,
      name: fb.name,
      email: fb.email,
      rating: fb.rating,
      feedback: fb.feedback,
      createdAt: fb.createdAt
    }), null, 2)));

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
      console.log("Formatted feedback:", JSON.stringify(feedbackData, null, 2));
      return feedbackData;
    });

    res.json(formattedFeedbacks);
  } catch (error) {
    console.error("getFeedbacks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};