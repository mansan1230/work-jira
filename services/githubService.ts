import { Project, Issue, User } from '../types';

interface AppData {
  projects: Project[];
  users: User[];
  issues: Issue[];
}

const GIST_FILENAME = 'mips-work-group-data.json';
const GIST_DESCRIPTION = 'MIPS Work Group - Project Data Sync';

export const saveToGist = async (token: string, data: AppData, existingGistId?: string): Promise<string> => {
  const url = existingGistId 
    ? `https://api.github.com/gists/${existingGistId}`
    : `https://api.github.com/gists`;

  const method = existingGistId ? 'PATCH' : 'POST';

  const payload = {
    description: GIST_DESCRIPTION,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(data, null, 2)
      }
    }
  };

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.id;
};

export const loadFromGist = async (token: string, gistId: string): Promise<AppData> => {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const file = result.files[GIST_FILENAME];

  if (!file || !file.content) {
    throw new Error('Invalid Gist: mips-work-group-data.json not found');
  }

  return JSON.parse(file.content);
};