import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useTimer() {
  const status = useGameStore((s) => s.status);
  const startTime = useGameStore((s) => s.startTime);
  const updateElapsed = useGameStore((s) => s.updateElapsed);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (status === 'playing' && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        updateElapsed(elapsed);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [status, startTime, updateElapsed]);
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}