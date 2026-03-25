import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { evaluateGuess } from '../utils/evaluateGuess';
import { generateCode, getAllPossibleCodes } from '../utils/codeGenerator';
import { sounds } from '../utils/soundManager';

export function useGameEngine() {
  const store = useGameStore();
  const settings = useSettingsStore();

  const startGame = useCallback(
    ({ mode, difficulty = 'medium', startingPlayer = 1 }) => {
      const { allowDuplicates, colorCount } = settings;
      const codeLength = store.codeLength || 4;
      const secretCode = generateCode(codeLength, colorCount, allowDuplicates);

      const allCodes = getAllPossibleCodes(codeLength, colorCount, allowDuplicates);

      store.initGame({
        mode,
        difficulty,
        secretCode,
        allowDuplicates,
        colorCount,
        codeLength,
        currentPlayer: startingPlayer,
        startingPlayer,
        aiRemaining: allCodes,
      });
    },
    [settings, store]
  );

  const submitCurrentGuess = useCallback(() => {
    const { currentGuess, secretCode, codeLength, soundEnabled: _s } = store;
    const soundEnabled = settings.soundEnabled;

    // Validate all slots filled
    if (currentGuess.some((p) => p === null)) {
      if (soundEnabled) sounds.error();
      return false;
    }

    const feedback = evaluateGuess(secretCode, currentGuess);

    if (soundEnabled) {
      sounds.submit();
      setTimeout(() => {
        for (let i = 0; i < feedback.blacks; i++) {
          setTimeout(() => sounds.blackPeg(), i * 80);
        }
        for (let i = 0; i < feedback.whites; i++) {
          setTimeout(() => sounds.whitePeg(), feedback.blacks * 80 + i * 80);
        }
      }, 200);
    }

    store.submitGuess(feedback);

    // Post-submit sound
    const newStatus =
      feedback.blacks === codeLength
        ? 'won'
        : store.guesses.length + 1 >= store.maxGuesses
        ? 'lost'
        : 'playing';

    if (soundEnabled) {
      if (newStatus === 'won') setTimeout(() => sounds.win(), 400);
      else if (newStatus === 'lost') setTimeout(() => sounds.lose(), 400);
    }

    return true;
  }, [store, settings]);

  const placePeg = useCallback(
    (slotIndex, colorId) => {
      if (settings.soundEnabled) sounds.pegPlace();
      store.setSlotColor(slotIndex, colorId);
    },
    [store, settings]
  );

  return {
    startGame,
    submitCurrentGuess,
    placePeg,
  };
}