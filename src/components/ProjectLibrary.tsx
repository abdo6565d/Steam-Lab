import React, { useState } from 'react';
import { Project, PROJECTS, Difficulty } from '../constants';
import { Library, Search, Plus, Filter, Tag, Cpu, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ProjectLibrary() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  const [isAddingProject, setIsAddingProject] = useState(false);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Library className="text-lab-accent w-5 h-5" />
            Project Library
          </h2>
          <p className="text-sm text-lab-muted">Manage and explore STEAM curriculum</p>
        </div>
        <button
          onClick={() => setIsAddingProject(true)}
          className="bg-lab-accent hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lab-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-lab-card border border-lab-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent"
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                selectedDifficulty === diff 
                  ? "bg-lab-accent border-lab-accent text-white" 
                  : "bg-lab-card border-lab-border text-lab-muted hover:border-lab-muted"
              )}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-lab-card border border-lab-border rounded-2xl p-5 flex flex-col group hover:border-lab-accent/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                  project.difficulty === 'Beginner' ? "bg-green-500/10 text-green-400" :
                  project.difficulty === 'Intermediate' ? "bg-orange-500/10 text-orange-400" :
                  "bg-purple-500/10 text-purple-400"
                )}>
                  {project.difficulty}
                </div>
                <span className="text-[10px] font-bold text-lab-muted uppercase tracking-widest">{project.subject}</span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-lab-accent transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-lab-muted line-clamp-2 mb-4 flex-1">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] bg-black/30 text-lab-muted px-2 py-1 rounded border border-lab-border">
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-lab-border mt-auto">
                <div className="flex items-center gap-2 text-xs text-lab-muted">
                  <Cpu className="w-3.5 h-3.5" />
                  {project.components.length} Components
                </div>
                <button className="text-lab-accent hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isAddingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-lab-card border border-lab-border rounded-2xl w-full max-w-lg p-6 space-y-4"
          >
            <h3 className="text-xl font-bold">Add New Project</h3>
            <div className="space-y-3">
              <input placeholder="Project Name" className="w-full bg-black/30 border border-lab-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent" />
              <textarea placeholder="Description" className="w-full bg-black/30 border border-lab-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent h-24" />
              <div className="grid grid-cols-2 gap-3">
                <select className="bg-black/30 border border-lab-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <input placeholder="Subject" className="w-full bg-black/30 border border-lab-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsAddingProject(false)} className="px-4 py-2 text-sm font-medium text-lab-muted hover:text-white">Cancel</button>
              <button onClick={() => setIsAddingProject(false)} className="bg-lab-accent px-6 py-2 rounded-xl text-sm font-bold text-white">Create Project</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
