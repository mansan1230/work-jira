import { IssuePriority } from "../types";

// AI Features have been disabled/removed as requested.
// These functions are kept as placeholders to prevent breaking import references.

export const enhanceDescription = async (title: string, currentDescription: string): Promise<string> => {
  return currentDescription;
};

export const suggestPriority = async (title: string, description: string): Promise<IssuePriority> => {
  return IssuePriority.MEDIUM;
};

export const generateSubtasks = async (title: string, description: string): Promise<string[]> => {
  return [];
};
