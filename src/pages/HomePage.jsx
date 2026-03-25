import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings, useGame } from '../store/store.js';
import { COLORS } from '../utils/constants.js';

function PillGroup({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:6 }}>
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button key={opt.id} onClick={() => onChange(opt.id)} style={{
            flex:1, padding:'9px 6px', borderRadius:10, fontSize:13, fontWeight:700,
            cursor:'pointer', transition:'all 0.12s', border:'none', outline:'none',
            background: active ? 'linear-gradient(135deg,rgba(240,192,96,0.22),rgba(200,120,26,0.18))' : 'rgba(255,255,255,0.05)',
            color: active ? '#f0c060' : 'rgba(255,255,255,0.4)',
            boxShadow: active ? 'inset 0 0 0 1.5px rgba(240,192,96,0.5), 0 2px 12px rgba(240,192,96,0.12)' : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            transform: active ? 'translateY(-1px)' : 'none',
          }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', margin:0 }}>{label}</p>
        {desc && <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:'2px 0 0' }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        flexShrink:0, width:44, height:24, borderRadius:12, position:'relative',
        cursor:'pointer', border:'none', outline:'none', transition:'background 0.2s',
        background: checked ? 'linear-gradient(135deg,#f0c060,#c8781a)' : 'rgba(255,255,255,0.12)',
        boxShadow: checked ? '0 2px 10px rgba(240,192,96,0.3)' : 'none',
      }}>
        <div style={{
          position:'absolute', top:4, width:16, height:16, borderRadius:'50%',
          background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
          transition:'left 0.18s cubic-bezier(.4,0,.2,1)',
          left: checked ? 24 : 4,
        }} />
      </button>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
      borderRadius:16, padding:'18px 20px', ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)',
      textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 10px', paddingLeft:2 }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />;
}

// ── How To Play ──────────────────────────────────────────────────────────────
function HowToPlay({ onClose }) {
  const [tab, setTab] = useState('basics');

  const tabs = [
    { id:'basics',   label:'Basics'   },
    { id:'modes',    label:'Modes'    },
    { id:'settings', label:'Settings' },
    { id:'tips',     label:'Tips'     },
  ];

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(13,15,20,0.92)', backdropFilter:'blur(16px)', padding:16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'rgba(18,21,32,0.99)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:20, padding:24, maxWidth:440, width:'100%', maxHeight:'88vh',
        display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:22, fontWeight:800, margin:0 }}>How to Play</h2>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:8, padding:'4px 12px', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:13,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:20,
          background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:'7px 0', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer',
              border:'none', outline:'none', transition:'all 0.12s',
              background: tab===t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab===t.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflowY:'auto', flex:1, paddingRight:4}}>
          {tab === 'basics' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <InfoBlock title="🎯 Goal">
                Crack the hidden 4-color code in 10 guesses or fewer.
              </InfoBlock>
              <InfoBlock title="🖱️ Making a Guess">
                <ol style={{ margin:0, paddingLeft:18, lineHeight:2 }}>
                  <li>Click an empty peg slot — a color picker pops up.</li>
                  <li>Fill all 4 slots with your chosen colors.</li>
                  <li>Press <strong style={{ color:'#f0c060' }}>Lock</strong> to submit.</li>
                </ol>
              </InfoBlock>
              <InfoBlock title="⬤ Reading Feedback">
                After each guess, you get up to 4 feedback dots on the right:
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                  {[
                    { color:'#e53935', label:'Red dot', desc:'A Peg is correct color AND correct position.' },
                    { color:'#e8e4d8', label:'White dot', desc:'A Peg is correct color BUT wrong position.' },
                    { color:'rgba(255,255,255,0.1)', label:'Empty dot', desc:'Color not in the code.' },
                  ].map(f => (
                    <div key={f.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:13, height:13, borderRadius:'50%', flexShrink:0,
                        background:f.color, border:'1px solid rgba(255,255,255,0.15)' }} />
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>
                        <strong style={{ color:'rgba(255,255,255,0.8)' }}>{f.label}</strong> — {f.desc}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ display:'flex', marginTop:10, fontSize:12, color:'rgb(255, 255, 255,0.8)' }}>
                  ⚠️ Dot positions don't match slot positions; only the counts matter.
                </p>
              </InfoBlock>
            </div>
          )}

          {tab === 'modes' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { icon:'🎯', name:'Solo', color:'#f0c060',
                  lines:['A random code is generated.','You have 10 guesses to crack it alone.','No time limit, but the timer tracks your speed.'] },
                { icon:'⚔️', name:'Vs Friend', color:'#93c5fd',
                  lines:['Both players share the same board and the same secret code.','You take turns — Player 1 guesses, then Player 2, alternating.','A pass-the-device screen appears between turns.','Whoever cracks the code in fewer guesses wins. If neither solves it, the one who got closest wins.'] },
                { icon:'🤖', name:'Vs AI', color:'#c4b5fd',
                  lines:['You and the AI share the same board and code.','You alternate turns — you guess, then the AI guesses.','The AI\'s strategy depends on difficulty.','Fewest guesses to crack the code wins.'] },
              ].map(m => (
                <div key={m.name} style={{
                  background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:12, padding:'14px 16px',
                }}>
                  <p style={{ margin:'0 0 8px', fontSize:15, fontWeight:700, color:m.color }}>
                    {m.icon} {m.name}
                  </p>
                  <ul style={{ margin:0, paddingLeft:16, display:'flex', flexDirection:'column', gap:4 }}>
                    {m.lines.map((l,i) => (
                      <li key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)',
                background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 14px' }}>
                🤖 <strong style={{ color:'rgba(255,255,255,0.5)' }}>AI Difficulties:</strong>{' '}
                <span style={{ color:'#2dc653' }}>Easy</span> = random guesses.{' '}
                <span style={{ color:'#f7c948' }}>Medium</span> = filters by feedback.{' '}
                <span style={{ color:'#e63946' }}>Hard</span> = Knuth's algorithm (solves in ≤5 moves).
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { icon:'🔁', name:'Allow Duplicate Colors', desc:'When ON: the same color can appear more than once in the code (e.g. Red-Red-Blue-Green). When OFF: each color appears at most once — a stricter puzzle.' },
                { icon:'👁️', name:'Colorblind Mode', desc:'Adds a unique symbol (●■▲◆★✦) on every peg so you can distinguish colors by shape alone, without relying on hue.' },
                { icon:'🔊', name:'Sound Effects', desc:'Plays audio cues for peg placement, guess submission, feedback dots, wins and losses. Uses Web Audio API — no files downloaded.' },
                { icon:'🎨', name:'Palette Size (6 / 7 / 8)', desc:'The number of distinct colors in the game. More colors = larger search space = harder code. With 6 colors and no duplicates, the code has 360 possible combinations. With 8 colors and duplicates, there are 4096.' },
              ].map(s => (
                <div key={s.name} style={{
                  background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:12, padding:'14px 16px',
                }}>
                  <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
                    {s.icon} {s.name}
                  </p>
                  <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.55 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'tips' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { emoji:'🧪', tip:'First guess: use 4 different colors to maximize information from the feedback.' },
                { emoji:'🔢', tip:'Count carefully — two red pegs in your guess only give two dots even if both are correct.' },
                { emoji:'⚔️', tip:'In 2-player and vs AI: watch your opponent\'s feedback rows! They reveal info about the code.' },
                { emoji:'🤖', tip:'Against Hard AI: it will always crack the code in 5 moves or fewer. Race to beat it in 4 or less.' },
              ].map((t,i) => (
                <div key={i} style={{
                  display:'flex', gap:12, padding:'12px 14px',
                  background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:11,
                }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{t.emoji}</span>
                  <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>{t.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={onClose} className="btn-gold"
          style={{ width:'100%', marginTop:20, padding:'12px 0', textAlign:'center', borderRadius:12, fontSize:14 }}>
          Got it — Let's Play!
        </button>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }) {
  return (
    <div>
      <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.75)', margin:'0 0 8px' }}>{title}</p>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{children}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate  = useNavigate();
  const settings  = useSettings();
  const gameStats = useGame(s => s.stats);

  const [mode,       setMode]   = useState('solo');
  const [difficulty, setDiff]   = useState('medium');
  const [firstPlayer, setFirst] = useState('random');
  const [showHTP,    setHTP]    = useState(false);

  function start() {
    let sp = 1;
    if (firstPlayer === 'random') sp = Math.random() < 0.5 ? 1 : 2;
    else sp = parseInt(firstPlayer);
    navigate('/game', { state: {
      mode, difficulty,
      colorCount:      settings.colorCount,
      allowDuplicates: settings.allowDuplicates,
      startingPlayer:  sp,
    }});
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'28px 16px',
      background:'linear-gradient(160deg, #0d0f14 0%, #111420 60%, #0d0f14 100%)',
    }}>
      {/* BG glows */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:560, height:560, top:'-8%', left:'50%',
          transform:'translateX(-50%)',
          background:'radial-gradient(circle, rgba(240,192,96,0.055), transparent 68%)',
          borderRadius:'50%' }} />
        <div style={{ position:'absolute', width:380, height:380, bottom:'-5%', right:'-8%',
          background:'radial-gradient(circle, rgba(139,92,246,0.04), transparent 68%)',
          borderRadius:'50%' }} />
      </div>

      {showHTP && <HowToPlay onClose={() => setHTP(false)} />}

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:14 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:4 }}>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:9, marginBottom:16 }}>
            {COLORS.slice(0,6).map((c,i) => {
              const sizes = [20,26,32,32,26,20];
              return (
                <div key={c.id} style={{
                  width:sizes[i], height:sizes[i], borderRadius:'50%',
                  background:`radial-gradient(circle at 35% 32%, ${c.hex}ff, ${c.hex}99)`,
                  boxShadow:`0 3px 12px ${c.hex}44, inset 0 1px 0 rgba(255,255,255,0.28)`,
                }} />
              );
            })}
          </div>
          <h1 style={{ fontFamily:'Playfair Display, serif', fontSize:44, fontWeight:900,
            margin:0, letterSpacing:'-0.02em', lineHeight:1 }}>Mastermind</h1>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginTop:5, letterSpacing:'0.04em' }}>
            Crack the secret code
          </p>
        </div>

        {/* Mode */}
        <div>
          <SectionLabel>Game Mode</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {[
              { id:'solo',      icon:'🎯', title:'Solo',      desc:'Crack the code alone' },
              { id:'twoPlayer', icon:'⚔️', title:'Vs Friend', desc:'Alternate turns on the same board' },
              { id:'vsAI',      icon:'🤖', title:'Vs AI',     desc:'Race the computer on the same board' },
            ].map(m => {
              const active = mode === m.id;
              return (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  display:'flex', alignItems:'center', gap:13, padding:'12px 15px',
                  borderRadius:13, textAlign:'left', cursor:'pointer', border:'none', outline:'none',
                  transition:'all 0.13s',
                  background: active ? 'linear-gradient(135deg,rgba(240,192,96,0.13),rgba(200,120,26,0.07))' : 'rgba(255,255,255,0.04)',
                  boxShadow: active ? 'inset 0 0 0 1.5px rgba(240,192,96,0.45), 0 4px 18px rgba(240,192,96,0.07)' : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  transform: active ? 'translateY(-1px)' : 'none',
                }}>
                  <div style={{
                    width:40, height:40, borderRadius:11, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:19,
                    background: active ? 'rgba(240,192,96,0.15)' : 'rgba(255,255,255,0.06)',
                    border: active ? '1px solid rgba(240,192,96,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}>{m.icon}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:700,
                      color: active ? '#f0c060' : 'rgba(255,255,255,0.8)' }}>{m.title}</p>
                    <p style={{ margin:'1px 0 0', fontSize:12, color:'rgba(255,255,255,0.35)' }}>{m.desc}</p>
                  </div>
                  <div style={{
                    width:7, height:7, borderRadius:'50%', flexShrink:0,
                    background: active ? '#f0c060' : 'transparent',
                    boxShadow: active ? '0 0 8px #f0c060' : 'none', transition:'all 0.15s',
                  }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        {mode === 'vsAI' && (
          <div>
            <SectionLabel>AI Difficulty</SectionLabel>
            <PillGroup value={difficulty} onChange={setDiff} options={[
              { id:'easy', label:'Easy' }, { id:'medium', label:'Medium' }, { id:'hard', label:'Hard' },
            ]} />
          </div>
        )}

        {/* First player */}
        {mode === 'twoPlayer' && (
          <div>
            <SectionLabel>Who Goes First?</SectionLabel>
            <PillGroup value={firstPlayer} onChange={setFirst} options={[
              { id:'random', label:'🎲 Random' }, { id:'1', label:'Player 1' }, { id:'2', label:'Player 2' },
            ]} />
          </div>
        )}

        {/* Settings */}
        <Card>
          <p style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.55)', margin:'0 0 14px' }}>⚙️ Game Settings</p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Toggle label="Allow Duplicate Colors" desc="Same color can appear more than once"
              checked={settings.allowDuplicates} onChange={settings.setAllowDuplicates} />
            <Divider />
            <Toggle label="Colorblind Mode" desc="Adds unique symbols to every peg"
              checked={settings.colorBlindMode} onChange={settings.setColorBlindMode} />
            <Divider />
            <Toggle label="Sound Effects"
              checked={settings.soundEnabled} onChange={settings.setSoundEnabled} />
            <Divider />
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.65)', margin:'0 0 8px' }}>Palette Size</p>
              <div style={{ display:'flex', gap:7, marginBottom:9 }}>
                {[6,7,8].map(n => {
                  const active = settings.colorCount === n;
                  return (
                    <button key={n} onClick={() => settings.setColorCount(n)} style={{
                      flex:1, padding:'8px 0', borderRadius:9, fontSize:14, fontWeight:800,
                      cursor:'pointer', border:'none', outline:'none', transition:'all 0.12s',
                      background: active ? 'rgba(240,192,96,0.15)' : 'rgba(255,255,255,0.05)',
                      color: active ? '#f0c060' : 'rgba(255,255,255,0.35)',
                      boxShadow: active ? 'inset 0 0 0 1.5px rgba(240,192,96,0.45)' : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                      transform: active ? 'translateY(-1px)' : 'none',
                    }}>{n}</button>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                {COLORS.slice(0, settings.colorCount).map(c => (
                  <div key={c.id} style={{
                    width:18, height:18, borderRadius:'50%',
                    background:`radial-gradient(circle at 35% 32%, ${c.hex}ff, ${c.hex}99)`,
                    boxShadow:`0 2px 7px ${c.hex}44`,
                  }} />
                ))}
                {settings.colorBlindMode && COLORS.slice(0, settings.colorCount).map(c => (
                  <span key={'sym'+c.id} style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700 }}>{c.symbol}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Session stats */}
        {gameStats.played > 0 && (
          <Card style={{ padding:'11px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)',
                textTransform:'uppercase', letterSpacing:'0.1em' }}>Session VS AI</span>
              <div style={{ display:'flex', gap:14 }}>
                <span style={{ fontSize:12, fontFamily:'monospace', fontWeight:700, color:'rgba(255,255,255,0.5)' }}>
                  {gameStats.wins}W / {gameStats.losses}L
                </span>
                {gameStats.best && (
                  <span style={{ fontSize:12, fontFamily:'monospace', color:'rgba(255,255,255,0.4)' }}>
                    Best: {gameStats.best}
                  </span>
                )}
                <span style={{ fontSize:12, fontFamily:'monospace', fontWeight:700, color:'#f0c060' }}>
                  🔥{gameStats.streak}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:2 }}>
          <button onClick={start} className="btn-gold"
            style={{ width:'100%', padding:'14px 0', fontSize:15, textAlign:'center', borderRadius:13 }}>
            Start Game →
          </button>
          <button onClick={() => setHTP(true)} className="btn-ghost"
            style={{ width:'100%', padding:'11px 0', fontSize:14, textAlign:'center', borderRadius:13 }}>
            ❓ How to Play
          </button>
        </div>

      </div>
    </div>
  );
}