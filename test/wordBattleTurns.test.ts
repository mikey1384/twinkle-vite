import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyEvent,
  BattleMeter,
  cardBanner,
  cardTier,
  eventHoldMs,
  eventLine,
  heartSlots,
  hpBand,
  turnFlagText
} from '../src/containers/Chat/Body/Collect/Vocabulary/WordBattle/turns';

const meter: BattleMeter = {
  mhp: 8,
  mmax: 8,
  php: 6,
  pmax: 6,
  focus: 0,
  turn: 'player',
  questionsLeft: 5,
  maxQuestions: 5,
  firstBattle: false,
  plain: false
};
const card = (quality: string, level = 1) => ({ id: 1, word: 'swift', quality, level, imagePath: null });

test('hearts draw full, half and empty from half-hearts; the HP bar changes colour by share', () => {
  assert.deepEqual(heartSlots(6, 6), ['full', 'full', 'full']);
  assert.deepEqual(heartSlots(3, 6), ['full', 'half', 'empty']);
  assert.deepEqual(heartSlots(0, 6), ['empty', 'empty', 'empty']);
  assert.equal(hpBand(8, 8), 'high');
  assert.equal(hpBand(4, 8), 'mid');
  assert.equal(hpBand(2, 8), 'low');
});

test('events move the meters as they play: damage, parry/counter damage and hits', () => {
  let m = applyEvent(meter, { kind: 'attack', damage: 5, crit: false, endure: false, focusBonus: 0 });
  assert.equal(m.mhp, 3);
  m = applyEvent(m, { kind: 'card', job: 'defense', card: card('elite'), match: 'synonym', matchedWord: 'brisk', outcome: 'parry', damage: 2 });
  assert.equal(m.mhp, 1);
  m = applyEvent(m, { kind: 'hit', halfHearts: 3, softened: false });
  assert.equal(m.php, 3);
  assert.equal(applyEvent(m, { kind: 'dodge' }), m);
});

test('a card banner names what it did and why it showed up', () => {
  const block = cardBanner({ kind: 'card', job: 'defense', card: card('rare'), match: 'synonym', matchedWord: 'brisk', outcome: 'block' });
  assert.equal(block.title, 'Your SWIFT card blocks!');
  assert.equal(block.why, 'SWIFT ~ BRISK · synonym');
  const exact = cardBanner({ kind: 'card', job: 'attack', card: { ...card('common'), word: 'brisk' }, match: 'exact', matchedWord: 'brisk', outcome: 'boost' });
  assert.equal(exact.why, 'Same word as BRISK');
  assert.equal(cardTier(card('legendary')), 'elite');
  assert.equal(cardTier(card('common', 6)), 'black');
});

test('every event has a line; a card pop-up holds long enough for its animation', () => {
  const events: any[] = [
    { kind: 'attack', damage: 3, crit: true, endure: false, focusBonus: 0 },
    { kind: 'attack', damage: 3, crit: false, endure: true, focusBonus: 0 },
    { kind: 'glancing', damage: 2, endure: false },
    { kind: 'miss', timedOut: true },
    { kind: 'dodge' },
    { kind: 'hit', halfHearts: 1, softened: true },
    { kind: 'standing' },
    { kind: 'rest' },
    ...['boost', 'miss', 'block', 'parry', 'counter', 'fail'].map((outcome) => ({
      kind: 'card', job: 'defense', card: card('rare'), match: 'related', matchedWord: 'brisk', outcome
    }))
  ];
  for (const event of events) {
    const line = eventLine(event, { word: 'ubiquitous', attacker: 'brisk', focus: 1 });
    assert.ok(line && line.length > 5, JSON.stringify(event));
  }
  assert.match(eventLine(events[1], { word: 'ubiquitous', focus: 1 })!, /UBIQUITOUS endures/);
  assert.match(eventLine(events[5], { word: 'ubiquitous', attacker: 'brisk', focus: 0 })!, /BRISK hits you/);
  assert.ok(eventHoldMs(events[12]) >= 2400);
});

test('the turn flag fits a phone', () => {
  assert.equal(turnFlagText('player', 'ubiquitous'), 'YOUR TURN');
  assert.equal(turnFlagText('monster', 'brisk'), "BRISK'S TURN");
  assert.equal(turnFlagText('monster', 'incomprehensibilities'), 'ITS TURN');
});

// Defense rules 2 (11-24): the card's move depends on its match and your answer.
test('defense moves: parry, counter + stun, block (half or none) each say what happened', () => {
  const def = (outcome: string, extra: Record<string, unknown> = {}) =>
    ({ kind: 'card', job: 'defense', card: card('rare'), match: 'synonym', matchedWord: 'brisk', outcome, ...extra }) as any;
  const line = (event: any) => eventLine(event, { word: 'ubiquitous', attacker: 'brisk', focus: 1 })!;
  assert.match(line(def('parry', { damage: 2 })), /Parried! SWIFT turns the blow and strikes back/);
  assert.match(line(def('counter', { damage: 4, stun: true, match: 'exact' })), /Counter!/);
  assert.match(line(def('block', { reduced: true })), /catches part of the blow/);
  assert.match(line(def('block')), /Not a scratch/);
  assert.match(line({ kind: 'hit', halfHearts: 1, softened: false, blocked: true }), /half the hit/);
  assert.match(line({ kind: 'stun' }), /UBIQUITOUS is seeing stars! It loses its next turn/);
  assert.equal(cardBanner(def('block', { reduced: true })).title, 'Your SWIFT card softens the blow!');
  assert.equal(cardBanner(def('counter', { stun: true })).title, 'Your SWIFT card counters and stuns!');
  // The stun shows on the meter as it plays; the free strike has its flag.
  assert.equal(applyEvent(meter, { kind: 'stun' }).stunned, true);
  assert.equal(turnFlagText('player', 'ubiquitous', true), 'FREE STRIKE!');
  assert.equal(turnFlagText('player', 'ubiquitous'), 'YOUR TURN');
  assert.ok(eventHoldMs({ kind: 'stun' }) >= 1200);
});

test('an older API (no stun or reduced fields) still reads as before', () => {
  const old = { kind: 'card', job: 'defense', card: card('elite'), match: 'family', matchedWord: 'brisk', outcome: 'counter', damage: 4 } as any;
  assert.equal(eventLine(old, { word: 'ubiquitous', focus: 0 }), 'Its own attack, sent straight back!');
  assert.equal(cardBanner(old).title, 'Your SWIFT card counters!');
  assert.equal(applyEvent(meter, old).stunned, undefined);
});

test('a counter-KO has its own line', async () => {
  const { cardKoLine } = await import('../src/containers/Chat/Body/Collect/Vocabulary/WordBattle/turns');
  const ev = (outcome: string) => ({ kind: 'card', job: 'defense', card: card('rare'), match: 'exact', matchedWord: 'brisk', outcome, damage: 5 }) as any;
  assert.match(cardKoLine(ev('counter'), 'ubiquitous'), /Counter K\.O\.! UBIQUITOUS/);
  assert.match(cardKoLine(ev('parry'), 'ubiquitous'), /Parry K\.O\.!/);
});
