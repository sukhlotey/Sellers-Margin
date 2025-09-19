import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["basic_monthly","all_monthly","annual"], required: true },
    amount: { type: Number, required: true }, // in rupees
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
    paymentGateway: { type: String, default: "razorpay" },
    paymentId: { type: String }, // gateway payment id
    orderId: { type: String }, // gateway order id
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
