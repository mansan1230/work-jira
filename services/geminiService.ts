import { GoogleGenAI } from "@google/genai";
import { IssuePriority } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to determine model based on complexity, though flash is usually sufficient for text
const TEXT_MODEL = 'gemini-2.5-flash'; 

export const enhanceDescription = async (title: string, currentDescription: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
    Act as a professional Project Manager and QA lead.
    Rewrite and expand the following issue description to be clearer, more structured, and actionable.
    Include a summary, acceptance criteria, and technical notes if implied.
    
    Issue Title: "${title}"
    Current Draft: "${currentDescription}"

    Return ONLY the improved Markdown content. Do not include introductory text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    return response.text || currentDescription;
  } catch (error) {
    console.error("Gemini enhance error:", error);
    throw error;
  }
};

export const suggestPriority = async (title: string, description: string): Promise<IssuePriority> => {
  if (!apiKey) return IssuePriority.MEDIUM;

  const prompt = `
    Analyze the following software issue and assign a priority level (LOW, MEDIUM, HIGH, CRITICAL).
    
    Title: ${title}
    Description: ${description}

    Return ONLY the priority string value.
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    const text = response.text?.trim().toUpperCase();
    if (text && Object.values(IssuePriority).includes(text as IssuePriority)) {
        return text as IssuePriority;
    }
    return IssuePriority.MEDIUM;
  } catch (error) {
    console.error("Gemini priority error:", error);
    return IssuePriority.MEDIUM;
  }
};

export const generateSubtasks = async (title: string, description: string): Promise<string[]> => {
    if (!apiKey) throw new Error("API Key missing");
  
    const prompt = `
      Given the following software task, break it down into 3-5 concise, actionable sub-tasks.
      
      Task: ${title}
      Context: ${description}
  
      Return the response as a JSON array of strings. Example: ["Setup repo", "Install dependencies"].
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
      });
      
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text) as string[];
    } catch (error) {
      console.error("Gemini subtask error:", error);
      return [];
    }
  };
