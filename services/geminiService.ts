
import { GoogleGenAI } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAITrainingAdvice = async (sport: string, rank: string, goal: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As an expert ${sport} coach, provide a short, actionable training advice for a ${rank} belt who wants to focus on: ${goal}. Keep it under 150 words and include one specific drill.`,
    });
    // .text is a property in the new SDK, not a method
    return response.text;
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Failed to fetch AI coach insights. Please check your connection.";
  }
};

export const generateSessionSummary = async (sessions: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these recent training sessions and provide a motivation summary for the member: ${JSON.stringify(sessions)}`,
    });
    // .text is a property in the new SDK, not a method
    return response.text;
  } catch (error) {
    return "Keep grinding! Consistency is the key to progress.";
  }
};
