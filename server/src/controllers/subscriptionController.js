import razorpay from "../utiles/paymentGateway.js";
import crypto from "crypto";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ message: "Plan is required" });

    let amountRs;
    if (plan === "basic_monthly") amountRs = 399;
    else if (plan === "all_monthly") amountRs = 499;
    else if (plan === "annual") amountRs = 1799;
    else return res.status(400).json({ message: "Invalid plan" });

    const amountPaise = amountRs * 100; // Razorpay requires paise

    const shortUserId = req.user._id.toString().slice(0, 10);
    const shortTimestamp = Date.now().toString().slice(-8);
    const receipt = `rcpt_${shortUserId}_${shortTimestamp}`;

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: { plan },
    };

    const order = await razorpay.orders.create(options);
    console.log("Order created:", order);

    return res.json({ order });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    console.log("Verify payment request:", { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      console.error("Missing payment verification fields:", { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan });
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    // Validate plan
    const validPlans = ["basic_monthly", "all_monthly", "annual"];
    if (!validPlans.includes(plan)) {
      console.error("Invalid plan:", plan);
      return res.status(400).json({ message: "Invalid plan" });
    }

    // Verify signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      console.error("RAZORPAY_KEY_SECRET is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const hmac = crypto.createHmac("sha256", key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest("hex");

    console.log("Signature verification:", { expectedSignature, receivedSignature: razorpay_signature });

    if (expectedSignature !== razorpay_signature) {
      console.error("Invalid signature. Expected:", expectedSignature, "Received:", razorpay_signature);
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Determine duration & amount
    let durationDays = 30;
    let amountRs = 0;
    if (plan === "basic_monthly") { durationDays = 30; amountRs = 399; }
    else if (plan === "all_monthly") { durationDays = 30; amountRs = 499; }
    else if (plan === "annual") { durationDays = 365; amountRs = 1799; }

    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Save subscription record
    const subscription = new Subscription({
      userId: req.user._id,
      plan,
      amount: amountRs,
      startDate,
      endDate,
      active: true,
      paymentGateway: "razorpay",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

    await subscription.save();

    // Update user's quick subscription info
    await User.findByIdAndUpdate(req.user._id, {
      isSubscribed: true,
      plan,
      planStart: startDate,
      planEnd: endDate,
      calcCount: 0,
    });

    console.log("Subscription activated for user:", req.user._id, "Plan:", plan);
    return res.json({ message: "Subscription activated", subscription });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: no user found" });
    }

    const planNameMap = {
      free: "Free",
      basic_monthly: "Basic Monthly",
      all_monthly: "All Modules Monthly",
      annual: "Annual",
    };

    const sub = await Subscription.findOne({ userId: req.user._id, active: true }).sort({ createdAt: -1 });
    if (!sub) {
      const user = await User.findById(req.user._id);
      return res.json({
        isSubscribed: false,
        plan: user.plan || "free",
        planName: planNameMap[user.plan || "free"],
        startDate: null,
        endDate: null,
        expiry: null,
      });
    }

    const now = new Date();
    if (sub.endDate < now) {
      sub.active = false;
      await sub.save();
      await User.findByIdAndUpdate(req.user._id, {
        isSubscribed: false,
        plan: "free",
        planStart: null,
        planEnd: null,
      });
      return res.json({
        isSubscribed: false,
        plan: "free",
        planName: planNameMap.free,
        startDate: null,
        endDate: null,
        expiry: null,
      });
    }

    return res.json({
      isSubscribed: true,
      plan: sub.plan,
      planName: planNameMap[sub.plan],
      startDate: sub.startDate,
      endDate: sub.endDate,
      expiry: sub.endDate,
    });
  } catch (err) {
    console.error("getSubscriptionStatus error:", err);
    return res.status(500).json({ message: "Error fetching subscription status", error: err.message });
  }
};

export const getPlans = (req, res) => {
  const plans = [
    { id: "free", name: "Free", price: 0, duration: "Lifetime" },
    { id: "basic_monthly", name: "Profit & Fee Monitor", price: 399, duration: "30 days" },
    { id: "all_monthly", name: "All Access Monthly", price: 499, duration: "30 days" },
    { id: "annual", name: "All Access Anually", price: 1799, duration: "365 days" },
  ];
  res.json(plans);
};