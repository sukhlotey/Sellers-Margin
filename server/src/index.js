import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";

// import authRoutes from "./routes/authRoutes.js";
// import profitFeeRoutes from "./routes/profitRoutes.js";
// import gstRoutes from "./routes/gstRoutes.js";
// import profitRoutes from "./routes/profitRoutes.js";
// import subscriptionRoutes from "./routes/subscriptionRoutes.js"; // NEW
// import feedbackRoutes from "./routes/feedbackRoute.js";
// import adminRoutes from "./routes/adminRoute.js";
 
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug environment variables

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const loadRoutes = async () => {
  const authRoutes = (await import("./routes/authRoutes.js")).default;
  const profitFeeRoutes = (await import("./routes/profitRoutes.js")).default;
  const gstRoutes = (await import("./routes/gstRoutes.js")).default;
  const subscriptionRoutes = (await import("./routes/subscriptionRoutes.js")).default;
  const feedbackRoutes = (await import("./routes/feedbackRoute.js")).default;
  const adminRoutes = (await import("./routes/adminRoute.js")).default;

  app.use("/api/auth", authRoutes);
  app.use("/api/profit-fee", profitFeeRoutes);
  app.use("/api/gst", gstRoutes);
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/admin", adminRoutes);
};

loadRoutes();


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
