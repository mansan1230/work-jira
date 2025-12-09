import React, { useState } from 'react';
import { Icons } from '../constants';

interface GistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: string, gistId: string) => Promise<void>;
  onLoad: (token: string, gistId: string) => Promise<void>;
  initialToken: string;
  initialGistId: string;
  isDarkMode: boolean;
}

export const GistModal: React.FC<GistModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onLoad, 
  initialToken, 
  initialGistId, 
  isDarkMode 
}) => {
  const [token, setToken] = useState(initialToken);
  const [gistId, setGistId] = useState(initialGistId);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!token) {
        setMessage({ type: 'error', text: 'Personal Access Token is required to save.' });
        return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await onSave(token, gistId);
      setMessage({ type: 'success', text: 'Successfully saved to GitHub Gist!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!token && !gistId) {
        setMessage({ type: 'error', text: 'Token and Gist ID are required.' });
        return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await onLoad(token, gistId);
      setMessage({ type: 'success', text: 'Successfully loaded data!' });
      setTimeout(onClose, 1500); // Close after success
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load' });
    } finally {
      setIsLoading(false);
    }
  };

  const modalBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const labelColor = isDarkMode ? 'text-slate-400' : 'text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className={`${modalBg} rounded-xl shadow-2xl w-full max-w-md p-6 border`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${textColor} flex items-center gap-2`}>
            <Icons.Github /> GitHub Gist Sync
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-400">
            <Icons.X />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-xs font-medium uppercase mb-1 ${labelColor}`}>
              Personal Access Token
            </label>
            <input 
              type="password" 
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full bg-white text-slate-900 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              placeholder="ghp_..."
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Token must have <code>gist</code> scope permissions.
            </p>
          </div>

          <div>
            <label className={`block text-xs font-medium uppercase mb-1 ${labelColor}`}>
              Gist ID
            </label>
            <input 
              type="text" 
              value={gistId}
              onChange={e => setGistId(e.target.value)}
              className="w-full bg-white text-slate-900 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              placeholder="e.g. 8f44..."
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Leave empty to create a new Gist when saving.
            </p>
          </div>
          
          {message && (
            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              onClick={handleLoad}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-colors ${isDarkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-50 text-slate-700'}`}
            >
              <Icons.Download /> Download
            </button>
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 transition-colors"
            >
              <Icons.Upload /> Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};