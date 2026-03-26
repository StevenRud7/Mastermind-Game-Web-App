import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame, useSettings } from '../store/store.js';
import { COLORS, MAX_GUESSES, CODE_LENGTH } from '../utils/constants.js';
import { sounds } from '../utils/soundManager.js';

function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ─── Peg ──────────────────────────────────────────────────────────────────────
function Peg({ colorId, size = 38, colorBlindMode = false, interactive = false, selected = false }) {
  const colorDef = colorId ? COLORS.find(c => c.id === colorId) : null;

  const base = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', transition: 'transform 0.1s, box-shadow 0.12s',
    cursor: interactive ? 'pointer' : 'default',
  };

  if (!colorDef) {
    return (
      <div style={{
        ...base,
        background: interactive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: selected
          ? '2px solid #f0c060'
          : interactive
          ? '2px solid rgba(255,255,255,0.2)'
          : '2px dashed rgba(255,255,255,0.1)',
        boxShadow: selected ? '0 0 10px rgba(240,192,96,0.4)' : 'none',
      }} />
    );
  }

  return (
    <div style={{
      ...base,
      background: `radial-gradient(circle at 35% 32%, ${colorDef.hex}ff, ${colorDef.hex}bb)`,
      boxShadow: selected
        ? `0 0 0 2px #f0c060, 0 0 14px rgba(240,192,96,0.5), 0 2px 10px ${colorDef.hex}55`
        : `0 2px 10px ${colorDef.hex}44, inset 0 1px 0 rgba(255,255,255,0.28)`,
    }}>
      <div style={{
        position: 'absolute', width: '38%', height: '28%', top: '17%', left: '18%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.5), transparent)',
        pointerEvents: 'none',
      }} />
      {colorBlindMode && (
        <span style={{
          fontSize: size * 0.3, fontWeight: 800,
          color: 'rgba(0,0,0,0.65)', lineHeight: 1, userSelect: 'none', zIndex: 1,
        }}>
          {colorDef.symbol}
        </span>
      )}
    </div>
  );
}

// ─── Feedback dots ─────────────────────────────────────────────────────────────
// Red = correct color + correct position. White = correct color, wrong position.
function FeedbackDot({ type }) {
  const base = { width: 11, height: 11, borderRadius: '50%', flexShrink: 0 };
  if (type === 'black')
    return <div style={{ ...base, background: 'radial-gradient(circle at 35% 30%, #ff5252, #c62828)', boxShadow: '0 0 4px rgba(198,40,40,0.6)' }} />;
  if (type === 'white')
    return <div style={{ ...base, background: 'radial-gradient(circle at 35% 30%, #fff, #ccc)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }} />;
  return <div style={{ ...base, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />;
}

function FeedbackGrid({ feedback }) {
  const blacks = feedback?.blacks ?? 0;
  const whites = feedback?.whites ?? 0;
  const dots = [
    ...Array(blacks).fill('black'),
    ...Array(whites).fill('white'),
    ...Array(Math.max(0, CODE_LENGTH - blacks - whites)).fill('empty'),
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      {dots.map((t, i) => <FeedbackDot key={i} type={t} />)}
    </div>
  );
}

// ─── Color picker popup ────────────────────────────────────────────────────────
function ColorPicker({ colorCount, colorBlindMode, onSelect, onClose, disabledColors = [], slotIndex = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Opens to the RIGHT of the column, aligned to top for slots 0-1 and bottom for 2-3
  // This prevents the picker from clipping outside the board at the top or bottom
  const alignTop = slotIndex <= 1;
  return (
    <div ref={ref} style={{
      position: 'absolute',
      left: 'calc(100% + 10px)',
      ...(alignTop ? { top: 0 } : { bottom: 0 }),
      background: 'rgba(16,19,30,0.98)', border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 14, padding: 12, zIndex: 200,
      boxShadow: '0 10px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)',
    }}>
      {/* Arrow pointing left toward the peg, vertically centred on the peg */}
      <div style={{
        position: 'absolute',
        top: alignTop ? 16 : undefined,
        bottom: alignTop ? undefined : 16,
        left: -7, marginTop: alignTop ? 0 : undefined,
        width: 12, height: 12, background: 'rgba(16,19,30,0.98)',
        border: '1px solid rgba(255,255,255,0.14)',
        transform: 'rotate(45deg)', borderTop: 'none', borderRight: 'none',
      }} />

      <p style={{
        fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center',
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700,
      }}>Pick Color</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {COLORS.slice(0, colorCount).map(c => {
          const disabled = disabledColors.includes(c.id);
          return (
            <div
              key={c.id}
              title={c.label}
              onClick={() => !disabled && onSelect(c.id)}
              style={{
                opacity: disabled ? 0.22 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
            >
              <div
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 32%, ${c.hex}ff, ${c.hex}99)`,
                  boxShadow: `0 2px 8px ${c.hex}55, inset 0 1px 0 rgba(255,255,255,0.28)`,
                  transition: 'transform 0.1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {colorBlindMode && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,0,0,0.65)' }}>
                    {c.symbol}
                  </span>
                )}
              </div>
              {colorBlindMode && (
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
                  {c.label.slice(0, 3)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GuessColumn ──────────────────────────────────────────────────────────────
// One guess attempt rendered as a vertical column. All columns share the same
// fixed width (COL_W) so the board stays perfectly uniform regardless of whether
// a player or AI badge is present. The badge area is always rendered at a fixed
// height — hidden via `visibility: hidden` when there is no badge.
const COL_W = 68;

function GuessColumn({
  pegs, feedback, isActive, colNum, playerLabel, isAiRow,
  onPegClick, onSubmit, colorCount, colorBlindMode, allowDuplicates,
}) {
  const [openSlot, setOpenSlot] = useState(null);

  const handlePegClick = idx => {
    if (!isActive) return;
    setOpenSlot(prev => prev === idx ? null : idx);
  };

  const handleColorSelect = colorId => {
    onPegClick(openSlot, colorId);
    setOpenSlot(null);
  };

  const isFilled = pegs.every(p => p !== null);

  let badgeText = null, badgeBg = 'transparent', badgeColor = 'transparent', badgeBorder = 'transparent';
  if (playerLabel === 'P1') {
    badgeText = 'P1'; badgeBg = 'rgba(72,149,239,0.18)'; badgeColor = '#93c5fd'; badgeBorder = 'rgba(72,149,239,0.3)';
  } else if (playerLabel === 'P2') {
    badgeText = 'P2'; badgeBg = 'rgba(240,114,182,0.18)'; badgeColor = '#f9a8d4'; badgeBorder = 'rgba(240,114,182,0.3)';
  } else if (isAiRow) {
    badgeText = 'AI'; badgeBg = 'rgba(139,92,246,0.18)'; badgeColor = '#c4b5fd'; badgeBorder = 'rgba(139,92,246,0.3)';
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '6px 4px', borderRadius: 10,
      background: isActive ? 'rgba(255,255,255,0.055)' : feedback ? 'rgba(255,255,255,0.02)' : 'transparent',
      border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
      opacity: (!isActive && !feedback && !isAiRow) ? 0.28 : 1,
      transition: 'background 0.2s, border 0.2s, opacity 0.2s',
      width: COL_W, minWidth: COL_W, flexShrink: 0,
    }}>

      {/* Fixed-height header: column number + optional badge */}
      <div style={{
        height: 20, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 3, width: '100%',
      }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          {colNum}
        </span>
        <span style={{
          fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 4,
          background: badgeBg, color: badgeColor,
          border: `1px solid ${badgeText ? badgeBorder : 'transparent'}`,
          visibility: badgeText ? 'visible' : 'hidden',
          minWidth: 18, textAlign: 'center',
        }}>
          {badgeText || 'XX'}
        </span>
      </div>

      {/* 4 pegs stacked vertically */}
      {pegs.map((colorId, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <div
            onClick={() => handlePegClick(i)}
            style={{ cursor: isActive ? 'pointer' : 'default', borderRadius: '50%' }}
          >
            <Peg
              colorId={colorId}
              size={44}
              interactive={isActive}
              selected={isActive && openSlot === i}
              colorBlindMode={colorBlindMode}
            />
          </div>
          {isActive && openSlot === i && (
            <ColorPicker
              colorCount={colorCount}
              colorBlindMode={colorBlindMode}
              onSelect={handleColorSelect}
              onClose={() => setOpenSlot(null)}
              disabledColors={allowDuplicates ? [] : pegs.filter((p, pi) => p && pi !== i)}
              slotIndex={i}
            />
          )}
        </div>
      ))}

      {/* Feedback 2×2 grid */}
      <FeedbackGrid feedback={feedback} />

      {/* Lock button row — fixed height so all columns align at the bottom */}
      <div style={{ height: 28, display: 'flex', alignItems: 'center', width: '100%' }}>
        {isActive && (
          <button
            onClick={isFilled ? onSubmit : undefined}
            style={{
              padding: '4px 0', width: '100%', borderRadius: 6, fontSize: 10, fontWeight: 700,
              border: 'none', transition: 'all 0.13s',
              cursor: isFilled ? 'pointer' : 'not-allowed',
              background: isFilled ? 'linear-gradient(135deg,#f0c060,#c8781a)' : 'rgba(255,255,255,0.06)',
              color: isFilled ? '#0d0f14' : 'rgba(255,255,255,0.2)',
              boxShadow: isFilled ? '0 2px 10px rgba(240,192,96,0.3)' : 'none',
            }}
            onMouseDown={e => { if (isFilled) e.currentTarget.style.transform = 'scale(0.94)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {isFilled ? 'Lock' : '···'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── AI thinking column ────────────────────────────────────────────────────────
// Matches GuessColumn exactly in size so the board stays uniform.
function AiThinkingColumn({ colNum }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '6px 4px', borderRadius: 10,
      width: COL_W, minWidth: COL_W, flexShrink: 0,
      background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
    }}>
      <div style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
          {colNum}
        </span>
        <span style={{
          fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 4,
          minWidth: 18, textAlign: 'center',
          background: 'rgba(139,92,246,0.18)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)',
        }}>AI</span>
      </div>

      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.22)',
          animation: `aiPulse ${0.7 + i * 0.12}s ease-in-out infinite alternate`,
        }} />
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        ))}
      </div>

      {/* Spacer matching the Lock button row */}
      <div style={{ height: 28 }} />
    </div>
  );
}

// ─── Secret code column ────────────────────────────────────────────────────────
// Leftmost column. Same height as GuessColumn so the board aligns perfectly.
function SecretCodeColumn({ secretCode, revealed, colorBlindMode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '6px 4px', borderRadius: 10,
      width: COL_W, minWidth: COL_W, flexShrink: 0,
      background: revealed ? 'rgba(240,192,96,0.07)' : 'rgba(255,255,255,0.03)',
      border: revealed ? '1px solid rgba(240,192,96,0.25)' : '1px solid rgba(255,255,255,0.07)',
      transition: 'all 0.3s',
    }}>
      {/* Fixed header matching GuessColumn */}
      <div style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>Code</span>
      </div>

      {Array.from({ length: CODE_LENGTH }).map((_, i) =>
        revealed ? (
          <Peg key={i} colorId={secretCode[i]} size={44} colorBlindMode={colorBlindMode} />
        ) : (
          <div key={i} style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'rgba(255,255,255,0.18)',
          }}>?</div>
        )
      )}

      {/* Spacers matching FeedbackGrid + Lock button row heights */}
      <div style={{ height: 29 }} />
      <div style={{ height: 28 }} />
    </div>
  );
}



// ─── Turn transition toast ─────────────────────────────────────────────────────
// Slim banner that fades in/out for 2 seconds when it's a new player's turn.
// TurnBadge — persistent pill showing whose turn it is.
// animateIn triggers a quick pop-in animation on player change.
function TurnBadge({ mode, currentPlayer, aiThinking, animateIn }) {
  if (mode === 'twoPlayer') {
    const isP1  = currentPlayer === 1;
    const col   = isP1 ? '#93c5fd' : '#f9a8d4';
    const bg    = isP1 ? 'rgba(72,149,239,0.15)' : 'rgba(240,114,182,0.15)';
    const bdr   = isP1 ? 'rgba(72,149,239,0.38)' : 'rgba(240,114,182,0.38)';
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderRadius: 40,
        background: bg, border: `1px solid ${bdr}`,
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        animation: animateIn ? 'badgePop 0.28s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          background: isP1 ? 'rgba(72,149,239,0.3)' : 'rgba(240,114,182,0.3)',
          border: `1.5px solid ${col}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 900, color: col,
        }}>P{currentPlayer}</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: col }}>
          Player {currentPlayer}'s Turn
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>· pass the device</span>
      </div>
    );
  }
  if (mode === 'vsAI') {
    if (aiThinking) {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 40,
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>🤖 AI is thinking…</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderRadius: 40,
        background: 'rgba(240,192,96,0.12)', border: '1px solid rgba(240,192,96,0.3)',
        animation: animateIn ? 'badgePop 0.28s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0c060' }}>Your Turn</span>
      </div>
    );
  }
  // solo — no badge needed, return an invisible spacer
  return null;
}

// ─── Result modal ──────────────────────────────────────────────────────────────
function ResultModal({ onPlayAgain, onHome }) {
  const game     = useGame();
  const settings = useSettings();
  const { status, mode, guesses, secretCode, elapsed, p1Turns, p2Turns, stats } = game;

  if (status === 'idle' || status === 'playing') return null;

  let emoji = '🏆', headline = '', sub = '';

  if (mode === 'twoPlayer') {
    const p1Won = p1Turns !== null;
    const p2Won = p2Turns !== null;
    if (p1Won && p2Won) {
      if (p1Turns < p2Turns)      { headline = 'Player 1 Wins!'; sub = `P1: ${p1Turns} guesses vs P2: ${p2Turns}`; }
      else if (p2Turns < p1Turns) { headline = 'Player 2 Wins!'; sub = `P2: ${p2Turns} guesses vs P1: ${p1Turns}`; }
      else                        { emoji = '🤝'; headline = "It's a Tie!"; sub = `Both solved in ${p1Turns}`; }
    } else if (p1Won) { headline = 'Player 1 Wins!'; sub = `Solved in ${p1Turns} guess${p1Turns !== 1 ? 'es' : ''}`; }
    else if (p2Won)   { headline = 'Player 2 Wins!'; sub = `Solved in ${p2Turns} guess${p2Turns !== 1 ? 'es' : ''}`; }
    else              { emoji = '💀'; headline = 'Neither Cracked It'; sub = 'The code beats both of you'; }

  } else if (mode === 'vsAI') {
    const hSolved = guesses.filter(g => g.player === 2).findIndex(g => g.feedback.blacks === CODE_LENGTH);
    const aSolved = guesses.filter(g => g.player === 1).findIndex(g => g.feedback.blacks === CODE_LENGTH);
    const hT = hSolved >= 0 ? hSolved + 1 : null;
    const aT = aSolved >= 0 ? aSolved + 1 : null;

    if (hT !== null && aT !== null) {
      if (hT <= aT) { headline = 'You Win!'; sub = `You: ${hT} guesses, AI: ${aT}`; }
      else          { emoji = '🤖'; headline = 'AI Wins!'; sub = `AI: ${aT} guesses, You: ${hT}`; }
    } else if (hT !== null) { headline = 'You Win!';       sub = `Cracked in ${hT} guesses`; }
    else if (aT !== null)   { emoji = '🤖'; headline = 'AI Wins!';       sub = 'Better luck next time'; }
    else                    { emoji = '💀'; headline = 'Code Stands!';    sub = 'Nobody cracked it'; }

  } else {
    // solo
    const won  = status === 'won';
    emoji     = won ? '🏆' : '💀';
    headline  = won ? 'Code Cracked!' : 'Code Stands!';
    sub       = won
      ? `Solved in ${guesses.length} guess${guesses.length !== 1 ? 'es' : ''}`
      : 'Better luck next time';
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,15,20,0.9)', backdropFilter: 'blur(12px)', padding: 16,
    }}>
      <div style={{
        background: 'rgba(18,21,32,0.99)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: 28, maxWidth: 360, width: '100%',
        boxShadow: '0 24px 70px rgba(0,0,0,0.75)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>{emoji}</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>
            {headline}
          </h2>
          {sub && (
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>{sub}</p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
          <p style={{
            fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 10, fontWeight: 700,
          }}>The Secret Code</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {secretCode.map((c, i) => (
              <Peg key={i} colorId={c} size={38} colorBlindMode={settings.colorBlindMode} />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Time',    value: fmt(elapsed) },
            { label: 'Guesses', value: guesses.length },
            { label: 'Streak',  value: `🔥${stats.streak}` },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '10px 8px', textAlign: 'center',
            }}>
              <p style={{
                fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                letterSpacing: '0.08em', margin: '0 0 4px', fontWeight: 700,
              }}>{s.label}</p>
              <p style={{
                fontFamily: 'monospace', fontWeight: 700, fontSize: 15, margin: 0,
                background: 'linear-gradient(135deg,#f0c060,#d4860a)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onHome}      className="btn-ghost" style={{ flex: 1, textAlign: 'center' }}>← Menu</button>
          <button onClick={onPlayAgain} className="btn-gold"  style={{ flex: 1, textAlign: 'center' }}>Play Again</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main GamePage ─────────────────────────────────────────────────────────────
export default function GamePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const game      = useGame();
  const settings  = useSettings();

  const config = location.state;

  const [badgeAnimateIn, setBadgeAnimateIn] = useState(false);
  const prevPlayerRef   = useRef(null);
  const aiActiveRef     = useRef(false);
  const animTimerRef    = useRef(null);

  const triggerBadgeAnim = useCallback(() => {
    clearTimeout(animTimerRef.current);
    setBadgeAnimateIn(true);
    animTimerRef.current = setTimeout(() => setBadgeAnimateIn(false), 350);
  }, []);

  // Initialise game on mount
  useEffect(() => {
    if (!config?.mode) { navigate('/'); return; }
    game.startGame({
      mode:            config.mode,
      difficulty:      config.difficulty || 'medium',
      colorCount:      config.colorCount || 6,
      allowDuplicates: config.allowDuplicates ?? true,
      startingPlayer:  config.startingPlayer || 1,
    });
    if (config.mode === 'twoPlayer' || config.mode === 'vsAI') triggerBadgeAnim();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up animation timer on unmount
  useEffect(() => () => clearTimeout(animTimerRef.current), []);

  // Timer — ticks every second while game is playing
  useEffect(() => {
    const id = setInterval(() => game.tickTimer(), 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2-player / vsAI — animate the badge on player change
  useEffect(() => {
    if (game.status !== 'playing') return;
    const prev = prevPlayerRef.current;
    if (prev !== null && prev !== game.currentPlayer) {
      if (settings.soundEnabled) sounds.switch();
      triggerBadgeAnim();
    }
    prevPlayerRef.current = game.currentPlayer;
  }, [game.currentPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // vsAI — trigger AI move when it is the AI's turn (player 1)
  useEffect(() => {
    if (game.mode !== 'vsAI' || game.status !== 'playing') return;
    if (game.currentPlayer !== 1) return;
    if (aiActiveRef.current) return;
    aiActiveRef.current = true;

    const t = setTimeout(() => {
      const result = game.doAiTurn();
      if (!result) { aiActiveRef.current = false; return; }
      const { guess, feedback } = result;
      setTimeout(() => {
        game.commitAiGuess(guess, feedback);
        aiActiveRef.current = false;
        if (settings.soundEnabled) {
          sounds.submit();
          if (feedback.blacks === CODE_LENGTH) setTimeout(() => sounds.win(), 300);
        }
      }, 650);
    }, 950);

    return () => { clearTimeout(t); aiActiveRef.current = false; };
  }, [game.currentPlayer, game.status, game.mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(() => {
    const feedback = game.submitHumanGuess();
    if (!feedback) {
      if (settings.soundEnabled) sounds.error();
      return;
    }
    if (settings.soundEnabled) {
      sounds.submit();
      setTimeout(() => {
        for (let i = 0; i < feedback.blacks; i++) setTimeout(() => sounds.black(), i * 80);
        for (let i = 0; i < feedback.whites; i++) setTimeout(() => sounds.white(), feedback.blacks * 80 + i * 80);
        if (feedback.blacks === CODE_LENGTH) setTimeout(() => sounds.win(), 400);
      }, 150);
    }
  }, [game, settings]);

  const handlePegClick = useCallback((slotIdx, colorId) => {
    if (settings.soundEnabled) sounds.peg();
    game.setColor(slotIdx, colorId);
  }, [game, settings]);

  const handlePlayAgain = useCallback(() => {
    const sp = config?.startingPlayer || 1;
    game.startGame({
      mode:            config?.mode || 'solo',
      difficulty:      config?.difficulty || 'medium',
      colorCount:      config?.colorCount || 6,
      allowDuplicates: config?.allowDuplicates ?? true,
      startingPlayer:  sp,
    });
    aiActiveRef.current = false;
    triggerBadgeAnim();
  }, [config, game, triggerBadgeAnim]);

  const handleHome = useCallback(() => {
    game.resetGame();
    navigate('/');
  }, [game, navigate]);

  if (!game.mode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
      </div>
    );
  }

  const isVsAI       = game.mode === 'vsAI';
  const is2P         = game.mode === 'twoPlayer';
  const aiThinking   = isVsAI && game.currentPlayer === 1 && game.status === 'playing';
  const humanCanPlay = !aiThinking && game.status === 'playing';
  const codeRevealed = game.status !== 'playing';
  const allGuesses   = game.guesses;

  // Total guesses used across all players — the board is limited to 10 combined
  const totalGuessesUsed = allGuesses.length;
  const turnsLeft        = Math.max(0, MAX_GUESSES - totalGuessesUsed);
  // Subtract 1 for the active human column OR the AI thinking placeholder — whichever
  // is currently visible — so the total visible column count never exceeds MAX_GUESSES.
  const activeCols    = (humanCanPlay ? 1 : 0) + (aiThinking ? 1 : 0);
  const emptyColCount = Math.max(0, turnsLeft - activeCols);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 60, paddingBottom: 40,
      background: 'linear-gradient(160deg,#0d0f14,#111420 60%,#0d0f14)',
    }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, top: '-5%', right: '-5%',
          background: 'radial-gradient(circle, rgba(240,192,96,0.045), transparent 68%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* End-of-game modal */}
      <ResultModal onPlayAgain={handlePlayAgain} onHome={handleHome} />

      {/* ── Navigation bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'rgba(13,15,20,0.93)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#f0c060,#c8781a)',
            boxShadow: '0 2px 10px rgba(240,192,96,0.3)',
          }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 12, color: '#0d0f14' }}>M</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16 }}>Mastermind</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}>
            {game.mode === 'solo' ? 'Solo' : game.mode === 'twoPlayer' ? 'Vs Friend' : `Vs AI · ${game.difficulty}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'monospace', fontWeight: 800, fontSize: 16,
            background: 'linear-gradient(135deg,#f0c060,#d4860a)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{fmt(game.elapsed)}</span>

          <button
            onClick={() => settings.setSoundEnabled(!settings.soundEnabled)}
            style={{
              fontSize: 13, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7, padding: '3px 9px', cursor: 'pointer', color: 'rgba(255,255,255,0.65)',
            }}
          >{settings.soundEnabled ? '🔊' : '🔇'}</button>

          <button
            onClick={() => settings.setColorBlindMode(!settings.colorBlindMode)}
            style={{
              fontSize: 11, fontWeight: 700, borderRadius: 7, padding: '3px 9px', cursor: 'pointer',
              background: settings.colorBlindMode ? 'rgba(240,192,96,0.15)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${settings.colorBlindMode ? 'rgba(240,192,96,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: settings.colorBlindMode ? '#f0c060' : 'rgba(255,255,255,0.5)',
            }}
          >CB</button>

          <button
            onClick={handleHome}
            className="btn-ghost"
            style={{ padding: '5px 13px', fontSize: 12 }}
          >← Menu</button>
        </div>
      </div>

      {/* ── Board area ── */}
      <div style={{ width: '100%', maxWidth: 1100, padding: '0 20px', position: 'relative', zIndex: 1, margin: '0 auto' }}>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          {/* Single unified guess tracker — coloured dots + numeric label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {Array.from({ length: MAX_GUESSES }).map((_, i) => {
                const used = i < totalGuessesUsed;
                return (
                  <div key={i} style={{
                    width: used ? 8 : 6,
                    height: used ? 8 : 6,
                    borderRadius: '50%',
                    transition: 'all 0.3s',
                    background: used
                      ? (turnsLeft <= 2 ? '#e63946' : '#f0c060')
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: used && turnsLeft <= 2 ? '0 0 4px #e63946' : 'none',
                  }} />
                );
              })}
            </div>
            <span style={{
              fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
              color: turnsLeft <= 2 ? '#e63946' : 'rgba(255,255,255,0.45)',
              minWidth: 48,
            }}>
              {turnsLeft} left
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[`${game.colorCount} colors`, game.allowDuplicates ? 'dupes on' : 'no dupes'].map(t => (
              <span key={t} style={{
                fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, padding: '2px 8px',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Fixed-height header: 3-column layout, always 44px so board never shifts ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', height: 44, marginBottom: 6,
        }}>
          {/* Left: "click pegs" hint — sits above the first board column */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // center within left column
          }}>
            <span style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}>
              click pegs ↓
            </span>
          </div>

          {/* Center: turn badge — perfectly centred over the board */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {game.status === 'playing' && (is2P || isVsAI) ? (
              <TurnBadge
                mode={game.mode}
                currentPlayer={game.currentPlayer}
                aiThinking={aiThinking}
                animateIn={badgeAnimateIn}
              />
            ) : (
              <div style={{ height: 32 }} />
            )}
          </div>

          {/* Right: red/white feedback legend */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4}}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5252', boxShadow: '0 0 4px rgba(255,82,82,0.5)', flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, whiteSpace: 'nowrap'}}>right color & right place</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4}}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#e8e4d8', flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, whiteSpace: 'nowrap' }}>right color & wrong place</span>
            </div>
          </div>
        </div>

        {/* ── Horizontal board ── */}
        <div style={{
          display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'flex-start',
          justifyContent: 'center',
          overflowX: 'auto', paddingBottom: 16, paddingTop: 4, scrollbarWidth: 'thin',
        }}>
          {/* Completed guess columns */}
          {allGuesses.map((g, i) => (
            <GuessColumn
              key={i}
              pegs={g.pegs}
              feedback={g.feedback}
              isActive={false}
              colNum={i + 1}
              playerLabel={is2P ? `P${g.player}` : null}
              isAiRow={isVsAI && g.player === 1}
              onPegClick={() => {}}
              onSubmit={() => {}}
              colorCount={game.colorCount}
              colorBlindMode={settings.colorBlindMode}
              allowDuplicates={game.allowDuplicates}
            />
          ))}

          {/* AI thinking placeholder */}
          {aiThinking && <AiThinkingColumn colNum={allGuesses.length + 1} />}

          {/* Active human guess column */}
          {humanCanPlay && (
            <GuessColumn
              pegs={game.currentGuess}
              feedback={null}
              isActive={true}
              colNum={allGuesses.length + (aiThinking ? 2 : 1)}
              playerLabel={is2P ? `P${game.currentPlayer}` : null}
              isAiRow={false}
              onPegClick={handlePegClick}
              onSubmit={handleSubmit}
              colorCount={game.colorCount}
              colorBlindMode={settings.colorBlindMode}
              allowDuplicates={game.allowDuplicates}
            />
          )}

          {/* Empty future columns */}
          {game.status === 'playing' && Array.from({ length: emptyColCount }).map((_, i) => (
            <GuessColumn
              key={`fut-${i}`}
              pegs={Array(CODE_LENGTH).fill(null)}
              feedback={null}
              isActive={false}
              colNum={allGuesses.length + 2 + i}
              playerLabel={null}
              isAiRow={false}
              onPegClick={() => {}}
              onSubmit={() => {}}
              colorCount={game.colorCount}
              colorBlindMode={settings.colorBlindMode}
              allowDuplicates={game.allowDuplicates}
            />
          ))}

          {/* Thin divider before secret code */}
          <div style={{
            width: 1, alignSelf: 'stretch', flexShrink: 0, margin: '0 2px',
            background: 'rgba(255,255,255,0.08)',
          }} />

          {/* Secret code — always rightmost */}
          <SecretCodeColumn
            secretCode={game.secretCode}
            revealed={codeRevealed}
            colorBlindMode={settings.colorBlindMode}
          />
        </div>
      </div>

      <style>{`
        @keyframes aiPulse {
          from { opacity: 0.35; transform: scale(0.9); }
          to   { opacity: 0.9;  transform: scale(1);   }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.88); opacity: 0.6; }
          60%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
