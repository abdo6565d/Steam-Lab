import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Rocket, Loader2, CheckCircle2, Clock, Trophy, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { SavedProject, POPULAR_COMPONENTS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ActivityGeneratorProps {
  currentProject?: SavedProject | null;
}

export default function ActivityGenerator({ currentProject }: ActivityGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<string | null>(null);

  const generateActivities = async () => {
    setLoading(true);
    try {
      const projectContext = currentProject 
        ? `The student is currently working on a project with components: ${currentProject.selectedComponentIds.map(id => POPULAR_COMPONENTS.find(c => c.id === id)?.name).join(', ')}. 
           The project intent is: "${currentProject.intent}".`
        : "The student is looking for general STEAM project ideas.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a STEAM curriculum designer. ${projectContext}
        
        Generate a "Level-Up" activity guide for this student.
        
        Provide 3 tiers of difficulty:
        1. **Tinkerer (10 mins)**: A small modification or "what if" scenario.
        2. **Engineer (20 mins)**: A structural or logical improvement requiring new components or code logic.
        3. **Inventor (Open-ended)**: A creative challenge to solve a real-world problem using the current setup.
        
        Format the output in clear Markdown with bold headers and bullet points. Make the activities highly relevant to the current project if provided.`,
      });

      setActivities(response.text || "");
    } catch (error) {
      console.error("Activity generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Rocket className="text-lab-accent w-5 h-5" />
            Level-Up Generator
          </h2>
          <p className="text-sm text-lab-muted">Instant pedagogical extensions for fast learners</p>
        </div>
        <button
          onClick={generateActivities}
          disabled={loading}
          className="bg-lab-accent hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-lab-accent/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          I'm Done—What's Next?
        </button>
      </div>

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
