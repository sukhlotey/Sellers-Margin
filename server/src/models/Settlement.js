import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    marketplace: { type: String, required: true }, // e.g. 'amazon', 'flipkart'
    settlementId: { type: String }, // settlement file/report id if present
    orderId: { type: String }, // marketplace order id (if present)
    orderDate: { type: Date }, 
    grossAmount: { type: Number, default: 0 }, // selling price (gross)
    feesBreakdown: { type: Object, default: {} }, // { commission: 100, shipping: 40, ads: 20, other: 0 }
    gstCollected: { type: Number, default: 0 }, // GST charged to buyer (output tax)
    gstOnFees: { type: Number, default: 0 }, // GST embedded in fees (input tax credit candidate)
    netPayout: { type: Number, default: 0 }, // amount credited to seller for this order
    currency: { type: String, default: "INR" },

    // batch fields
    batchId: { type: String, index: true }, // groups rows from same uploaded settlement
    isBulk: { type: Boolean, default: false },

    // rawRow (optional) - minimal store of original parsed row if needed for debug (avoid storing large files)
    rawRow: { type: Object, select: false },
  },
  { timestamps: true }
);

export default mongoose.model("Settlement", settlementSchema);
