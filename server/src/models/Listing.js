import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  originalTitle: { type: String, required: true },
  originalDescription: { type: String },
  Title: { type: String },
  Description: { type: String },
  keywords: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Listing", ListingSchema);
