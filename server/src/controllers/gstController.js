import Settlement from "../models/Settlement.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { parseSettlementFile } from "../utiles/settlementParser.js";

/* multer memory storage (do not save file to disk) */
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });

/**
 * POST /api/gst/upload
 * multipart/form-data: file, marketplace (string), columnMapping (JSON string)
 */
export const uploadSettlement = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const { buffer, originalname } = req.file;
    const marketplace = (req.body.marketplace || "generic").toLowerCase();
    const columnMapping = req.body.columnMapping ? JSON.parse(req.body.columnMapping) : {};

    // Parse CSV or Excel file
    const canonical = parseSettlementFile(buffer, marketplace, columnMapping);

    if (!canonical || canonical.length === 0) {
      return res.status(400).json({ message: "No rows parsed from file" });
    }

    const batchId = uuidv4();

    // Enrich and save
    const toInsert = canonical.map((r) => {
      console.log("Inserting record:", r); // Debug log
      const grossAmount = r.grossAmount - (r.returnAmount || 0);
      const gstCollected = r.gstCollected || (grossAmount * 0.18);
      const netPayout = r.netPayout || (grossAmount - (r.feesBreakdown.commission + r.feesBreakdown.shippingFee + r.feesBreakdown.otherFee + r.gstOnFees));
      const grossProfit = grossAmount - r.costPrice;
      const netProfit = netPayout - r.costPrice;
      const margin = grossAmount > 0 ? (netProfit / grossAmount) * 100 : 0;

      return {
        userId: req.user._id,
        marketplace,
        settlementId: r.settlementId || null,
        orderId: r.orderId || null,
        productName: r.productName || null,
        orderDate: r.orderDate || null,
        quantity: r.quantity || 1,
        grossAmount,
        costPrice: r.costPrice || 0,
        feesBreakdown: r.feesBreakdown || { commission: 0, shippingFee: 0, otherFee: 0 },
        gstCollected,
        gstOnFees: r.gstOnFees || 0,
        netPayout,
        grossProfit,
        netProfit,
        margin,
        reconciliationStatus: r.reconciliationStatus || "Pending",
        reconciliationNotes: r.reconciliationNotes || "",
        currency: r.currency || "INR",
        batchId,
        isBulk: true,
        filename: originalname,
        rawRow: r.rawRow || {},
        returnAmount: r.returnAmount || 0,
      };
    });

    const saved = await Settlement.insertMany(toInsert);
    console.log("Saved records:", saved.length);

    // Compute summary for the response
    const summary = await getGSTSummaryForBatch(req.user._id, batchId);
    console.log("Computed summary:", summary);

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
        totalSales: { $sum: { $multiply: [{ $subtract: ["$grossAmount", "$returnAmount"] }, "$quantity"] } },
        outputGST: { $sum: { $multiply: ["$gstCollected", "$quantity"] } },
        inputGST: { $sum: { $multiply: ["$gstOnFees", "$quantity"] } },
        totalFees: { $sum: { $sum: ["$feesBreakdown.commission", "$feesBreakdown.shippingFee", "$feesBreakdown.otherFee"] } },
        totalNetPayout: { $sum: { $multiply: ["$netPayout", "$quantity"] } },
        totalGrossProfit: { $sum: { $multiply: ["$grossProfit", "$quantity"] } },
        totalNetProfit: { $sum: { $multiply: ["$netProfit", "$quantity"] } },
        totalReturns: { $sum: { $multiply: ["$returnAmount", "$quantity"] } },
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
    totalReturns: 0,
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
    const { from, to, batchId } = req.query;
    const match = {
      userId: req.user._id,
    };

    if (batchId) {
      match.batchId = batchId;
    } else {
      const fromDate = from ? new Date(from) : new Date("1970-01-01");
      const toDate = to ? new Date(to) : new Date();
      match.createdAt = { $gte: fromDate, $lte: toDate };
    }

    const agg = await Settlement.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalGross: { $sum: { $multiply: [{ $subtract: ["$grossAmount", "$returnAmount"] }, "$quantity"] } },
          totalGSTCollected: { $sum: { $multiply: ["$gstCollected", "$quantity"] } },
          totalGSTOnFees: { $sum: { $multiply: ["$gstOnFees", "$quantity"] } },
          totalFees: { $sum: { $sum: ["$feesBreakdown.commission", "$feesBreakdown.shippingFee", "$feesBreakdown.otherFee"] } },
          totalNetPayout: { $sum: { $multiply: ["$netPayout", "$quantity"] } },
          totalGrossProfit: { $sum: { $multiply: ["$grossProfit", "$quantity"] } },
          totalNetProfit: { $sum: { $multiply: ["$netProfit", "$quantity"] } },
          totalReturns: { $sum: { $multiply: ["$returnAmount", "$quantity"] } },
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
      totalReturns: 0,
    };

    const gstLiability = summary.totalGSTCollected - summary.totalGSTOnFees;

    res.json({ summary, gstLiability });
  } catch (error) {
    console.error("getGSTSummary error:", error);
    res.status(500).json({ message: "Error computing GST summary", error: error.message });
  }
};


export const deleteReport = async (req, res) => {
  try {
    const { batchId } = req.params;
    const deleted = await Settlement.deleteMany({ userId: req.user._id, batchId });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Report not found or already deleted" });
    }
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("deleteReport error:", error);
    res.status(500).json({ message: "Error deleting report", error: error.message });
  }
};

export const deleteMultipleReports = async (req, res) => {
  try {
    const { batchIds } = req.body;
    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({ message: "No batch IDs provided" });
    }
    const deleted = await Settlement.deleteMany({ userId: req.user._id, batchId: { $in: batchIds } });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "No reports found or already deleted" });
    }
    res.json({ message: `${deleted.deletedCount} report(s) deleted successfully` });
  } catch (error) {
    console.error("deleteMultipleReports error:", error);
    res.status(500).json({ message: "Error deleting reports", error: error.message });
  }
};