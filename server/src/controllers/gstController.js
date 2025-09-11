import Settlement from "../models/Settlement.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { parseCSVBuffer, marketplaceParsers } from "../utiles/settlementParser.js";
import { parseCSVBuffer as parseCSV } from "../utiles/settlementParser.js"; // same util
import { parse } from "csv-parse/sync";

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

    const { buffer } = req.file;
    const marketplace = (req.body.marketplace || "generic").toLowerCase();
    // parse rows from CSV buffer (we have parse helper)
    // NOTE: settlementParser.parseSettlementFile will call parseCSVBuffer internally
    const rows = parseCSVBuffer(buffer);
    // choose parser
    const parser = marketplaceParsers[marketplace] || marketplaceParsers.generic;
    const canonical = parser(rows);

    if (!canonical || canonical.length === 0) {
      return res.status(400).json({ message: "No rows parsed from file" });
    }

    const batchId = uuidv4();

    // enrich and save
    const toInsert = canonical.map((r) => ({
      userId: req.user._id,
      marketplace,
      settlementId: r.settlementId || null,
      orderId: r.orderId || null,
      orderDate: r.orderDate || null,
      grossAmount: r.grossAmount || 0,
      feesBreakdown: r.feesBreakdown || {},
      gstCollected: r.gstCollected || 0,
      gstOnFees: r.gstOnFees || 0,
      netPayout: r.netPayout || 0,
      currency: r.currency || "INR",
      batchId,
      isBulk: true,
      rawRow: r.rawRow || {},
    }));

    const saved = await Settlement.insertMany(toInsert);

    return res.json({
      message: "Upload parsed and saved",
      batchId,
      count: saved.length,
    });
  } catch (error) {
    console.error("uploadSettlement error:", error);
    return res.status(500).json({ message: "Upload error", error: error.message });
  }
};

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
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    // normalize field name for frontend convenience
    const payload = bulk.map((b) => ({ _id: b._id, createdAt: b.createdAt, recordsCount: b.recordsCount, marketplace: b.marketplace }));
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
          totalGross: { $sum: "$grossAmount" },
          totalGSTCollected: { $sum: "$gstCollected" },
          totalGSTOnFees: { $sum: "$gstOnFees" },
          totalFees: { $sum: { $sum: [ "$feesBreakdown.commission", "$feesBreakdown.shippingFee", "$feesBreakdown.otherFee" ] } },
          totalNetPayout: { $sum: "$netPayout" },
        },
      },
    ]);

    const summary = agg[0] || {
      totalGross: 0,
      totalGSTCollected: 0,
      totalGSTOnFees: 0,
      totalFees: 0,
      totalNetPayout: 0,
    };

    // GST liability (simple): output tax - ITC (gstOnFees)
    const gstLiability = (summary.totalGSTCollected || 0) - (summary.totalGSTOnFees || 0);

    res.json({ summary, gstLiability });
  } catch (error) {
    console.error("getGSTSummary error:", error);
    res.status(500).json({ message: "Error computing GST summary", error: error.message });
  }
};
