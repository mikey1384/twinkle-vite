// Word battles v2 (twinkle-api helpers/wordBattle/engine.ts, Mikey 11-24): the
// turn-based battle as the server reports it. The browser never decides
// anything: every roll (crit, block, a card showing up) happened on the
// server, and each answer returns the events to play in order. This file
// turns those events into battle lines and timings; BattleScreen plays them.
// Older API servers send no `engine`: the screen then plays engine 1.
import { pick } from './lines';

export interface BattleCardView {
  id: number;
  word: string;
  quality: string;
  level: number;
  imagePath: string | null;
}

export type CardMatch = 'exact' | 'family' | 'synonym' | 'related' | 'kindred';
export type AttackTier = 'escaped' | 'beaten' | 'seen' | 'site';

export type BattleEvent =
  | {
      kind: 'card';
      job: 'attack' | 'defense';
      card: BattleCardView;
      match: CardMatch;
      matchedWord: string;
      outcome: 'boost' | 'miss' | 'block' | 'parry' | 'counter' | 'fail';
      damage?: number;
      // Defense rules 2 (11-24): an exact card's counter also stunned the
      // monster; a block that only halved the hit (a 'hit' event follows).
      stun?: boolean;
      reduced?: boolean;
    }
  | { kind: 'attack'; damage: number; crit: boolean; endure: boolean; focusBonus: number }
  | { kind: 'glancing'; damage: number; endure: boolean }
  | { kind: 'miss'; timedOut: boolean }
  | { kind: 'dodge' }
  // blocked: a card's block took half of this hit.
  | { kind: 'hit'; halfHearts: number; softened: boolean; blocked?: boolean }
  // The monster is dazed: its next turn is your free strike.
  | { kind: 'stun' }
  | { kind: 'standing' }
  | { kind: 'rest' };

export interface BattleMeter {
  mhp: number;
  mmax: number;
  php: number;
  pmax: number;
  focus: number;
  turn: 'player' | 'monster' | null;
  questionsLeft: number;
  maxQuestions: number;
  firstBattle: boolean;
  plain: boolean;
  // Defense rules 2: the monster is dazed (older servers leave it out).
  stunned?: boolean;
}

export const FOCUS_CAP = 2;

// The source tag on the DEFEND window: where the monster's word came from.
export const TIER_TAGS: Record<AttackTier, string> = {
  escaped: 'ESCAPED · YOUR DEN',
  beaten: 'BEATEN · YOUR DEN',
  seen: 'A WORD YOU MET',
  site: 'A COMMON WORD'
};

export const MATCH_LABELS: Record<CardMatch, string> = {
  exact: 'same word',
  family: 'word family',
  synonym: 'synonym',
  related: 'related',
  kindred: 'kindred word'
};

export type CardTier = 'common' | 'elite' | 'black';
export function cardTier(card: { quality?: string; level?: number }): CardTier {
  if (Number(card.level) === 6) return 'black';
  if (card.quality === 'elite' || card.quality === 'legendary') return 'elite';
  return 'common';
}

// The banner under a card: what it did, and why it showed up (the match
// teaches: SWIFT ~ BRISK · synonym; the pixel font has no ≈).
export function cardBanner(event: Extract<BattleEvent, { kind: 'card' }>) {
  const C = event.card.word.toUpperCase();
  const M = event.matchedWord.toUpperCase();
  const verb: Record<typeof event.outcome, string> = {
    boost: 'powers up your strike!',
    miss: 'glows... but the strike misses.',
    block: event.reduced ? 'softens the blow!' : 'blocks!',
    parry: 'parries!',
    counter: event.stun ? 'counters and stuns!' : 'counters!',
    fail: 'tries to block...'
  };
  return {
    title: `Your ${C} card ${verb[event.outcome]}`,
    why: event.match === 'exact' || C === M ? `Same word as ${M}` : `${C} ~ ${M} · ${MATCH_LABELS[event.match]}`
  };
}

// Hearts as the HUD draws them: full, half or empty, from half-hearts.
export function heartSlots(php: number, pmax: number): Array<'full' | 'half' | 'empty'> {
  return Array.from({ length: Math.ceil(pmax / 2) }, (_, i) => {
    const left = php - i * 2;
    return left >= 2 ? 'full' : left === 1 ? 'half' : 'empty';
  });
}

// The HP bar's colour band.
export function hpBand(mhp: number, mmax: number): 'high' | 'mid' | 'low' {
  const ratio = mmax > 0 ? mhp / mmax : 0;
  return ratio <= 0.25 ? 'low' : ratio <= 0.5 ? 'mid' : 'high';
}

// The line the text window types for each event. W: the monster's word;
// A: the word it attacked with (its turn).
export function eventLine(
  event: BattleEvent,
  { word, attacker, focus }: { word: string; attacker?: string; focus: number }
): string | null {
  const W = word.toUpperCase();
  const A = (attacker || word).toUpperCase();
  switch (event.kind) {
    case 'attack':
      if (event.crit) return pick(['A critical hit! Right where it hurts.', 'Critical hit! That one rattled it.'], word);
      if (event.endure) return `${W} endures the hit!`;
      return focus >= 2 ? 'Direct hit! Your focus is sharp.' : focus === 1 ? 'Direct hit! Your focus is building.' : 'Direct hit!';
    case 'glancing':
      return event.endure ? `A glancing blow! ${W} endures it.` : 'Two out of three: a glancing blow!';
    case 'miss':
      return event.timedOut
        ? pick([`Too slow! ${W} sidesteps.`, `You hesitate... ${W} grins.`], word)
        : pick([`Miss! ${W} shrugs it off.`, `Whiff! ${W} is unbothered.`], word);
    case 'dodge':
      return focus >= FOCUS_CAP ? 'You saw it coming. Focus is full!' : 'You saw it coming. Focus +1.';
    case 'hit':
      if (event.blocked) return `Your card took the edge off. Only half the hit gets through.`;
      return event.softened ? `${A} hits you... gently. It's going easy, this time.` : pick([`Ouch! ${A} lands a hit.`, `${A} strikes! That stung.`], attacker || word);
    case 'stun':
      return `${W} is seeing stars! It loses its next turn.`;
    case 'card': {
      const C = event.card.word.toUpperCase();
      switch (event.outcome) {
        case 'boost':
          return `Your ${C} card powers up the strike!`;
        case 'miss':
          return `Your ${C} card glows... but the strike misses.`;
        case 'block':
          return event.reduced ? `Your ${C} card catches part of the blow!` : `Your ${C} card blocks the attack! Not a scratch.`;
        case 'parry':
          return `Parried! ${C} turns the blow and strikes back.`;
        case 'counter':
          return event.stun ? `Counter! ${C} sends it straight back, hard.` : 'Its own attack, sent straight back!';
        case 'fail':
          return `Your ${C} card tries to block...`;
      }
      return null;
    }
    case 'standing':
      return "It's barely standing!";
    case 'rest':
      return `${W} catches its breath.`;
  }
}

export function monsterTurnLine(word: string, attacker: string) {
  return `${word.toUpperCase()} calls on ${attacker.toUpperCase()}!`;
}

// A card's strike-back that finishes the monster (a counter-KO).
export function cardKoLine(event: Extract<BattleEvent, { kind: 'card' }>, word: string) {
  const W = word.toUpperCase();
  return event.outcome === 'counter'
    ? `Counter K.O.! ${W} is knocked out by its own attack!`
    : `Parry K.O.! One clean strike back finishes ${W}!`;
}

// A stun's free strike: the dazed monster's turn is yours.
export function freeStrikeLine(word: string) {
  return `${word.toUpperCase()} is still dazed. Free strike!`;
}

// The gentle first v2 battle's tip, shown under the encounter line.
export const FIRST_BATTLE_TIP = 'Tip: answer right to attack. On its turn, answer right to dodge!';

export function koLines(word: string) {
  return ["You're out of hearts!", `${word.toUpperCase()} ran off while you caught your breath.`];
}

// How long an event holds the screen (before speed and reduced motion):
// a card pop-up runs about 2.6 s (the server allows 5 s before the next
// question's window).
export function eventHoldMs(event: BattleEvent) {
  if (event.kind === 'card') return event.outcome === 'counter' || event.outcome === 'parry' ? 2600 : 2200;
  if (event.kind === 'stun') return 1300;
  if (event.kind === 'attack' && event.crit) return 900;
  return 650;
}

// The meters after one event (HP and hearts only; focus comes from the
// server's final state), so the bars move as each event plays.
export function applyEvent(meter: BattleMeter, event: BattleEvent): BattleMeter {
  switch (event.kind) {
    case 'attack':
    case 'glancing':
      return { ...meter, mhp: Math.max(0, meter.mhp - event.damage) };
    case 'card':
      return event.damage ? { ...meter, mhp: Math.max(0, meter.mhp - event.damage) } : meter;
    case 'hit':
      return { ...meter, php: Math.max(0, meter.php - event.halfHearts) };
    case 'stun':
      return { ...meter, stunned: true };
    default:
      return meter;
  }
}

// The turn flag: a long name would not fit on a phone.
export function turnFlagText(turn: 'player' | 'monster', word: string, free = false) {
  if (turn === 'player') return free ? 'FREE STRIKE!' : 'YOUR TURN';
  return word.length <= 12 ? `${word.toUpperCase()}'S TURN` : 'ITS TURN';
}
