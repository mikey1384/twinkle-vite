import type { BossDef, BossMove } from './types';

// Every boss's four named attacks (Mikey 10-10: "bosses should all have not
// just one but multiple unique attacks"). The server picks which attack each
// hit is, and the attack sets how the question is asked and how long it
// gives (api questBoss.ts):
//   strike — fill the gap, the normal window
//   jab    — which way?, a short window
//   slam   — spot the crack, a longer window (from phase 2)
//   trap   — fix it (from phase 3)
//   swarm  — stomp every wrong one
//   barrage — three quick right/wrong calls (from phase 2)
//   climb  — build the sentence (from phase 3)
// A world's bosses use the type it introduced in every phase.
// Here each attack gets its name and the boss move that plays it: the move
// winds up while the name shows (the telegraph), then fires and keeps firing
// while the question is open; a wrong pick aims it at the marble.

export type AttackKind =
  'strike' | 'jab' | 'slam' | 'trap' | 'swarm' | 'barrage' | 'climb';

export const ATTACK_KINDS: Record<AttackKind, { tag: string; color: string }> =
  {
    strike: { tag: 'FILL THE GAP', color: '#ff9db0' },
    jab: { tag: 'QUICK! WHICH WAY?', color: '#7fe3ff' },
    slam: { tag: 'HEAVY! SPOT THE CRACK', color: '#ffb05a' },
    trap: { tag: 'TRAP! FIX IT', color: '#c9a2ff' },
    swarm: { tag: 'SWARM! STOMP THE WRONG ONES', color: '#9be37a' },
    barrage: { tag: 'BARRAGE! RIGHT OR WRONG x3', color: '#7fe3ff' },
    climb: { tag: 'CLIMB! BUILD THE SENTENCE', color: '#ffd24a' }
  };

// boss id → [move id, name] for strike, jab, slam, trap
const MOVESETS: Record<string, Record<AttackKind, [string, string]>> = {
  'plural-slime': {
    strike: ['lob', 'Slime Lob'],
    jab: ['lob', 'Quick Glob'],
    slam: ['double-lob', 'Double Lob'],
    trap: ['double-lob', 'Sticky Split'],
    swarm: ['double-lob', 'Slime Swarm'],
    barrage: ['lob', 'Glob Barrage'],
    climb: ['double-lob', 'Slime Tower']
  },
  'article-bat': {
    strike: ['rings', 'Sonic Rings'],
    jab: ['swoop', 'Swoop'],
    slam: ['swoop', 'Dive Bomb'],
    trap: ['rings', 'Echo Snare'],
    swarm: ['swoop', 'Bat Swarm'],
    barrage: ['rings', 'Ring Barrage'],
    climb: ['swoop', 'Echo Climb']
  },
  'scarecrow-knight': {
    strike: ['hay-bale', 'Hay Bale'],
    jab: ['crow-wave', 'Crow Wave'],
    slam: ['pitchfork-spin', 'Pitchfork Spin'],
    trap: ['crow-wave', 'Straw Snare'],
    swarm: ['crow-wave', 'Crow Swarm'],
    barrage: ['hay-bale', 'Hay Barrage'],
    climb: ['pitchfork-spin', 'Straw Tower']
  },
  'captain-crab': {
    strike: ['claw-snap', 'Claw Snap'],
    jab: ['hat-toss', 'Hat Toss'],
    slam: ['claw-snap', 'Shockwave Snap'],
    trap: ['bubbles', 'Bubble Trap'],
    swarm: ['bubbles', 'Crab Crew'],
    barrage: ['claw-snap', 'Snap Barrage'],
    climb: ['hat-toss', 'Plank Climb']
  },
  'gull-squadron': {
    strike: ['shells', 'Shell Drop'],
    jab: ['dive', 'Dive'],
    slam: ['dive', 'Squadron Dive'],
    trap: ['fish', 'Fish Toss'],
    swarm: ['dive', 'Full Squadron'],
    barrage: ['shells', 'Shell Barrage'],
    climb: ['fish', 'Mast Climb']
  },
  kraken: {
    strike: ['tentacles', 'Tentacle Burst'],
    jab: ['tentacles', 'Lash'],
    slam: ['whirlpool', 'Whirlpool'],
    trap: ['ink', 'Ink Cloud'],
    swarm: ['tentacles', 'Tentacle Swarm'],
    barrage: ['ink', 'Ink Barrage'],
    climb: ['whirlpool', 'Rising Tide']
  },
  'scare-mill': {
    strike: ['flour', 'Flour Sack'],
    jab: ['gust', 'Gust'],
    slam: ['millstone', 'Millstone'],
    trap: ['flour', 'Dust Trap'],
    swarm: ['flour', 'Sack Swarm'],
    barrage: ['gust', 'Gust Barrage'],
    climb: ['millstone', 'Mill Tower']
  },
  'bramble-boar': {
    strike: ['thorns', 'Thorn Volley'],
    jab: ['charge', 'Charge'],
    slam: ['charge', 'Stampede'],
    trap: ['brambles', 'Bramble Snare'],
    swarm: ['thorns', 'Thorn Swarm'],
    barrage: ['charge', 'Charge Barrage'],
    climb: ['brambles', 'Bramble Wall']
  },
  'cyclone-rooster': {
    strike: ['egg-bombs', 'Egg Bombs'],
    jab: ['wind-turn', 'Wind Turn'],
    slam: ['crow-tornado', 'Crow Tornado'],
    trap: ['egg-bombs', 'Chick Trap'],
    swarm: ['egg-bombs', 'Chick Swarm'],
    barrage: ['wind-turn', 'Wind Barrage'],
    climb: ['crow-tornado', 'Twister Climb']
  },
  'stone-golem': {
    strike: ['stomp', 'Stomp'],
    jab: ['stomp', 'Quick Stomp'],
    slam: ['double-stomp', 'Double Stomp'],
    trap: ['pebble-rain', 'Pebble Rain'],
    swarm: ['pebble-rain', 'Pebble Swarm'],
    barrage: ['stomp', 'Stomp Barrage'],
    climb: ['double-stomp', 'Rock Tower']
  },
  'clause-flower': {
    strike: ['vine-whip', 'Vine Whip'],
    jab: ['snap', 'Snap'],
    slam: ['seed-spread', 'Seed Storm'],
    trap: ['vine-whip', 'Vine Snare'],
    swarm: ['seed-spread', 'Seedling Swarm'],
    barrage: ['snap', 'Snap Barrage'],
    climb: ['vine-whip', 'Vine Ladder']
  },
  'elder-treant': {
    strike: ['acorn-rain', 'Acorn Rain'],
    jab: ['roots', 'Root Strike'],
    slam: ['leaf-storm', 'Leaf Storm'],
    trap: ['root-pairs', 'Root Cage'],
    swarm: ['acorn-rain', 'Acorn Swarm'],
    barrage: ['roots', 'Root Barrage'],
    climb: ['root-pairs', 'Root Ladder']
  },
  'sand-worm': {
    strike: ['dune-wave', 'Dune Wave'],
    jab: ['burrow', 'Burrow'],
    slam: ['sand-rainbow', 'Sand Rainbow'],
    trap: ['geysers', 'Geysers'],
    swarm: ['geysers', 'Sand Swarm'],
    barrage: ['burrow', 'Burrow Barrage'],
    climb: ['dune-wave', 'Dune Climb']
  },
  'clock-scorpion': {
    strike: ['tail-laser', 'Tail Laser'],
    jab: ['tick-sting', 'Tick Sting'],
    slam: ['alarm', 'Alarm'],
    trap: ['gear-shed', 'Gear Shed'],
    swarm: ['gear-shed', 'Gear Swarm'],
    barrage: ['tick-sting', 'Tick Barrage'],
    climb: ['alarm', 'Clock Tower']
  },
  'tense-dragon': {
    strike: ['fireballs', 'Fireballs'],
    jab: ['fireballs', 'Ember Flick'],
    slam: ['meteors', 'Meteor Rain'],
    trap: ['breath', 'Fire Breath'],
    swarm: ['fireballs', 'Ember Swarm'],
    barrage: ['fireballs', 'Fire Barrage'],
    climb: ['meteors', 'Sky Climb']
  },
  yeti: {
    strike: ['snowball', 'Snowball'],
    jab: ['chest-pound', 'Chest Pound'],
    slam: ['avalanche', 'Avalanche'],
    trap: ['frost-breath', 'Frost Breath'],
    swarm: ['snowball', 'Snowball Swarm'],
    barrage: ['chest-pound', 'Pound Barrage'],
    climb: ['avalanche', 'Ice Climb']
  },
  'mirror-wraith': {
    strike: ['shard-fan', 'Shard Fan'],
    jab: ['frost-ray', 'Frost Ray'],
    slam: ['hall-of-mirrors', 'Hall of Mirrors'],
    trap: ['icicle-curtain', 'Icicle Curtain'],
    swarm: ['hall-of-mirrors', 'Mirror Swarm'],
    barrage: ['shard-fan', 'Shard Barrage'],
    climb: ['icicle-curtain', 'Mirror Stair']
  },
  'glacier-mammoth': {
    strike: ['avalanche', 'Avalanche'],
    jab: ['tusk-slam', 'Tusk Slam'],
    slam: ['blizzard', 'Blizzard'],
    trap: ['freezing-breath', 'Freezing Breath'],
    swarm: ['avalanche', 'Herd Rush'],
    barrage: ['tusk-slam', 'Tusk Barrage'],
    climb: ['blizzard', 'Glacier Climb']
  },
  bookwyrm: {
    strike: ['page-shuriken', 'Page Shuriken'],
    jab: ['ribbon-lash', 'Ribbon Lash'],
    slam: ['shelf-rain', 'Shelf Rain'],
    trap: ['wavy-dive', 'Wavy Dive'],
    swarm: ['page-shuriken', 'Page Swarm'],
    barrage: ['ribbon-lash', 'Lash Barrage'],
    climb: ['shelf-rain', 'Shelf Climb']
  },
  'ink-golem': {
    strike: ['ink-wave', 'Ink Wave'],
    jab: ['puddle-spikes', 'Puddle Spikes'],
    slam: ['spike-march', 'Spike March'],
    trap: ['split-blobs', 'Split Blobs'],
    swarm: ['split-blobs', 'Blob Swarm'],
    barrage: ['puddle-spikes', 'Spike Barrage'],
    climb: ['spike-march', 'Ink Tower']
  },
  'paper-phoenix': {
    strike: ['crane-flock', 'Crane Flock'],
    jab: ['feather-fan', 'Feather Fan'],
    slam: ['firestorm', 'Firestorm'],
    trap: ['flame-dive', 'Flame Dive'],
    swarm: ['crane-flock', 'Crane Swarm'],
    barrage: ['feather-fan', 'Feather Barrage'],
    climb: ['firestorm', 'Phoenix Rise']
  },
  'grim-grimoire': {
    strike: ['page-storm', 'Page Storm'],
    jab: ['summon-glyphs', 'Glyph March'],
    slam: ['arcane-beam', 'Arcane Beam'],
    trap: ['magic-circle', 'Magic Circle'],
    swarm: ['summon-glyphs', 'Glyph Swarm'],
    barrage: ['page-storm', 'Page Barrage'],
    climb: ['magic-circle', 'Spell Stair']
  },
  'librarian-sphinx': {
    strike: ['book-barrage', 'Book Barrage'],
    jab: ['eye-beam', 'Eye Beam'],
    slam: ['light-columns', 'Light Columns'],
    trap: ['riddle-rings', 'Riddle Rings'],
    swarm: ['book-barrage', 'Book Swarm'],
    barrage: ['eye-beam', 'Gaze Barrage'],
    climb: ['riddle-rings', 'Riddle Stair']
  },
  'gargoyle-twins': {
    strike: ['stone-orbs', 'Stone Orbs'],
    jab: ['dive', 'Dive'],
    slam: ['fury-dive', 'Fury Dive'],
    trap: ['rubble-slam', 'Rubble Slam'],
    swarm: ['stone-orbs', 'Orb Swarm'],
    barrage: ['dive', 'Twin Barrage'],
    climb: ['rubble-slam', 'Rubble Climb']
  },
  'storm-knight': {
    strike: ['sword-wave', 'Sword Wave'],
    jab: ['lightning', 'Lightning'],
    slam: ['thunder-lance', 'Thunder Lance'],
    trap: ['storm-call', 'Storm Call'],
    swarm: ['storm-call', 'Squall Swarm'],
    barrage: ['lightning', 'Bolt Barrage'],
    climb: ['thunder-lance', 'Storm Stair']
  },
  'pop-quiz-bot': {
    strike: ['pencil-volley', 'Pencil Volley'],
    jab: ['red-pen-laser', 'Red Pen Laser'],
    slam: ['overdrive', 'Overdrive'],
    trap: ['stamp', 'Grade Stamp'],
    swarm: ['eraser-bombs', 'Eraser Swarm'],
    barrage: ['pencil-volley', 'Pop Quiz'],
    climb: ['overdrive', 'Grade Ladder']
  },
  'chalk-specter': {
    strike: ['chalk-spikes', 'Chalk Spikes'],
    jab: ['fade-darts', 'Fade Darts'],
    slam: ['doodle-army', 'Doodle Army'],
    trap: ['eraser-wipe', 'Eraser Wipe'],
    swarm: ['doodle-army', 'Doodle Swarm'],
    barrage: ['fade-darts', 'Dart Barrage'],
    climb: ['chalk-boulder', 'Chalk Stair']
  },
  'bell-golem': {
    strike: ['shockwave-rings', 'Shockwave Rings'],
    jab: ['pendulum', 'Pendulum'],
    slam: ['grand-toll', 'Grand Toll'],
    trap: ['detention-bells', 'Detention Bells'],
    swarm: ['detention-bells', 'Bell Swarm'],
    barrage: ['shockwave-rings', 'Ring Barrage'],
    climb: ['grand-toll', 'Bell Tower']
  },
  'headmaster-hydra': {
    strike: ['fire-volley', 'Fire Volley'],
    jab: ['lightning-call', 'Lightning Call'],
    slam: ['tri-blast', 'Tri-Blast'],
    trap: ['frost-breath', 'Frost Breath'],
    swarm: ['roll-call', 'Roll Call'],
    barrage: ['tri-blast', 'Head Barrage'],
    climb: ['cap-toss', 'Graduation Climb']
  },
  'clockwork-spider': {
    strike: ['gear-bombs', 'Gear Bombs'],
    jab: ['drop-in', 'Drop In'],
    slam: ['gear-storm', 'Gear Storm'],
    trap: ['laser-grid', 'Laser Grid'],
    swarm: ['gear-bombs', 'Gear Swarm'],
    barrage: ['eye-laser', 'Laser Barrage'],
    climb: ['drop-in', 'Web Climb']
  },
  'paradox-cube': {
    strike: ['rewind-orbs', 'Rewind Orbs'],
    jab: ['blink-beam', 'Blink Beam'],
    slam: ['paradox-rain', 'Paradox Rain'],
    trap: ['glitch-storm', 'Glitch Storm'],
    swarm: ['copies', 'Copy Swarm'],
    barrage: ['blink-beam', 'Blink Barrage'],
    climb: ['paradox-rain', 'Impossible Stair']
  },
  'quantum-cat': {
    strike: ['yarn-phase', 'Yarn Phase'],
    jab: ['laser-pointer', 'Laser Pointer'],
    slam: ['probability-cloud', 'Probability Cloud'],
    trap: ['entangled-yarn', 'Entangled Yarn'],
    swarm: ['two-sides', 'Cat Swarm'],
    barrage: ['laser-pointer', 'Pointer Barrage'],
    climb: ['probability-cloud', 'Quantum Climb']
  },
  'null-serpent': {
    strike: ['void-orbs', 'Void Orbs'],
    jab: ['tail-whip', 'Tail Whip'],
    slam: ['event-horizon', 'Event Horizon'],
    trap: ['null-zones', 'Null Zones'],
    swarm: ['star-spit', 'Star Swarm'],
    barrage: ['void-orbs', 'Void Barrage'],
    climb: ['event-horizon', 'Void Ascent']
  },
  'sovereign-of-syntax': {
    strike: ['rune-lasers', 'Rune Lasers'],
    jab: ['judgement', 'Judgement'],
    slam: ['meteor-rain', 'Meteor Rain'],
    trap: ['black-hole', 'Black Hole'],
    swarm: ['shield-volley', 'Rune Swarm'],
    barrage: ['nova', 'Nova Barrage'],
    climb: ['cataclysm', 'Throne Ascent']
  }
};

export interface BossAttackPlay {
  kind: AttackKind;
  name: string;
  move: BossMove;
}

// The named attack and the move that plays it. A boss without a moveset (or
// a move that went missing) plays its first move under the attack's tag.
export function bossAttack(def: BossDef, kind: AttackKind): BossAttackPlay {
  const [moveId, name] = MOVESETS[def.id]?.[kind] || ['', ''];
  const move = def.moves.find((m) => m.id === moveId) || def.moves[0];
  return { kind, name: name || ATTACK_KINDS[kind].tag, move };
}

export function hasMoveset(def: BossDef) {
  const set = MOVESETS[def.id];
  return (
    !!set &&
    (Object.keys(ATTACK_KINDS) as AttackKind[]).every((kind) =>
      def.moves.some((m) => m.id === set[kind][0])
    )
  );
}
