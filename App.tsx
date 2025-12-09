import React, { useState, useEffect } from 'react';
import { INITIAL_PROJECTS, INITIAL_ISSUES, INITIAL_USERS, Icons } from './constants';
import { Issue, IssueStatus, IssuePriority, Project, User } from './types';
import { IssueModal } from './components/IssueModal';
import { GistModal } from './components/GistModal';
import { saveToGist, loadFromGist } from './services/githubService';

const StatusBadge = ({ status, isDarkMode }: { status: IssueStatus, isDarkMode: boolean }) => {
  const styles = {
    [IssueStatus.TODO]: isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200',
    [IssueStatus.IN_PROGRESS]: isDarkMode ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-700 border-blue-200',
    [IssueStatus.REVIEW]: isDarkMode ? 'bg-purple-900/30 text-purple-400 border-purple-900/50' : 'bg-purple-50 text-purple-700 border-purple-200',
    [IssueStatus.DONE]: isDarkMode ? 'bg-green-900/30 text-green-400 border-green-900/50' : 'bg-green-50 text-green-700 border-green-200',
  };

  const icons = {
    [IssueStatus.TODO]: <Icons.Circle />,
    [IssueStatus.IN_PROGRESS]: <Icons.Clock />,
    [IssueStatus.REVIEW]: <Icons.AlertCircle />,
    [IssueStatus.DONE]: <Icons.CheckCircle2 />,
  };

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${styles[status]}`}>
       <span className="w-3.5 h-3.5">{icons[status]}</span>
      {status.replace('_', ' ')}
    </span>
  );
};

const PriorityIcon = ({ priority }: { priority: IssuePriority }) => {
  const colors = {
    [IssuePriority.LOW]: 'text-slate-400',
    [IssuePriority.MEDIUM]: 'text-blue-500',
    [IssuePriority.HIGH]: 'text-orange-500',
    [IssuePriority.CRITICAL]: 'text-red-600',
  };
  return (
    <svg className={`w-4 h-4 ${colors[priority]}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z" />
    </svg>
  );
};

export default function App() {
  // --- STATE ---
  
  // Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('mips_theme');
      return saved ? saved === 'dark' : false;
    } catch { return false; }
  });

  // Projects
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('mips_projects');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch { return INITIAL_PROJECTS; }
  });

  // Users
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('mips_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch { return INITIAL_USERS; }
  });

  // Issues
  const [issues, setIssues] = useState<Issue[]>(() => {
    try {
      const saved = localStorage.getItem('mips_issues');
      return saved ? JSON.parse(saved) : INITIAL_ISSUES;
    } catch { return INITIAL_ISSUES; }
  });

  // GitHub Sync State
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('mips_gh_token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('mips_gist_id') || '');
  const [isGistModalOpen, setIsGistModalOpen] = useState(false);

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
     return projects.length > 0 ? projects[0].id : '';
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>(undefined);
  
  // Adding UI state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  // Drag and Drop State
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);

  // --- PERSISTENCE ---

  useEffect(() => localStorage.setItem('mips_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('mips_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('mips_issues', JSON.stringify(issues)), [issues]);
  useEffect(() => localStorage.setItem('mips_theme', isDarkMode ? 'dark' : 'light'), [isDarkMode]);
  useEffect(() => localStorage.setItem('mips_gh_token', githubToken), [githubToken]);
  useEffect(() => localStorage.setItem('mips_gist_id', gistId), [gistId]);

  // --- GLOBAL KEY LISTENERS (ESC) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) setIsModalOpen(false);
        if (isGistModalOpen) setIsGistModalOpen(false);
        if (isAddingProject) setIsAddingProject(false);
        if (isAddingUser) setIsAddingUser(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isAddingProject, isAddingUser, isGistModalOpen]);

  useEffect(() => {
    // If active project was deleted or doesn't exist, switch to first one
    if (projects.length > 0 && !projects.find(p => p.id === activeProjectId)) {
        setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  // --- HANDLERS ---

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  
  const projectIssues = activeProject 
    ? issues.filter(i => {
        const matchesProject = i.projectId === activeProject.id;
        if (!searchQuery) return matchesProject;
        const query = searchQuery.toLowerCase();
        return matchesProject && (
            i.title.toLowerCase().includes(query) || 
            i.key.toLowerCase().includes(query)
        );
      }) 
    : [];

  const handleCreateIssue = () => {
    setEditingIssue(undefined);
    setIsModalOpen(true);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setIsModalOpen(true);
  };

  const handleSaveIssue = (issueData: Partial<Issue>) => {
    if (!activeProject) return;
    
    if (editingIssue) {
      // Update
      setIssues(prev => prev.map(i => i.id === editingIssue.id ? { ...i, ...issueData } as Issue : i));
    } else {
      // Create
      const newIssue: Issue = {
        id: Math.random().toString(36).substr(2, 9),
        key: `${activeProject.key}-${Math.floor(Math.random() * 1000) + 100}`,
        createdAt: new Date().toISOString(),
        comments: [],
        projectId: activeProject.id,
        title: issueData.title!,
        description: issueData.description || '',
        status: issueData.status || IssueStatus.TODO,
        priority: issueData.priority || IssuePriority.MEDIUM,
        assigneeId: issueData.assigneeId
      };
      setIssues(prev => [...prev, newIssue]);
    }
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) {
        setIsAddingProject(false);
        return;
    }
    const newProject: Project = {
        id: 'p-' + Math.random().toString(36).substr(2, 6),
        key: newProjectName.substring(0, 3).toUpperCase(),
        name: newProjectName,
        description: '',
        icon: '📁'
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setNewProjectName('');
    setIsAddingProject(false);
  };

  const handleRemoveProject = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this project?')) {
          setProjects(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleAddUser = () => {
    if (!newUserName.trim()) {
        setIsAddingUser(false);
        return;
    }
    const newUser: User = {
        id: 'u-' + Math.random().toString(36).substr(2, 6),
        name: newUserName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUserName)}&background=random`
    };
    setUsers(prev => [...prev, newUser]);
    setNewUserName('');
    setIsAddingUser(false);
  };

  const handleRemoveUser = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to remove this user?')) {
          setUsers(prev => prev.filter(u => u.id !== id));
      }
  };

  // --- JSON EXPORT / IMPORT ---
  
  const handleExport = () => {
    const data = { projects, users, issues };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mips-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (json.projects && json.users && json.issues) {
             if (confirm('This will replace all current data. Continue?')) {
                setProjects(json.projects);
                setUsers(json.users);
                setIssues(json.issues);
                alert('Data imported successfully!');
             }
          } else {
             alert('Invalid backup file format.');
          }
        } catch (err) {
          alert('Error parsing JSON file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
      if (confirm('Are you sure you want to wipe all data and reset to defaults?')) {
          setProjects(INITIAL_PROJECTS);
          setUsers(INITIAL_USERS);
          setIssues(INITIAL_ISSUES);
      }
  };

  // --- GIST SYNC ---
  const handleGistSave = async (token: string, existingId: string, isSecret: boolean) => {
      setGithubToken(token);
      // isSecret means public=false
      const newId = await saveToGist(token, { projects, users, issues }, existingId, !isSecret);
      setGistId(newId); // Update stored ID if it was a new creation
  };

  const handleGistLoad = async (token: string, id: string) => {
      setGithubToken(token);
      setGistId(id);
      const data = await loadFromGist(token, id);
      setProjects(data.projects);
      setUsers(data.users);
      setIssues(data.issues);
  };

  // --- DRAG AND DROP ---
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedIssueId(id);
      e.dataTransfer.effectAllowed = 'move';
      e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
      e.currentTarget.classList.remove('opacity-50');
      setDraggedIssueId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: IssueStatus) => {
      e.preventDefault();
      if (!draggedIssueId) return;

      setIssues(prev => prev.map(issue => {
          if (issue.id === draggedIssueId) {
              return { ...issue, status };
          }
          return issue;
      }));
  };

  const Avatar = ({ userId }: { userId?: string }) => {
    const user = users.find(u => u.id === userId);
    if (!user) return <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />;
    return (
      <img 
        src={user.avatar} 
        alt={user.name} 
        title={user.name}
        className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
      />
    );
  };

  const COLUMNS = Object.values(IssueStatus);

  // Dynamic Classes
  const bgClass = isDarkMode ? 'bg-slate-950' : 'bg-slate-50';
  const textClass = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const headerClass = isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const boardClass = isDarkMode ? 'bg-slate-950' : 'bg-slate-50/50';
  const columnClass = isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/50 border-slate-200/60';
  const cardClass = isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300';
  const cardTextClass = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const cardSubtextClass = isDarkMode ? 'text-slate-500' : 'text-slate-500';

  if (!activeProject && projects.length === 0) {
      return (
          <div className={`flex items-center justify-center h-screen ${bgClass} flex-col gap-4`}>
              <h1 className={`text-2xl font-bold ${textClass}`}>MIPS Work Group</h1>
              <p className="text-slate-500">No projects found. Please add a project to get started.</p>
              <button 
                onClick={() => setIsAddingProject(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                  Create Project
              </button>
              {isAddingProject && (
                   <div className="flex gap-2">
                       <input 
                         autoFocus
                         className="border border-slate-300 p-2 rounded bg-white text-slate-900" 
                         value={newProjectName} 
                         onChange={e => setNewProjectName(e.target.value)} 
                         onKeyDown={e => e.key === 'Enter' && handleAddProject()}
                         placeholder="Project Name"
                       />
                       <button onClick={handleAddProject} className="text-blue-600">Add</button>
                   </div>
              )}
          </div>
      );
  }

  return (
    <div className={`flex h-screen w-full ${bgClass} ${textClass} font-sans transition-colors duration-200`}>
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <span className="font-bold text-white text-lg tracking-tight">MIPS Group</span>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</h3>
                <button 
                    onClick={() => setIsAddingProject(true)} 
                    className="text-slate-500 hover:text-blue-400 transition-colors"
                    title="Add Project"
                >
                    <Icons.Plus />
                </button>
            </div>
            
            {isAddingProject && (
                <div className="mb-3 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                        autoFocus
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddProject();
                            if (e.key === 'Escape') setIsAddingProject(false);
                        }}
                        onBlur={() => !newProjectName && setIsAddingProject(false)}
                        placeholder="Project Name..."
                        className="w-full bg-white text-slate-900 text-sm px-3 py-1.5 rounded border border-blue-500/50 focus:outline-none focus:border-blue-500"
                    />
                </div>
            )}

            <ul className="space-y-1">
              {projects.map(project => (
                <li key={project.id} className="group relative">
                  <button
                    onClick={() => setActiveProjectId(project.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all pr-8 ${
                      activeProjectId === project.id 
                        ? 'bg-blue-600/10 text-blue-400 font-medium' 
                        : 'hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <span className="text-lg">{project.icon}</span>
                    <span className="truncate">{project.name}</span>
                  </button>
                  <button 
                    onClick={(e) => handleRemoveProject(e, project.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  >
                      <Icons.Trash />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Team Section */}
          <div>
             <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team</h3>
                <button 
                    onClick={() => setIsAddingUser(true)} 
                    className="text-slate-500 hover:text-blue-400 transition-colors"
                    title="Add Team Member"
                >
                    <Icons.UserPlus />
                </button>
             </div>
             
             {isAddingUser && (
                <div className="mb-3 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                        autoFocus
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddUser();
                            if (e.key === 'Escape') setIsAddingUser(false);
                        }}
                        onBlur={() => !newUserName && setIsAddingUser(false)}
                        placeholder="Member Name..."
                        className="w-full bg-white text-slate-900 text-sm px-3 py-1.5 rounded border border-blue-500/50 focus:outline-none focus:border-blue-500"
                    />
                </div>
             )}

             <ul className="space-y-1">
                {users.map(u => (
                  <li key={u.id} className="group relative">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-all pr-8">
                         <img src={u.avatar} className="w-5 h-5 rounded-full border border-slate-600" title={u.name} />
                         <span className="truncate text-slate-300 text-sm">{u.name}</span>
                      </div>
                      <button 
                        onClick={(e) => handleRemoveUser(e, u.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                          <Icons.Trash />
                      </button>
                  </li>
                ))}
             </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
           <div className="flex gap-2">
              <button onClick={handleExport} className="text-slate-500 hover:text-slate-300" title="Export JSON"><Icons.Download /></button>
              <button onClick={handleImport} className="text-slate-500 hover:text-slate-300" title="Import JSON"><Icons.Upload /></button>
              <button onClick={() => setIsGistModalOpen(true)} className="text-slate-500 hover:text-slate-300" title="Sync with GitHub"><Icons.Github /></button>
           </div>
           <button onClick={handleReset} className="text-slate-700 hover:text-red-500" title="Reset All"><Icons.Refresh /></button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Bar */}
        <header className={`h-16 ${headerClass} flex items-center justify-between px-8 flex-shrink-0 z-10 transition-colors`}>
          <div className="flex items-center gap-4">
            <h1 className={`text-xl font-bold ${textClass}`}>{activeProject ? activeProject.name : 'Select Project'}</h1>
            <span className="text-slate-400">/</span>
            <span className="text-sm font-medium text-slate-500">Board</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Icons.Search />
                 </div>
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search issues..." 
                    className="pl-10 pr-4 py-1.5 text-sm bg-white text-slate-900 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all w-64 shadow-sm"
                 />
            </div>
            
            {/* Dark Mode Toggle */}
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>

            <button 
                onClick={handleCreateIssue}
                disabled={!activeProject}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-all active:scale-95"
            >
              <Icons.Plus />
              Create Issue
            </button>
          </div>
        </header>

        {/* Board Area */}
        <div className={`flex-1 overflow-x-auto overflow-y-hidden p-8 ${boardClass} transition-colors`}>
           <div className="flex h-full gap-6 min-w-max">
              {COLUMNS.map(status => {
                  const columnIssues = projectIssues.filter(i => i.status === status);
                  
                  return (
                    <div 
                        key={status} 
                        className={`w-80 flex flex-col h-full rounded-xl border transition-colors ${columnClass}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status as IssueStatus)}
                    >
                        {/* Column Header */}
                        <div className="p-4 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                {status.replace('_', ' ')}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>{columnIssues.length}</span>
                            </h3>
                            <button className="text-slate-400 hover:text-slate-600"><Icons.MoreHorizontal /></button>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar space-y-3">
                            {columnIssues.length === 0 ? (
                                <div className={`h-24 flex items-center justify-center border-2 border-dashed rounded-lg text-sm ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                                    No issues
                                </div>
                            ) : (
                                columnIssues.map(issue => (
                                    <div 
                                        key={issue.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, issue.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleEditIssue(issue)}
                                        className={`p-4 rounded-lg shadow-sm border transition-all cursor-grab active:cursor-grabbing group ${cardClass}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-medium hover:underline ${cardSubtextClass} hover:text-blue-500`}>{issue.key}</span>
                                        </div>
                                        
                                        <h4 className={`text-sm font-semibold ${issue.description ? 'mb-1' : 'mb-3'} line-clamp-2 leading-snug ${cardTextClass}`}>{issue.title}</h4>
                                        
                                        {issue.description && (
                                            <p className={`text-xs mb-3 line-clamp-3 ${cardSubtextClass}`}>
                                                {issue.description}
                                            </p>
                                        )}
                                        
                                        <div className={`flex items-center justify-between mt-auto pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <PriorityIcon priority={issue.priority} />
                                                <StatusBadge status={issue.status} isDarkMode={isDarkMode} />
                                            </div>
                                            <Avatar userId={issue.assigneeId} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                  );
              })}
           </div>
        </div>
      </main>

      {activeProject && (
        <IssueModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveIssue}
            initialIssue={editingIssue}
            project={activeProject}
            users={users}
            isDarkMode={isDarkMode}
        />
      )}

      <GistModal
        isOpen={isGistModalOpen}
        onClose={() => setIsGistModalOpen(false)}
        onSave={handleGistSave}
        onLoad={handleGistLoad}
        initialToken={githubToken}
        initialGistId={gistId}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
