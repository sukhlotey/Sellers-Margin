import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profitFeeRoutes from "./routes/profitRoutes.js";
import gstRoutes from "./routes/gstRoutes.js";
import profitRoutes from "./routes/profitRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js"; // NEW
import feedbackRoutes from "./routes/feedbackRoute.js";
import adminRoutes from "./routes/adminRoute.js";
 
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
app.use("/api/subscription", subscriptionRoutes); // NEW
app.use("/api/feedback",  feedbackRoutes);
app.use("/api/admin", adminRoutes); // Added

app.get("/", (req, res) => {
  res.send("Seller Sense AI Module Running 🚀");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
