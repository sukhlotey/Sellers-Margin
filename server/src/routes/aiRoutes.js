import express from "express";
import { optimizeListing } from "../controllers/aiController.js";

const router = express.Router();

router.post("/optimize", optimizeListing);

export default router;
