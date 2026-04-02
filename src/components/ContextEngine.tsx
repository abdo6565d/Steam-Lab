import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Search, Globe, Briefcase, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedProject, POPULAR_COMPONENTS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ContextEngineProps {
  currentProject?: SavedProject | null;
}

export default function ContextEngine({ currentProject }: ContextEngineProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    analogy: string;
    application: string;
    science: string;
  } | null>(null);

  // Pre-fill topic if current project changes
  useEffect(() => {
    if (currentProject) {
      const components = currentProject.selectedComponentIds
        .map(id => POPULAR_COMPONENTS.find(c => c.id === id)?.name)
        .join(' and ');
      setTopic(`${components} for ${currentProject.intent}`);
    }
  }, [currentProject]);

  const generateContext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a STEAM educator for early grade students (ages 6-10). 
        For the topic or project: "${topic}", provide:
        1. A "Real-Life Application": A simple, scientific or technological example of how this is used in the real world (e.g., how a sensor works in an automatic door).
        2. A "Simple Analogy": Compare it to something very familiar (like a heartbeat, a light switch, or a water pipe).
        3. A "Cool Science Fact": A short, mind-blowing fact related to the technology or science involved.
        
        Keep the language very simple, encouraging, and focused on technology/science.
        
        Format the response as a JSON object with keys: "application", "analogy", "science".`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || "{}");
      setResult(data);
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Globe className="text-lab-accent w-5 h-5" />
          Context Engine
        </h2>
        <p className="text-sm text-lab-muted">Bridge STEAM topics to the real world</p>
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
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-lab-accent hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
        </button>
      </form>

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
              icon={<Sparkles className="text-purple-400" />}
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
