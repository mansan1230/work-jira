export enum IssueStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  key: string; // e.g. PROJ-1
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string;
  createdAt: string;
  comments: Comment[];
}

export interface Project {
  id: string;
  key: string; // e.g. PROJ
  name: string;
  description: string;
  icon: string; // emoji
}

export interface GeminiResponse {
  text: string;
}
