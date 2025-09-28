import express from "express";
import {
  uploadSettlement,
  getBulkHistory,
  getBulkDetails,
  getGSTSummary,
  uploadMiddleware,
  deleteMultipleReports,
  deleteReport,
} from "../controllers/gstController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// upload settlement CSV/Excel (multipart) - field name: file
router.post("/upload", protect, uploadMiddleware.single("file"), uploadSettlement);

// bulk history
router.get("/bulk/history", protect, getBulkHistory);
router.get("/bulk/:batchId", protect, getBulkDetails);

// summary
router.get("/summary", protect, getGSTSummary);
router.delete("/bulk/:batchId", protect, deleteReport);

// Delete multiple reports by batchIds
router.delete("/bulk", protect, deleteMultipleReports);
export default router;
