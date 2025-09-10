import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

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
    weight: { type: Number, required: true },

    commissionFee: Number,
    gstTax: Number,
    profit: Number,
    breakEvenPrice: Number,

    batchId: { type: String, default: null }, // same id for all rows in one bulk upload
    isBulk: { type: Boolean, default: false },
    fileName: { type: String, default: null }, // New field for file name

  },
  { timestamps: true }
);

export default mongoose.model("ProfitFee", profitFeeSchema);
