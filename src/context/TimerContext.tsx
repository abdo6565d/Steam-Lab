import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface TimerContextType {
  mode: 'stopwatch' | 'timer';
  setMode: React.Dispatch<React.SetStateAction<'stopwatch' | 'timer'>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  timerStart: number;
  setTimerStart: React.Dispatch<React.SetStateAction<number>>;
  resetTimer: () => void;
  formatTime: (ms: number) => { m: string; s: string; cs: string };
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio context error:", e);
  }
};

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [timerStart, setTimerStart] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      // Calculate how much time has already passed to handle pause/resume correctly
      const elapsed = mode === 'timer' 
        ? Math.max(0, (timerStart * 1000) - time) 
        : time;
        
      startTimeRef.current = Date.now() - elapsed;
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const currentDiff = now - startTimeRef.current;
        
        if (mode === 'timer') {
          const totalMs = timerStart * 1000;
          const remaining = totalMs - currentDiff;
          
          if (remaining <= 0) {
            setTime(0);
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            playBeep();
          } else {
            setTime(Math.floor(remaining));
          }
        } else {
          setTime(Math.floor(currentDiff));
        }
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, timerStart]);

  const resetTimer = React.useCallback(() => {
    setIsRunning(false);
    if (mode === 'timer') {
      setTime(timerStart * 1000);
    } else {
      setTime(0);
    }
  }, [mode, timerStart]);

  const formatTime = React.useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return {
      m: minutes.toString().padStart(2, '0'),
      s: seconds.toString().padStart(2, '0'),
      cs: centiseconds.toString().padStart(2, '0')
    };
  }, []);

  const contextValue = React.useMemo(() => ({
    mode, setMode, isRunning, setIsRunning, time, setTime,
    timerStart, setTimerStart, resetTimer, formatTime
  }), [mode, isRunning, time, timerStart, resetTimer, formatTime]);

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
