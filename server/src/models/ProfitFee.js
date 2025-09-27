import mongoose from "mongoose";

const profitFeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productName: { type: String, required: true },
    sellingPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    importDuties: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    gstPercent: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    adCost: { type: Number, default: 0 },
    category: { type: String, default: "General" },
    weight: { type: Number, required: true },
    platform: { type: String, required: true },
    fulfillmentType: { type: String, required: true },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    storageDuration: { type: Number, default: 1 },
    commissionFee: { type: Number },
    closingFee: { type: Number },
    fulfillmentFee: { type: Number },
    gstOnFees: { type: Number },
    outputGST: { type: Number },
    inputGSTCredit: { type: Number },
    netGSTRemitted: { type: Number },
    netPayout: { type: Number },
    profit: { type: Number },
    breakEvenPrice: { type: Number },
    batchId: { type: String, default: null },
    isBulk: { type: Boolean, default: false },
    fileName: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("ProfitFee", profitFeeSchema);