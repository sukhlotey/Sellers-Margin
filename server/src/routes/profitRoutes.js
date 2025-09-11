import express from "express";
import { calculateProfit,calculateAndSaveProfit,getProfitHistory,bulkSaveProfit,getBulkHistory,
  getBulkDetails,deleteBulkBatch,
  deleteMultipleBulkBatches } from "../controllers/profitController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST → calculate profit
router.post("/calculate",protect, calculateProfit);
router.get("/history",protect, getProfitHistory);
router.post("/save", protect, calculateAndSaveProfit);
router.post("/bulk-save", protect, bulkSaveProfit);
router.get("/bulk/history", protect, getBulkHistory);
router.get("/bulk/:batchId", protect, getBulkDetails);
router.delete("/bulk/:batchId", protect, deleteBulkBatch);
router.delete("/bulk", protect, deleteMultipleBulkBatches);
export default router;
