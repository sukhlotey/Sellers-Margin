import ProfitFee from "../models/ProfitFee.js";
import { v4 as uuidv4 } from "uuid";

export const calculateProfit = (req, res) => {
  try {
    const {
      sellingPrice,
      costPrice,
      commissionPercent,
      gstPercent,
      shippingCost = 0,
      adCost = 0,
      weight = 0,
      category = "General",
    } = req.body;

    const commissionFee = (sellingPrice * commissionPercent) / 100;
    const gstTax = (sellingPrice * gstPercent) / 100;

    // Profit = SP - CP - Commission - GST - Shipping - Ads
    const profit = sellingPrice - costPrice - commissionFee - gstTax - shippingCost - adCost;

    // Break-even = CP + Commission + GST + Shipping + Ads
    const breakEvenPrice = costPrice + commissionFee + gstTax + shippingCost + adCost;

    res.json({
      sellingPrice,
      costPrice,
      commissionPercent,
      gstPercent,
      shippingCost,
      adCost,
      weight,
      category,
      commissionFee,
      gstTax,
      profit,
      breakEvenPrice,
    });
  } catch (error) {
    res.status(500).json({ message: "Calculation error", error: error.message });
  }
};

export const calculateAndSaveProfit = async (req, res) => {
  try {
    const {
      productName,
      sellingPrice,
      costPrice,
      commissionPercent,
      gstPercent,
      shippingCost = 0,
      adCost = 0,
      weight = 0,
      category = "General",
    } = req.body;

    const commissionFee = (sellingPrice * commissionPercent) / 100;
    const gstTax = (sellingPrice * gstPercent) / 100;
    const profit = sellingPrice - costPrice - commissionFee - gstTax - shippingCost - adCost;
    const breakEvenPrice = costPrice + commissionFee + gstTax + shippingCost + adCost;

    const record = new ProfitFee({
      userId: req.user._id,
      productName,
      sellingPrice,
      costPrice,
      commissionPercent,
      gstPercent,
      shippingCost,
      adCost,
      category,
      weight,
      commissionFee,
      gstTax,
      profit,
      breakEvenPrice,
    });

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Error saving calculation", error: error.message });
  }
};
// Bulk save profit records
export const bulkSaveProfit = async (req, res) => {
  try {
    const { records } = req.body; // expects array of objects

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "No records provided" });
    }

    const batchId = uuidv4(); // unique id for this upload

    const enrichedRecords = records.map((r) => {
      const commissionFee = (r.sellingPrice * r.commissionPercent) / 100;
      const gstTax = (r.sellingPrice * r.gstPercent) / 100;
      const profit =
        r.sellingPrice - r.costPrice - commissionFee - gstTax - r.shippingCost - r.adCost;
      const breakEvenPrice =
        r.costPrice + commissionFee + gstTax + r.shippingCost + r.adCost;

      return {
        ...r,
        userId: req.user._id,
        batchId,
        isBulk: true,
        commissionFee,
        gstTax,
        profit,
        breakEvenPrice,
      };
    });

    const saved = await ProfitFee.insertMany(enrichedRecords);

    res.json({
      message: "Bulk save successful",
      batchId,
      count: saved.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving bulk records",
      error: error.message,
    });
  }
};

// ✅ Get grouped bulk uploads
export const getBulkHistory = async (req, res) => {
  try {
    const bulk = await ProfitFee.aggregate([
      { $match: { userId: req.user._id, isBulk: true } },
      {
        $group: {
          _id: "$batchId",
          createdAt: { $first: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(bulk);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bulk history", error: error.message });
  }
};

// ✅ Fetch products of a single bulk upload
export const getBulkDetails = async (req, res) => {
  try {
    const { batchId } = req.params;
    const records = await ProfitFee.find({ userId: req.user._id, batchId });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bulk details", error: error.message });
  }
};
// GET → fetch history
export const getProfitHistory = async (req, res) => {
  try {
    const history = await ProfitFee.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};
