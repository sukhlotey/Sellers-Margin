import ProfitFee from "../models/ProfitFee.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

export const calculateProfit = async (req, res) => {
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

    // Validate required fields
    if (!sellingPrice || !costPrice || !commissionPercent || !gstPercent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const commissionFee = (sellingPrice * commissionPercent) / 100;
    const gstTax = (sellingPrice * gstPercent) / 100;
    const profit = sellingPrice - costPrice - commissionFee - gstTax - shippingCost - adCost;
    const breakEvenPrice = costPrice + commissionFee + gstTax + shippingCost + adCost;

    // Fetch user and check subscription status
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check subscription expiry and update user.isSubscribed if expired
    if (user.isSubscribed && user.planEnd && new Date(user.planEnd) < new Date()) {
      user.isSubscribed = false;
      user.plan = "free";
      user.planStart = null;
      user.planEnd = null;
      await user.save();
    }

    // Enforce 5-calculation limit for free plan users
    if (!user.isSubscribed && user.calcCount >= 5) {
      return res.status(403).json({
        message: "Free plan calculation limit reached. Please upgrade to continue.",
      });
    }

    // Increment calcCount for non-subscribed users
    if (!user.isSubscribed) {
      user.calcCount = (user.calcCount || 0) + 1;
      await user.save();
    }

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
      usageCount: user.calcCount,
      isSubscribed: user.isSubscribed,
    });
  } catch (error) {
    console.error("calculateProfit error:", error);
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

    // Validate required fields
    if (!productName || !sellingPrice || !costPrice || !commissionPercent || !gstPercent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch user and check subscription status
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check subscription expiry and update user.isSubscribed if expired
    if (user.isSubscribed && user.planEnd && new Date(user.planEnd) < new Date()) {
      user.isSubscribed = false;
      user.plan = "free";
      user.planStart = null;
      user.planEnd = null;
      await user.save();
    }

    // Enforce 5-save limit for free plan users
    if (!user.isSubscribed && user.calcCount > 5) {
      return res.status(403).json({
        message: "Free plan save limit reached. Please upgrade to continue.",
      });
    }

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
    console.error("calculateAndSaveProfit error:", error);
    res.status(500).json({ message: "Error saving calculation", error: error.message });
  }
};

export const bulkSaveProfit = async (req, res) => {
  try {
    const { records, fileName } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "No records provided" });
    }

    const batchId = uuidv4();

    const enrichedRecords = records.map((r) => {
      const commissionFee = (r.sellingPrice * r.commissionPercent) / 100;
      const gstTax = (r.sellingPrice * r.gstPercent) / 100;
      const profit = r.sellingPrice - r.costPrice - commissionFee - gstTax - r.shippingCost - r.adCost;
      const breakEvenPrice = r.costPrice + commissionFee + gstTax + r.shippingCost + r.adCost;

      return {
        ...r,
        userId: req.user._id,
        batchId,
        isBulk: true,
        fileName,
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
      fileName,
    });
  } catch (error) {
    console.error("bulkSaveProfit error:", error);
    res.status(500).json({
      message: "Error saving bulk records",
      error: error.message,
    });
  }
};

export const getBulkHistory = async (req, res) => {
  try {
    const bulk = await ProfitFee.aggregate([
      { $match: { userId: req.user._id, isBulk: true } },
      {
        $group: {
          _id: "$batchId",
          createdAt: { $first: "$createdAt" },
          recordsCount: { $sum: 1 },
          fileName: { $first: "$fileName" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(bulk);
  } catch (error) {
    console.error("getBulkHistory error:", error);
    res.status(500).json({ message: "Error fetching bulk history", error: error.message });
  }
};

export const getBulkDetails = async (req, res) => {
  try {
    const { batchId } = req.params;
    const records = await ProfitFee.find({ userId: req.user._id, batchId });
    res.json(records);
  } catch (error) {
    console.error("getBulkDetails error:", error);
    res.status(500).json({ message: "Error fetching bulk details", error: error.message });
  }
};

export const getProfitHistory = async (req, res) => {
  try {
    const history = await ProfitFee.find({
      userId: req.user._id,
      isBulk: { $ne: true },
    }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error("getProfitHistory error:", error);
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};

export const deleteBulkBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const result = await ProfitFee.deleteMany({
      userId: req.user._id,
      batchId,
      isBulk: true,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No records found for this batch" });
    }

    res.json({ message: "Bulk batch deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("deleteBulkBatch error:", error);
    res.status(500).json({ message: "Error deleting bulk batch", error: error.message });
  }
};

export const deleteMultipleBulkBatches = async (req, res) => {
  try {
    const { batchIds } = req.body;

    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({ message: "No batch IDs provided" });
    }

    const result = await ProfitFee.deleteMany({
      userId: req.user._id,
      batchId: { $in: batchIds },
      isBulk: true,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No records found for the provided batch IDs" });
    }

    res.json({ message: "Bulk batches deleted successfully", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("deleteMultipleBulkBatches error:", error);
    res.status(500).json({ message: "Error deleting bulk batches", error: error.message });
  }
};