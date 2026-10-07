import { playNote, playThump, playWhoosh } from '../sfx';

// The marble run's sound rules (Mikey 10-07).
// Practice: five promotions climb do-re-mi-sol-high do. The note follows the
// marble's grade, not a streak, so misses never knock the tune back. Reaching
// S with no misses plays the bonus in place of the high do.
// Bosses: seven hits climb do-re-mi-fa-sol-la-ti, one note per right answer
// in a row; a miss resets the climb; a perfect 7th plays the bonus instead.
const PRACTICE_STEPS = [0, 2, 4, 7, 12];
const BOSS_STEPS = [0, 2, 4, 5, 7, 9, 11];

function chime(step: number) {
  playNote(72 + step, { instrument: 'bell', level: 0.16 });
  playNote(84 + step, { at: 0.07, instrument: 'glock', level: 0.05 });
}

export function practiceChime(promotions: number) {
  chime(PRACTICE_STEPS[Math.min(promotions, PRACTICE_STEPS.length - 1)]);
}
export function bossChime(streak: number) {
  chime(BOSS_STEPS[Math.min(streak, BOSS_STEPS.length - 1)]);
}

export function perfectBonus() {
  playNote(84, { instrument: 'bell', level: 0.18 });
  playNote(96, { at: 0.07, instrument: 'glock', level: 0.06 });
  [72, 76, 79, 84, 88, 91, 96].forEach((m, i) =>
    playNote(m, { at: 0.32 + i * 0.06, instrument: 'glock', level: 0.07 })
  );
  [60, 64, 67, 72].forEach((m) => playNote(m, { at: 0.32, instrument: 'bell', level: 0.06 }));
  [84, 88, 91].forEach((m, i) => playNote(m, { at: 0.8, instrument: 'bell', level: i ? 0.1 : 0.14 }));
}

export function missSound() {
  playNote(57, { instrument: 'marimba', level: 0.16 });
  playNote(52, { at: 0.13, instrument: 'marimba', level: 0.14 });
}

export function flagSound() {
  [67, 72, 76, 79, 84].forEach((m, i) =>
    playNote(m, { at: i * 0.08, instrument: 'marimba', level: 0.16 })
  );
}

export const thump = playThump;
export const whoosh = playWhoosh;
export const note = playNote;

// boss stings: menace makes them lower and bigger
export function bossIntroSound(menace: number) {
  const base = 45 - Math.floor(menace / 3);
  playNote(base, { instrument: 'marimba', level: 0.22 });
  playNote(base + 3, { at: 0.2, instrument: 'marimba', level: 0.2 });
  playNote(base - 1, { at: 0.42, instrument: 'marimba', level: 0.24 });
  playNote(base + 11, { at: 0.42, instrument: 'bell', level: 0.06 });
  if (menace >= 5) playNote(base - 12, { at: 0.42, instrument: 'pad', level: 0.12, hold: 1.2 });
  playThump(1, 0.62);
  if (menace >= 8) playThump(1.2, 0.9);
}
export function bossLaughSound() {
  [50, 53, 50, 53, 49].forEach((m, i) => playNote(m, { at: i * 0.11, instrument: 'marimba', level: 0.16 }));
}
export function bossDownSound() {
  playThump(1.2);
  [79, 76, 72, 67].forEach((m, i) => playNote(m, { at: 0.1 + i * 0.07, instrument: 'marimba', level: 0.14 }));
  [72, 76, 79, 84].forEach((m) => playNote(m, { at: 0.45, instrument: 'bell', level: 0.09 }));
  playNote(91, { at: 0.45, instrument: 'glock', level: 0.05 });
}
