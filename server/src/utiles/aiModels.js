import fetch from "node-fetch";

// Using HuggingFace free inference API
const HF_API = "https://api-inference.huggingface.co/models/t5-small";
const HF_TOKEN = process.env.HF_TOKEN || ""; // optional: use free account token

export const generateOptimizedText = async (input, type = "title") => {
  try {
    const response = await fetch(HF_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` })
      },
      body: JSON.stringify({
        inputs:
          type === "title"
            ? `Rewrite product title to be SEO-friendly: ${input}`
            : `Rewrite product description for better SEO: ${input}`
      })
    });

    const data = await response.json();
    if (data?.error) {
      console.warn("HuggingFace API Warning:", data.error);
      return input; // fallback
    }
    return data[0]?.generated_text || input;
  } catch (err) {
    console.error("AI API Error:", err);
    return input; // fallback
  }
};
