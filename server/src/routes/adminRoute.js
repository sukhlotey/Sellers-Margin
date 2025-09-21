import express from "express";
import { loginAdmin, getDashboardData } from "../controllers/adminController.js";
import { adminProtect } from "../middleware/adminProtect.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/dashboard", adminProtect, getDashboardData);

export default router;