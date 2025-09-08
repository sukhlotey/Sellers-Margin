import express from "express";
import { calculateProfit,calculateAndSaveProfit,getProfitHistory } from "../controllers/profitController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST → calculate profit
router.post("/calculate",protect, calculateProfit);
router.get("/history",protect, getProfitHistory);
router.post("/save", protect, calculateAndSaveProfit);

export default router;
