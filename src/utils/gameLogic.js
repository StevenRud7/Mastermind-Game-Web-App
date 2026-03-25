import { COLORS, CODE_LENGTH } from './constants';

// ─── Code generation ─────────────────────────────────────────────────────────

export function generateCode(colorCount, allowDuplicates) {
  const palette = COLORS.slice(0, colorCount).map(c => c.id);
  const code = [];
  const pool = [...palette];
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (allowDuplicates) {
      code.push(palette[Math.floor(Math.random() * palette.length)]);
    } else {
      const idx = Math.floor(Math.random() * pool.length);
      code.push(pool[idx]);
      pool.splice(idx, 1);
    }
  }
  return code;
}

// ─── Guess evaluation ────────────────────────────────────────────────────────
// Returns { blacks, whites }

export function evaluateGuess(secret, guess) {
  let blacks = 0;
  const secretLeft = [];
  const guessLeft  = [];

  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      blacks++;
    } else {
      secretLeft.push(secret[i]);
      guessLeft.push(guess[i]);
    }
  }

  let whites = 0;
  for (const c of guessLeft) {
    const idx = secretLeft.indexOf(c);
    if (idx !== -1) { whites++; secretLeft.splice(idx, 1); }
  }

  return { blacks, whites };
}

// ─── AI helpers ──────────────────────────────────────────────────────────────

function allCodes(colorCount, allowDuplicates) {
  const palette = COLORS.slice(0, colorCount).map(c => c.id);
  const results = [];
  function build(cur, used) {
    if (cur.length === CODE_LENGTH) { results.push([...cur]); return; }
    for (const c of palette) {
      if (!allowDuplicates && used.has(c)) continue;
      used.add(c); cur.push(c);
      build(cur, used);
      cur.pop(); if (!allowDuplicates) used.delete(c);
    }
  }
  build([], new Set());
  return results;
}

function filterPool(pool, guess, fb) {
  return pool.filter(code => {
    const r = evaluateGuess(code, guess);
    return r.blacks === fb.blacks && r.whites === fb.whites;
  });
}

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Returns { guess: string[], newPool: string[][] }
// allowDuplicates is passed so the hard opener never generates invalid guesses
export function aiNextGuess(pool, allPool, difficulty, isFirst, allowDuplicates = true) {
  if (pool.length === 0) pool = allPool;

  if (difficulty === 'easy') {
    return { guess: randItem(allPool), newPool: pool };
  }

  if (difficulty === 'medium') {
    return { guess: randItem(pool), newPool: pool };
  }

  // hard: Knuth minimax with randomized tie-breaking and varied openings
  if (isFirst && allPool.length <= 1296) {
    if (allowDuplicates) {
      const palette = COLORS.slice(0, 6).map(c => c.id);
      const shuffled = [...palette].sort(() => Math.random() - 0.5);
      const [a, b] = shuffled;
      const openings = [
        [a, a, b, b], [b, b, a, a],
        [a, b, b, a], [b, a, a, b],
        [a, b, a, b], [b, a, b, a],
      ];
      return { guess: randItem(openings), newPool: pool };
    } else {
      // No-duplicates: pick a random valid opener from the pool
      return { guess: randItem(pool), newPool: pool };
    }
  }

  if (pool.length <= 2) return { guess: randItem(pool), newPool: pool };

  let bestScore = Infinity;
  const candidates = allPool.length <= 1296 ? allPool : pool;
  const scored = [];

  for (const cand of candidates) {
    const buckets = {};
    for (const poss of pool) {
      const key = `${evaluateGuess(poss, cand).blacks},${evaluateGuess(poss, cand).whites}`;
      buckets[key] = (buckets[key] || 0) + 1;
    }
    const worst = Math.max(...Object.values(buckets));
    if (worst < bestScore) bestScore = worst;
    scored.push({ cand, worst });
  }

  // Among tied candidates, prefer ones still in the pool, then randomize
  const tied   = scored.filter(s => s.worst === bestScore).map(s => s.cand);
  const poolSet = new Set(pool.map(p => JSON.stringify(p)));
  const inPool = tied.filter(c => poolSet.has(JSON.stringify(c)));
  return { guess: randItem(inPool.length > 0 ? inPool : tied), newPool: pool };
}

export function makeAllCodes(colorCount, allowDuplicates) {
  return allCodes(colorCount, allowDuplicates);
}

export function applyFeedback(pool, guess, fb) {
  return filterPool(pool, guess, fb);
}