// The 34 bosses: every fort and castle across the 10 worlds (Mikey 10-07:
// every boss looks unique and has unique moves; higher-level bosses get
// flashier, more intimidating moves). Each boss's sprite and moves live in
// its own module under ./bosses, registered by id.
//
// `menace` (1-10) sets how showy the fight is: screen effects, how many
// attacks at once, a second phase when its health runs low. `timeScale` is
// how much more time than Classic the boss gives (Mikey 10-07: the first boss
// is easy on the clock, the last uses Classic's exact speed): ×2 at the first
// fort, easing down to exactly ×1 at the last castle.

export interface BossInfo {
  id: string;
  world: number;
  node: 'fort' | 'castle';
  index: number; // fort number in its world (castle = 1)
  name: string;
  menace: number;
  arena: string; // arena background id
  moves: string; // design notes (what each move looks like)
}

export const BOSSES: BossInfo[] = [
  // World 1 · Starter Village
  { id: 'plural-slime', world: 1, node: 'fort', index: 1, name: 'Plural Slime', menace: 1, arena: 'w1-fort', moves: 'Squash and lob mini-slimes that bounce. When hit hard, a mini-slime splits off and hops away.' },
  { id: 'article-bat', world: 1, node: 'fort', index: 2, name: 'Article Bat', menace: 1, arena: 'w1-fort', moves: 'Monocled bat. Sonic rings along the floor; a swoop dive low across the room.' },
  { id: 'scarecrow-knight', world: 1, node: 'castle', index: 1, name: 'Sir Scarecrow', menace: 2, arena: 'w1-castle', moves: 'Straw knight on a stick. Rolls hay bales; sends a flock of 3 crows in a wave; pitchfork spin that kicks up straw.' },
  // World 2 · Harbor Town
  { id: 'captain-crab', world: 2, node: 'fort', index: 1, name: 'Captain Crab', menace: 2, arena: 'w2-fort', moves: 'Pirate-hat crab. Claw snap sends a shockwave; blows a stream of bouncing bubbles.' },
  { id: 'gull-squadron', world: 2, node: 'fort', index: 2, name: 'Gull Squadron', menace: 2, arena: 'w2-fort', moves: 'Three gulls in formation: they dive one after another, then drop shells from above.' },
  { id: 'kraken', world: 2, node: 'castle', index: 1, name: 'The Ink Kraken', menace: 3, arena: 'w2-castle', moves: 'Huge kraken in the water. Tentacles burst up from the floor where the marble is (warning ripple first); an ink cloud darkens the screen for a moment; a whirlpool tug.' },
  // World 3 · Windmill Hills
  { id: 'scare-mill', world: 3, node: 'fort', index: 1, name: 'Scare-Mill', menace: 3, arena: 'w3-fort', moves: 'A grumpy little windmill. Spins its blades to blow gusts that push the marble back; flings sacks of flour that burst into dust.' },
  { id: 'bramble-boar', world: 3, node: 'fort', index: 2, name: 'Bramble Boar', menace: 3, arena: 'w3-fort', moves: 'Thorny boar. Paws the ground, then charges across the arena (big jump to clear); thorn volley in an arc.' },
  { id: 'cyclone-rooster', world: 3, node: 'castle', index: 1, name: 'Cyclone Rooster', menace: 4, arena: 'w3-castle', moves: 'Giant weathervane rooster. Crows to summon a travelling tornado; egg bombs that crack into chicks; spins the arena wind direction.' },
  // World 4 · Forest of Clauses
  { id: 'stone-golem', world: 4, node: 'fort', index: 1, name: 'Stone Golem', menace: 4, arena: 'w4-fort', moves: 'Mossy golem. Raises arms and stomps: rock waves along the floor and a screen shake; falling pebbles.' },
  { id: 'clause-flower', world: 4, node: 'fort', index: 2, name: 'Clauseflower', menace: 4, arena: 'w4-fort', moves: 'Giant venus flytrap. Vine whip sweeps low; seed spray in a 3-way spread; snaps its jaws forward.' },
  { id: 'elder-treant', world: 4, node: 'castle', index: 1, name: 'Elder Treant', menace: 5, arena: 'w4-castle', moves: 'Ancient tree. Roots erupt from the ground in a line toward the marble; acorn rain; a leaf storm sweeps across. Phase 2: eyes glow, roots come faster in pairs.' },
  // World 5 · Tense Canyon
  { id: 'sand-worm', world: 5, node: 'fort', index: 1, name: 'Dune Worm', menace: 5, arena: 'w5-fort', moves: 'Burrows and resurfaces at another spot with a sand spray; arcs over the arena like a rainbow of sand.' },
  { id: 'clock-scorpion', world: 5, node: 'fort', index: 2, name: 'Tick-Tock Scorpion', menace: 5, arena: 'w5-fort', moves: 'Brass scorpion with a clock on its back. Tail sting strike with a ticking warning; tail laser that sweeps low then high.' },
  { id: 'tense-dragon', world: 5, node: 'castle', index: 1, name: 'Tense Dragon', menace: 6, arena: 'w5-castle', moves: 'Red dragon. Fireballs; a fire-breath sweep across the floor; phase 2: takes off and calls a meteor rain with warning shadows.' },
  // World 6 · Passive Glacier
  { id: 'yeti', world: 6, node: 'fort', index: 1, name: 'Snowball Yeti', menace: 6, arena: 'w6-fort', moves: 'Packs and rolls giant snowballs that grow as they roll; pounds its chest to shake icicles down.' },
  { id: 'mirror-wraith', world: 6, node: 'fort', index: 2, name: 'Mirror Wraith', menace: 6, arena: 'w6-fort', moves: 'Ice spirit. Splits into reflections and only one is real; fires ice shards in a fan; the screen frosts at the edges.' },
  { id: 'glacier-mammoth', world: 6, node: 'castle', index: 1, name: 'Glacier Mammoth', menace: 7, arena: 'w6-castle', moves: 'Huge frost mammoth. Trumpets an avalanche that sweeps the arena; tusk slam shockwave; freezing breath that ices the floor (marble slides). Phase 2: blizzard with icicle rain.' },
  // World 7 · Sky Library
  { id: 'bookwyrm', world: 7, node: 'fort', index: 1, name: 'Bookwyrm', menace: 6, arena: 'w7-fort', moves: 'A long worm made of books. Throws spinning page shuriken; snakes through the air in a wave.' },
  { id: 'ink-golem', world: 7, node: 'fort', index: 2, name: 'Ink Golem', menace: 7, arena: 'w7-fort', moves: 'Dripping ink giant. Leaves ink puddles that erupt as spikes; splits into ink blobs that recombine.' },
  { id: 'paper-phoenix', world: 7, node: 'fort', index: 3, name: 'Paper Phoenix', menace: 7, arena: 'w7-fort', moves: 'Origami firebird. Homing origami cranes; a dive of paper flame; rebirth flash when dazed.' },
  { id: 'grim-grimoire', world: 7, node: 'fort', index: 4, name: 'Grim Grimoire', menace: 7, arena: 'w7-fort', moves: 'A floating spellbook. Opens to summon letter-minions that march; page storm; a magic circle that pulses outward.' },
  { id: 'librarian-sphinx', world: 7, node: 'castle', index: 1, name: 'The Librarian Sphinx', menace: 8, arena: 'w7-castle', moves: 'Winged sphinx on a pile of books. Eye beams that sweep the floor; flying book barrage in waves; riddle rings (expanding rings to hop through). Phase 2: takes flight, the sky darkens, a column of light strikes where the marble stands (warning glow).' },
  // World 8 · The Citadel
  { id: 'gargoyle-twins', world: 8, node: 'fort', index: 1, name: 'Gargoyle Twins', menace: 8, arena: 'w8-fort', moves: 'Two stone gargoyles taking turns: one dives, one spits stone orbs; when one is dazed the other gets faster.' },
  { id: 'storm-knight', world: 8, node: 'castle', index: 1, name: 'The Storm Knight', menace: 9, arena: 'w8-castle', moves: 'Armoured giant knight. Lightning strikes on warning columns; sword wave that skims the floor; shield bash with a screen shake. Phase 2: armour cracks, glowing eyes, lightning in threes.' },
  // World 9 · The Academy
  { id: 'pop-quiz-bot', world: 9, node: 'fort', index: 1, name: 'Pop Quiz Bot', menace: 8, arena: 'w9-fort', moves: 'Boxy robot with a screen face. Pencil missiles in a volley; eraser bombs that bounce and pop.' },
  { id: 'chalk-specter', world: 9, node: 'fort', index: 2, name: 'Chalk Specter', menace: 8, arena: 'w9-fort', moves: 'A ghost of chalk dust. Draws hazards on the board that come to life (chalk spikes, chalk boulder); fades in and out.' },
  { id: 'bell-golem', world: 9, node: 'fort', index: 3, name: 'Bell Golem', menace: 9, arena: 'w9-fort', moves: 'Bronze school bell giant. Rings shockwave rings (hop each); swings down like a pendulum.' },
  { id: 'headmaster-hydra', world: 9, node: 'castle', index: 1, name: 'Headmaster Hydra', menace: 9, arena: 'w9-castle', moves: 'Three-headed hydra in a graduation cap. Each head has its own attack (fire, ice, lightning); heads attack in turn, then together. Phase 2: heads drop away one by one with a fireworks burst.' },
  // World 10 · Logic Tower
  { id: 'clockwork-spider', world: 10, node: 'fort', index: 1, name: 'Clockwork Spider', menace: 9, arena: 'w10-fort', moves: 'Brass spider on a thread. Laser grid that sweeps; drops gear bombs; climbs off screen and drops in.' },
  { id: 'paradox-cube', world: 10, node: 'fort', index: 2, name: 'Paradox Cube', menace: 9, arena: 'w10-fort', moves: 'A spinning impossible cube. Teleports with a glitch effect; fires orbs that reverse direction; copies of itself.' },
  { id: 'quantum-cat', world: 10, node: 'fort', index: 3, name: 'Quantum Cat', menace: 10, arena: 'w10-fort', moves: 'A cat in a box that is two cats at once. Two cats attack from both sides, only one is real; yarn balls that phase through walls.' },
  { id: 'null-serpent', world: 10, node: 'fort', index: 4, name: 'Null Serpent', menace: 10, arena: 'w10-fort', moves: 'A serpent of void and stars. Void orbs that pull the marble; screen glitch; coils around the arena.' },
  { id: 'sovereign-of-syntax', world: 10, node: 'castle', index: 1, name: 'The Sovereign of Syntax', menace: 10, arena: 'w10-castle', moves: 'The final boss: a cosmic crowned titan made of glowing runes. Three phases: (1) rune lasers and orbiting rune shields; (2) the arena turns into space, meteor rain and a black hole pull; (3) desperation: the screen pulses, every attack at once, then a huge final burst. Dramatic intro with the screen going dark.' }
];

// Classic's time multiplier for each boss in map order: ×2 at the first fort,
// easing to exactly ×1 at the final castle (more generous early, steeper late).
export function bossTimeScale(id: string) {
  const i = BOSSES.findIndex((b) => b.id === id);
  if (i < 0) return 1;
  const k = i / (BOSSES.length - 1);
  return Math.round((1 + Math.pow(1 - k, 1.5)) * 100) / 100;
}

export function bossFor(world: number, node: 'fort' | 'castle', index: number) {
  return BOSSES.find((b) => b.world === world && b.node === node && b.index === index) || BOSSES[0];
}

// Fort and castle rooms, one pair per world (Codex paints them).
export const ARENAS: { id: string; scene: string }[] = [
  { id: 'w1-fort', scene: 'inside a small wooden-and-stone hilltop fort: stone wall, timber beams, arrow-slit windows with evening sky, plain banners, wall torches; an open gate on the left; a raised stone ledge on the right' },
  { id: 'w1-castle', scene: 'the throne hall of a grand castle at night: purple-grey stone pillars, a huge stained-glass window with a moon (abstract glass shapes), royal banners, braziers; an arched doorway on the left; a wide raised dais with steps on the right' },
  { id: 'w2-fort', scene: "inside a pirate sea fort: weathered planks, portholes showing the sea, ropes and nets, barrels, a ship's wheel on the wall, lanterns; a dock door on the left; a raised wooden deck on the right" },
  { id: 'w2-castle', scene: "a sunken sea temple, half underwater: coral-covered pillars, shafts of green-blue light, a giant shell throne area raised on the right, water lapping at the stone floor, bubbles" },
  { id: 'w3-fort', scene: 'inside a giant windmill: huge wooden gears and the turning axle, sacks of flour, beams, light through slats; a barn door on the left; a raised loft platform on the right' },
  { id: 'w3-castle', scene: 'the top of a storm-swept farm castle open to the sky: a giant weathervane, swirling clouds and a funnel cloud far off, golden fields far below; a raised stone platform on the right' },
  { id: 'w4-fort', scene: 'a fort built into a giant tree: carved wooden walls, roots, glowing mushrooms, lanterns on vines; a hollow entrance on the left; a raised root ledge on the right' },
  { id: 'w4-castle', scene: 'an ancient forest temple at twilight: enormous trees forming a cathedral, mossy stone ruins, glowing spores, a raised overgrown altar platform on the right' },
  { id: 'w5-fort', scene: 'inside a sandstone canyon fort: carved pillars, hieroglyph-like decorative patterns (no letters), hanging lamps, sand spilling; a raised stone dais on the right' },
  { id: 'w5-castle', scene: "a dragon's volcanic lair: obsidian pillars, glowing lava falls, piles of gold, a smoky red sky through a broken roof, a raised rock platform on the right" },
  { id: 'w6-fort', scene: 'inside an ice fort: walls of packed snow and blue ice blocks, frost patterns, icicles, cold lanterns; a raised ice ledge on the right' },
  { id: 'w6-castle', scene: 'a vast frozen palace hall: crystal ice columns, aurora light through a glass ceiling, frozen waterfalls, a raised ice throne platform on the right' },
  { id: 'w7-fort', scene: 'a reading hall of the sky library: towering shelves, floating books, a giant round window to the clouds, golden lamps; a raised reading balcony on the right' },
  { id: 'w7-castle', scene: 'the great dome of the sky library: a mosaic dome of stars, spiralling bookshelves into the sky, golden light, clouds visible through arches, a raised marble platform on the right' },
  { id: 'w8-fort', scene: 'the citadel courtyard in a storm: grim stone walls, gargoyle statues, rain, lightning in the sky, iron gates; a raised battlement on the right' },
  { id: 'w8-castle', scene: "the citadel's throne room in a thunderstorm: black stone, red banners, tall windows with lightning, a huge raised throne dais on the right" },
  { id: 'w9-fort', scene: 'an academy lecture hall: wooden benches rising in tiers, a giant chalkboard with doodles (no readable words), tall windows, chandeliers; a raised stage on the right' },
  { id: 'w9-castle', scene: "the academy's grand graduation hall at night: tall arched windows, banners with crests (no text), a pipe organ, chandeliers, a raised ceremonial stage on the right" },
  { id: 'w10-fort', scene: 'a chamber inside the Logic Tower: brass gears, glowing circuits and rune panels, steam pipes, holographic light; a raised metal platform on the right' },
  { id: 'w10-castle', scene: 'the cosmic summit of the Logic Tower: an open platform under a galaxy, floating rune rings, beams of light, nebula clouds, the curve of a planet far below; a raised glowing platform on the right' }
];
