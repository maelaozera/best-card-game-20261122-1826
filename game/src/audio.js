// Ember Duel — synthesized sound effects.
// No audio files: every sound is built with the Web Audio API from code,
// so the game loads nothing over the network. Sounds start only after the
// player presses a key or clicks, which is when browsers allow audio.

let audioContext = null;
let muted = false;

export function ensureAudio() {
  if (!audioContext) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioContext = new Ctor();
    } catch (err) {
      return null;
    }
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, startAt, duration, type, volume, slideTo) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + startAt + duration);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + duration + 0.05);
}

function noiseBurst(startAt, duration, volume) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + startAt);
}

export function playDrawSound() {
  tone(620, 0, 0.09, 'triangle', 0.12);
  tone(880, 0.06, 0.09, 'triangle', 0.1);
}

export function playCardSound() {
  noiseBurst(0, 0.12, 0.18);
  tone(330, 0, 0.12, 'sine', 0.16, 520);
}

export function playAttackSound() {
  noiseBurst(0, 0.16, 0.25);
  tone(180, 0, 0.18, 'sawtooth', 0.12, 70);
}

export function playSpellSound() {
  tone(520, 0, 0.14, 'sine', 0.14, 1040);
  tone(780, 0.1, 0.18, 'sine', 0.12, 1560);
}

export function playHealSound() {
  tone(440, 0, 0.16, 'sine', 0.12);
  tone(660, 0.12, 0.2, 'sine', 0.12);
  tone(880, 0.24, 0.26, 'sine', 0.1);
}

export function playTurnSound() {
  tone(392, 0, 0.1, 'triangle', 0.12);
  tone(523, 0.08, 0.14, 'triangle', 0.12);
}

export function playWinSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => tone(freq, i * 0.14, 0.3, 'triangle', 0.16));
  tone(1319, 0.6, 0.5, 'triangle', 0.12);
}

export function playLoseSound() {
  const notes = [392, 330, 262, 196];
  notes.forEach((freq, i) => tone(freq, i * 0.18, 0.34, 'sawtooth', 0.09));
}

export function playErrorSound() {
  tone(140, 0, 0.16, 'square', 0.08, 110);
}
