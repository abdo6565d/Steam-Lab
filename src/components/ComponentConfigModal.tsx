import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  Zap, 
  Hash, 
  Layers, 
  Info,
  Palette
} from 'lucide-react';
import { 
  POPULAR_COMPONENTS, 
  STANDARD_LED_COLORS, 
  DEFAULT_RESISTOR_PRESETS,
  ResistorValueCount 
} from '../constants';

interface ComponentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string | null;
  componentCounts: Record<string, number>;
  onUpdateCount: (componentId: string, count: number) => void;
  ledColors: string[];
  onUpdateLedColors: (colors: string[]) => void;
  resistorValueCounts: ResistorValueCount[];
  onUpdateResistorValueCounts: (counts: ResistorValueCount[]) => void;
}

export const ComponentConfigModal: React.FC<ComponentConfigModalProps> = ({
  isOpen,
  onClose,
  componentId,
  componentCounts,
  onUpdateCount,
  ledColors,
  onUpdateLedColors,
  resistorValueCounts,
  onUpdateResistorValueCounts,
}) => {
  const [customResistorInput, setCustomResistorInput] = useState('');
  const [customResistorError, setCustomResistorError] = useState<string | null>(null);

  if (!isOpen || !componentId) return null;

  const compMeta = POPULAR_COMPONENTS.find(c => c.id === componentId);
  const isLed = componentId === 'led';
  const isResistor = componentId === 'resistor' || componentId === 'resistor-330';

  const count = componentCounts[componentId] || 1;

  // LED handlers
  const handleSetLedColor = (index: number, colorName: string) => {
    const updated = [...ledColors];
    updated[index] = colorName;
    onUpdateLedColors(updated);
  };

  const handleSetLedCount = (newCount: number) => {
    const safeCount = Math.max(1, Math.min(8, newCount));
    onUpdateCount('led', safeCount);
    
    // Adjust ledColors array length
    const updatedColors = [...ledColors];
    if (safeCount > updatedColors.length) {
      const palette = ['Red', 'Green', 'Blue', 'Yellow', 'White', 'Orange'];
      for (let i = updatedColors.length; i < safeCount; i++) {
        updatedColors.push(palette[i % palette.length]);
      }
    } else if (safeCount < updatedColors.length) {
      updatedColors.splice(safeCount);
    }
    onUpdateLedColors(updatedColors);
  };

  // Resistor handlers
  const totalResistorCount = resistorValueCounts.reduce((sum, item) => sum + item.count, 0);

  const handleUpdateResistorValCount = (value: string, newCount: number) => {
    const safeCount = Math.max(0, newCount);
    const updated = resistorValueCounts.map(item => {
      if (item.value === value) {
        return { ...item, count: safeCount };
      }
      return item;
    });

    // Ensure at least one resistor exists total
    const totalRemaining = updated.reduce((s, i) => s + i.count, 0);
    if (totalRemaining < 1) {
      // Find this item and keep count at 1
      const fallback = updated.map(item => item.value === value ? { ...item, count: 1 } : item);
      onUpdateResistorValueCounts(fallback);
      onUpdateCount(componentId, 1);
      return;
    }

    onUpdateResistorValueCounts(updated);
    onUpdateCount(componentId, totalRemaining);
  };

  const handleAddCustomResistor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let val = customResistorInput.trim();
    if (!val) return;
    if (!val.endsWith('Ω') && !val.toLowerCase().endsWith('ohm')) {
      val = `${val}Ω`;
    }

    const existingIdx = resistorValueCounts.findIndex(
      r => r.value.toLowerCase() === val.toLowerCase()
    );

    if (existingIdx >= 0) {
      // Increment existing
      const updated = [...resistorValueCounts];
      updated[existingIdx] = { ...updated[existingIdx], count: updated[existingIdx].count + 1 };
      onUpdateResistorValueCounts(updated);
      onUpdateCount(componentId, updated.reduce((s, i) => s + i.count, 0));
    } else {
      // Add new
      const updated = [
        ...resistorValueCounts,
        { value: val, count: 1, label: 'Custom Value' }
      ];
      onUpdateResistorValueCounts(updated);
      onUpdateCount(componentId, updated.reduce((s, i) => s + i.count, 0));
    }

    setCustomResistorInput('');
    setCustomResistorError(null);
  };

  const handleRemoveResistorValueRow = (value: string) => {
    const updated = resistorValueCounts.filter(r => r.value !== value);
    if (updated.length === 0) {
      const fallback = [{ value: '220Ω', count: 1, label: 'LED Current Limiter' }];
      onUpdateResistorValueCounts(fallback);
      onUpdateCount(componentId, 1);
    } else {
      const total = updated.reduce((s, i) => s + i.count, 0);
      if (total < 1 && updated[0]) {
        updated[0].count = 1;
      }
      onUpdateResistorValueCounts(updated);
      onUpdateCount(componentId, Math.max(1, updated.reduce((s, i) => s + i.count, 0)));
    }
  };

  const handleAddPresetResistor = (preset: { value: string; label: string }) => {
    const existing = resistorValueCounts.find(r => r.value === preset.value);
    if (existing) {
      handleUpdateResistorValCount(preset.value, existing.count + 1);
    } else {
      const updated = [...resistorValueCounts, { value: preset.value, count: 1, label: preset.label }];
      onUpdateResistorValueCounts(updated);
      onUpdateCount(componentId, updated.reduce((s, i) => s + i.count, 0));
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-lab-card border border-lab-accent/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-lab-border bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lab-accent/15 border border-lab-accent/30 flex items-center justify-center text-lab-accent">
                {isLed ? <Zap className="w-5 h-5" /> : isResistor ? <Hash className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {compMeta?.name || componentId.toUpperCase()}
                  <span className="text-xs bg-lab-accent/20 text-lab-accent px-2 py-0.5 rounded-full font-mono font-bold border border-lab-accent/30">
                    {isResistor ? `${totalResistorCount} Total` : `${count} Units`}
                  </span>
                </h3>
                <p className="text-xs text-lab-muted">
                  {isLed 
                    ? 'Adjust the count and pick the color for each LED.' 
                    : isResistor 
                      ? 'Adjust the count and set the number for each custom resistance value.' 
                      : `Set the quantity of ${compMeta?.name || 'this component'} used in your circuit.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-lab-muted hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-6">
            {/* Standard Component Count Stepper (For Non-Resistors) */}
            {!isResistor && (
              <div className="bg-black/50 border border-lab-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-lab-muted block mb-1">
                    Component Count
                  </span>
                  <div className="text-sm text-white font-medium">
                    How many <strong className="text-lab-accent">{compMeta?.name || componentId}</strong> units are you using?
                  </div>
                </div>

                {/* Big Count Stepper */}
                <div className="flex items-center gap-3 self-center sm:self-auto">
                  <button
                    type="button"
                    onClick={() => isLed ? handleSetLedCount(count - 1) : onUpdateCount(componentId, Math.max(1, count - 1))}
                    disabled={count <= 1}
                    className="w-10 h-10 rounded-xl bg-black/60 border border-lab-border flex items-center justify-center text-lg font-bold text-white hover:bg-lab-accent hover:border-lab-accent disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:border-lab-border transition-all"
                  >
                    -
                  </button>

                  <div className="w-14 text-center">
                    <span className="text-2xl font-mono font-bold text-lab-accent">{count}</span>
                    <span className="text-[10px] text-lab-muted block uppercase tracking-wider font-semibold">
                      {count === 1 ? 'Unit' : 'Units'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => isLed ? handleSetLedCount(count + 1) : onUpdateCount(componentId, Math.min(8, count + 1))}
                    disabled={count >= 8}
                    className="w-10 h-10 rounded-xl bg-black/60 border border-lab-border flex items-center justify-center text-lg font-bold text-white hover:bg-lab-accent hover:border-lab-accent disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:border-lab-border transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Quick Count Preset Pills for standard components */}
            {!isResistor && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-lab-muted font-medium">Quick Presets:</span>
                {[1, 2, 3, 4, 5].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => isLed ? handleSetLedCount(preset) : onUpdateCount(componentId, preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      count === preset
                        ? 'bg-lab-accent text-white border-lab-accent shadow-sm'
                        : 'bg-black/40 border-lab-border text-lab-muted hover:text-white hover:border-lab-muted'
                    }`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            )}

            {/* LED COLOR CONFIGURATION SECTION */}
            {isLed && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-lab-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-lab-accent" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Color for Each LED ({ledColors.length} configured)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSetLedCount(count + 1)}
                    disabled={count >= 8}
                    className="text-[11px] font-bold text-lab-accent hover:text-orange-400 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add LED
                  </button>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: count }).map((_, idx) => {
                    const currentColor = ledColors[idx] || (idx === 0 ? 'Red' : idx === 1 ? 'Green' : 'Blue');
                    const colorMeta = STANDARD_LED_COLORS.find(c => c.name.toLowerCase() === currentColor.toLowerCase()) || STANDARD_LED_COLORS[0];

                    return (
                      <div
                        key={idx}
                        className="bg-black/40 border border-lab-border/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-lab-accent/30 transition-all"
                      >
                        {/* LED Badge */}
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition-all shrink-0"
                            style={{ 
                              backgroundColor: colorMeta.hex,
                              boxShadow: `0 0 10px ${colorMeta.glow}`
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-white">LED #{idx + 1}</span>
                            <span className="text-[11px] text-lab-muted ml-2 font-mono">
                              ({colorMeta.name})
                            </span>
                          </div>
                        </div>

                        {/* Color Selector Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {STANDARD_LED_COLORS.map(c => {
                            const isSelected = currentColor.toLowerCase() === c.name.toLowerCase();
                            return (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => handleSetLedColor(idx, c.name)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  isSelected
                                    ? 'border-white text-white shadow-sm'
                                    : 'bg-black/50 border-lab-border/60 text-lab-muted hover:text-white'
                                }`}
                                style={isSelected ? { backgroundColor: `${c.hex}33`, borderColor: c.hex } : undefined}
                              >
                                <span 
                                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                                  style={{ backgroundColor: c.hex }} 
                                />
                                <span>{c.name}</span>
                                {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESISTOR BREAKDOWN & NUMBER FOR EACH CUSTOM VALUE */}
            {isResistor && (
              <div className="space-y-4">
                {/* Total Resistors Display */}
                <div className="bg-black/50 border border-lab-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-lab-muted block mb-0.5">
                      Total Resistor Count
                    </span>
                    <div className="text-sm font-bold text-white">
                      Sum of all configured resistor values:
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-bold text-lab-accent">{totalResistorCount}</span>
                    <span className="text-xs text-lab-muted uppercase font-semibold">Resistors</span>
                  </div>
                </div>

                {/* List of Custom Resistor Values & Their Numbers */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-lab-muted px-1">
                    <span>Resistance Value</span>
                    <span>Number of Resistors</span>
                  </div>

                  {resistorValueCounts.map((resistorItem) => (
                    <div
                      key={resistorItem.value}
                      className="bg-black/40 border border-lab-border rounded-xl p-3 flex items-center justify-between gap-3 hover:border-lab-accent/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-lab-accent/20 border border-lab-accent/40 text-lab-accent font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          Ω
                        </span>
                        <div className="truncate">
                          <span className="text-xs font-mono font-bold text-white">{resistorItem.value}</span>
                          {resistorItem.label && (
                            <span className="text-[10px] text-lab-muted ml-2 block sm:inline truncate">
                              ({resistorItem.label})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Number Stepper for this specific custom value */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-black/60 border border-lab-border rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateResistorValCount(resistorItem.value, resistorItem.count - 1)}
                            disabled={resistorItem.count <= 0}
                            className="w-6 h-6 flex items-center justify-center text-lab-muted hover:text-white hover:bg-white/10 rounded disabled:opacity-20 font-bold text-xs"
                            title="Decrease count for this value"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-white">
                            {resistorItem.count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateResistorValCount(resistorItem.value, resistorItem.count + 1)}
                            disabled={resistorItem.count >= 8}
                            className="w-6 h-6 flex items-center justify-center text-lab-muted hover:text-white hover:bg-white/10 rounded disabled:opacity-20 font-bold text-xs"
                            title="Increase count for this value"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove value button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveResistorValueRow(resistorItem.value)}
                          className="p-1 text-lab-muted hover:text-red-400 transition-colors"
                          title="Remove this value from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add Preset Values */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-lab-muted block">Add Common Resistor Values:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_RESISTOR_PRESETS.map(preset => {
                      const alreadyInList = resistorValueCounts.some(r => r.value === preset.value);
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleAddPresetResistor(preset)}
                          className="px-2.5 py-1 bg-black/50 hover:bg-lab-accent/20 hover:border-lab-accent/50 text-white border border-lab-border rounded-lg text-xs font-mono transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-lab-accent" />
                          <span>{preset.value}</span>
                          <span className="text-[9px] text-lab-muted hidden sm:inline">({preset.label.split(' ')[0]})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Resistance Value Input */}
                <div className="pt-2 border-t border-lab-border/40">
                  <span className="text-[11px] font-semibold text-lab-muted block mb-1.5">
                    Or Enter Any Custom Resistance Value:
                  </span>
                  <form onSubmit={handleAddCustomResistor} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customResistorInput}
                      onChange={(e) => setCustomResistorInput(e.target.value)}
                      placeholder="e.g. 560Ω, 470Ω, 100kΩ"
                      className="flex-1 bg-black/60 border border-lab-border rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-lab-accent"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-lab-accent hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Value</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Non-LED & Non-Resistor Multi-Unit Clarification */}
            {!isLed && !isResistor && count > 1 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 text-xs text-blue-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Multi-Unit Circuit Allocation</strong>
                  Using {count} units of {compMeta?.name || componentId}. The circuit generator will allocate dedicated collision-free Arduino pins for each unit, provide serial wiring instructions for both, and generate sample logic in the sketch.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-lab-border bg-black/40 flex items-center justify-between">
            <div className="text-xs text-lab-muted font-medium">
              {isResistor 
                ? `${totalResistorCount} total resistor(s) configured` 
                : isLed 
                  ? `${count} LED(s) [${ledColors.slice(0, count).join(', ')}]` 
                  : `${count} unit(s) selected`}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-lab-accent hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-lab-accent/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
