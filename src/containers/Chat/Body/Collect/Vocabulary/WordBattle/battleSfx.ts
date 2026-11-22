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
  | 'nothing';

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
    case 'nothing':
      playNote(60, { instrument: 'marimba', level: 0.12, hold: 0.2 });
      return;
  }
}
