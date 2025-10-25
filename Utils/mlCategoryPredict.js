import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
dotenv.config();

const client = new InferenceClient(process.env.HF_TOKEN);

export async function mlCategoryPredict({ text, hashtags }) {
  hashtags = Array.isArray(hashtags) ? hashtags : [];
  const input = [text, ...hashtags.map(tag => tag.replace(/^#/, ""))].join(" ");
  const output = await client.textClassification({
    model: "cardiffnlp/tweet-topic-21-multi",
    inputs: input,
    provider: "hf-inference"
  });
  if (!output || !output.length) return { category: "other" };
  return { category: output[0].label.toLowerCase() };
}
