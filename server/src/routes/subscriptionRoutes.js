import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createOrder, verifyPayment, getSubscriptionStatus, getPlans } from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/create-order", protect, createOrder);     // create razorpay order
router.post("/verify", protect, verifyPayment);          // verify payment & activate
router.get("/status", protect, getSubscriptionStatus);   // current subscription
router.get("/plans", getPlans);

export default router;
