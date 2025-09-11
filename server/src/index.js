import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profitFeeRoutes from "./routes/profitRoutes.js";
import gstRoutes from "./routes/gstRoutes.js";
import profitRoutes from "./routes/profitRoutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profit-fee", profitFeeRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/profit-fee", profitRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
