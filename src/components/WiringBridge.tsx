import React, { useState, useEffect } from 'react';
import { POPULAR_COMPONENTS, PopularComponent, AIResult, SavedProject } from '../constants';
import { 
  Zap, CircleDot, RotateCw, Radio, Move, Thermometer, Plus, X, ArrowRight, 
  Sparkles, Loader2, MessageSquare, Code, Hash, Grid, Cpu, Sun, Eye, 
  Droplets, Palette, Volume2, Bell, Music, Gamepad2, Wind, Target, 
  Activity, Waves, ToggleRight, ClipboardList, Save, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const ICON_MAP: Record<string, any> = {
  Zap, CircleDot, RotateCw, Radio, Move, Thermometer, Hash, Grid, Cpu, 
  Sun, Eye, Droplets, Palette, Volume2, Bell, Music, Gamepad2, Wind, 
  Target, Activity, Waves, ToggleRight
};

interface WiringBridgeProps {
  onSave: (project: SavedProject) => void;
  initialProject: SavedProject | null;
  onProjectChange: (project: SavedProject | null) => void;
}

export default function WiringBridge({ onSave, initialProject, onProjectChange }: WiringBridgeProps) {
  // Custom Builder State
  const [selectedPopularIds, setSelectedPopularIds] = useState<string[]>([]);
  const [intent, setIntent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Load initial project if provided
  useEffect(() => {
    if (initialProject) {
      setSelectedPopularIds(initialProject.selectedComponentIds);
      setIntent(initialProject.intent);
      setAiResult(initialProject.result);
      setProjectName(initialProject.name);
      setIsSaved(true);
    }
  }, [initialProject]);

  const togglePopularComponent = (id: string) => {
    setSelectedPopularIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setIsSaved(false);
  };

  const generateSchematic = async () => {
    if (selectedPopularIds.length === 0 || !intent.trim()) return;
    
    setIsGenerating(true);
    setIsSaved(false);
    try {
      const selectedNames = selectedPopularIds.map(id => POPULAR_COMPONENTS.find(c => c.id === id)?.name).join(', ');
      const prompt = `You are an Arduino expert. A student wants to build a project with these components: ${selectedNames}. 
      Their goal is: "${intent}".
      
      Provide:
      1. Best wiring connections to an Arduino Uno.
      2. Complete, well-commented Arduino C++ code to achieve the goal.
      3. Suggestions for the number and type of jumper wires needed (Male-to-Male, Female-to-Female, Male-to-Female).
      4. BREADBOARD GUIDANCE: If a breadboard is used, provide specific row (A-J) and column (1-30) coordinates for component placement and jumper wire connections.
      
      Return a JSON object with keys:
      - "connections": Array of { "compId", "compPin", "arduinoPin", "breadboardCoords" }
      - "code": String (the Arduino code)
      - "wires": Array of { "type", "count", "reason" }
      - "breadboardGuide": String (General instructions for breadboard layout)
      
      Component IDs to use: ${selectedPopularIds.join(', ')}.
      Only suggest standard, safe connections. Be very specific about breadboard coordinates (e.g., "Row A, Col 15").`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || "{}") as AIResult;
      setAiResult(data);
      
      if (!projectName) {
        setProjectName(intent.slice(0, 30) + (intent.length > 30 ? '...' : ''));
      }

      // Update parent state
      onProjectChange({
        id: initialProject?.id || Math.random().toString(36).substr(2, 9),
        name: projectName || intent.slice(0, 30) + (intent.length > 30 ? '...' : ''),
        timestamp: Date.now(),
        selectedComponentIds: selectedPopularIds,
        intent: intent,
        result: data
      });

    } catch (error) {
      console.error("Failed to generate schematic:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!aiResult) return;
    const project: SavedProject = {
      id: initialProject?.id || Math.random().toString(36).substr(2, 9),
      name: projectName || 'Untitled Project',
      timestamp: Date.now(),
      selectedComponentIds: selectedPopularIds,
      intent: intent,
      result: aiResult
    };
    onSave(project);
    setIsSaved(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-lab-accent w-5 h-5" />
            Custom STEAM Builder
          </h2>
          <p className="text-sm text-lab-muted">Design, Wire, and Code your Arduino project</p>
        </div>
        {aiResult && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setIsSaved(false);
              }}
              placeholder="Project Name..."
              className="bg-black/30 border border-lab-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-lab-accent w-40 sm:w-60 transition-all"
            />
            <button
              onClick={handleSave}
              disabled={isSaved || !projectName.trim()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                isSaved 
                  ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                  : "bg-lab-accent text-white hover:bg-orange-600 shadow-lg shadow-lab-accent/20 disabled:opacity-50"
              )}
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Component Selector */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-lab-muted">Select Components</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {POPULAR_COMPONENTS.map(comp => {
              const Icon = ICON_MAP[comp.icon] || Zap;
              const isSelected = selectedPopularIds.includes(comp.id);
              return (
                <button
                  key={comp.id}
                  onClick={() => togglePopularComponent(comp.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                    isSelected 
                      ? "bg-lab-accent/10 border-lab-accent text-white shadow-lg shadow-lab-accent/10" 
                      : "bg-lab-card border-lab-border text-lab-muted hover:border-lab-muted hover:text-lab-text"
                  )}
                >
                  <Icon className={cn("w-6 h-6", isSelected ? "text-lab-accent" : "text-lab-muted")} />
                  <span className="text-[10px] font-bold text-center">{comp.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intent Input */}
        <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-lab-accent">
            <MessageSquare className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Project Purpose</h3>
          </div>
          <textarea
            value={intent}
            onChange={(e) => {
              setIntent(e.target.value);
              setIsSaved(false);
            }}
            placeholder="Tell the program what is the purpose of connecting these components (e.g., 'I want to make an alarm that goes off when someone gets too close')..."
            className="w-full bg-black/30 border border-lab-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent h-24 transition-all"
          />
          <div className="flex justify-end">
            <button
              onClick={generateSchematic}
              disabled={isGenerating || selectedPopularIds.length === 0 || !intent.trim()}
              className="bg-lab-accent hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-lab-accent/20"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {initialProject && !isGenerating ? 'Update Guide' : 'Generate Full Guide'}
            </button>
          </div>
        </div>

        {/* AI Results */}
        <AnimatePresence>
          {(aiResult || isGenerating) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Visual Debugger & Wiring */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-black/40 border border-lab-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                  <div className="absolute top-4 left-4 text-[10px] font-bold text-lab-accent uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Visual Debugger
                  </div>

                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-lab-accent animate-spin" />
                      <p className="text-sm text-lab-muted animate-pulse">Designing your project...</p>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-lg aspect-video flex items-center justify-center">
                      <svg viewBox="0 0 500 300" className="w-full h-full">
                        <rect x="200" y="100" width="100" height="100" rx="8" className="fill-lab-card stroke-lab-accent stroke-2" />
                        <text x="250" y="155" textAnchor="middle" className="fill-lab-accent text-[12px] font-bold">ARDUINO UNO</text>
                        
                        {selectedPopularIds.map((id, idx) => {
                          const comp = POPULAR_COMPONENTS.find(c => c.id === id)!;
                          const angle = (idx / selectedPopularIds.length) * 2 * Math.PI;
                          const r = 160;
                          const cx = 250 + r * Math.cos(angle);
                          const cy = 150 + r * Math.sin(angle);
                          
                          return (
                            <g key={id}>
                              {aiResult?.connections.filter(conn => conn.compId === id).map((conn, cIdx) => (
                                <motion.path
                                  key={cIdx}
                                  d={`M ${cx} ${cy} L 250 150`}
                                  stroke="var(--color-lab-accent)"
                                  strokeWidth="1"
                                  strokeDasharray="4 4"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  className="opacity-40"
                                />
                              ))}
                              <rect x={cx - 30} y={cy - 30} width="60" height="60" rx="8" className="fill-lab-card stroke-lab-border" />
                              <text x={cx} y={cy + 5} textAnchor="middle" className="fill-white text-[8px] font-bold">{comp.name}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </div>

                <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4 overflow-y-auto max-h-[400px]">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-lab-accent">Wiring & Breadboard</h3>
                  <div className="space-y-3">
                    {aiResult?.connections.map((conn, idx) => (
                      <div key={idx} className="bg-black/20 rounded-xl p-3 border border-lab-border/50 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-[10px] text-lab-muted uppercase font-bold">{conn.compId}</div>
                            <div className="text-xs text-white">{conn.compPin}</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-lab-accent" />
                          <div className="flex-1 text-right">
                            <div className="text-[10px] text-lab-muted uppercase font-bold">Arduino Pin</div>
                            <div className="text-xs text-lab-accent font-mono">{conn.arduinoPin}</div>
                          </div>
                        </div>
                        {conn.breadboardCoords && (
                          <div className="pt-2 border-t border-lab-border/30 flex items-center gap-2">
                            <Grid className="w-3 h-3 text-lab-muted" />
                            <span className="text-[10px] text-lab-muted">Breadboard: <span className="text-white font-bold">{conn.breadboardCoords}</span></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Breadboard Guide & Wire Suggestions & Code */}
              {!isGenerating && aiResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Wires & Breadboard Guide */}
                  <div className="space-y-6">
                    <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-lab-accent">
                        <ClipboardList className="w-5 h-5" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Wire Requirements</h3>
                      </div>
                      <div className="space-y-3">
                        {aiResult.wires.map((wire, idx) => (
                          <div key={idx} className="bg-black/20 rounded-xl p-4 border border-lab-border/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-white">{wire.type}</span>
                              <span className="bg-lab-accent/20 text-lab-accent px-2 py-0.5 rounded text-[10px] font-bold">x{wire.count}</span>
                            </div>
                            <p className="text-[10px] text-lab-muted italic">{wire.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {aiResult.breadboardGuide && (
                      <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-lab-accent">
                          <Grid className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-widest">Breadboard Layout</h3>
                        </div>
                        <p className="text-xs text-lab-muted leading-relaxed">{aiResult.breadboardGuide}</p>
                      </div>
                    )}
                  </div>

                  {/* Arduino Code */}
                  <div className="lg:col-span-2 bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-lab-accent">
                        <Code className="w-5 h-5" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Arduino Code</h3>
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(aiResult.code)}
                        className="text-[10px] font-bold text-lab-muted hover:text-white uppercase transition-colors"
                      >
                        Copy Code
                      </button>
                    </div>
                    <pre className="bg-black/40 rounded-xl p-5 text-xs font-mono text-lab-text overflow-x-auto border border-lab-border leading-relaxed">
                      <code>{aiResult.code}</code>
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
