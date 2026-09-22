import React, { useState, useEffect } from 'react';
import { Search, Globe, Lightbulb, Loader2, AlertCircle, Zap, Atom } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedProject, POPULAR_COMPONENTS } from '../constants';
import { generateContextLocal } from '../lib/selfProcessingEngine';

interface ContextEngineProps {
  currentProject?: SavedProject | null;
}

export default function ContextEngine({ currentProject }: ContextEngineProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    analogy: string;
    application: string;
    science: string;
  } | null>(() => {
    // Automatically generate context if project exists
    return generateContextLocal('', currentProject);
  });

  // Pre-fill topic if current project changes
  useEffect(() => {
    if (currentProject) {
      const components = currentProject.selectedComponentIds
        .map(id => {
          if (id === 'resistor' || id === 'resistor-330') {
            if (currentProject.resistors && currentProject.resistors.length > 0) {
              return `${currentProject.resistors.length} Resistors (${currentProject.resistors.map(r => `${r.id}: ${r.value}`).join(', ')})`;
            }
            if (currentProject.resistorValue) {
              return `${currentProject.resistorValue} Resistor`;
            }
          }
          const found = POPULAR_COMPONENTS.find(c => c.id === id || (id === 'resistor-330' && c.id === 'resistor'));
          return found?.name || id;
        })
        .join(' and ');
      const newTopic = `${components} for ${currentProject.intent}`;
      setTopic(newTopic);
      // Auto populate with local engine
      setResult(generateContextLocal(newTopic, currentProject));
    }
  }, [currentProject]);

  const generateContext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 80)); // Fast feedback pulse
      const localData = generateContextLocal(topic, currentProject);
      setResult(localData);
    } catch (err: any) {
      console.error("Context synthesis failed:", err);
      setError(err?.message || "Failed to generate context.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="text-lab-accent w-5 h-5" />
            Context Engine
          </h2>
          <p className="text-sm text-lab-muted">Bridge STEAM topics to real-world industrial and biological analogies</p>
        </div>

        {/* Self-Processing Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold text-xs shadow-sm self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Self-Processing Knowledge Base</span>
        </div>
      </div>

      <form onSubmit={generateContext} className="relative">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a STEAM topic (e.g., PID Control, Photosynthesis)..."
          className="w-full bg-lab-card border border-lab-border rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-lab-accent transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-lab-muted w-5 h-5" />
        <button
          type="submit"
          disabled={loading || !topic}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-lab-accent hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Lookup
        </button>
      </form>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl p-3.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="px-2 py-0.5 hover:bg-white/10 rounded font-semibold text-xs text-red-200">
            Dismiss
          </button>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card
              icon={<Globe className="text-orange-400" />}
              title="Real-Life Use"
              content={result.application}
              delay={0}
            />
            <Card
              icon={<Lightbulb className="text-yellow-400" />}
              title="Simple Analogy"
              content={result.analogy}
              delay={0.1}
            />
            <Card
              icon={<Atom className="text-cyan-400" />}
              title="Science Fact"
              content={result.science}
              delay={0.2}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ icon, title, content, delay }: { icon: React.ReactNode, title: string, content: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-lab-card border border-lab-border rounded-xl p-5 space-y-3 hover:border-lab-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wider text-lab-muted">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed">{content}</p>
    </motion.div>
  );
}
