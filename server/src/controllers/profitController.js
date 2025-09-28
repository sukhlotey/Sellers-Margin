import ProfitFee from "../models/ProfitFee.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

export const calculateProfit = async (req, res) => {
  try {
    const {
      sellingPrice,
      costPrice,
      importDuties,
      commissionPercent,
      gstPercent,
      shippingCost = 0,
      adCost = 0,
      weight = 0,
      category = "General",
      platform = "Amazon",
      fulfillmentType = "FBA",
      dimensions = { length: 0, width: 0, height: 0 },
      storageDuration = 1,
    } = req.body;

    if (!sellingPrice || !costPrice || !importDuties || !commissionPercent || !gstPercent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const commissionFee = (sellingPrice * commissionPercent) / 100;
    const closingFee = platform === "Amazon"
      ? (sellingPrice < 300 ? 10 : sellingPrice <= 500 ? 15 : 45)
      : sellingPrice * 0.025;
    const volumetricWeight = dimensions.length && dimensions.width && dimensions.height
      ? (dimensions.length * dimensions.width * dimensions.height) / 5000
      : 1;
    const fulfillmentFee = fulfillmentType === "SellerFulfilled" || (platform === "Amazon" && fulfillmentType === "EasyShip")
      ? shippingCost
      : (platform === "Amazon" ? 15 : 20) + shippingCost + (platform === "Amazon" ? 30 : 35) * storageDuration * volumetricWeight;
    const gstOnFees = (commissionFee + closingFee + fulfillmentFee) * 0.18;
    const outputGST = (sellingPrice * gstPercent) / 100;
    const inputGSTCredit = importDuties * 0.18; // Assuming 18% IGST component
    const netGSTRemitted = outputGST - inputGSTCredit;
    const totalPlatformFees = commissionFee + closingFee + fulfillmentFee + gstOnFees;
    const netPayout = sellingPrice - totalPlatformFees - netGSTRemitted;
    const profit = netPayout - costPrice - importDuties;
    const breakEvenPrice = costPrice + importDuties + commissionFee + closingFee + fulfillmentFee + gstOnFees + outputGST;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isSubscribed && user.planEnd && new Date(user.planEnd) < new Date()) {
      user.isSubscribed = false;
      user.plan = "free";
      user.planStart = null;
      user.planEnd = null;
      await user.save();
    }

    if (!user.isSubscribed && user.calcCount >= 5) {
      return res.status(403).json({
        message: "Free plan calculation limit reached. Please upgrade to continue.",
      });
    }

    if (!user.isSubscribed) {
      user.calcCount = (user.calcCount || 0) + 1;
      await user.save();
    }

    res.json({
      sellingPrice,
      costPrice,
      importDuties,
      commissionPercent,
      gstPercent,
      shippingCost,
      adCost,
      weight,
      category,
      platform,
      fulfillmentType,
      dimensions,
      storageDuration,
      commissionFee,
      closingFee,
      fulfillmentFee,
      gstOnFees,
      outputGST,
      inputGSTCredit,
      netGSTRemitted,
      netPayout,
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
      importDuties,
      commissionPercent,
      gstPercent,
      shippingCost = 0,
      adCost = 0,
      weight = 0,
      category = "General",
      platform = "Amazon",
      fulfillmentType = "FBA",
      dimensions = { length: 0, width: 0, height: 0 },
      storageDuration = 1,
    } = req.body;

    if (!productName || !sellingPrice || !costPrice || !importDuties || !commissionPercent || !gstPercent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isSubscribed && user.planEnd && new Date(user.planEnd) < new Date()) {
      user.isSubscribed = false;
      user.plan = "free";
      user.planStart = null;
      user.planEnd = null;
      await user.save();
    }

    if (!user.isSubscribed && user.calcCount > 5) {
      return res.status(403).json({
        message: "Free plan save limit reached. Please upgrade to continue.",
      });
    }

    const commissionFee = (sellingPrice * commissionPercent) / 100;
    const closingFee = platform === "Amazon"
      ? (sellingPrice < 300 ? 10 : sellingPrice <= 500 ? 15 : 45)
      : sellingPrice * 0.025;
    const volumetricWeight = dimensions.length && dimensions.width && dimensions.height
      ? (dimensions.length * dimensions.width * dimensions.height) / 5000
      : 1;
    const fulfillmentFee = fulfillmentType === "SellerFulfilled" || (platform === "Amazon" && fulfillmentType === "EasyShip")
      ? shippingCost
      : (platform === "Amazon" ? 15 : 20) + shippingCost + (platform === "Amazon" ? 30 : 35) * storageDuration * volumetricWeight;
    const gstOnFees = (commissionFee + closingFee + fulfillmentFee) * 0.18;
    const outputGST = (sellingPrice * gstPercent) / 100;
    const inputGSTCredit = importDuties * 0.18;
    const netGSTRemitted = outputGST - inputGSTCredit;
    const totalPlatformFees = commissionFee + closingFee + fulfillmentFee + gstOnFees;
    const netPayout = sellingPrice - totalPlatformFees - netGSTRemitted;
    const profit = netPayout - costPrice - importDuties;
    const breakEvenPrice = costPrice + importDuties + commissionFee + closingFee + fulfillmentFee + gstOnFees + outputGST;

    const record = new ProfitFee({
      userId: req.user._id,
      productName,
      sellingPrice,
      costPrice,
      importDuties,
      commissionPercent,
      gstPercent,
      shippingCost,
      adCost,
      category,
      weight,
      platform,
      fulfillmentType,
      dimensions,
      storageDuration,
      commissionFee,
      closingFee,
      fulfillmentFee,
      gstOnFees,
      outputGST,
      inputGSTCredit,
      netGSTRemitted,
      netPayout,
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
      const closingFee = r.platform === "Amazon"
        ? (r.sellingPrice < 300 ? 10 : r.sellingPrice <= 500 ? 15 : 45)
        : r.sellingPrice * 0.025;
      const volumetricWeight = r.dimensions?.length && r.dimensions?.width && r.dimensions?.height
        ? (r.dimensions.length * r.dimensions.width * r.dimensions.height) / 5000
        : 1;
      const fulfillmentFee = r.fulfillmentType === "SellerFulfilled" || (r.platform === "Amazon" && r.fulfillmentType === "EasyShip")
        ? r.shippingCost
        : (r.platform === "Amazon" ? 15 : 20) + r.shippingCost + (r.platform === "Amazon" ? 30 : 35) * r.storageDuration * volumetricWeight;
      const gstOnFees = (commissionFee + closingFee + fulfillmentFee) * 0.18;
      const outputGST = (r.sellingPrice * r.gstPercent) / 100;
      const inputGSTCredit = r.importDuties * 0.18;
      const netGSTRemitted = outputGST - inputGSTCredit;
      const totalPlatformFees = commissionFee + closingFee + fulfillmentFee + gstOnFees;
      const netPayout = r.sellingPrice - totalPlatformFees - netGSTRemitted;
      const profit = netPayout - r.costPrice - r.importDuties;
      const breakEvenPrice = r.costPrice + r.importDuties + commissionFee + closingFee + fulfillmentFee + gstOnFees + outputGST;

      return {
        ...r,
        userId: req.user._id,
        batchId,
        isBulk: true,
        fileName,
        commissionFee,
        closingFee,
        fulfillmentFee,
        gstOnFees,
        outputGST,
        inputGSTCredit,
        netGSTRemitted,
        netPayout,
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
          platform: { $first: "$platform" },
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

// Delete a single non-bulk ProfitFee record by ID
export const deleteProfitRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Record ID is required" });
    }
    const result = await ProfitFee.deleteOne({
      userId: req.user._id,
      _id: id,
      isBulk: false,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Record not found or already deleted" });
    }
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("deleteProfitRecord error:", error);
    res.status(500).json({ message: "Error deleting record", error: error.message });
  }
};

// Delete multiple non-bulk ProfitFee records by IDs
export const deleteMultipleProfitRecords = async (req, res) => {
  try {
    const { recordIds } = req.body;
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ message: "No record IDs provided" });
    }
    const result = await ProfitFee.deleteMany({
      userId: req.user._id,
      _id: { $in: recordIds },
      isBulk: false,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No records found or already deleted" });
    }
    res.json({ message: `${result.deletedCount} record(s) deleted successfully` });
  } catch (error) {
    console.error("deleteMultipleProfitRecords error:", error);
    res.status(500).json({ message: "Error deleting records", error: error.message });
  }
};