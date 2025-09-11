import Settlement from "../models/Settlement.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { parseSettlementFile } from "../utiles/settlementParser.js";

/* multer memory storage (do not save file to disk) */
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });

/**
 * POST /api/gst/upload
 * multipart/form-data: file, marketplace (string)
 */
export const uploadSettlement = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const { buffer, originalname } = req.file;
    const marketplace = (req.body.marketplace || "generic").toLowerCase();
    
    // Parse CSV or Excel file
    const canonical = parseSettlementFile(buffer, marketplace);

    if (!canonical || canonical.length === 0) {
      return res.status(400).json({ message: "No rows parsed from file" });
    }

    const batchId = uuidv4();

    // Enrich and save
    const toInsert = canonical.map((r) => ({
      userId: req.user._id,
      marketplace,
      settlementId: r.settlementId || null,
      orderId: r.orderId || null,
      productName: r.productName || null,
      orderDate: r.orderDate || null,
      quantity: r.quantity || 1,
      grossAmount: r.grossAmount || 0,
      costPrice: r.costPrice || 0,
      feesBreakdown: r.feesBreakdown || {},
      gstCollected: r.gstCollected || 0,
      gstOnFees: r.gstOnFees || 0,
      netPayout: r.netPayout || 0,
      grossProfit: r.grossProfit || 0,
      netProfit: r.netProfit || 0,
      margin: r.margin || 0,
      reconciliationStatus: r.reconciliationStatus || "Pending",
      reconciliationNotes: r.reconciliationNotes || "",
      currency: r.currency || "INR",
      batchId,
      isBulk: true,
      filename: originalname,
      rawRow: r.rawRow || {},
    }));

    const saved = await Settlement.insertMany(toInsert);

    // Compute summary for the response
    const summary = await getGSTSummaryForBatch(req.user._id, batchId);

    return res.json({
      message: "Upload parsed and saved",
      batchId,
      count: saved.length,
      summary,
      report: {
        _id: batchId,
        createdAt: new Date(),
        recordsCount: saved.length,
        marketplace,
        filename: originalname,
      },
      records: toInsert,
    });
  } catch (error) {
    console.error("uploadSettlement error:", error);
    return res.status(500).json({ message: "Upload error", error: error.message });
  }
};

/**
 * Helper function to compute summary for a batch
 */
async function getGSTSummaryForBatch(userId, batchId) {
  const agg = await Settlement.aggregate([
    { $match: { userId, batchId, isBulk: true } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $multiply: ["$grossAmount", "$quantity"] } },
        outputGST: { $sum: { $multiply: ["$gstCollected", "$quantity"] } },
        inputGST: { $sum: { $multiply: ["$gstOnFees", "$quantity"] } },
        totalFees: { $sum: { $sum: ["$feesBreakdown.commission", "$feesBreakdown.shippingFee", "$feesBreakdown.otherFee"] } },
        totalNetPayout: { $sum: { $multiply: ["$netPayout", "$quantity"] } },
        totalGrossProfit: { $sum: { $multiply: ["$grossProfit", "$quantity"] } },
        totalNetProfit: { $sum: { $multiply: ["$netProfit", "$quantity"] } },
      },
    },
  ]);

  const summary = agg[0] || {
    totalSales: 0,
    outputGST: 0,
    inputGST: 0,
    totalFees: 0,
    totalNetPayout: 0,
    totalGrossProfit: 0,
    totalNetProfit: 0,
  };
  summary.netGST = summary.outputGST - summary.inputGST;
  return summary;
}

/**
 * GET /api/gst/bulk/history
 * returns grouped batches with count and createdAt
 */
export const getBulkHistory = async (req, res) => {
  try {
    const bulk = await Settlement.aggregate([
      { $match: { userId: req.user._id, isBulk: true } },
      {
        $group: {
          _id: "$batchId",
          createdAt: { $first: "$createdAt" },
          recordsCount: { $sum: 1 },
          marketplace: { $first: "$marketplace" },
          filename: { $first: "$filename" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    const payload = bulk.map((b) => ({
      _id: b._id,
      createdAt: b.createdAt,
      recordsCount: b.recordsCount,
      marketplace: b.marketplace,
      filename: b.filename,
    }));
    res.json(payload);
  } catch (error) {
    console.error("getBulkHistory error:", error);
    res.status(500).json({ message: "Error fetching bulk history", error: error.message });
  }
};

/**
 * GET /api/gst/bulk/:batchId
 * returns all settlement records for batch
 */
export const getBulkDetails = async (req, res) => {
  try {
    const { batchId } = req.params;
    const records = await Settlement.find({ userId: req.user._id, batchId }).sort({ createdAt: 1 }).lean();
    res.json(records);
  } catch (error) {
    console.error("getBulkDetails error:", error);
    res.status(500).json({ message: "Error fetching bulk details", error: error.message });
  }
};

/**
 * GET /api/gst/summary?from=yyyy-mm-dd&to=yyyy-mm-dd
 * returns aggregated GST summary for user within date range
 */
export const getGSTSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date("1970-01-01");
    const toDate = to ? new Date(to) : new Date();

    const match = {
      userId: req.user._id,
      createdAt: { $gte: fromDate, $lte: toDate },
    };

    const agg = await Settlement.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalGross: { $sum: { $multiply: ["$grossAmount", "$quantity"] } },
          totalGSTCollected: { $sum: { $multiply: ["$gstCollected", "$quantity"] } },
          totalGSTOnFees: { $sum: { $multiply: ["$gstOnFees", "$quantity"] } },
          totalFees: { $sum: { $sum: ["$feesBreakdown.commission", "$feesBreakdown.shippingFee", "$feesBreakdown.otherFee"] } },
          totalNetPayout: { $sum: { $multiply: ["$netPayout", "$quantity"] } },
          totalGrossProfit: { $sum: { $multiply: ["$grossProfit", "$quantity"] } },
          totalNetProfit: { $sum: { $multiply: ["$netProfit", "$quantity"] } },
        },
      },
    ]);

    const summary = agg[0] || {
      totalGross: 0,
      totalGSTCollected: 0,
      totalGSTOnFees: 0,
      totalFees: 0,
      totalNetPayout: 0,
      totalGrossProfit: 0,
      totalNetProfit: 0,
    };

    const gstLiability = summary.totalGSTCollected - summary.totalGSTOnFees;

    res.json({ summary, gstLiability });
  } catch (error) {
    console.error("getGSTSummary error:", error);
    res.status(500).json({ message: "Error computing GST summary", error: error.message });
  }
};