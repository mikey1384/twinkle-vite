// Word battle sound effects: original motifs built on Grammarbles' instruments
// (Quest/sfx.ts), so they share its mute switch and never throw.
import {
  playNote,
  playQuestSound,
  playThump,
  playWhoosh
} from '~/containers/Home/GrammarGameModal/Quest/sfx';

export type BattleSound =
  | 'encounter'
  | 'boss'
  | 'select'
  | 'hit'
  | 'counter'
  | 'defeat'
  | 'ranAway'
  | 'reelTick'
  | 'drop'
  | 'rareDrop'
  | 'massiveDrop'
  | 'nothing'
  // word battles v2
  | 'dodge'
  | 'cardFlip'
  | 'block'
  | 'beam'
  // defense rules 2: the parry's blade ring and the dizzy stun
  | 'parry'
  | 'stun';

export function playBattleSound(sound: BattleSound) {
  switch (sound) {
    case 'encounter':
      playWhoosh(0.1, 0.3, 0, 600, 2400);
      [64, 67, 71, 76].forEach((midi, i) =>
        playNote(midi, { at: 0.08 * i, instrument: 'marimba', level: 0.18, hold: 0.12 })
      );
      return;
    case 'boss':
      playThump(1.2);
      [52, 55, 58, 57].forEach((midi, i) =>
        playNote(midi, { at: 0.14 * i, instrument: 'marimba', level: 0.22, hold: 0.2 })
      );
      return;
    case 'select':
      playNote(84, { instrument: 'marimba', level: 0.16, hold: 0.06 });
      return;
    case 'hit':
      playThump(0.9);
      playWhoosh(0.12, 0.18, 0, 3000, 900);
      playNote(88, { at: 0.05, instrument: 'glock', level: 0.12, hold: 0.15 });
      return;
    case 'counter':
      playThump(1.4);
      playNote(50, { at: 0.04, instrument: 'marimba', level: 0.2, hold: 0.3 });
      return;
    case 'defeat':
      playWhoosh(0.12, 0.7, 0, 2000, 200);
      playQuestSound('clear');
      return;
    case 'ranAway':
      playWhoosh(0.08, 0.4, 0, 900, 2600);
      playQuestSound('notYet');
      return;
    case 'reelTick':
      playNote(96, { instrument: 'glock', level: 0.05, hold: 0.03 });
      return;
    case 'drop':
      playQuestSound('correct');
      return;
    case 'rareDrop':
      playQuestSound('fanfare');
      return;
    case 'massiveDrop':
      // the rare fanfare, scaled up: a boom and a rising glock run on top
      playThump(1.6);
      playQuestSound('fanfare');
      [72, 76, 79, 84, 88, 91, 96].forEach((midi, i) =>
        playNote(midi, { at: 0.35 + 0.07 * i, instrument: 'glock', level: 0.14, hold: 0.18 })
      );
      return;
    case 'nothing':
      playNote(60, { instrument: 'marimba', level: 0.12, hold: 0.2 });
      return;
    case 'dodge':
      playWhoosh(0.1, 0.25, 0, 1200, 3200);
      return;
    case 'cardFlip':
      // a quick rising sparkle as the card turns over
      playWhoosh(0.06, 0.2, 0, 800, 2600);
      [79, 83, 86, 91].forEach((midi, i) =>
        playNote(midi, { at: 0.12 + 0.05 * i, instrument: 'glock', level: 0.1, hold: 0.1 })
      );
      return;
    case 'block':
      // a clang: a short thump and two bright glock hits
      playThump(1.1);
      playNote(93, { at: 0.02, instrument: 'glock', level: 0.14, hold: 0.12 });
      playNote(88, { at: 0.07, instrument: 'glock', level: 0.1, hold: 0.2 });
      return;
    case 'beam':
      // the counter beam: a sweep up and a low hit as it lands
      playWhoosh(0.12, 0.45, 0, 400, 3600);
      playThump(1.5);
      [60, 67, 72, 79].forEach((midi, i) =>
        playNote(midi, { at: 0.08 * i, instrument: 'marimba', level: 0.16, hold: 0.14 })
      );
      return;
    case 'parry':
      // a blade ring: a fast swish, a bright double ting, then the sting
      playWhoosh(0.1, 0.16, 0, 2400, 5200);
      playNote(96, { at: 0.03, instrument: 'glock', level: 0.14, hold: 0.1 });
      playNote(100, { at: 0.09, instrument: 'glock', level: 0.12, hold: 0.22 });
      playThump(0.8);
      return;
    case 'stun':
      // dizzy: three tweets falling and wobbling, like stars round its head
      [91, 86, 89, 84, 88, 83].forEach((midi, i) =>
        playNote(midi, { at: 0.07 * i, instrument: 'glock', level: 0.1, hold: 0.09 })
      );
      playWhoosh(0.06, 0.4, 0.05, 1800, 700);
      return;
  }
}
