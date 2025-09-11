import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    marketplace: { type: String, required: true }, // e.g. 'amazon', 'flipkart', 'generic'
    settlementId: { type: String }, // settlement file/report id if present
    orderId: { type: String }, // marketplace order id (if present)
    productName: { type: String }, // product name, SKU, or ASIN
    orderDate: { type: Date }, 
    quantity: { type: Number, default: 1 }, // quantity sold
    grossAmount: { type: Number, default: 0 }, // selling price (gross)
    costPrice: { type: Number, default: 0 }, // cost price (optional, for profitability)
    feesBreakdown: { // detailed breakdown of marketplace fees
      commission: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      otherFee: { type: Number, default: 0 },
    },
    gstCollected: { type: Number, default: 0 }, // GST charged to buyer (output tax)
    gstOnFees: { type: Number, default: 0 }, // GST embedded in fees (input tax credit candidate)
    netPayout: { type: Number, default: 0 }, // amount credited to seller for this order
    grossProfit: { type: Number, default: 0 }, // selling price - cost price
    netProfit: { type: Number, default: 0 }, // net payout - cost price
    margin: { type: Number, default: 0 }, // net profit / selling price * 100
    reconciliationStatus: { type: String, default: "Pending" }, // 'Matched', 'Short Paid', 'Missing'
    reconciliationNotes: { type: String }, // notes for reconciliation issues
    currency: { type: String, default: "INR" },
    batchId: { type: String, index: true }, // groups rows from same uploaded settlement
    isBulk: { type: Boolean, default: false },
    filename: { type: String }, // name of the uploaded file
    rawRow: { type: Object, select: false }, // minimal store of original parsed row for debugging
  },
  { timestamps: true }
);

export default mongoose.model("Settlement", settlementSchema);