// Grammar Quest music (Mikey 10-07): an overworld theme for the map, a long
// looping level theme per world, and the fort, castle and final boss themes. Each track is an MP3 with an intro that
// plays once and a body that loops seamlessly (sample-exact loop points from
// the renderer's manifest). One track plays at a time; switching crossfades.
// Players can turn music off; the choice is remembered on this device.
// A decoded track is big (about 35 MB a minute), so only the two most recent
// stay decoded (the map's theme and the level's), and once nothing has played
// for a while they are dropped and the audio device is let go.

import { announceAudioChoice } from '../sfx';
import { gqMedia } from '../../media';
import { GQ_MUSIC } from '../../media.generated';

export interface MusicTrack {
  id: string;
  title: string;
  bpm: number;
  loopStart: number;
  loopEnd: number;
  duration: number;
}

const ENABLED_KEY = 'grammarQuestMusic';
// music sits well under the sound effects: a background, not the show
const VOLUME = 0.176; // Mikey 10-07: 80% of 0.22
const KEEP_DECODED = 2;
const IDLE_RELEASE_MS = 30000;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let manifest: Promise<Record<string, MusicTrack>> | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();
let current: {
  id: string;
  src: AudioBufferSourceNode;
  gain: GainNode;
  startedAt: number;
  offset: number;
} | null = null;
let wanted: string | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let unlockArmed = false;

// music starts OFF until the player turns it on (Mikey 10-07)
export function musicEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

// `fromAccount`: applying the choice saved on the account (no echo back)
export function setMusicEnabled(on: boolean, { fromAccount = false } = {}) {
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0');
  } catch {
    // not remembered here; the account still keeps it
  }
  if (!fromAccount) announceAudioChoice({ music: on });
  // switching off keeps `wanted`, so switching back on resumes that track
  if (!on) {
    fadeOut(current, 0.4);
    current = null;
    scheduleRelease();
  } else if (wanted) playMusic(wanted);
}

function audio() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) {
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
    armUnlock();
  }
  return ctx;
}

// iOS and Safari only start audio inside a tap or key press. A track asked
// for outside one (the map opening after a fetch) waits for the next tap.
function armUnlock() {
  if (unlockArmed || typeof document === 'undefined') return;
  unlockArmed = true;
  const events = ['pointerdown', 'touchend', 'keydown'];
  const unlock = () => {
    events.forEach((e) => document.removeEventListener(e, unlock, true));
    unlockArmed = false;
    if (ctx && ctx.state !== 'running' && wanted) ctx.resume().catch(() => {});
  };
  events.forEach((e) => document.addEventListener(e, unlock, true));
}

// keep only the most recently used decoded tracks
function touchBuffer(id: string) {
  const hit = buffers.get(id);
  if (!hit) return;
  buffers.delete(id);
  buffers.set(id, hit);
  while (buffers.size > KEEP_DECODED)
    buffers.delete(buffers.keys().next().value as string);
}

// nothing playing for a while: drop the decoded tracks and let the audio
// device sleep (a later playMusic decodes again and wakes it)
function scheduleRelease() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (current || (wanted && musicEnabled())) return;
    buffers.clear();
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  }, IDLE_RELEASE_MS);
}

export function loadManifest() {
  if (!manifest) {
    // loop points ship in the generated media module (no manifest fetch)
    manifest = Promise.resolve(GQ_MUSIC as Record<string, MusicTrack>);
  }
  return manifest;
}

function loadBuffer(id: string) {
  let hit = buffers.get(id);
  if (!hit) {
    const a = audio();
    hit = fetch(gqMedia(`music/grammar-quest/${id}.mp3`))
      .then((r) => r.arrayBuffer())
      .then((data) => a!.decodeAudioData(data));
    buffers.set(id, hit);
    hit.catch(() => buffers.delete(id));
  }
  return hit;
}

// warm a track up (fetch + decode) so it starts instantly later
export function preloadMusic(id: string) {
  if (!audio()) return;
  loadBuffer(id).catch(() => {});
}

// Start a track (crossfading from whatever plays). `offset` (seconds) is for
// the jukebox's "jump to the loop seam" button.
export async function playMusic(
  id: string,
  { fade = 0.8, offset = 0 }: { fade?: number; offset?: number } = {}
) {
  wanted = id;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = null;
  if (!musicEnabled()) return;
  if (current?.id === id && !offset) return;
  const a = audio();
  if (!a || !master) return;
  try {
    const [buffer, tracks] = await Promise.all([
      loadBuffer(id),
      loadManifest()
    ]);
    if (wanted !== id || !musicEnabled()) return;
    touchBuffer(id);
    const meta = tracks[id];
    const src = a.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    if (meta) {
      src.loopStart = meta.loopStart;
      src.loopEnd = Math.min(meta.loopEnd, buffer.duration);
    }
    const gain = a.createGain();
    gain.gain.setValueAtTime(0.0001, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(1, a.currentTime + fade);
    src.connect(gain).connect(master);
    src.start(a.currentTime, offset);
    fadeOut(current, fade);
    current = { id, src, gain, startedAt: a.currentTime, offset };
  } catch {
    // music is decoration: a failed load never touches the game
  }
}

export function stopMusic(fade = 0.8) {
  wanted = null;
  fadeOut(current, fade);
  current = null;
  scheduleRelease();
}

function fadeOut(track: typeof current, fade: number) {
  if (!track || !ctx) return;
  const t = ctx.currentTime;
  track.gain.gain.cancelScheduledValues(t);
  track.gain.gain.setValueAtTime(Math.max(0.0001, track.gain.gain.value), t);
  track.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
  track.src.stop(t + fade + 0.05);
}

// where the current track is (seconds into the file), for the jukebox
export function musicPosition() {
  if (!current || !ctx) return null;
  const meta = current.src;
  const played = ctx.currentTime - current.startedAt + current.offset;
  const { loopStart, loopEnd } = meta;
  if (!meta.loop || loopEnd <= loopStart || played < loopEnd)
    return { id: current.id, at: played };
  return {
    id: current.id,
    at: loopStart + ((played - loopStart) % (loopEnd - loopStart))
  };
}

// which track a node plays: its world's theme, or a boss theme
export function musicForNode(nodeId: string) {
  const m = /^w(\d+)([sfc])/.exec(nodeId);
  if (!m) return 'w1-starter-village';
  if (m[2] === 'f') return 'boss-fort';
  if (m[2] === 'c') return Number(m[1]) === 10 ? 'boss-final' : 'boss-castle';
  return WORLD_TRACKS[Number(m[1]) - 1] || WORLD_TRACKS[0];
}

export const WORLD_TRACKS = [
  'w1-starter-village',
  'w2-harbor-town',
  'w3-windmill-hills',
  'w4-forest-of-clauses',
  'w5-tense-canyon',
  'w6-passive-glacier',
  'w7-sky-library',
  'w8-the-citadel',
  'w9-the-academy',
  'w10-logic-tower'
];
export const BOSS_TRACKS = ['boss-fort', 'boss-castle', 'boss-final'];
// the world map's own theme (Mikey 10-07: the overworld has its own song)
export const OVERWORLD_TRACK = 'overworld';
