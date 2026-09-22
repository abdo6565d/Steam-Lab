import React, { useState, useEffect, useRef, useCallback } from 'react';
import { POPULAR_COMPONENTS, PopularComponent, AIResult, SavedProject, CustomConnection, ResistorItem, ConnectionMode } from '../constants';
import { generateSchematicLocal, COMPONENT_RULES } from '../lib/selfProcessingEngine';
import { 
  Zap, CircleDot, RotateCw, Radio, Move, Thermometer, Plus, X, ArrowRight, 
  Sparkles, Loader2, MessageSquare, Code, Hash, Grid, Cpu, Sun, Eye, 
  Droplets, Palette, Volume2, Bell, Music, Gamepad2, Wind, Target, 
  Activity, Waves, ToggleRight, ClipboardList, Save, CheckCircle2, 
  Wifi, Sprout, Compass, RotateCcw, RefreshCw, Monitor, Keyboard, Settings2, Bluetooth,
  BookOpen, Cloud, Edit2, Trash2, PlusCircle, Check, Sliders, Layers, Plug, Cable
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Stopwatch from './Stopwatch';
import SequentialWiringWalkthrough from './SequentialWiringWalkthrough';
import { AlertCircle } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Zap, CircleDot, RotateCw, Radio, Move, Thermometer, Hash, Grid, Cpu, 
  Sun, Eye, Droplets, Palette, Volume2, Bell, Music, Gamepad2, Wind, 
  Target, Activity, Waves, ToggleRight, Wifi, Sprout, Compass, 
  RotateCcw, RefreshCw, Monitor, Keyboard, Settings2, Bluetooth
};

const STANDARD_ARDUINO_PINS = [
  '5V', '3.3V', 'GND', 'VIN',
  'D2', 'D3', 'D4', 'D5', 'D6', 'D7',
  'D8', 'D9', 'D10', 'D11', 'D12', 'D13',
  'A0', 'A1', 'A2', 'A3', 'A4', 'A5'
];

const POPULAR_RESISTOR_PRESETS = [
  { value: '220Ω', label: '220Ω (LEDs)' },
  { value: '330Ω', label: '330Ω (Signals)' },
  { value: '1kΩ', label: '1kΩ (Protection)' },
  { value: '2.2kΩ', label: '2.2kΩ (Dividers)' },
  { value: '4.7kΩ', label: '4.7kΩ (DS18B20 1-Wire)' },
  { value: '10kΩ', label: '10kΩ (Pull-Up/Down)' },
  { value: '100kΩ', label: '100kΩ (High Z)' }
];

interface WiringBridgeProps {
  onSave: (project: SavedProject) => void;
  initialProject: SavedProject | null;
  onProjectChange: (project: SavedProject | null) => void;
}

export default function WiringBridge({ onSave, initialProject, onProjectChange }: WiringBridgeProps) {
  // Custom Builder State
  const [projectId, setProjectId] = useState<string>(() => initialProject?.id || Math.random().toString(36).substring(2, 11));
  const [selectedPopularIds, setSelectedPopularIds] = useState<string[]>([]);
  const [intent, setIntent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExplainingCode, setIsExplainingCode] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Multi-Resistor Configuration State (Count & Value of each)
  const [resistors, setResistors] = useState<ResistorItem[]>(() => {
    if (initialProject?.resistors && initialProject.resistors.length > 0) {
      return initialProject.resistors;
    }
    if (initialProject?.resistorValue) {
      return [{ id: 'R1', value: initialProject.resistorValue }];
    }
    return [{ id: 'R1', value: '4.7kΩ' }];
  });
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});

  // Connection Routing State: Direct to Arduino vs Through Breadboard
  const [componentConnectionModes, setComponentConnectionModes] = useState<Record<string, ConnectionMode>>(() => {
    if (initialProject?.componentConnectionModes) {
      return initialProject.componentConnectionModes;
    }
    return {};
  });
  const [pendingRoutingComponentId, setPendingRoutingComponentId] = useState<string | null>(null);

  // Auto-Save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [draftRestoredBanner, setDraftRestoredBanner] = useState(false);

  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');

  // Load initial project if provided, or restore draft from localStorage
  useEffect(() => {
    if (initialProject) {
      setProjectId(initialProject.id);
      setSelectedPopularIds(initialProject.selectedComponentIds || []);
      setIntent(initialProject.intent || '');
      setAiResult(initialProject.result || null);
      setProjectName(initialProject.name || '');
      if (initialProject.resistors && initialProject.resistors.length > 0) {
        setResistors(initialProject.resistors);
      } else if (initialProject.resistorValue) {
        setResistors([{ id: 'R1', value: initialProject.resistorValue }]);
      }
      if (initialProject.componentConnectionModes) {
        setComponentConnectionModes(initialProject.componentConnectionModes);
      }
      setIsSaved(true);
      setAutoSaveStatus('saved');
      if (initialProject.timestamp) {
        setLastSavedTime(new Date(initialProject.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      lastSavedStateRef.current = JSON.stringify({
        selectedComponentIds: initialProject.selectedComponentIds,
        intent: initialProject.intent,
        result: initialProject.result,
        name: initialProject.name,
        resistors: initialProject.resistors || [{ id: 'R1', value: initialProject.resistorValue || '4.7kΩ' }],
        componentConnectionModes: initialProject.componentConnectionModes || {}
      });
    } else {
      // Check if there is an existing draft in localStorage to prevent data loss
      try {
        const draftStr = localStorage.getItem('steam_custom_builder_draft');
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft && ((draft.selectedComponentIds && draft.selectedComponentIds.length > 0) || (draft.intent && draft.intent.trim().length > 0) || draft.result)) {
            if (draft.id) setProjectId(draft.id);
            if (draft.selectedComponentIds) setSelectedPopularIds(draft.selectedComponentIds);
            if (draft.intent) setIntent(draft.intent);
            if (draft.result) setAiResult(draft.result);
            if (draft.name) setProjectName(draft.name);
            if (draft.resistors && draft.resistors.length > 0) {
              setResistors(draft.resistors);
            } else if (draft.resistorValue) {
              setResistors([{ id: 'R1', value: draft.resistorValue }]);
            }
            if (draft.componentConnectionModes) {
              setComponentConnectionModes(draft.componentConnectionModes);
            }
            setDraftRestoredBanner(true);
            if (draft.timestamp) {
              setLastSavedTime(new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            }
            lastSavedStateRef.current = JSON.stringify({
              selectedComponentIds: draft.selectedComponentIds,
              intent: draft.intent,
              result: draft.result,
              name: draft.name,
              resistors: draft.resistors || [{ id: 'R1', value: draft.resistorValue || '4.7kΩ' }],
              componentConnectionModes: draft.componentConnectionModes || {}
            });
          }
        }
      } catch (e) {
        console.error("Failed to restore draft from localStorage", e);
      }
    }
  }, [initialProject]);

  // Core auto-save execution function
  const executeAutoSave = useCallback((
    currentId: string,
    currentName: string,
    currentIntent: string,
    currentComponentIds: string[],
    currentResult: AIResult | null,
    currentResistors: ResistorItem[],
    currentConnectionModes: Record<string, ConnectionMode>
  ) => {
    const primaryResistorVal = currentResistors[0]?.value || '4.7kΩ';
    const currentStateStr = JSON.stringify({
      selectedComponentIds: currentComponentIds,
      intent: currentIntent,
      result: currentResult,
      name: currentName,
      resistors: currentResistors,
      componentConnectionModes: currentConnectionModes
    });

    // Skip if nothing changed from last saved state
    if (currentStateStr === lastSavedStateRef.current) {
      return;
    }

    const timestamp = Date.now();

    // Always update draft in localStorage
    const draftData = {
      id: currentId,
      name: currentName || currentIntent.slice(0, 30) || 'Custom Project Draft',
      selectedComponentIds: currentComponentIds,
      intent: currentIntent,
      result: currentResult,
      resistorValue: primaryResistorVal,
      resistors: currentResistors,
      componentConnectionModes: currentConnectionModes,
      timestamp
    };
    try {
      localStorage.setItem('steam_custom_builder_draft', JSON.stringify(draftData));
    } catch (e) {
      console.error("Failed to save draft to localStorage", e);
    }

    // If aiResult exists, update the full project in localStorage
    if (currentResult) {
      const projectToSave: SavedProject = {
        id: currentId,
        name: currentName.trim() || currentIntent.slice(0, 30) || 'Custom Arduino Project',
        timestamp,
        selectedComponentIds: currentComponentIds,
        intent: currentIntent,
        result: currentResult,
        resistorValue: primaryResistorVal,
        resistors: currentResistors,
        componentConnectionModes: currentConnectionModes
      };

      onSave(projectToSave);
      onProjectChange(projectToSave);
      setIsSaved(true);
    }

    lastSavedStateRef.current = currentStateStr;
    setAutoSaveStatus('saved');
    const now = new Date();
    setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [onSave, onProjectChange]);

  // Trigger auto-save whenever wiring configuration, components, resistors list, connection modes, or intent change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!autoSaveEnabled) return;

    const currentStateStr = JSON.stringify({
      selectedComponentIds: selectedPopularIds,
      intent,
      result: aiResult,
      name: projectName,
      resistors,
      componentConnectionModes
    });

    if (currentStateStr === lastSavedStateRef.current) {
      return;
    }

    setAutoSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce to batch rapid keystrokes/clicks while ensuring prompt auto-save
    debounceTimerRef.current = setTimeout(() => {
      executeAutoSave(projectId, projectName, intent, selectedPopularIds, aiResult, resistors, componentConnectionModes);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedPopularIds, intent, projectName, aiResult, resistors, componentConnectionModes, autoSaveEnabled, projectId, executeAutoSave]);

  // Flush auto-save immediately on page unload/navigation to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      executeAutoSave(projectId, projectName, intent, selectedPopularIds, aiResult, resistors, componentConnectionModes);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, projectName, intent, selectedPopularIds, aiResult, resistors, componentConnectionModes, executeAutoSave]);

  const togglePopularComponent = (id: string) => {
    setSelectedPopularIds(prev => {
      const isRemoving = prev.includes(id);
      const next = isRemoving ? prev.filter(i => i !== id) : [...prev, id];
      
      if (!isRemoving) {
        // When adding a new component, assign initial default connection mode and prompt user
        const defaultMode: ConnectionMode = ['led', 'resistor', 'resistor-330', 'ldr', 'push-button'].includes(id) 
          ? 'breadboard' 
          : 'direct';
        
        setComponentConnectionModes(curr => ({
          ...curr,
          [id]: curr[id] || defaultMode
        }));

        setPendingRoutingComponentId(id);
      } else {
        if (pendingRoutingComponentId === id) {
          setPendingRoutingComponentId(null);
        }
      }

      // If user adds ds18b20 and no resistor has 4.7kΩ, ensure a 4.7kΩ resistor is available
      if (!isRemoving && id === 'ds18b20') {
        const has4k7 = resistors.some(r => r.value === '4.7kΩ');
        if (!has4k7) {
          if (next.includes('resistor') || next.includes('resistor-330')) {
            // Update R1 to 4.7kΩ
            setResistors(curr => curr.map((r, idx) => idx === 0 ? { ...r, value: '4.7kΩ', label: 'DS18B20 1-Wire' } : r));
          }
        }
      }
      return next;
    });
    setIsSaved(false);
  };

  // Direct toggle for component connection mode (Direct vs Breadboard)
  const setComponentMode = (compId: string, mode: ConnectionMode) => {
    const updatedModes = { ...componentConnectionModes, [compId]: mode };
    setComponentConnectionModes(updatedModes);

    if (pendingRoutingComponentId === compId) {
      setPendingRoutingComponentId(null);
    }

    // If schematic is already generated, refresh it immediately without conflicts or duplicate pins
    if (aiResult) {
      const refreshed = generateSchematicLocal(selectedPopularIds, intent, resistors, updatedModes);
      setAiResult(refreshed);
      executeAutoSave(projectId, projectName, intent, selectedPopularIds, refreshed, resistors, updatedModes);
    }
    setIsSaved(false);
  };

  // Multi-Resistor Management Functions
  const addResistor = (suggestedValue = '220Ω', suggestedLabel = '') => {
    const newIdx = resistors.length + 1;
    const newResistor: ResistorItem = {
      id: `R${newIdx}`,
      value: suggestedValue,
      label: suggestedLabel
    };
    setResistors(prev => [...prev, newResistor]);
    setIsSaved(false);
  };

  const removeResistor = (index: number) => {
    if (resistors.length <= 1) return;
    setResistors(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((r, i) => ({ ...r, id: `R${i + 1}` }));
    });
    setIsSaved(false);
  };

  const updateResistorValue = (index: number, newValue: string) => {
    setResistors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: newValue };
      return updated;
    });
    setIsSaved(false);
  };

  const applyCustomResistorValue = (index: number, val: string) => {
    if (!val.trim()) return;
    let formatted = val.trim();
    if (!formatted.includes('Ω') && !formatted.toLowerCase().includes('ohm')) {
      formatted += 'Ω';
    }
    updateResistorValue(index, formatted);
    setCustomInputs(prev => ({ ...prev, [index]: '' }));
  };

  const setResistorCount = (count: number) => {
    const target = Math.max(1, Math.min(8, count));
    setResistors(prev => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        const next = [...prev];
        for (let i = prev.length; i < target; i++) {
          next.push({ 
            id: `R${i + 1}`, 
            value: i === 1 ? '220Ω' : (i === 2 ? '10kΩ' : '1kΩ') 
          });
        }
        return next;
      } else {
        return prev.slice(0, target).map((r, i) => ({ ...r, id: `R${i + 1}` }));
      }
    });
    setIsSaved(false);
  };

  const isResistorSelected = selectedPopularIds.includes('resistor') || selectedPopularIds.includes('resistor-330');
  const isDS18B20Selected = selectedPopularIds.includes('ds18b20');
  const isLEDSelected = selectedPopularIds.includes('led');

  const generateSchematic = async () => {
    if (selectedPopularIds.length === 0 || !intent.trim()) return;
    
    setIsGenerating(true);
    setIsSaved(false);
    setGenerationError(null);
    try {
      // 100% Deterministic Self-Processing Circuit Engine
      await new Promise(r => setTimeout(r, 80)); // Brief smooth UI pulse
      const data = generateSchematicLocal(selectedPopularIds, intent, resistors, componentConnectionModes);

      setAiResult(data);
      
      const effectiveName = projectName || (intent.slice(0, 30) + (intent.length > 30 ? '...' : ''));
      if (!projectName) {
        setProjectName(effectiveName);
      }

      // Automatically auto-save immediately to localStorage
      executeAutoSave(projectId, effectiveName, intent, selectedPopularIds, data, resistors, componentConnectionModes);

    } catch (error: any) {
      console.error("Failed to process schematic:", error);
      setGenerationError(error?.message || "Failed to process schematic. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const explainCode = async () => {
    if (!aiResult?.code) return;
    
    setIsExplainingCode(true);
    try {
      // Local deterministic explanation synthesis
      await new Promise(r => setTimeout(r, 100));
      const explanation = aiResult.codeExplanation || 
        `### Self-Processing Code Analysis\n- **Logic**: Directly synthesizes readings from ${selectedPopularIds.length} connected modules.\n- **Control Flow**: Initializes pins in setup() and executes continuous sampling and threshold tests in loop().`;

      const updatedResult = { ...aiResult, codeExplanation: explanation };
      setAiResult(updatedResult);

      // Auto-save the updated explanation
      executeAutoSave(projectId, projectName, intent, selectedPopularIds, updatedResult, resistors, componentConnectionModes);

    } catch (error: any) {
      console.error("Failed to explain code:", error);
    } finally {
      setIsExplainingCode(false);
    }
  };

  const handleManualSave = () => {
    executeAutoSave(projectId, projectName, intent, selectedPopularIds, aiResult, resistors, componentConnectionModes);
  };

  return (
    <div className="space-y-6">
      {/* Draft Restored Banner */}
      {draftRestoredBanner && (
        <div className="bg-lab-accent/10 border border-lab-accent/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-lab-accent">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lab-accent shrink-0" />
            <span>Restored your active wiring project from localStorage automatically.</span>
          </div>
          <button 
            onClick={() => setDraftRestoredBanner(false)}
            className="text-xs hover:text-white transition-colors underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Auto-Save Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-lab-accent w-5 h-5" />
            Custom STEAM Builder
          </h2>
          <p className="text-sm text-lab-muted">Design, Wire, and Code your Arduino project</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Self-Processing Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-semibold text-xs shadow-sm">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Self-Processing System</span>
          </div>

          {/* Auto-Save Status Indicator */}
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all",
              autoSaveStatus === 'saving' 
                ? "bg-lab-accent/10 border-lab-accent/50 text-lab-accent shadow-sm" 
                : "bg-black/30 border-lab-border text-lab-muted"
            )}
            title={autoSaveEnabled ? "Auto-save is actively writing to localStorage" : "Auto-save is paused"}
          >
            {autoSaveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-lab-accent shrink-0" />
                <span className="text-[11px] font-semibold text-lab-accent whitespace-nowrap">Auto-saving...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-[11px] font-medium text-lab-text whitespace-nowrap">
                  {lastSavedTime ? `Auto-saved ${lastSavedTime}` : 'Auto-save active'}
                </span>
              </>
            )}

            <button
              type="button"
              onClick={() => setAutoSaveEnabled(prev => !prev)}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ml-1",
                autoSaveEnabled 
                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                  : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
              )}
              title="Toggle Auto-save protection"
            >
              {autoSaveEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Project Name and Manual Save */}
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
                className="bg-black/30 border border-lab-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-lab-accent w-36 sm:w-52 transition-all"
              />
              <button
                onClick={handleManualSave}
                disabled={!projectName.trim() && !intent.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                  isSaved 
                    ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                    : "bg-lab-accent text-white hover:bg-orange-600 shadow-lg shadow-lab-accent/20"
                )}
                title="Force instant save to localStorage"
              >
                {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Component Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-lab-muted">Select Components</h3>
            <span className="text-[11px] text-lab-muted">
              {selectedPopularIds.length} component{selectedPopularIds.length === 1 ? '' : 's'} selected • auto-saved
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {POPULAR_COMPONENTS.map(comp => {
              const Icon = ICON_MAP[comp.icon] || Zap;
              const isSelected = selectedPopularIds.includes(comp.id) || (comp.id === 'resistor' && selectedPopularIds.includes('resistor-330'));
              const isResistor = comp.id === 'resistor' || comp.id === 'resistor-330';
              
              let displayName = comp.name;
              if (isResistor) {
                if (resistors.length === 1) {
                  displayName = `${resistors[0].value} Resistor`;
                } else {
                  displayName = `${resistors.length} Resistors (${resistors.map(r => r.value).join(', ')})`;
                }
              }

              return (
                <button
                  key={comp.id}
                  onClick={() => togglePopularComponent(comp.id)}
                  className={cn(
                    "flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border transition-all text-left relative group",
                    isSelected 
                      ? "bg-lab-accent/10 border-lab-accent text-white shadow-lg shadow-lab-accent/10 scale-[1.02]" 
                      : "bg-lab-card border-lab-border text-lab-muted hover:border-lab-muted hover:text-lab-text"
                  )}
                >
                  {isResistor && (
                    <span className="absolute top-2 right-2 text-[9px] bg-lab-accent/20 text-lab-accent px-1.5 py-0.5 rounded font-mono font-bold">
                      {resistors.length === 1 ? resistors[0].value : `${resistors.length}x`}
                    </span>
                  )}
                  {comp.id === 'ds18b20' && (
                    <span className="absolute top-2 right-2 text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-bold uppercase">
                      1-Wire
                    </span>
                  )}
                  <Icon className={cn("w-6 h-6", isSelected ? "text-lab-accent" : "text-lab-muted")} />
                  <span className="text-[10px] font-bold text-center leading-tight">{displayName}</span>
                </button>
              );
            })}
          </div>

          {/* Multi-Resistor Configuration Panel */}
          {isResistorSelected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-lab-card/90 border border-lab-accent/40 rounded-2xl p-5 space-y-4 shadow-sm"
            >
              {/* Header: Title and Quantity Stepper */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lab-border/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-lab-accent/15 border border-lab-accent/30 flex items-center justify-center text-lab-accent shrink-0">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resistors Configuration</h4>
                      <span className="text-[10px] bg-lab-accent/20 text-lab-accent px-2 py-0.5 rounded-md font-mono font-bold border border-lab-accent/30">
                        {resistors.length} Resistor{resistors.length > 1 ? 's' : ''} Configured
                      </span>
                    </div>
                    <p className="text-[11px] text-lab-muted">
                      Choose how many resistors you need and specify the resistance value for each one.
                    </p>
                  </div>
                </div>

                {/* Resistor Count Stepper & Add Button */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/50 border border-lab-border rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setResistorCount(resistors.length - 1)}
                      disabled={resistors.length <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-lab-muted hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent font-bold"
                      title="Decrease resistor count"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-mono font-bold text-white">
                      {resistors.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setResistorCount(resistors.length + 1)}
                      disabled={resistors.length >= 8}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-lab-muted hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent font-bold"
                      title="Increase resistor count"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => addResistor(resistors.length === 1 ? '220Ω' : '10kΩ')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-lab-accent/15 hover:bg-lab-accent/25 text-lab-accent border border-lab-accent/40 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Resistor</span>
                  </button>
                </div>
              </div>

              {/* Individual Resistors List */}
              <div className="space-y-3">
                {resistors.map((resistor, idx) => (
                  <div 
                    key={resistor.id}
                    className="bg-black/40 border border-lab-border/70 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-lab-accent/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="w-7 h-7 rounded-lg bg-lab-accent/20 border border-lab-accent/40 text-lab-accent font-mono font-bold text-xs flex items-center justify-center">
                        {resistor.id}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{resistor.id} Value:</span>
                          <span className="text-xs font-mono font-bold text-lab-accent bg-lab-accent/10 px-2 py-0.5 rounded border border-lab-accent/20">
                            {resistor.value}
                          </span>
                        </div>
                        {resistor.label && (
                          <span className="text-[10px] text-lab-muted">{resistor.label}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Presets */}
                      <div className="flex flex-wrap items-center gap-1 bg-black/50 p-1 rounded-xl border border-lab-border">
                        {POPULAR_RESISTOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => updateResistorValue(idx, preset.value)}
                            className={cn(
                              "px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap",
                              resistor.value === preset.value
                                ? "bg-lab-accent text-white shadow-sm"
                                : "text-lab-muted hover:text-white hover:bg-white/5"
                            )}
                            title={preset.label}
                          >
                            {preset.value}
                          </button>
                        ))}
                      </div>

                      {/* Custom Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={customInputs[idx] || ''}
                          onChange={(e) => setCustomInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') applyCustomResistorValue(idx, customInputs[idx] || '');
                          }}
                          placeholder="e.g. 560Ω"
                          className="bg-black/60 border border-lab-border rounded-xl px-2 py-1 text-xs text-white font-mono w-20 focus:outline-none focus:border-lab-accent"
                        />
                        <button
                          type="button"
                          onClick={() => applyCustomResistorValue(idx, customInputs[idx] || '')}
                          className="px-2 py-1 bg-lab-card hover:bg-lab-accent hover:text-white border border-lab-border rounded-xl text-xs font-bold text-lab-muted transition-colors"
                        >
                          Set
                        </button>
                      </div>

                      {/* Delete Button (if more than 1 resistor) */}
                      {resistors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResistor(idx)}
                          className="p-1.5 text-lab-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                          title={`Remove ${resistor.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Helpful Recommendation Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-lab-muted">
                <span className="font-semibold text-white/80">Quick Recommendations:</span>
                {isDS18B20Selected && !resistors.some(r => r.value === '4.7kΩ') && (
                  <button
                    type="button"
                    onClick={() => addResistor('4.7kΩ', 'DS18B20 1-Wire Pull-up')}
                    className="px-2 py-0.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-lg font-medium transition-colors"
                  >
                    + Add 4.7kΩ for DS18B20
                  </button>
                )}
                {isLEDSelected && !resistors.some(r => r.value === '220Ω' || r.value === '330Ω') && (
                  <button
                    type="button"
                    onClick={() => addResistor('220Ω', 'LED Current Limiter')}
                    className="px-2 py-0.5 bg-lab-accent/15 hover:bg-lab-accent/25 text-lab-accent border border-lab-accent/30 rounded-lg font-medium transition-colors"
                  >
                    + Add 220Ω for LED
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addResistor('10kΩ', 'Pull-Up / Sensor')}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-lab-text border border-lab-border rounded-lg font-medium transition-colors"
                >
                  + Add 10kΩ for Buttons / Sensors
                </button>
              </div>
            </motion.div>
          )}

          {/* Helper banner when DS18B20 is selected without any resistor */}
          {isDS18B20Selected && !isResistorSelected && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>DS18B20 Selected:</strong> Waterproof 1-Wire sensors require a <strong>4.7kΩ pull-up resistor</strong> between VCC and DATA.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPopularIds(prev => [...prev, 'resistor']);
                  setResistors([{ id: 'R1', value: '4.7kΩ', label: 'DS18B20 Pull-up' }]);
                  setIsSaved(false);
                }}
                className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/40 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ml-2"
              >
                + Add 4.7kΩ Resistor
              </button>
            </div>
          )}

          {/* Physical Connection Architecture & Conflict Prevention (Direct vs. Breadboard) */}
          {selectedPopularIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-lab-card/90 border border-lab-accent/40 rounded-2xl p-5 space-y-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lab-border/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-lab-accent/15 border border-lab-accent/30 flex items-center justify-center text-lab-accent shrink-0">
                    <Cable className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Physical Connection Architecture</h4>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Conflict-Free (No Dual Wiring)
                      </span>
                    </div>
                    <p className="text-[11px] text-lab-muted">
                      Specify whether each component connects <strong>directly to Arduino headers</strong> or <strong>mounts via breadboard</strong>. Connections are strictly single-routed to prevent circuit diagram and code conflicts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prompt query banner when a newly added component needs routing preference */}
              {pendingRoutingComponentId && (
                <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <Plug className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="text-xs text-amber-200">
                      <span className="font-bold">Wiring Query:</span> Is <strong className="text-white underline">{POPULAR_COMPONENTS.find(c => c.id === pendingRoutingComponentId)?.name || pendingRoutingComponentId}</strong> connected directly to Arduino or through breadboard?
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setComponentMode(pendingRoutingComponentId, 'direct')}
                      className="px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Plug className="w-3.5 h-3.5" />
                      Direct to Arduino
                    </button>
                    <button
                      type="button"
                      onClick={() => setComponentMode(pendingRoutingComponentId, 'breadboard')}
                      className="px-3 py-1.5 bg-blue-500 text-white font-bold text-xs rounded-lg hover:bg-blue-400 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Grid className="w-3.5 h-3.5" />
                      Via Breadboard
                    </button>
                  </div>
                </div>
              )}

              {/* Component Connection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {selectedPopularIds.map(compId => {
                  const comp = POPULAR_COMPONENTS.find(c => c.id === compId);
                  const compName = comp?.name || compId;
                  const Icon = comp?.icon ? ICON_MAP[comp.icon] || Cpu : Cpu;
                  const currentMode: ConnectionMode = componentConnectionModes[compId] || (
                    ['led', 'resistor', 'resistor-330', 'ldr', 'push-button'].includes(compId)
                      ? 'breadboard'
                      : 'direct'
                  );
                  const isDirect = currentMode === 'direct';

                  return (
                    <div
                      key={compId}
                      className={cn(
                        "rounded-xl border p-3.5 space-y-2.5 transition-all",
                        pendingRoutingComponentId === compId
                          ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30"
                          : isDirect
                            ? "bg-black/40 border-amber-500/30"
                            : "bg-black/40 border-blue-500/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                            isDirect 
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-400" 
                              : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{compName}</div>
                            <div className="text-[10px] text-lab-muted">
                              {isDirect ? "Direct jumper cables to Arduino headers" : "Mounted in breadboard tie-points first"}
                            </div>
                          </div>
                        </div>

                        {/* Segmented Mode Selector */}
                        <div className="flex bg-black/70 border border-lab-border rounded-lg p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setComponentMode(compId, 'direct')}
                            className={cn(
                              "px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1",
                              isDirect
                                ? "bg-amber-500 text-black shadow-sm"
                                : "text-lab-muted hover:text-white"
                            )}
                            title="Connect directly from component to Arduino headers (bypassing breadboard)"
                          >
                            <Plug className="w-3 h-3" />
                            Direct
                          </button>
                          <button
                            type="button"
                            onClick={() => setComponentMode(compId, 'breadboard')}
                            className={cn(
                              "px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1",
                              !isDirect
                                ? "bg-blue-500 text-white shadow-sm"
                                : "text-lab-muted hover:text-white"
                            )}
                            title="Mount into breadboard first, then run jumpers to Arduino"
                          >
                            <Grid className="w-3 h-3" />
                            Breadboard
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-lab-muted pt-1 border-t border-white/5">
                        <span>Physical Route:</span>
                        <span className={isDirect ? "text-amber-300 font-medium" : "text-blue-300 font-medium"}>
                          {isDirect 
                            ? "⚡ Direct Headers (No Breadboard Contact)" 
                            : "🛹 Breadboard Rows ➔ Arduino Jumpers"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Intent Input & Utilities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-lab-accent">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Project Purpose</h3>
              </div>
              <span className="text-[10px] text-lab-muted uppercase font-bold">Auto-persisted</span>
            </div>
            <textarea
              value={intent}
              onChange={(e) => {
                setIntent(e.target.value);
                setIsSaved(false);
              }}
              placeholder="Tell the program what is the purpose of connecting these components (e.g., 'Measure water temperature with the waterproof DS18B20 sensor and alert if it exceeds 30°C')..."
              className="w-full bg-black/30 border border-lab-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lab-accent h-24 transition-all leading-relaxed"
            />
            {generationError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{generationError}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setGenerationError(null)} 
                  className="px-2 py-0.5 hover:bg-white/10 rounded font-semibold text-xs text-red-200 transition-colors ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Self-Processing: Instant &amp; Offline</span>
                </span>
              </div>

              <button
                onClick={generateSchematic}
                disabled={isGenerating || selectedPopularIds.length === 0 || !intent.trim()}
                className="bg-lab-accent hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-lab-accent/20"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 text-yellow-200" />
                )}
                {isGenerating 
                  ? 'Processing Circuit...' 
                  : (initialProject ? '⚡ Update Circuit (Self-Processing)' : '⚡ Process Guide (Self-Processing)')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Stopwatch />
          </div>
        </div>

        {/* Interactive Wiring & Schematic Engine */}
        <AnimatePresence>
          {(aiResult || isGenerating) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Loading State during synthesis */}
              {isGenerating && (
                <div className="bg-lab-card border border-lab-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="w-10 h-10 text-lab-accent animate-spin" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Synthesizing Project</h3>
                    <p className="text-xs text-lab-muted mt-1">Generating sequential wiring steps and Arduino code...</p>
                  </div>
                </div>
              )}

              {/* Breadboard Guide & Wire Suggestions & Code */}
              {!isGenerating && aiResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Wires & Breadboard Guide */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-lab-accent">
                        <ClipboardList className="w-5 h-5" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Wire Requirements</h3>
                      </div>
                      <div className="space-y-3">
                        {aiResult.wires?.map((wire, idx) => (
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

                    {/* Sequential Physical Step-by-Step Connection Walkthrough */}
                    {aiResult.sequentialGuides && aiResult.sequentialGuides.length > 0 && (
                      <SequentialWiringWalkthrough
                        sequentialGuides={aiResult.sequentialGuides}
                        onUpdateGuides={(updated) => {
                          const updatedResult = { ...aiResult, sequentialGuides: updated };
                          setAiResult(updatedResult);
                          executeAutoSave(projectId, projectName, intent, selectedPopularIds, updatedResult, resistors, componentConnectionModes);
                        }}
                        onResetGuides={() => {
                          const refreshed = generateSchematicLocal(selectedPopularIds, intent, resistors, componentConnectionModes);
                          if (refreshed.sequentialGuides) {
                            const updatedResult = { ...aiResult, sequentialGuides: refreshed.sequentialGuides };
                            setAiResult(updatedResult);
                            executeAutoSave(projectId, projectName, intent, selectedPopularIds, updatedResult, resistors, componentConnectionModes);
                          }
                        }}
                      />
                    )}

                    {aiResult.breadboardGuide && (
                      <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-lab-accent">
                            <Grid className="w-5 h-5" />
                            <h3 className="text-sm font-bold uppercase tracking-widest">Assembly & Connection Guide</h3>
                          </div>
                          <span className="text-[10px] bg-lab-accent/15 text-lab-accent border border-lab-accent/30 px-2 py-0.5 rounded font-mono font-bold">
                            Strict Single-Route
                          </span>
                        </div>
                        <div className="text-xs text-lab-text leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-xl border border-lab-border/60">
                          {aiResult.breadboardGuide}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arduino Code */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-lab-accent">
                          <Code className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-widest">Arduino Code</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={explainCode}
                            disabled={isExplainingCode}
                            className="text-[10px] font-bold text-lab-accent hover:text-orange-400 uppercase transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {isExplainingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                            {aiResult.codeExplanation ? 'Re-explain' : 'Explain Code'}
                          </button>
                          <button 
                            onClick={() => navigator.clipboard.writeText(aiResult.code)}
                            className="text-[10px] font-bold text-lab-muted hover:text-white uppercase transition-colors"
                          >
                            Copy Code
                          </button>
                        </div>
                      </div>
                      <pre className="bg-black/40 rounded-xl p-5 text-xs font-mono text-lab-text overflow-y-auto max-h-[600px] border border-lab-border leading-relaxed whitespace-pre-wrap break-words">
                        <code>{aiResult.code}</code>
                      </pre>
                    </div>

                    {/* Code Explanation */}
                    <AnimatePresence>
                      {(isExplainingCode || aiResult.codeExplanation) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-4 overflow-hidden"
                        >
                          <div className="flex items-center gap-2 text-lab-accent">
                            <BookOpen className="w-5 h-5" />
                            <h3 className="text-sm font-bold uppercase tracking-widest">Code Explanation</h3>
                          </div>
                          
                          {isExplainingCode ? (
                            <div className="flex items-center gap-3 py-4 text-lab-muted">
                              <Loader2 className="w-4 h-4 animate-spin text-lab-accent" />
                              <span className="text-xs animate-pulse italic">Analyzing code logic and pin routing...</span>
                            </div>
                          ) : (
                            <div className="text-xs text-lab-muted leading-relaxed whitespace-pre-wrap prose prose-invert prose-xs max-w-none">
                              {aiResult.codeExplanation}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
