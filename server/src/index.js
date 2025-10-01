import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";
 
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


connectDB();

const app = express();

// app.use(cors());
app.use(cors({ origin: ['https://sellersense.netlify.app', 'https://sellersense.in','http://localhost:5173'] }));
app.use(express.json());

app.get('/ping', (req, res) => res.send('OK'));
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
