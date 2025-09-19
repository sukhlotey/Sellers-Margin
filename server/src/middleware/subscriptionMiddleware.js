import User from "../models/User.js";
import Subscription from "../models/Subscription.js";

export const enforceFreeLimit = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const userId = req.user._id;
    const user = await User.findById(userId);

    // 1) If user has active subscription and not expired → allow
    if (user.isSubscribed && user.planEnd && new Date(user.planEnd) > new Date()) {
      return next();
    }

    // 2) Otherwise check calcCount (free limit = 5)
    if (!user.calcCount || user.calcCount < 5) {
      // allow and increment on successful calculate (we'll increment in controller after calculation)
      return next();
    }

    // more than 5 → block
    return res.status(402).json({
      message: "Free limit reached. Please subscribe to continue. Visit /pricing or call /api/subscription/status",
    });
  } catch (err) {
    console.error("enforceFreeLimit error:", err);
    return res.status(500).json({ message: "Subscription check failed" });
  }
};
