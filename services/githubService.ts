import { Project, Issue, User } from '../types';

interface AppData {
  projects: Project[];
  users: User[];
  issues: Issue[];
}

const GIST_FILENAME = 'mips-work-group-data.json';
const GIST_DESCRIPTION = 'MIPS Work Group - Project Data Sync';

/**
 * Saves data to GitHub Gist.
 * @param isPublic If creating a new Gist, determines if it is public. Default is false (Secret).
 */
export const saveToGist = async (token: string, data: AppData, existingGistId?: string, isPublic: boolean = false): Promise<string> => {
  const url = existingGistId 
    ? `https://api.github.com/gists/${existingGistId}`
    : `https://api.github.com/gists`;

  const method = existingGistId ? 'PATCH' : 'POST';

  const payload: any = {
    description: GIST_DESCRIPTION,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(data, null, 2)
      }
    }
  };

  // Only set 'public' when creating a NEW gist. 
  // GitHub API does not allow changing privacy via PATCH.
  if (!existingGistId) {
    payload.public = isPublic;
  }

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
