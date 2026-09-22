import React from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTimer } from '../context/TimerContext';

export default function Stopwatch() {
  const {
    mode, setMode, isRunning, setIsRunning, time, setTime,
    timerStart, setTimerStart, resetTimer, formatTime
  } = useTimer();

  const handleStartStop = () => {
    if (mode === 'timer' && time === 0 && !isRunning) {
      return;
    }
    setIsRunning(!isRunning);
  };

  const adjustTimer = (amount: number) => {
    if (isRunning) return;
    setTimerStart(prev => Math.max(0, prev + amount));
    setTime(prev => Math.max(0, prev + (amount * 1000)));
  };

  const { m, s, cs } = formatTime(time);

  return (
    <div className="bg-lab-card border border-lab-border rounded-2xl p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lab-accent">
          <Clock className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Lab Utility</h3>
        </div>
        <div className="flex bg-black/40 rounded-lg p-1 border border-lab-border">
          <button
            onClick={() => {
              setMode('stopwatch');
              setIsRunning(false);
              setTime(0);
            }}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
              mode === 'stopwatch' ? "bg-lab-accent text-white" : "text-lab-muted hover:text-white"
            )}
          >
            Stopwatch
          </button>
          <button
            onClick={() => {
              setMode('timer');
              setIsRunning(false);
              setTime(timerStart * 1000);
            }}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
              mode === 'timer' ? "bg-lab-accent text-white" : "text-lab-muted hover:text-white"
            )}
          >
            Timer
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <div className="flex items-baseline gap-2 font-mono text-5xl font-bold text-white tabular-nums">
          <span>{m}</span>
          <span className="text-lab-accent text-3xl">:</span>
          <span>{s}</span>
          <span className="text-lab-muted text-2xl">.{cs}</span>
        </div>

        {mode === 'timer' && !isRunning && (
          <div className="flex items-center gap-4 pt-2">
            <div className="flex flex-col items-center">
              <button onClick={() => adjustTimer(60)} className="p-1 hover:text-lab-accent transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-lab-muted uppercase">Min</span>
              <button onClick={() => adjustTimer(-60)} className="p-1 hover:text-lab-accent transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <button onClick={() => adjustTimer(1)} className="p-1 hover:text-lab-accent transition-colors">
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-lab-muted uppercase">Sec</span>
              <button onClick={() => adjustTimer(-1)} className="p-1 hover:text-lab-accent transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleStartStop}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all shadow-lg",
            isRunning 
              ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30" 
              : "bg-lab-accent text-white hover:bg-orange-600 shadow-lab-accent/20"
          )}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'STOP' : 'START'}
        </button>
        <button
          onClick={resetTimer}
          className="p-3 bg-black/40 border border-lab-border rounded-xl text-lab-muted hover:text-white hover:border-lab-muted transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="pt-4 border-t border-lab-border/30">
        <p className="text-[10px] text-lab-muted italic text-center">
          Use this utility to time your experiments or code execution.
        </p>
      </div>
    </div>
  );
}
