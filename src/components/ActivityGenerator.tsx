import React, { useState } from 'react';
import { Rocket, Loader2, CheckCircle2, Clock, Trophy, AlertCircle, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { SavedProject, POPULAR_COMPONENTS } from '../constants';
import { generateActivitiesLocal } from '../lib/selfProcessingEngine';

interface ActivityGeneratorProps {
  currentProject?: SavedProject | null;
}

export default function ActivityGenerator({ currentProject }: ActivityGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<string | null>(() => {
    // Generate initial activities locally if project exists
    return currentProject ? generateActivitiesLocal(currentProject) : null;
  });
  const [error, setError] = useState<string | null>(null);

  const generateActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 80)); // Snappy UX feedback
      const localMarkdown = generateActivitiesLocal(currentProject);
      setActivities(localMarkdown);
    } catch (err: any) {
      console.error("Activity generation failed:", err);
      setError(err?.message || "Failed to generate activities.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Rocket className="text-lab-accent w-5 h-5" />
            Level-Up Generator
          </h2>
          <p className="text-sm text-lab-muted">Instant pedagogical extension activities for tinkers, engineers, and inventors</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Self-Processing Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold text-xs shadow-sm">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Self-Processing Curriculum</span>
          </div>

          <button
            onClick={generateActivities}
            disabled={loading}
            className="bg-lab-accent hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-lab-accent/20 text-sm shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-yellow-200" />
            )}
            ⚡ Level-Up Challenges
          </button>
        </div>
      </div>

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
        {activities && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-lab-card border border-lab-border rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-lab-accent" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-lab-border pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="text-orange-400 w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-lab-muted">Tinkerer</div>
                  <div className="text-sm font-semibold">10 Minutes</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Trophy className="text-purple-400 w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-lab-muted">Engineer</div>
                  <div className="text-sm font-semibold">20 Minutes</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Rocket className="text-orange-400 w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-lab-muted">Inventor</div>
                  <div className="text-sm font-semibold">Open-ended</div>
                </div>
              </div>
            </div>

            <div className="markdown-body prose prose-invert max-w-none">
              <ReactMarkdown>{activities}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activities && !loading && (
        <div className="border-2 border-dashed border-lab-border rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-lab-card rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-lab-muted w-8 h-8" />
          </div>
          <p className="text-lab-muted max-w-xs mx-auto">
            When a student finishes their core task, click the button above to generate extension challenges.
          </p>
        </div>
      )}
    </div>
  );
}
