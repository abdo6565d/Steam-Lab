import React from 'react';
import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTimer } from '../context/TimerContext';
import { cn } from '../lib/utils';

export default function FloatingTimer() {
  const { isRunning, time, formatTime, setIsRunning, resetTimer, mode } = useTimer();
  const { m, s, cs } = formatTime(time);

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 50 }}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-lab-card border border-lab-accent/50 rounded-2xl p-3 shadow-2xl shadow-lab-accent/20 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center px-2 border-r border-lab-border">
            <div className="flex items-center gap-1 text-[10px] font-bold text-lab-accent uppercase tracking-tighter mb-1">
              <Clock className="w-3 h-3" />
              {mode}
            </div>
            <div className="font-mono text-xl font-bold text-white tabular-nums flex items-baseline gap-0.5">
              <span>{m}</span>
              <span className="text-lab-accent">:</span>
              <span>{s}</span>
              <span className="text-lab-muted text-xs">.{cs}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-2 bg-lab-accent text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 bg-black/40 border border-lab-border text-lab-muted rounded-lg hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
