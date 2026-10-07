// Grammar Quest sound effects (Mikey 10-07: no songs, MIDI-style effects like
// the Red Square game, but not 8-bit). Each effect is a short note list
// played by small modern instruments built from sine partials (bell,
// glockenspiel, marimba, a soft pad), through a gentle filter and a little
// room reverb. Nothing to download, all motifs original. Sounds play only
// after a click (browsers unlock audio on a gesture) and never throw.

type Note = [midi: number, startBeats: number, lengthBeats: number];
export type Instrument = 'bell' | 'glock' | 'marimba' | 'pad';

interface Effect {
  bpm: number;
  instrument: Instrument;
  gain: number;
  notes: Note[];
  // an optional pad held under the notes (fanfare)
  pad?: Note[];
}

// Partials as [frequency ratio, level, decay seconds]. Bells ring with a
// slightly inharmonic overtone; marimba is a short wooden knock.
const INSTRUMENTS: Record<
  Instrument,
  { partials: [number, number, number][]; attack: number }
> = {
  bell: {
    attack: 0.004,
    partials: [
      [1, 1, 1.1],
      [2.01, 0.35, 0.6],
      [3.99, 0.12, 0.3],
      [5.4, 0.05, 0.18]
    ]
  },
  glock: {
    attack: 0.002,
    partials: [
      [1, 1, 0.7],
      [2.76, 0.25, 0.25],
      [5.4, 0.1, 0.12]
    ]
  },
  marimba: {
    attack: 0.003,
    partials: [
      [1, 1, 0.35],
      [3.93, 0.2, 0.08],
      [9.2, 0.05, 0.03]
    ]
  },
  pad: {
    attack: 0.12,
    partials: [
      [1, 1, 1.6],
      [2, 0.25, 1.4],
      [3, 0.08, 1.2]
    ]
  }
};

const EFFECTS = {
  // a soft wooden tick when a stop is picked on the map
  select: {
    bpm: 480,
    instrument: 'marimba',
    gain: 0.22,
    notes: [[84, 0, 0.5]]
  },
  // a game picked on the Grammarbles menu: a quick bright rise
  start: {
    bpm: 520,
    instrument: 'bell',
    gain: 0.2,
    notes: [
      [72, 0, 1],
      [79, 1, 1],
      [84, 2, 2]
    ]
  },
  // right first try: a bright rising interval, pitched up with the combo
  correct: {
    bpm: 420,
    instrument: 'bell',
    gain: 0.14,
    notes: [
      [76, 0, 0.5],
      [83, 0.5, 1.5]
    ]
  },
  // a miss: two low, muted marimba notes; gentle, never a buzzer
  miss: {
    bpm: 260,
    instrument: 'marimba',
    gain: 0.16,
    notes: [
      [57, 0, 0.5],
      [52, 0.5, 1]
    ]
  },
  // every 5 in a row: a quick sparkle up
  combo: {
    bpm: 600,
    instrument: 'glock',
    gain: 0.12,
    notes: [
      [79, 0, 0.5],
      [83, 0.5, 0.5],
      [86, 1, 0.5],
      [91, 1.5, 2]
    ]
  },
  // stop or fort cleared
  clear: {
    bpm: 340,
    instrument: 'marimba',
    gain: 0.2,
    notes: [
      [67, 0, 0.5],
      [72, 0.5, 0.5],
      [76, 1, 0.5],
      [79, 1.5, 0.5],
      [84, 2, 2]
    ]
  },
  // a run not cleared yet: an encouraging "almost", not a fail sound
  notYet: {
    bpm: 280,
    instrument: 'marimba',
    gain: 0.16,
    notes: [
      [72, 0, 0.5],
      [71, 0.5, 0.5],
      [72, 1, 1.5]
    ]
  },
  // perfect run or castle: bells over a warm pad
  fanfare: {
    bpm: 300,
    instrument: 'bell',
    gain: 0.12,
    notes: [
      [72, 0, 0.5],
      [76, 0.5, 0.5],
      [79, 1, 0.5],
      [84, 1.5, 1],
      [83, 2.5, 0.5],
      [84, 3, 3]
    ],
    pad: [
      [60, 0, 6],
      [64, 0, 6],
      [67, 0, 6]
    ]
  },
  // a nemesis waiting in its house: a soft, sly minor motif
  nemesis: {
    bpm: 240,
    instrument: 'marimba',
    gain: 0.18,
    notes: [
      [57, 0, 0.5],
      [60, 0.5, 0.5],
      [63, 1, 0.5],
      [62, 1.5, 1.5]
    ]
  }
} satisfies Record<string, Effect>;

export type QuestSound = keyof typeof EFFECTS;

const MUTE_KEY = 'grammarQuestMuted';
let context: BaseAudioContext | null = null;
let bus: AudioNode | null = null;

export function isQuestMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

// `fromAccount`: applying the choice saved on the account (no echo back)
export function setQuestMuted(muted: boolean, { fromAccount = false } = {}) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // not remembered here; the account still keeps it
  }
  if (!fromAccount) announceAudioChoice({ sound: !muted });
}

// A player's sound/music switch is saved on their account (Mikey 10-07: the
// choice persists everywhere); the Grammarbles page listens and saves it.
export const AUDIO_CHOICE_EVENT = 'grammarbles-audio-choice';
export function announceAudioChoice(choice: {
  sound?: boolean;
  music?: boolean;
}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUDIO_CHOICE_EVENT, { detail: choice }));
}

function audio() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  if (!context) context = new Ctx();
  const ctx = context as AudioContext;
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().catch(() => {});
  }
  // let the audio device sleep once the effects go quiet (every effect is
  // far shorter than this); the next effect wakes it
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (ctx.state === 'running' && typeof ctx.suspend === 'function')
      ctx.suspend().catch(() => {});
  }, 20000);
  return context;
}
let idleTimer: ReturnType<typeof setTimeout> | null = null;

// lets a check page render effects into a fresh (offline) context
export function __resetForTest() {
  context = null;
  bus = null;
}

// Everything goes through one bus: a gentle low-pass (takes the edge off) and
// a short room reverb mixed in quietly, so effects sit in a space instead of
// beeping in a vacuum.
function outputBus(ctx: BaseAudioContext) {
  if (bus) return bus;
  const input = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 6500;
  tone.Q.value = 0.5;
  const dry = ctx.createGain();
  dry.gain.value = 0.85;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  const reverb = ctx.createConvolver();
  reverb.buffer = roomImpulse(ctx, 1.1);
  input.connect(tone);
  tone.connect(dry).connect(ctx.destination);
  tone.connect(reverb).connect(wet).connect(ctx.destination);
  bus = input;
  return bus;
}

// A small room: decaying stereo noise.
function roomImpulse(ctx: BaseAudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
  }
  return impulse;
}

const frequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function strike(
  ctx: BaseAudioContext,
  out: AudioNode,
  instrument: Instrument,
  midi: number,
  at: number,
  hold: number,
  level: number
) {
  const { partials, attack } = INSTRUMENTS[instrument];
  for (const [ratio, partLevel, decay] of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency(midi) * ratio;
    const peak = level * partLevel;
    // a pad sustains for its held length; struck instruments just ring out
    const ring = instrument === 'pad' ? hold + decay : decay;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + attack);
    if (instrument === 'pad') gain.gain.setValueAtTime(peak, at + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + ring);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + ring + 0.05);
  }
}

// The marble run plays single notes and impacts on the same output (and the
// same mute switch). Returns null while muted or without Web Audio.
export function questAudio() {
  if (isQuestMuted()) return null;
  try {
    const ctx = audio();
    if (!ctx) return null;
    return { ctx, out: outputBus(ctx) };
  } catch {
    return null;
  }
}

export function playNote(
  midi: number,
  {
    at = 0,
    instrument = 'bell',
    level = 0.14,
    hold = 0.2
  }: {
    at?: number;
    instrument?: Instrument;
    level?: number;
    hold?: number;
  } = {}
) {
  const a = questAudio();
  if (!a) return;
  try {
    strike(
      a.ctx,
      a.out,
      instrument,
      midi,
      a.ctx.currentTime + 0.01 + at,
      hold,
      level
    );
  } catch {
    // decoration only
  }
}

// a low, round impact: a sine that drops in pitch (hits, stomps, landings)
export function playThump(strength = 1, at = 0) {
  const a = questAudio();
  if (!a) return;
  try {
    const t0 = a.ctx.currentTime + 0.01 + at;
    const o = a.ctx.createOscillator();
    const gain = a.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t0);
    o.frequency.exponentialRampToValueAtTime(42, t0 + 0.2);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.4 * strength, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    o.connect(gain).connect(a.out);
    o.start(t0);
    o.stop(t0 + 0.32);
  } catch {
    // decoration only
  }
}

// a soft noise burst (whooshes, splashes, crumbles)
export function playWhoosh(
  level = 0.12,
  length = 0.35,
  at = 0,
  from = 1800,
  to = 300
) {
  const a = questAudio();
  if (!a) return;
  try {
    const t0 = a.ctx.currentTime + 0.01 + at;
    const n = Math.floor(a.ctx.sampleRate * length);
    const buf = a.ctx.createBuffer(1, n, a.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.ctx.createBufferSource();
    src.buffer = buf;
    const filter = a.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(to, t0 + length);
    const gain = a.ctx.createGain();
    gain.gain.value = level;
    src.connect(filter).connect(gain).connect(a.out);
    src.start(t0);
  } catch {
    // decoration only
  }
}

// `shift` raises the whole effect by semitones (the combo climbs).
export function playQuestSound(
  name: QuestSound,
  { shift = 0 }: { shift?: number } = {}
) {
  if (isQuestMuted()) return;
  try {
    const ctx = audio();
    if (!ctx) return;
    const out = outputBus(ctx);
    const effect: Effect = EFFECTS[name];
    const beat = 60 / effect.bpm;
    const start = ctx.currentTime + 0.01;
    for (const [midi, at, length] of effect.notes) {
      strike(
        ctx,
        out,
        effect.instrument,
        midi + shift,
        start + at * beat,
        length * beat,
        effect.gain
      );
    }
    for (const [midi, at, length] of effect.pad || []) {
      strike(
        ctx,
        out,
        'pad',
        midi + shift,
        start + at * beat,
        length * beat,
        effect.gain * 0.35
      );
    }
  } catch {
    // sound is decoration; a failure never touches the game
  }
}
