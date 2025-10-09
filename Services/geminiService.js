import { GoogleGenAI } from '@google/genai';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateTweetContent = async (prompt) => {
  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini error:', error);
    throw new Error('Failed to generate content');
  }
};
