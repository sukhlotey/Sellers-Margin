import Listing from "../models/Listing.js";
import { optimizeText } from "../utiles/localAi.js";

export const optimizeListing = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    // Call local AI model
    const aiResponse = await optimizeText(title, description);

    // Basic parsing (you can improve with regex/formatting)
    const optimizedTitle = aiResponse.split("Optimized title:")[1]?.split("\n")[0]?.trim() || title;
    const optimizedDescription = aiResponse.split("Optimized description:")[1]?.split("\n")[0]?.trim() || description;
    const keywords = aiResponse.match(/\b\w+\b/g).slice(0, 10); // crude keyword extraction

    // Save to DB
    const newListing = new Listing({
      originalTitle: title,
      originalDescription: description,
      optimizedTitle,
      optimizedDescription,
      keywords,
    });

    await newListing.save();

    res.json({
      success: true,
      optimizedTitle,
      optimizedDescription,
      keywords,
    });
  } catch (error) {
    console.error("AI Optimization Error:", error);
    res.status(500).json({ error: "AI processing failed" });
  }
};
