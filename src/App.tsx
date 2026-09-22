import React, { useState, useEffect } from 'react';
import { 
  Beaker, Settings, LayoutDashboard, HelpCircle, Menu, X, FolderOpen, Zap,
  Download, Upload, Check, FileDown, Sparkles, AlertCircle
} from 'lucide-react';
import WiringBridge from './components/WiringBridge';
import ContextEngine from './components/ContextEngine';
import ActivityGenerator from './components/ActivityGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { SavedProject } from './constants';
import { TimerProvider } from './context/TimerContext';
import FloatingTimer from './components/FloatingTimer';

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

  // Load saved projects and active project from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('steam_saved_projects');
    if (stored) {
      try {
        setSavedProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved projects", e);
      }
    }
    const activeStored = localStorage.getItem('steam_active_project');
    if (activeStored) {
      try {
        setCurrentProject(JSON.parse(activeStored));
      } catch (e) {
        console.error("Failed to parse active project", e);
      }
    }
  }, []);

  const saveProject = (project: SavedProject) => {
    setSavedProjects(prev => {
      const updated = [project, ...prev.filter(p => p.id !== project.id)];
      localStorage.setItem('steam_saved_projects', JSON.stringify(updated));
      return updated;
    });
    localStorage.setItem('steam_active_project', JSON.stringify(project));
  };

  const handleProjectChange = (project: SavedProject | null) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('steam_active_project', JSON.stringify(project));
    } else {
      localStorage.removeItem('steam_active_project');
    }
  };

  const deleteProject = (id: string) => {
    setSavedProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('steam_saved_projects', JSON.stringify(updated));
      return updated;
    });
    if (currentProject?.id === id) {
      setCurrentProject(null);
      localStorage.removeItem('steam_active_project');
      localStorage.removeItem('steam_custom_builder_draft');
    }
  };

  const [exportedId, setExportedId] = useState<string | null>(null);
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const exportProjectAsJSON = (project: SavedProject) => {
    try {
      const exportPayload = {
        format: "steam_project_backup",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        project: {
          id: project.id,
          name: project.name,
          timestamp: project.timestamp,
          selectedComponentIds: project.selectedComponentIds,
          intent: project.intent,
          resistorValue: project.resistorValue,
          resistors: project.resistors,
          result: project.result
        }
      };
      const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      const cleanName = (project.name || 'steam_project')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_');
      downloadAnchor.setAttribute("download", `${cleanName || 'project'}_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportedId(project.id);
      setTimeout(() => setExportedId(null), 2500);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleImportJSON = (file: File) => {
    setImportNotification(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const importedProj: SavedProject = parsed.project || parsed;

        if (!importedProj || !importedProj.intent || !Array.isArray(importedProj.selectedComponentIds)) {
          throw new Error("Invalid project structure. The JSON file must contain selectedComponentIds and intent.");
        }

        const newId = Math.random().toString(36).substring(2, 11);
        const validatedProject: SavedProject = {
          id: newId,
          name: (importedProj.name || 'Imported STEAM Project') + ' (Imported)',
          timestamp: Date.now(),
          selectedComponentIds: importedProj.selectedComponentIds,
          intent: importedProj.intent,
          resistorValue: importedProj.resistorValue,
          resistors: importedProj.resistors,
          result: importedProj.result || { connections: [], code: '', wires: [] }
        };

        saveProject(validatedProject);
        setCurrentProject(validatedProject);
        setImportNotification({
          type: 'success',
          message: `Successfully imported "${validatedProject.name}"!`
        });
        setTimeout(() => setImportNotification(null), 4000);
      } catch (err: any) {
        console.error("Failed to import JSON project", err);
        setImportNotification({
          type: 'error',
          message: err.message || "Failed to parse JSON file."
        });
        setTimeout(() => setImportNotification(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'wiring', label: 'Custom Builder', icon: LayoutDashboard },
    { id: 'saved', label: 'Saved Projects', icon: FolderOpen },
    { id: 'context', label: 'Context Engine', icon: Beaker },
    { id: 'activity', label: 'Level-Up', icon: Settings },
  ] as const;

  return (
    <TimerProvider>
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
                  <span className="text-xs font-medium">Self-Processing Engine</span>
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
                    onProjectChange={handleProjectChange}
                  />
                )}
                {activeTab === 'saved' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <FolderOpen className="text-lab-accent w-5 h-5" />
                          Saved Projects
                        </h2>
                        <p className="text-sm text-lab-muted">Manage, export, and backup your circuit designs and code</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Export Current Project configuration button if active project exists */}
                        {currentProject && (
                          <button
                            onClick={() => exportProjectAsJSON(currentProject)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-lab-accent text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-md shadow-lab-accent/20"
                            title="Export currently active project configuration as JSON"
                          >
                            {exportedId === currentProject.id ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Exported!</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Export Current ({currentProject.name.slice(0, 16)}{currentProject.name.length > 16 ? '...' : ''})</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Import JSON file button */}
                        <label className="flex items-center gap-2 px-3.5 py-2 bg-lab-card hover:bg-white/5 border border-lab-border text-lab-text rounded-xl text-xs font-bold cursor-pointer transition-all">
                          <Upload className="w-4 h-4 text-lab-accent" />
                          <span>Import (.json)</span>
                          <input
                            type="file"
                            accept=".json,application/json"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImportJSON(file);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Import Notification Banner */}
                    {importNotification && (
                      <div className={cn(
                        "rounded-xl px-4 py-3 flex items-center justify-between text-xs border transition-all",
                        importNotification.type === 'success' 
                          ? "bg-green-500/10 border-green-500/30 text-green-400" 
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      )}>
                        <div className="flex items-center gap-2">
                          {importNotification.type === 'success' ? (
                            <Check className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{importNotification.message}</span>
                        </div>
                        <button 
                          onClick={() => setImportNotification(null)}
                          className="hover:underline font-bold text-xs"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedProjects.map(project => {
                        const isCurrent = currentProject?.id === project.id;
                        const isExported = exportedId === project.id;

                        return (
                          <div 
                            key={project.id} 
                            className={cn(
                              "bg-lab-card border rounded-2xl p-6 flex flex-col justify-between transition-all",
                              isCurrent ? "border-lab-accent/60 shadow-lg shadow-lab-accent/5" : "border-lab-border"
                            )}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg">{project.name}</h3>
                                  {isCurrent && (
                                    <span className="text-[9px] bg-lab-accent/20 text-lab-accent px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-lab-muted font-mono whitespace-nowrap">
                                  {new Date(project.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(project.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-lab-muted line-clamp-2 mb-4">{project.intent}</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {project.selectedComponentIds.map(id => {
                                  const isRes = id === 'resistor' || id === 'resistor-330';
                                  if (isRes) {
                                    if (project.resistors && project.resistors.length > 0) {
                                      const summary = project.resistors.length === 1 
                                        ? `${project.resistors[0].value} Resistor`
                                        : `${project.resistors.length} Resistors (${project.resistors.map(r => `${r.id}: ${r.value}`).join(', ')})`;
                                      return (
                                        <span key={id} className="text-[10px] bg-lab-accent/10 text-lab-accent px-2 py-1 rounded-md uppercase font-bold">
                                          {summary}
                                        </span>
                                      );
                                    }
                                    const label = project.resistorValue ? `${project.resistorValue} Resistor` : 'Resistor';
                                    return (
                                      <span key={id} className="text-[10px] bg-lab-accent/10 text-lab-accent px-2 py-1 rounded-md uppercase font-bold">
                                        {label}
                                      </span>
                                    );
                                  }
                                  const label = id === 'ds18b20' ? 'DS18B20 Temp' : id;
                                  return (
                                    <span key={id} className="text-[10px] bg-lab-accent/10 text-lab-accent px-2 py-1 rounded-md uppercase font-bold">
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-lab-border/40">
                              <button 
                                onClick={() => {
                                  setCurrentProject(project);
                                  setActiveTab('wiring');
                                }}
                                className="flex-1 bg-lab-accent text-white py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
                              >
                                Load Project
                              </button>
                              
                              {/* Export JSON button */}
                              <button
                                onClick={() => exportProjectAsJSON(project)}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all",
                                  isExported 
                                    ? "bg-green-500/20 text-green-400 border-green-500/40" 
                                    : "bg-lab-card hover:bg-white/5 border-lab-border text-lab-text hover:text-white"
                                )}
                                title="Download project configuration as JSON"
                              >
                                {isExported ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Download className="w-3.5 h-3.5 text-lab-accent" />}
                                <span>{isExported ? 'Exported' : 'Export JSON'}</span>
                              </button>

                              <button 
                                onClick={() => deleteProject(project.id)}
                                className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                                title="Delete project"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {savedProjects.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-lab-card/50 border border-dashed border-lab-border rounded-2xl">
                          <FolderOpen className="w-10 h-10 text-lab-muted mx-auto mb-4" />
                          <p className="text-lab-muted mb-2">No saved projects yet.</p>
                          <p className="text-xs text-lab-muted">Build a project in Custom Builder or import a project JSON file above!</p>
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

        {/* Global Floating Timer */}
        <FloatingTimer />
      </div>
    </TimerProvider>
  );
}
