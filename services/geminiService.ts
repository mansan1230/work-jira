import { IssuePriority } from "../types";

// AI Features have been disabled/removed as requested.
// These functions are kept as placeholders to prevent breaking import references.
// Parameters are prefixed with underscore to prevent TypeScript "unused parameter" errors.

export const enhanceDescription = async (_title: string, currentDescription: string): Promise<string> => {
  return currentDescription;
};

export const suggestPriority = async (_title: string, _description: string): Promise<IssuePriority> => {
  return IssuePriority.MEDIUM;
};

export const generateSubtasks = async (_title: string, _description: string): Promise<string[]> => {
  return [];
};
