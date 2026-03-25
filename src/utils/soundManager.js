let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
function tone(freq, type, dur, vol = 0.12, delay = 0) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    g.gain.setValueAtTime(0, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + dur);
  } catch (_) {}
}
export const sounds = {
  peg()    { tone(440, 'sine', 0.07, 0.1); },
  submit() { tone(330,'triangle',0.08,0.09); tone(500,'triangle',0.08,0.09,0.09); },
  black()  { tone(600,'sine',0.1,0.11); },
  white()  { tone(400,'sine',0.08,0.08); },
  win()    { [523,659,784,1047].forEach((f,i) => tone(f,'triangle',0.25,0.13,i*0.11)); },
  lose()   { tone(220,'sawtooth',0.3,0.1); tone(165,'sawtooth',0.4,0.08,0.18); },
  error()  { tone(180,'square',0.12,0.1); },
  switch() { tone(350,'sine',0.08,0.09); tone(500,'sine',0.1,0.1,0.09); },
};