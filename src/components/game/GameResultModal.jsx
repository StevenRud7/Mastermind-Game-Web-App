import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatTime } from '../../hooks/useTimer';
import { DIFFICULTIES } from '../../utils/constants';
import Peg from './Peg';

export default function GameResultModal({ onPlayAgain, onHome }) {
  const store = useGameStore();
  const { colorBlindMode } = useSettingsStore();

  const {
    status,
    mode,
    guesses,
    secretCode,
    codeLength,
    elapsedSeconds,
    difficulty,
    p1Solved,
    p2Solved,
    p1SolvedTurn,
    p2SolvedTurn,
    startingPlayer,
    sessionStats,
  } = store;

  const isGameOver = status === 'won' || status === 'lost';

  // Determine result for 2-player
  const getTwoPlayerResult = () => {
    if (!p1Solved && !p2Solved) return { winner: null, label: "Neither cracked it!" };
    if (p1Solved && !p2Solved) return { winner: 1, label: "Player 1 Wins!" };
    if (!p1Solved && p2Solved) return { winner: 2, label: "Player 2 Wins!" };
    if (p1SolvedTurn < p2SolvedTurn) return { winner: 1, label: "Player 1 Wins!" };
    if (p2SolvedTurn < p1SolvedTurn) return { winner: 2, label: "Player 2 Wins!" };
    return { winner: null, label: "It's a Tie!" };
  };

  const isSoloWin = mode !== 'twoPlayer' && status === 'won';
  const isSoloLoss = mode !== 'twoPlayer' && status === 'lost';
  const twoPlayerResult = mode === 'twoPlayer' ? getTwoPlayerResult() : null;
  const hasWinner = isSoloWin || (twoPlayerResult?.winner !== null);

  useEffect(() => {
    if (!isGameOver) return;
    if (hasWinner) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f0c060', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f0c060', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isGameOver, hasWinner]);

  const turnsUsed = mode === 'twoPlayer'
    ? Math.max(
        guesses.filter(g => g.player === 1).length,
        guesses.filter(g => g.player === 2).length
      )
    : guesses.length;

  return (
    <AnimatePresence>
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,9,12,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 32 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="glass rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* Result emoji + title */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                className="text-6xl mb-3"
              >
                {isSoloWin ? '🏆' : isSoloLoss ? '💀' : twoPlayerResult?.winner ? '🏆' : '🤝'}
              </motion.div>

              <h2 className="font-display text-3xl font-bold mb-1">
                {mode === 'twoPlayer'
                  ? twoPlayerResult?.label
                  : isSoloWin
                  ? 'Cracked It!'
                  : 'Code Stands'}
              </h2>

              {mode === 'twoPlayer' && twoPlayerResult?.winner && (
                <p className="text-sm font-body text-white/50">
                  Solved in{' '}
                  {twoPlayerResult.winner === 1 ? p1SolvedTurn : p2SolvedTurn} guess
                  {(twoPlayerResult.winner === 1 ? p1SolvedTurn : p2SolvedTurn) !== 1 ? 'es' : ''}
                </p>
              )}
              {isSoloLoss && (
                <p className="text-sm font-body text-white/50">
                  Better luck next time
                </p>
              )}
              {isSoloWin && (
                <p className="text-sm font-body text-white/50">
                  Solved in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}
                </p>
              )}
            </div>

            {/* Secret code reveal */}
            <div className="flex flex-col items-center mb-6">
              <p className="text-xs font-body text-white/40 uppercase tracking-widest mb-3">
                The Secret Code
              </p>
              <div className="flex gap-3">
                {secretCode.map((colorId, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300 }}
                  >
                    <Peg colorId={colorId} size="lg" colorBlindMode={colorBlindMode} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatBox label="Time" value={formatTime(elapsedSeconds)} />
              <StatBox label="Guesses" value={`${turnsUsed}/${store.maxGuesses}`} />
              <StatBox
                label="Streak"
                value={`${sessionStats.currentStreak}`}
                sub={`best ${sessionStats.bestStreak}`}
              />
            </div>

            {/* 2-Player breakdown */}
            {mode === 'twoPlayer' && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl p-3 text-center"
                  style={{ background: p1Solved ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${p1Solved ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                  <p className="text-xs text-white/40 font-body mb-1">Player 1</p>
                  <p className="font-mono font-bold text-blue-300">
                    {p1Solved ? `${p1SolvedTurn} guesses` : 'Did not solve'}
                  </p>
                </div>
                <div className="rounded-xl p-3 text-center"
                  style={{ background: p2Solved ? 'rgba(244,114,182,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${p2Solved ? 'rgba(244,114,182,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                  <p className="text-xs text-white/40 font-body mb-1">Player 2</p>
                  <p className="font-mono font-bold text-rose-300">
                    {p2Solved ? `${p2SolvedTurn} guesses` : 'Did not solve'}
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={onHome} className="btn-ghost flex-1">
                ← Menu
              </button>
              <button onClick={onPlayAgain} className="btn-primary flex-1">
                Play Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatBox({ label, value, sub }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-xs font-body text-white/40 mb-0.5">{label}</p>
      <p className="font-mono font-bold text-sm gold-text">{value}</p>
      {sub && <p className="text-xs font-body text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}