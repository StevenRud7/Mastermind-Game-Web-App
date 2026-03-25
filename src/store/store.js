import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CODE_LENGTH, MAX_GUESSES } from '../utils/constants';
import { generateCode, evaluateGuess, makeAllCodes, applyFeedback, aiNextGuess } from '../utils/gameLogic';

// ─── Settings (persisted) ─────────────────────────────────────────────────────
export const useSettings = create(
  persist(
    (set) => ({
      allowDuplicates: true,
      colorCount: 6,
      soundEnabled: true,
      colorBlindMode: false,
      setAllowDuplicates: v => set({ allowDuplicates: v }),
      setColorCount:      v => set({ colorCount: v }),
      setSoundEnabled:    v => set({ soundEnabled: v }),
      setColorBlindMode:  v => set({ colorBlindMode: v }),
    }),
    { name: 'mm-settings' }
  )
);

// ─── Game store ───────────────────────────────────────────────────────────────
const EMPTY_GUESS = () => Array(CODE_LENGTH).fill(null);

export const useGame = create((set, get) => ({
  // ── config (set at game start) ──
  mode:           null,   // 'solo' | 'twoPlayer' | 'vsAI'
  difficulty:     'medium',
  secretCode:     [],
  allowDuplicates: true,
  colorCount:     6,

  // ── state ──
  status:         'idle', // 'idle' | 'playing' | 'won' | 'lost'
  guesses:        [],     // { pegs:[], feedback:{blacks,whites}, player:1|2 }
  currentGuess:   EMPTY_GUESS(),

  // ── 2-player ──
  currentPlayer:  1,
  p1Done:         false,
  p2Done:         false,
  p1Turns:        null,   // how many guesses P1 used to solve (null = not solved)
  p2Turns:        null,

  // ── AI internals ──
  aiPool:         [],     // remaining candidates for AI
  allPool:        [],     // full code space (for easy mode random picks)
  aiGuessCount:   0,

  // ── timer ──
  startTime:      null,
  elapsed:        0,

  // ── session stats ──
  stats: { played:0, wins:0, losses:0, best:null, streak:0, bestStreak:0 },

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  startGame({ mode, difficulty, colorCount, allowDuplicates, startingPlayer = 1 }) {
    const secret = generateCode(colorCount, allowDuplicates);
    const all    = makeAllCodes(colorCount, allowDuplicates);
    set({
      mode, difficulty, colorCount, allowDuplicates,
      secretCode:    secret,
      status:        'playing',
      guesses:       [],
      currentGuess:  EMPTY_GUESS(),
      currentPlayer: startingPlayer,
      p1Done: false, p2Done: false,
      p1Turns: null, p2Turns: null,
      aiPool:  [...all],
      allPool: all,
      aiGuessCount: 0,
      startTime: Date.now(),
      elapsed: 0,
    });
  },

  resetGame() {
    set({ status: 'idle', guesses: [], currentGuess: EMPTY_GUESS(), mode: null });
  },

  // Place a color in the current guess row
  setColor(slotIdx, colorId) {
    const g = [...get().currentGuess];
    g[slotIdx] = colorId;
    set({ currentGuess: g });
  },

  clearSlot(slotIdx) {
    const g = [...get().currentGuess];
    g[slotIdx] = null;
    set({ currentGuess: g });
  },

  // Submit the current human guess — returns feedback or null if invalid
  submitHumanGuess() {
    const s = get();
    if (s.currentGuess.some(p => p === null)) return null;
    const feedback = evaluateGuess(s.secretCode, s.currentGuess);
    // In vsAI, human is always player 2
    const player = s.mode === 'vsAI' ? 2 : s.currentPlayer;
    get()._recordGuess(s.currentGuess, feedback, player);
    return feedback;
  },

  // Internal: record a completed guess and advance state
  _recordGuess(pegs, feedback, player) {
    const s = get();
    const newGuess   = { pegs: [...pegs], feedback, player };
    const newGuesses = [...s.guesses, newGuess];
    const won        = feedback.blacks === CODE_LENGTH;

    if (s.mode === 'twoPlayer' || s.mode === 'vsAI') {
      const p1Guesses = newGuesses.filter(g => g.player === 1);
      const p2Guesses = newGuesses.filter(g => g.player === 2);

      let p1Done  = s.p1Done;
      let p2Done  = s.p2Done;
      let p1Turns = s.p1Turns;
      let p2Turns = s.p2Turns;

      if (player === 1) {
        if (won) { p1Done = true; p1Turns = p1Guesses.length; }
      } else {
        if (won) { p2Done = true; p2Turns = p2Guesses.length; }
      }

      // 10 total guesses across both players — end when anyone wins or board is full
      const totalUsed     = newGuesses.length;
      const boardFull     = totalUsed >= MAX_GUESSES;
      const gameOver      = won || boardFull;
      const neitherSolved = gameOver && p1Turns === null && p2Turns === null;
      const endStatus     = gameOver ? (neitherSolved ? 'lost' : 'won') : 'playing';
      const nextPlayer    = player === 1 ? 2 : 1;

      set({
        guesses:       newGuesses,
        currentGuess:  EMPTY_GUESS(),
        currentPlayer: gameOver ? s.currentPlayer : nextPlayer,
        p1Done, p2Done, p1Turns, p2Turns,
        status: endStatus,
        ...(gameOver ? { elapsed: Math.round((Date.now() - s.startTime) / 1000) } : {}),
      });

      if (gameOver && s.mode === 'vsAI') {
        const st           = s.stats;
        const finalP2Turns = p2Turns ?? null;
        const finalP1Turns = p1Turns ?? null;
        const humanWon     = finalP2Turns !== null && (finalP1Turns === null || finalP2Turns <= finalP1Turns);
        const streak       = humanWon ? st.streak + 1 : 0;
        set({
          stats: {
            played:     st.played + 1,
            wins:       humanWon ? st.wins + 1 : st.wins,
            losses:     humanWon ? st.losses : st.losses + 1,
            best:       humanWon ? (st.best === null ? finalP2Turns : Math.min(st.best, finalP2Turns)) : st.best,
            streak,
            bestStreak: Math.max(st.bestStreak, streak),
          },
        });
      }
    } else {
      // solo
      const total        = newGuesses.length;
      const outOfGuesses = total >= MAX_GUESSES;
      const newStatus    = won ? 'won' : outOfGuesses ? 'lost' : 'playing';

      set({
        guesses:      newGuesses,
        currentGuess: EMPTY_GUESS(),
        status:       newStatus,
        ...(newStatus !== 'playing' ? { elapsed: Math.round((Date.now() - s.startTime) / 1000) } : {}),
      });

      if (newStatus !== 'playing') {
        const st = s.stats;
        const streak = won ? st.streak + 1 : 0;
        set({
          stats: {
            played: st.played + 1,
            wins:   won ? st.wins + 1 : st.wins,
            losses: won ? st.losses : st.losses + 1,
            best:   won ? (st.best === null ? total : Math.min(st.best, total)) : st.best,
            streak,
            bestStreak: Math.max(st.bestStreak, streak),
          },
        });
      }
    }
  },

  // AI takes a turn — medium/hard AI considers ALL guesses (human + AI) to narrow pool
  doAiTurn() {
    const s = get();
    if (s.status !== 'playing') return null;

    // Rebuild pool from scratch using every guess on the board (human + AI)
    // This means medium/hard AI benefits from the human player's guesses too
    let pool = s.aiPool;
    if (s.difficulty !== 'easy') {
      pool = [...s.allPool];
      for (const g of s.guesses) {
        pool = applyFeedback(pool, g.pegs, g.feedback);
      }
      if (pool.length === 0) pool = s.aiPool; // safety fallback
    }

    const { guess, newPool } = aiNextGuess(
      pool, s.allPool, s.difficulty, s.aiGuessCount === 0, s.allowDuplicates
    );

    const feedback    = evaluateGuess(s.secretCode, guess);
    const updatedPool = applyFeedback(newPool, guess, feedback);

    set({ aiPool: updatedPool, aiGuessCount: s.aiGuessCount + 1, currentGuess: guess });
    return { guess, feedback };
  },

  commitAiGuess(guess, feedback) {
    get()._recordGuess(guess, feedback, 1); // AI is always player-slot 1 in vsAI
  },

  tickTimer() {
    const s = get();
    if (s.status === 'playing' && s.startTime) {
      set({ elapsed: Math.round((Date.now() - s.startTime) / 1000) });
    }
  },
}));