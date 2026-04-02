import React, { useState, useEffect } from 'react';
import { Beaker, Settings, LayoutDashboard, HelpCircle, Menu, X, FolderOpen, Zap } from 'lucide-react';
import WiringBridge from './components/WiringBridge';
import ContextEngine from './components/ContextEngine';
import ActivityGenerator from './components/ActivityGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { SavedProject } from './constants';

const Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3L21 12L12 21L3 12L12 3Z" />
    <path d="M12 8L16 12L12 16L8 12L12 8Z" />
    <path d="M10 12h4" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'wiring' | 'context' | 'activity' | 'saved'>('wiring');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  // Load saved projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('steam_saved_projects');
    if (stored) {
      try {
        setSavedProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved projects", e);
      }
    }
  }, []);

  const saveProject = (project: SavedProject) => {
    const updated = [project, ...savedProjects.filter(p => p.id !== project.id)];
    setSavedProjects(updated);
    localStorage.setItem('steam_saved_projects', JSON.stringify(updated));
  };

  const deleteProject = (id: string) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('steam_saved_projects', JSON.stringify(updated));
  };

  const tabs = [
    { id: 'wiring', label: 'Custom Builder', icon: LayoutDashboard },
    { id: 'saved', label: 'Saved Projects', icon: FolderOpen },
    { id: 'context', label: 'Context Engine', icon: Beaker },
    { id: 'activity', label: 'Level-Up', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-lab-bg flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-lab-card border-b border-lab-border p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lab-accent rounded flex items-center justify-center">
            <Logo className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-sm tracking-tight">STEAM LAB</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-lab-card border-r border-lab-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-lab-accent rounded-lg flex items-center justify-center shadow-lg shadow-lab-accent/20">
              <Logo className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">STEAM</h1>
              <span className="text-[10px] text-lab-muted font-bold tracking-widest uppercase">Lab</span>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id 
                    ? "bg-lab-accent text-white shadow-lg shadow-lab-accent/10" 
                    : "text-lab-muted hover:bg-white/5 hover:text-lab-text"
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-lab-border">
            <div className="bg-black/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-lab-muted uppercase">
                <HelpCircle className="w-3 h-3" />
                Lab Status
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium">AI Engine Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'wiring' && (
                <WiringBridge 
                  onSave={saveProject} 
                  initialProject={currentProject} 
                  onProjectChange={setCurrentProject}
                />
              )}
              {activeTab === 'saved' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Saved Projects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedProjects.map(project => (
                      <div key={project.id} className="bg-lab-card border border-lab-border rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-2">{project.name}</h3>
                          <p className="text-sm text-lab-muted line-clamp-2 mb-4">{project.intent}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.selectedComponentIds.map(id => (
                              <span key={id} className="text-[10px] bg-lab-accent/10 text-lab-accent px-2 py-1 rounded-md uppercase font-bold">
                                {id}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setCurrentProject(project);
                              setActiveTab('wiring');
                            }}
                            className="flex-1 bg-lab-accent text-white py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
                          >
                            Load Project
                          </button>
                          <button 
                            onClick={() => deleteProject(project.id)}
                            className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {savedProjects.length === 0 && (
                      <div className="col-span-full text-center py-20 bg-lab-card/50 border border-dashed border-lab-border rounded-2xl">
                        <FolderOpen className="w-10 h-10 text-lab-muted mx-auto mb-4" />
                        <p className="text-lab-muted">No saved projects yet. Create one in the Custom Builder!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'context' && <ContextEngine currentProject={currentProject} />}
              {activeTab === 'activity' && (
                <ActivityGenerator currentProject={currentProject} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
