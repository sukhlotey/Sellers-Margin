import ProfitFee from "../models/ProfitFee.js";

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


// GET → fetch history
export const getProfitHistory = async (req, res) => {
  try {
    const history = await ProfitFee.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};
