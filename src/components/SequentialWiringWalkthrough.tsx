import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, ListOrdered, ChevronDown, ChevronRight, 
  Copy, Check, RotateCcw, Plus, Trash2, Edit3, Save, X, Sparkles,
  Plug, Grid, ArrowRight, Info, AlertTriangle, Layers
} from 'lucide-react';
import { ComponentSequentialGuide, SequentialWiringStep } from '../constants';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SequentialWiringWalkthroughProps {
  sequentialGuides: ComponentSequentialGuide[];
  onUpdateGuides: (updated: ComponentSequentialGuide[]) => void;
  onResetGuides?: () => void;
}

export default function SequentialWiringWalkthrough({
  sequentialGuides,
  onUpdateGuides,
  onResetGuides
}: SequentialWiringWalkthroughProps) {
  const [selectedCompFilter, setSelectedCompFilter] = useState<string>('all');
  const [expandedCompIds, setExpandedCompIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sequentialGuides.forEach(g => { init[g.componentId] = true; });
    return init;
  });
  const [copied, setCopied] = useState(false);

  // Editing state for customizing steps
  const [editingStep, setEditingStep] = useState<{
    compId: string;
    step: SequentialWiringStep;
    isNew?: boolean;
  } | null>(null);

  // Calculate overall progress
  const allSteps = sequentialGuides.flatMap(g => g.steps);
  const totalSteps = allSteps.length;
  const completedSteps = allSteps.filter(s => s.completed).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const toggleStepCompleted = (compId: string, stepId: string) => {
    const updated = sequentialGuides.map(guide => {
      if (guide.componentId !== compId) return guide;
      return {
        ...guide,
        steps: guide.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s)
      };
    });
    onUpdateGuides(updated);
  };

  const toggleAccordion = (compId: string) => {
    setExpandedCompIds(prev => ({
      ...prev,
      [compId]: !prev[compId]
    }));
  };

  const handleExpandAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    sequentialGuides.forEach(g => { next[g.componentId] = expand; });
    setExpandedCompIds(next);
  };

  const markAllProgress = (completed: boolean) => {
    const updated = sequentialGuides.map(guide => ({
      ...guide,
      steps: guide.steps.map(s => ({ ...s, completed }))
    }));
    onUpdateGuides(updated);
  };

  const handleSaveStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep) return;

    const { compId, step, isNew } = editingStep;
    const updated = sequentialGuides.map(guide => {
      if (guide.componentId !== compId) return guide;

      let newSteps: SequentialWiringStep[];
      if (isNew) {
        newSteps = [...guide.steps, { ...step, stepNumber: guide.steps.length + 1 }];
      } else {
        newSteps = guide.steps.map(s => s.id === step.id ? step : s);
      }

      // Re-index step numbers
      newSteps = newSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

      return {
        ...guide,
        steps: newSteps
      };
    });

    onUpdateGuides(updated);
    setEditingStep(null);
  };

  const handleDeleteStep = (compId: string, stepId: string) => {
    const updated = sequentialGuides.map(guide => {
      if (guide.componentId !== compId) return guide;
      const filtered = guide.steps.filter(s => s.id !== stepId);
      return {
        ...guide,
        steps: filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
      };
    });
    onUpdateGuides(updated);
  };

  const copyAsMarkdown = () => {
    let md = `# Sequential Physical Circuit Connection Guide\n\n`;
    md += `> Generated Step-by-Step Sequential Instructions (${completedSteps}/${totalSteps} Steps Complete)\n\n`;

    sequentialGuides.forEach(guide => {
      md += `## ${guide.componentName} (${guide.location === 'breadboard' ? 'Breadboard Mount' : 'Direct Arduino Headers'})\n`;
      md += `**Location**: ${guide.locationDetails}\n\n`;
      md += `**Overview**: ${guide.overview}\n\n`;
      md += `### Sequential Steps:\n`;
      guide.steps.forEach(s => {
        md += `${s.stepNumber}. [${s.completed ? 'x' : ' '}] **${s.fromPoint} ➔ ${s.toPoint}** (${s.wireType || 'Direct Wire'})\n`;
        md += `   ${s.instruction}\n`;
        if (s.details) md += `   *Note: ${s.details}*\n`;
      });
      md += `\n---\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibleGuides = selectedCompFilter === 'all'
    ? sequentialGuides
    : sequentialGuides.filter(g => g.componentId === selectedCompFilter);

  return (
    <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lab-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-lab-accent border border-orange-500/30 flex items-center justify-center">
              <ListOrdered className="w-5 h-5 text-lab-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Sequential Component Wiring Steps
                <span className="text-[10px] bg-lab-accent/20 text-lab-accent border border-lab-accent/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Series & Leg-by-Leg Walkthrough
                </span>
              </h3>
              <p className="text-xs text-lab-muted mt-0.5">
                Physical connection sequences for each component (e.g. LED anode to resistor leg, resistor to Arduino pin, cathode to GND).
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={copyAsMarkdown}
            className="px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-lab-border rounded-lg text-lab-text font-medium flex items-center gap-1.5 transition-colors"
            title="Copy as Markdown document"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-lab-muted" />}
            {copied ? 'Copied Steps!' : 'Copy Steps'}
          </button>

          {onResetGuides && (
            <button
              onClick={onResetGuides}
              className="px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-lab-border rounded-lg text-lab-muted hover:text-white font-medium flex items-center gap-1.5 transition-colors"
              title="Reset steps to standard generated sequence"
            >
              <RotateCcw className="w-3.5 h-3.5 text-lab-muted" />
              Reset Defaults
            </button>
          )}

          <button
            onClick={() => markAllProgress(completedSteps < totalSteps)}
            className="px-3 py-1.5 bg-lab-accent/15 hover:bg-lab-accent/25 border border-lab-accent/30 rounded-lg text-lab-accent font-bold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedSteps === totalSteps ? 'Uncheck All' : 'Mark All Done'}
          </button>
        </div>
      </div>

      {/* Assembly Progress Meter */}
      <div className="bg-black/30 border border-lab-border/60 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-lab-muted font-medium flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-lab-accent" />
            Physical Assembly Progress:
            <span className="text-white font-bold ml-1">{completedSteps}</span> of <span className="text-white font-bold">{totalSteps}</span> steps completed
          </span>
          <span className={cn(
            "font-mono font-bold px-2 py-0.5 rounded text-[11px]",
            progressPercent === 100 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-lab-accent/20 text-lab-accent border border-lab-accent/30"
          )}>
            {progressPercent}% Complete
          </span>
        </div>
        <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-lab-border/40">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
            className={cn(
              "h-full rounded-full transition-all",
              progressPercent === 100 ? "bg-green-500" : "bg-gradient-to-r from-orange-500 to-amber-400"
            )}
          />
        </div>
      </div>

      {/* Filter Tabs by Component */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCompFilter('all')}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold transition-all",
              selectedCompFilter === 'all'
                ? "bg-lab-accent text-white shadow-sm"
                : "bg-black/40 text-lab-muted hover:text-white border border-lab-border"
            )}
          >
            All Components ({sequentialGuides.length})
          </button>
          {sequentialGuides.map(guide => {
            const guideCompleted = guide.steps.every(s => s.completed);
            return (
              <button
                key={guide.componentId}
                onClick={() => setSelectedCompFilter(guide.componentId)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                  selectedCompFilter === guide.componentId
                    ? "bg-lab-accent text-white shadow-sm font-bold"
                    : "bg-black/40 text-lab-muted hover:text-white border border-lab-border"
                )}
              >
                {guideCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-lab-accent" />
                )}
                {guide.componentName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-lab-muted">
          <button
            onClick={() => handleExpandAll(true)}
            className="hover:text-white transition-colors"
          >
            Expand All
          </button>
          <span>•</span>
          <button
            onClick={() => handleExpandAll(false)}
            className="hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Sequential Guides List */}
      <div className="space-y-4">
        {visibleGuides.length === 0 ? (
          <div className="text-center py-10 bg-black/20 border border-dashed border-lab-border rounded-xl text-lab-muted text-xs">
            No sequential guides available for the selected view.
          </div>
        ) : (
          visibleGuides.map(guide => {
            const isExpanded = !!expandedCompIds[guide.componentId];
            const compCompletedCount = guide.steps.filter(s => s.completed).length;
            const compTotalCount = guide.steps.length;
            const allDone = compTotalCount > 0 && compCompletedCount === compTotalCount;

            return (
              <div 
                key={guide.componentId}
                className={cn(
                  "border rounded-xl transition-all overflow-hidden bg-black/20",
                  allDone 
                    ? "border-green-500/30 bg-green-950/10" 
                    : "border-lab-border hover:border-lab-border/80"
                )}
              >
                {/* Component Accordion Header */}
                <div 
                  onClick={() => toggleAccordion(guide.componentId)}
                  className="px-5 py-3.5 bg-black/40 flex items-center justify-between cursor-pointer select-none hover:bg-black/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-lab-muted hover:text-white">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm tracking-wide">
                          {guide.componentName}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border",
                          guide.location === 'breadboard'
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        )}>
                          {guide.location === 'breadboard' ? (
                            <>
                              <Grid className="w-2.5 h-2.5" />
                              {guide.locationDetails || 'Breadboard Mount'}
                            </>
                          ) : (
                            <>
                              <Plug className="w-2.5 h-2.5" />
                              {guide.locationDetails || 'Direct Headers'}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[11px] font-mono px-2 py-0.5 rounded border",
                      allDone 
                        ? "bg-green-500/20 text-green-400 border-green-500/30 font-bold" 
                        : "bg-black/60 text-lab-muted border-lab-border"
                    )}>
                      {compCompletedCount}/{compTotalCount} Steps
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStep({
                          compId: guide.componentId,
                          step: {
                            id: `${guide.componentId}-custom-${Date.now()}`,
                            stepNumber: guide.steps.length + 1,
                            instruction: '',
                            fromPoint: `${guide.componentName} Leg`,
                            toPoint: 'Target Node',
                            wireType: 'Jumper Wire',
                            details: '',
                            completed: false
                          },
                          isNew: true
                        });
                      }}
                      className="px-2 py-1 bg-lab-accent/15 hover:bg-lab-accent/30 text-lab-accent border border-lab-accent/30 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Add a custom physical step"
                    >
                      <Plus className="w-3 h-3" />
                      Add Step
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-5 space-y-4 border-t border-lab-border/40"
                    >
                      {/* Overview Card */}
                      <div className="bg-black/40 border border-lab-border/70 rounded-xl p-3.5 text-xs text-lab-text leading-relaxed flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-lab-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white block mb-0.5">Physical Connection Overview:</span>
                          <p className="text-lab-muted">{guide.overview}</p>
                        </div>
                      </div>

                      {/* Step by Step Items */}
                      <div className="space-y-3">
                        {guide.steps.map((step) => (
                          <div 
                            key={step.id}
                            className={cn(
                              "rounded-xl border p-4 transition-all relative",
                              step.completed
                                ? "bg-green-950/20 border-green-500/30"
                                : "bg-black/30 border-lab-border/60 hover:border-lab-border"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Step Checkbox & Number */}
                              <div className="flex items-start gap-3 flex-1">
                                <button
                                  onClick={() => toggleStepCompleted(guide.componentId, step.id)}
                                  className="mt-0.5 text-lab-muted hover:text-white transition-colors shrink-0"
                                  title={step.completed ? "Mark incomplete" : "Mark as connected"}
                                >
                                  {step.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-lab-muted/80 hover:text-lab-accent" />
                                  )}
                                </button>

                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center flex-wrap gap-2">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-mono font-bold",
                                      step.completed ? "bg-green-500/20 text-green-300" : "bg-lab-accent/20 text-lab-accent"
                                    )}>
                                      Step {step.stepNumber}
                                    </span>

                                    {/* Pathway Node Pill */}
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono bg-black/60 px-2 py-0.5 rounded border border-lab-border/60 text-lab-text">
                                      <span className="font-bold text-amber-300">{step.fromPoint}</span>
                                      <ArrowRight className="w-3 h-3 text-lab-muted" />
                                      <span className="font-bold text-sky-300">{step.toPoint}</span>
                                    </div>

                                    {step.wireType && (
                                      <span className="text-[10px] bg-black/40 text-lab-muted border border-lab-border/40 px-1.5 py-0.5 rounded">
                                        {step.wireType}
                                      </span>
                                    )}
                                  </div>

                                  {/* Physical Instruction Paragraph */}
                                  <p className={cn(
                                    "text-xs leading-relaxed text-lab-text",
                                    step.completed && "line-through opacity-70"
                                  )}>
                                    {step.instruction}
                                  </p>

                                  {/* Additional Electrical/Physical Note */}
                                  {step.details && (
                                    <p className="text-[11px] text-lab-muted/80 italic bg-black/20 px-2.5 py-1 rounded border-l-2 border-lab-accent/60">
                                      {step.details}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons for Step */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingStep({
                                    compId: guide.componentId,
                                    step: { ...step },
                                    isNew: false
                                  })}
                                  className="p-1 text-lab-muted hover:text-white transition-colors"
                                  title="Edit / Customize this step"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStep(guide.componentId, step.id)}
                                  className="p-1 text-lab-muted hover:text-red-400 transition-colors"
                                  title="Delete this step"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Specify Step Modal */}
      <AnimatePresence>
        {editingStep && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-lab-card border border-lab-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-lab-border pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-lab-accent" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    {editingStep.isNew ? 'Add Custom Connection Step' : `Edit Step ${editingStep.step.stepNumber}`}
                  </h4>
                </div>
                <button
                  onClick={() => setEditingStep(null)}
                  className="text-lab-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStep} className="space-y-4 text-xs">
                <div>
                  <label className="text-lab-muted block mb-1">Instruction Text (Physical Action)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. The long leg of the LED connects to leg 1 of the 220Ω resistor at Row E Col 15..."
                    value={editingStep.step.instruction}
                    onChange={(e) => setEditingStep({
                      ...editingStep,
                      step: { ...editingStep.step, instruction: e.target.value }
                    })}
                    className="w-full bg-black/60 border border-lab-border rounded-lg p-2.5 text-white leading-relaxed focus:outline-none focus:border-lab-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-lab-muted block mb-1">Origin Point / Component Leg</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LED Anode (Long Leg)"
                      value={editingStep.step.fromPoint}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        step: { ...editingStep.step, fromPoint: e.target.value }
                      })}
                      className="w-full bg-black/60 border border-lab-border rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-lab-muted block mb-1">Destination Point / Pin</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Resistor Leg 1 (Row E Col 15)"
                      value={editingStep.step.toPoint}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        step: { ...editingStep.step, toPoint: e.target.value }
                      })}
                      className="w-full bg-black/60 border border-lab-border rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-lab-muted block mb-1">Wire / Connection Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Series Breadboard Tie-Point"
                      value={editingStep.step.wireType || ''}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        step: { ...editingStep.step, wireType: e.target.value }
                      })}
                      className="w-full bg-black/60 border border-lab-border rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-lab-muted block mb-1">Physical Note / Builder Tip (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Prevents excessive current"
                      value={editingStep.step.details || ''}
                      onChange={(e) => setEditingStep({
                        ...editingStep,
                        step: { ...editingStep.step, details: e.target.value }
                      })}
                      className="w-full bg-black/60 border border-lab-border rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-lab-border">
                  <button
                    type="button"
                    onClick={() => setEditingStep(null)}
                    className="px-3 py-1.5 text-lab-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-lab-accent hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Step
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
