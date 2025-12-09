import React, { useState, useEffect } from 'react';
import { Issue, IssuePriority, IssueStatus, User, Project } from '../types';
import { Icons } from '../constants';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (issue: Partial<Issue>) => void;
  initialIssue?: Issue;
  project: Project;
  users: User[];
  isDarkMode: boolean;
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onSave, initialIssue, project, users, isDarkMode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.TODO);
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState<string>('');
  
  useEffect(() => {
    if (initialIssue) {
      setTitle(initialIssue.title);
      setDescription(initialIssue.description);
      setStatus(initialIssue.status);
      setPriority(initialIssue.priority);
      setAssigneeId(initialIssue.assigneeId || '');
    } else {
      // Reset for new issue
      setTitle('');
      setDescription('');
      setStatus(IssueStatus.TODO);
      setPriority(IssuePriority.MEDIUM);
      setAssigneeId('');
    }
  }, [initialIssue, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...(initialIssue || {}),
      title,
      description,
      status,
      priority,
      assigneeId,
      projectId: project.id,
    });
    onClose();
  };

  const modalBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const labelColor = isDarkMode ? 'text-slate-400' : 'text-slate-700';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className={`${modalBg} rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-slate-200/20`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
               {project.key} / {initialIssue ? initialIssue.key : 'NEW ISSUE'}
            </span>
            <h2 className={`text-xl font-semibold ${textColor} mt-1`}>
              {initialIssue ? 'Edit Issue' : 'Create Issue'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors text-slate-500">
            <Icons.X />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Title Input */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${labelColor}`}>Summary</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-slate-900"
            />
          </div>

          {/* Description */}
          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <label className={`text-sm font-medium ${labelColor}`}>Description</label>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              className="w-full h-40 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm resize-none bg-white text-slate-900"
            />
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Status */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${labelColor}`}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                {Object.values(IssueStatus).map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${labelColor}`}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                {Object.values(IssueStatus).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {Object.values(IssuePriority).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className={`text-sm font-medium ${labelColor}`}>Assignee</label>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setAssigneeId(user.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                      assigneeId === user.id
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20 text-blue-800'
                        : isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-500' 
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                    <span className="text-sm">{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${borderColor} ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} flex justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
          >
            {initialIssue ? 'Save Changes' : 'Create Issue'}
          </button>
        </div>

      </div>
    </div>
  );
};