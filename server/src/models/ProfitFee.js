import mongoose from "mongoose";

const profitFeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productName: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    gstPercent: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    adCost: { type: Number, default: 0 },
    category: { type: String, default: "General" },
     weight: { type: Number, required: true }, // ✅ always grams // grams
    commissionFee: Number,
    gstTax: Number,
    profit: Number,
    breakEvenPrice: Number,
  },
  { timestamps: true }
);

export default mongoose.model("ProfitFee", profitFeeSchema);
