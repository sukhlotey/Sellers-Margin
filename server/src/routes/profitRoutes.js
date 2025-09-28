import express from "express";
import { calculateProfit,calculateAndSaveProfit,getProfitHistory,bulkSaveProfit,getBulkHistory,
  getBulkDetails,deleteBulkBatch,
  deleteMultipleBulkBatches, deleteMultipleProfitRecords,deleteProfitRecord } from "../controllers/profitController.js";
import { protect } from "../middleware/authMiddleware.js";
import { enforceFreeLimit } from "../middleware/subscriptionMiddleware.js";

const router = express.Router();

// POST → calculate profit
router.post("/calculate",protect,enforceFreeLimit, calculateProfit);
router.get("/history",protect, getProfitHistory);
router.post("/save", protect,enforceFreeLimit, calculateAndSaveProfit);
router.post("/bulk-save", protect, bulkSaveProfit);
router.get("/bulk/history", protect, getBulkHistory);
router.get("/bulk/:batchId", protect, getBulkDetails);
router.delete("/bulk/:batchId", protect, deleteBulkBatch);
router.delete("/bulk", protect, deleteMultipleBulkBatches);
router.delete("/:id", protect, deleteProfitRecord);
router.delete("/", protect, deleteMultipleProfitRecords);
export default router;
