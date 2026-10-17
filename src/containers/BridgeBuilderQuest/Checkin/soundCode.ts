// The proximity ladder's sound check (Mikey 10-17): the phone showing a
// check-in code also chirps a short sound code (near-ultrasound, ggwave), and
// the scanning phone listens for it. Hearing it shows the two phones are in one
// room even with no shared Wi-Fi (twinkle-api meetupCheckins.ts checks the code).
// Nothing is recorded or sent but the six letters heard.
//
// Phones only play sound after a tap (unlockSound runs inside one), and iPhones
// mute web audio on silent unless the page asks for "playback".

export type SoundStatus = 'heard' | 'not_heard' | 'denied' | 'unsupported';

const PROTOCOL = 'GGWAVE_PROTOCOL_ULTRASOUND_FASTEST';
// ggwave's 0-100; loud enough across a table. 15-19 kHz: adults rarely hear
// it, many kids hear a faint tick (the page says so)
const VOLUME = 40;
// a one-second burst, then a short gap, while the code is up
const CHIRP_GAP_MS = 1400;
// the server's alphabet (meetupCheckinRules.ts SOUND_CODE_ALPHABET)
const SOUND_CODE = /^[A-HJKMNP-Z2-9]{6}$/;
const PREF_KEY = 'bridgeBuilderSoundCheck';

let context: AudioContext | null = null;
let engine: Promise<{ gg: any; tx: any; rate: number } | null> | null = null;

export function soundSupported() {
  return (
    typeof window !== 'undefined' &&
    !!(window.AudioContext || (window as any).webkitAudioContext)
  );
}

function soundContext() {
  if (!soundSupported()) return null;
  if (!context) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    context = new Ctor();
  }
  return context;
}

function setAudioSession(type: 'playback' | 'play-and-record') {
  try {
    const session = (navigator as any).audioSession;
    if (session) session.type = type;
  } catch {
    // older browsers have no audio session
  }
}

// Call inside a tap: lets this page play (and later hear) sound.
export function unlockSound() {
  try {
    const ctx = soundContext();
    if (!ctx) return;
    setAudioSession('playback');
    if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    // a silent frame starts audio on iPhones
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // no sound check on this browser; check-ins still work
  }
}

export function soundRunning() {
  return context?.state === 'running';
}

// The member's choice from the one-time explainer: 'on', 'off' or '' (not
// asked yet). Kept in memory too: with browser storage blocked the choice
// still holds for this visit (and the explainer asks again next time).
let rememberedPreference: 'on' | 'off' | '' = '';
export function soundPreference(): 'on' | 'off' | '' {
  try {
    const value = window.localStorage.getItem(PREF_KEY);
    if (value === 'on' || value === 'off') return value;
  } catch {
    // storage blocked: fall back to this visit's answer
  }
  return rememberedPreference;
}

export function setSoundPreference(value: 'on' | 'off') {
  rememberedPreference = value;
  try {
    window.localStorage.setItem(PREF_KEY, value);
  } catch {
    // remembered for this visit only
  }
}

async function loadEngine() {
  const ctx = soundContext();
  if (!ctx) return null;
  if (!engine) {
    engine = (async () => {
      const mod: any = await import('ggwave');
      const factory = mod.default || mod;
      const gg = await factory({
        print: () => undefined,
        printErr: () => undefined
      });
      gg.disableLog?.();
      return { gg, tx: newInstance(gg, ctx.sampleRate), rate: ctx.sampleRate };
    })().catch(() => null);
  }
  return engine;
}

// The library allows 4 instances at once: one sends; a listener holds one.
export function newInstance(gg: any, rate: number) {
  const params = gg.getDefaultParameters();
  params.sampleRateInp = rate;
  params.sampleRateOut = rate;
  params.sampleFormatInp = gg.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
  params.sampleFormatOut = gg.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
  return gg.init(params);
}

// The waveform of one burst (exported for the loopback test).
export function encodeSoundCode(gg: any, tx: any, code: string) {
  const bytes = gg.encode(tx, code, gg.ProtocolId[PROTOCOL], VOLUME);
  // a view into the engine's memory: copy before the next call reuses it
  return new Float32Array(new Int8Array(bytes).buffer);
}

// A receiver of sound codes. Feed it the microphone in fixed 1024-sample
// chunks (what the listener's ScriptProcessor gives): a short chunk throws
// the decoder's frames out of step and it stops hearing.
export const LISTEN_CHUNK = 1024;
export function soundReceiver(gg: any, rate: number) {
  const rx = newInstance(gg, rate);
  return {
    push(samples: Float32Array) {
      const result = gg.decode(
        rx,
        new Int8Array(new Float32Array(samples).buffer)
      );
      if (!result || !result.length) return '';
      const text = new TextDecoder().decode(new Uint8Array(result));
      return SOUND_CODE.test(text) ? text : '';
    },
    close() {
      gg.free(rx);
    }
  };
}

// Chirp the current code over and over until stopped. `current` is read
// before each burst, so a refreshed code is played from the next one.
export function startChirping(current: () => string) {
  let stopped = false;
  let timer = 0;
  let source: AudioBufferSourceNode | null = null;
  loop();
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    try {
      source?.stop();
    } catch {
      // already finished
    }
  };

  async function loop() {
    const ctx = soundContext();
    const loaded = await loadEngine();
    if (stopped || !ctx || !loaded) return;
    const code = current();
    if (code && ctx.state === 'running') {
      try {
        setAudioSession('playback');
        const wave = encodeSoundCode(loaded.gg, loaded.tx, code);
        const buffer = ctx.createBuffer(1, wave.length, ctx.sampleRate);
        buffer.getChannelData(0).set(wave);
        source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        timer = window.setTimeout(loop, buffer.duration * 1000 + CHIRP_GAP_MS);
        return;
      } catch {
        // try again after the gap
      }
    }
    timer = window.setTimeout(loop, CHIRP_GAP_MS);
  }
}

// Listen for a friend's chirp. Resolves once listening started (or why it
// could not); onHeard gets each sound code heard.
export async function startListening(
  onHeard: (code: string) => void
): Promise<{
  status: 'listening' | 'denied' | 'unsupported';
  stop: () => void;
}> {
  const none = () => undefined;
  const ctx = soundContext();
  if (!ctx || !navigator.mediaDevices?.getUserMedia)
    return { status: 'unsupported', stop: none };
  let stream: MediaStream;
  try {
    setAudioSession('play-and-record');
    stream = await navigator.mediaDevices.getUserMedia({
      // the raw sound: phones' voice clean-up removes the chirp
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
  } catch (error: any) {
    return {
      status:
        error?.name === 'NotAllowedError' || error?.name === 'SecurityError'
          ? 'denied'
          : 'unsupported',
      stop: none
    };
  }
  const loaded = await loadEngine();
  if (!loaded) {
    stream.getTracks().forEach((track) => track.stop());
    return { status: 'unsupported', stop: none };
  }
  if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
  const receiver = soundReceiver(loaded.gg, loaded.rate);
  const input = ctx.createMediaStreamSource(stream);
  // ScriptProcessor works on every phone browser; the gain keeps it silent
  const processor = ctx.createScriptProcessor(LISTEN_CHUNK, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  processor.onaudioprocess = (event) => {
    try {
      const code = receiver.push(event.inputBuffer.getChannelData(0));
      if (code) onHeard(code);
    } catch {
      // one bad chunk; keep listening
    }
  };
  input.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);
  return {
    status: 'listening',
    stop() {
      processor.onaudioprocess = null;
      try {
        input.disconnect();
        processor.disconnect();
        mute.disconnect();
      } catch {
        // already disconnected
      }
      stream.getTracks().forEach((track) => track.stop());
      receiver.close();
      setAudioSession('playback');
    }
  };
}
