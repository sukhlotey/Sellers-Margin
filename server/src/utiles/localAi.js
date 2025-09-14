import { pipeline } from "@xenova/transformers";

// Singleton so model loads only once
let generator = null;

export async function getTextGenerator() {
  if (!generator) {
    console.log("⏳ Loading AI model (flan-t5-small)...");

    generator = await pipeline(
      "text2text-generation",
       "Xenova/t5-small",
      {
        authToken: process.env.HF_TOKEN || "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",
      }
    );

    console.log("✅ Model loaded successfully");
  }
  return generator;
}

export async function optimizeText(title, description) {
  const generator = await getTextGenerator();

  // Prompt engineering
  const prompt = `
  Rewrite the following product listing to make it more SEO-friendly:
  Title: ${title}
  Description: ${description}

  Provide:
  - Optimized title
  - Optimized description
  - Keywords
  `;

  const output = await generator(prompt, {
    max_new_tokens: 128,
    temperature: 0.7,
  });

  return output[0].generated_text;
}
