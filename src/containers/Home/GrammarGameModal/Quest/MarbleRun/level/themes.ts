// Every practice stop is its own level (Mikey 10-07: "every level should be
// different", in the spirit of Super Mario Bros. 3, Super Mario World and
// Yoshi's Island). A theme sets the painted backdrop (Codex imagegen, one per
// stop), how the marble moves, the ground it crosses, the weather, and which
// obstacles and enemies the level is built from. The level generator then
// lays out five obstacles from those pools, seeded by the stop, so layouts
// differ too.
//
// The order inside each world is the order of its stops on the map; a world
// with more stops than themes listed here would wrap, so keep them in step
// with questMap (stops per world: 10, 9, 8, 11, 8, 9, 16, 5, 12, 16).

export type Mode =
  | 'roll' // on the ground, gravity
  | 'swim' // underwater: floaty, drifts, no gravity
  | 'fly' // in the sky: wings, glides between clouds
  | 'slide' // ice: slips and slides, long skids
  | 'lowgrav' // space / moon: big floaty jumps
  | 'rail'; // rides a mine cart / rail car on a track

export type Terrain =
  | 'grass'
  | 'meadow'
  | 'autumn'
  | 'sand'
  | 'beach'
  | 'dock'
  | 'mud'
  | 'stone'
  | 'brick'
  | 'snow'
  | 'ice'
  | 'cloud'
  | 'crystal'
  | 'candy'
  | 'moon'
  | 'metal'
  | 'circuit'
  | 'book'
  | 'wood'
  | 'coral'
  | 'rock';

export type Weather =
  | 'rain'
  | 'snow'
  | 'blizzard'
  | 'fireflies'
  | 'petals'
  | 'leaves'
  | 'bubbles'
  | 'stars'
  | 'sandstorm'
  | 'embers'
  | 'sparkles'
  | 'lightning'
  | 'fog'
  | 'pages'
  | 'confetti'
  | 'glitch';

export type Light = 'day' | 'sunset' | 'night' | 'dark' | 'dream';

export interface Theme {
  id: string;
  world: number;
  name: string;
  mode: Mode;
  terrain: Terrain;
  light: Light;
  weather?: Weather;
  // obstacle and enemy pools the generator draws from
  obstacles: string[];
  enemies: string[];
  // what Codex paints behind the level
  scene: string;
}

export const THEMES: Theme[] = [
  // ---- World 1 · Starter Village (10) ------------------------------------
  { id: 'w1-village-morning', world: 1, name: 'Village Morning', mode: 'roll', terrain: 'grass', light: 'day', obstacles: ['enemy', 'slope', 'pit', 'step', 'spring'], enemies: ['beetle', 'snail'], scene: 'A cheerful village morning: cottages with red roofs, fences, flower boxes, rolling green hills, soft clouds.' },
  { id: 'w1-flower-meadow', world: 1, name: 'Crayon Meadow', mode: 'roll', terrain: 'meadow', light: 'day', weather: 'petals', obstacles: ['enemy', 'slope', 'spring', 'platform', 'pit'], enemies: ['bee', 'snail'], scene: "A pastel crayon-drawn flower meadow like Yoshi's Island: giant smiling-free flowers, scribbled hills, soft pastel sky with chalky texture." },
  { id: 'w1-mushroom-grove', world: 1, name: 'Mushroom Grove', mode: 'roll', terrain: 'grass', light: 'day', obstacles: ['spring', 'enemy', 'step', 'platform', 'pit'], enemies: ['shroom', 'beetle'], scene: 'A grove of giant red-and-white spotted mushrooms of different heights, ferns, dappled sunlight, distant hills.' },
  { id: 'w1-orchard', world: 1, name: 'Apple Orchard', mode: 'roll', terrain: 'grass', light: 'day', weather: 'leaves', obstacles: ['enemy', 'boulder', 'slope', 'pit', 'step'], enemies: ['worm', 'beetle'], scene: 'An apple orchard on gentle hills: rows of apple trees heavy with red apples, ladders, baskets, a red barn far away.' },
  { id: 'w1-pond-shallows', world: 1, name: 'Lily Pond', mode: 'swim', terrain: 'sand', light: 'day', weather: 'bubbles', obstacles: ['fish', 'current', 'weeds', 'bubbles', 'clam'], enemies: ['fish'], scene: 'UNDERWATER in a clear, sunny village pond: lily pad shadows on the surface above, reeds, smooth pebbles, light rays, little bubbles. The whole image is underwater.' },
  { id: 'w1-rainy-lanes', world: 1, name: 'Rainy Lanes', mode: 'roll', terrain: 'mud', light: 'day', weather: 'rain', obstacles: ['enemy', 'slope', 'pit', 'step', 'platform'], enemies: ['frog', 'snail'], scene: 'A village lane on a rainy day: grey-blue sky, wet cottage roofs, puddles, umbrellas hung on a fence, a rainbow just starting at the edge.' },
  { id: 'w1-kite-hills', world: 1, name: 'Kite Hills', mode: 'fly', terrain: 'cloud', light: 'day', obstacles: ['gust', 'bird', 'hoop', 'island', 'gust'], enemies: ['bird'], scene: 'High above windy green hills: colourful kites on long strings, big puffy clouds, the village tiny far below. No ground at the bottom: just hills far away.' },
  { id: 'w1-village-sunset', world: 1, name: 'Sunset Square', mode: 'roll', terrain: 'brick', light: 'sunset', obstacles: ['enemy', 'step', 'spring', 'pit', 'slope'], enemies: ['beetle', 'bee'], scene: 'The village square at sunset: a fountain, bunting flags, a clock tower, warm orange and pink sky, long shadows.' },
  { id: 'w1-firefly-night', world: 1, name: 'Firefly Night', mode: 'roll', terrain: 'grass', light: 'night', weather: 'fireflies', obstacles: ['enemy', 'pit', 'slope', 'platform', 'step'], enemies: ['owl', 'snail'], scene: 'The village at night: a big friendly moon, deep blue sky with stars, warm glowing cottage windows, fireflies over the hills.' },
  { id: 'w1-lantern-festival', world: 1, name: 'Lantern Festival', mode: 'roll', terrain: 'wood', light: 'night', weather: 'sparkles', obstacles: ['spring', 'platform', 'enemy', 'pit', 'step'], enemies: ['beetle', 'owl'], scene: 'A night lantern festival: strings of paper lanterns, a wooden stage, fireworks bursting in the sky, stalls with striped awnings.' },

  // ---- World 2 · Harbor Town (9) -----------------------------------------
  { id: 'w2-harbor-docks', world: 2, name: 'Harbor Docks', mode: 'roll', terrain: 'dock', light: 'day', obstacles: ['enemy', 'pit', 'platform', 'step', 'spring'], enemies: ['crab', 'gull'], scene: 'A busy harbor: wooden piers, fishing boats with sails, stacked crates, a lighthouse on the far rocks, seagulls, bright sea.' },
  { id: 'w2-sandy-beach', world: 2, name: 'Sunny Beach', mode: 'roll', terrain: 'beach', light: 'day', obstacles: ['enemy', 'slope', 'pit', 'boulder', 'spring'], enemies: ['crab', 'gull'], scene: 'A sunny beach: palm trees, sandcastles, striped umbrellas, turquoise waves, a far island.' },
  { id: 'w2-coral-reef', world: 2, name: 'Coral Reef', mode: 'swim', terrain: 'coral', light: 'day', weather: 'bubbles', obstacles: ['fish', 'current', 'urchin', 'weeds', 'clam'], enemies: ['fish', 'jelly'], scene: 'UNDERWATER coral reef: bright pink, orange and purple corals, sea anemones, schools of tiny fish far away, sunbeams from the surface. Fully underwater.' },
  { id: 'w2-pirate-airship', world: 2, name: 'Pirate Airship', mode: 'roll', terrain: 'wood', light: 'day', obstacles: ['cannon', 'pit', 'enemy', 'platform', 'cannon'], enemies: ['gull', 'crab'], scene: 'Sky battle above the sea like Super Mario Bros. 3 airships: the side of a huge wooden flying ship with cannons, propellers, rigging and sails; clouds rushing past.' },
  { id: 'w2-tide-pools', world: 2, name: 'Tide Pools', mode: 'roll', terrain: 'rock', light: 'day', obstacles: ['pit', 'enemy', 'step', 'spring', 'slope'], enemies: ['crab', 'starfish'], scene: 'Rocky tide pools at low tide: starfish, shells, seaweed-draped rocks, sea spray, a cliff with a cottage on top.' },
  { id: 'w2-shipwreck', world: 2, name: 'Sunken Ship', mode: 'swim', terrain: 'sand', light: 'dark', weather: 'bubbles', obstacles: ['eel', 'current', 'urchin', 'weeds', 'fish'], enemies: ['eel', 'jelly'], scene: 'UNDERWATER deep sea: a sunken wooden pirate ship, treasure chest glowing, glowing jellyfish, darker blue water with faint light rays. Fully underwater.' },
  { id: 'w2-harbor-sunset', world: 2, name: 'Harbor Sunset', mode: 'roll', terrain: 'dock', light: 'sunset', obstacles: ['enemy', 'platform', 'pit', 'step', 'spring'], enemies: ['gull', 'crab'], scene: 'The harbor at sunset: boats silhouetted on golden water, warm sky, lanterns lighting on the pier, birds flying home.' },
  { id: 'w2-sea-caves', world: 2, name: 'Sea Caves', mode: 'roll', terrain: 'rock', light: 'dark', weather: 'sparkles', obstacles: ['pit', 'step', 'enemy', 'boulder', 'platform'], enemies: ['crab', 'bat'], scene: 'Inside a sea cave: glittering wet rock arches, glowing blue crystals, a waterfall of light from an opening, a tide pool shining.' },
  { id: 'w2-lighthouse-night', world: 2, name: 'Lighthouse Night', mode: 'roll', terrain: 'rock', light: 'night', weather: 'rain', obstacles: ['enemy', 'slope', 'pit', 'spring', 'step'], enemies: ['gull', 'crab'], scene: 'A stormy night on the cliffs: a tall lighthouse sweeping its beam, dark waves crashing, rain, a ship far away.' },

  // ---- World 3 · Windmill Hills (8) --------------------------------------
  { id: 'w3-windmill-fields', world: 3, name: 'Windmill Fields', mode: 'roll', terrain: 'grass', light: 'day', obstacles: ['enemy', 'slope', 'spring', 'pit', 'seesaw'], enemies: ['mole', 'bee'], scene: 'Rolling farm hills with tall windmills turning, patchwork fields, hay bales, a winding dirt road, bright sky.' },
  { id: 'w3-tulip-fields', world: 3, name: 'Tulip Rows', mode: 'roll', terrain: 'meadow', light: 'day', weather: 'petals', obstacles: ['enemy', 'pit', 'spring', 'slope', 'platform'], enemies: ['bee', 'mole'], scene: 'Endless stripes of red, yellow and purple tulips leading to a windmill, a canal with a little bridge, fluffy clouds.' },
  { id: 'w3-hot-air-balloons', world: 3, name: 'Balloon Race', mode: 'fly', terrain: 'cloud', light: 'day', obstacles: ['hoop', 'gust', 'bird', 'island', 'hoop'], enemies: ['bird'], scene: 'A sky full of colourful hot-air balloons racing over farmland far below, big clouds, sunshine. No ground at the bottom.' },
  { id: 'w3-barn-yard', world: 3, name: 'Barnyard', mode: 'roll', terrain: 'wood', light: 'day', obstacles: ['seesaw', 'enemy', 'step', 'pit', 'spring'], enemies: ['chick', 'mole'], scene: 'A big red barn and farmyard: haystacks, a tractor, a silo, fences, a weathervane, sunflowers.' },
  { id: 'w3-wheat-sunset', world: 3, name: 'Golden Wheat', mode: 'roll', terrain: 'grass', light: 'sunset', weather: 'leaves', obstacles: ['enemy', 'slope', 'pit', 'boulder', 'step'], enemies: ['mole', 'chick'], scene: 'Golden wheat fields at sunset, windmills silhouetted, scarecrows, a warm orange sky with long clouds.' },
  { id: 'w3-rainbow-meadow', world: 3, name: 'After the Rain', mode: 'roll', terrain: 'mud', light: 'day', weather: 'sparkles', obstacles: ['spring', 'platform', 'pit', 'enemy', 'slope'], enemies: ['frog', 'snail'], scene: 'Hills just after rain: a huge double rainbow, sparkling wet grass, puddles reflecting the sky, clouds breaking up.' },
  { id: 'w3-cloud-hop', world: 3, name: 'Cloud Hop', mode: 'fly', terrain: 'cloud', light: 'day', obstacles: ['island', 'gust', 'hoop', 'bird', 'storm'], enemies: ['bird'], scene: 'Up in the clouds above the windmills: cloud platforms with little grass tufts, sun rays, a rainbow arching. No ground at the bottom.' },
  { id: 'w3-starry-hills', world: 3, name: 'Starry Hills', mode: 'roll', terrain: 'grass', light: 'night', weather: 'stars', obstacles: ['enemy', 'slope', 'pit', 'spring', 'step'], enemies: ['owl', 'mole'], scene: 'Windmill hills at night under a sky full of stars and a shooting star, a glowing farmhouse window, the Milky Way.' },

  // ---- World 4 · Forest of Clauses (11) ----------------------------------
  { id: 'w4-forest-path', world: 4, name: 'Forest Path', mode: 'roll', terrain: 'grass', light: 'day', weather: 'leaves', obstacles: ['enemy', 'slope', 'pit', 'step', 'boulder'], enemies: ['squirrel', 'beetle'], scene: 'A sunny forest path: tall oak trees, light beams through leaves, ferns, a mossy log, mushrooms.' },
  { id: 'w4-treetops', world: 4, name: 'Treetop Walk', mode: 'roll', terrain: 'wood', light: 'day', obstacles: ['vine', 'platform', 'pit', 'enemy', 'spring'], enemies: ['squirrel', 'bird'], scene: 'High in the forest canopy: rope bridges, treehouses, giant branches, leaves everywhere, the forest floor far below.' },
  { id: 'w4-glow-mushroom-night', world: 4, name: 'Glowshroom Night', mode: 'roll', terrain: 'grass', light: 'night', weather: 'fireflies', obstacles: ['spring', 'enemy', 'pit', 'platform', 'step'], enemies: ['shroom', 'owl'], scene: 'A forest at night lit by glowing blue and purple mushrooms, fireflies, a full moon through the trees.' },
  { id: 'w4-swamp', world: 4, name: 'Muddy Swamp', mode: 'roll', terrain: 'mud', light: 'day', weather: 'fog', obstacles: ['platform', 'enemy', 'pit', 'slope', 'step'], enemies: ['frog', 'snail'], scene: 'A misty swamp: cypress trees with hanging moss, lily pads, cattails, a little wooden shack on stilts.' },
  { id: 'w4-river-rapids', world: 4, name: 'River Rapids', mode: 'swim', terrain: 'sand', light: 'day', weather: 'bubbles', obstacles: ['current', 'fish', 'weeds', 'bubbles', 'current'], enemies: ['fish', 'eel'], scene: 'UNDERWATER in a fast clear forest river: smooth stones, swaying river weeds, light dancing through the surface, a log above. Fully underwater.' },
  { id: 'w4-fairy-glen', world: 4, name: 'Fairy Glen', mode: 'roll', terrain: 'meadow', light: 'dream', weather: 'sparkles', obstacles: ['spring', 'platform', 'enemy', 'pit', 'slope'], enemies: ['pixie', 'snail'], scene: 'A magical glen: rings of pastel mushrooms, sparkling dust, tiny glowing flowers, soft purple and teal light.' },
  { id: 'w4-autumn-woods', world: 4, name: 'Autumn Woods', mode: 'roll', terrain: 'autumn', light: 'day', weather: 'leaves', obstacles: ['enemy', 'slope', 'boulder', 'pit', 'step'], enemies: ['squirrel', 'hedgehog'], scene: 'A forest in autumn: red, orange and gold trees, falling leaves, pumpkins, a little stone bridge.' },
  { id: 'w4-hollow-log', world: 4, name: 'Hollow Log', mode: 'roll', terrain: 'wood', light: 'dark', obstacles: ['pit', 'enemy', 'step', 'platform', 'spring'], enemies: ['beetle', 'worm'], scene: 'Inside a giant hollow log tunnel: wood grain walls, glowing moss, tree roots, little openings letting in green light.' },
  { id: 'w4-spider-woods', world: 4, name: 'Webbed Woods', mode: 'roll', terrain: 'grass', light: 'dark', weather: 'fog', obstacles: ['enemy', 'platform', 'pit', 'vine', 'step'], enemies: ['spider', 'bat'], scene: 'A spooky-cute dark forest: twisty trees, big dew-covered spider webs, purple mist, glowing eyes in the dark.' },
  { id: 'w4-waterfall-cliffs', world: 4, name: 'Waterfall Cliffs', mode: 'roll', terrain: 'rock', light: 'day', weather: 'sparkles', obstacles: ['platform', 'pit', 'spring', 'enemy', 'vine'], enemies: ['bird', 'frog'], scene: 'Tall cliffs with several waterfalls pouring into misty pools, rainbows in the spray, trees clinging to the rock.' },
  { id: 'w4-firefly-river', world: 4, name: 'Moonlit River', mode: 'roll', terrain: 'grass', light: 'night', weather: 'fireflies', obstacles: ['platform', 'enemy', 'pit', 'slope', 'spring'], enemies: ['frog', 'owl'], scene: 'A forest river at night: the moon reflected in the water, fireflies, glowing reeds, a wooden pier.' },

  // ---- World 5 · Tense Canyon (8) ----------------------------------------
  { id: 'w5-canyon-day', world: 5, name: 'Red Canyon', mode: 'roll', terrain: 'rock', light: 'day', obstacles: ['enemy', 'pit', 'boulder', 'step', 'slope'], enemies: ['lizard', 'cactus'], scene: 'A grand red-rock canyon: layered cliffs, mesas, a hot blue sky, a winding river far below.' },
  { id: 'w5-desert-dunes', world: 5, name: 'Angry Sun Dunes', mode: 'roll', terrain: 'sand', light: 'day', weather: 'sandstorm', obstacles: ['enemy', 'slope', 'quicksand', 'pit', 'spring'], enemies: ['cactus', 'scorpion'], scene: 'Rolling golden sand dunes under a blazing sun like Super Mario Bros. 3 desert, cacti, a distant pyramid, heat shimmer.' },
  { id: 'w5-mine-cart', world: 5, name: 'Mine Cart Dash', mode: 'rail', terrain: 'rock', light: 'dark', obstacles: ['railgap', 'bats', 'railgap', 'loop', 'bats'], enemies: ['bat'], scene: 'Inside a canyon mine: wooden support beams, lanterns, rails crossing at different heights, glittering gold veins.' },
  { id: 'w5-oasis', world: 5, name: 'Oasis', mode: 'roll', terrain: 'sand', light: 'day', obstacles: ['platform', 'enemy', 'pit', 'spring', 'slope'], enemies: ['lizard', 'scorpion'], scene: 'A desert oasis: palm trees around a sparkling blue pool, tents with striped cloth, camels in the distance.' },
  { id: 'w5-crystal-caves', world: 5, name: 'Crystal Caves', mode: 'roll', terrain: 'crystal', light: 'dark', weather: 'sparkles', obstacles: ['pit', 'step', 'enemy', 'platform', 'spring'], enemies: ['bat', 'mole'], scene: 'A deep cave full of giant glowing crystals in pink, blue and purple, underground pools reflecting the light.' },
  { id: 'w5-sandstorm', world: 5, name: 'Sandstorm Ruins', mode: 'roll', terrain: 'sand', light: 'sunset', weather: 'sandstorm', obstacles: ['enemy', 'step', 'pit', 'boulder', 'quicksand'], enemies: ['scorpion', 'mummy'], scene: 'Ancient sandstone ruins with tall pillars and a half-buried statue head, a swirling orange sandstorm, low sun.' },
  { id: 'w5-desert-night', world: 5, name: 'Pyramid Night', mode: 'roll', terrain: 'sand', light: 'night', weather: 'stars', obstacles: ['enemy', 'pit', 'slope', 'step', 'spring'], enemies: ['mummy', 'scorpion'], scene: 'Desert night: great pyramids under a starry sky and a crescent moon, glowing torches, dunes in blue moonlight.' },
  { id: 'w5-lava-vents', world: 5, name: 'Lava Vents', mode: 'roll', terrain: 'rock', light: 'dark', weather: 'embers', obstacles: ['geyser', 'pit', 'enemy', 'platform', 'step'], enemies: ['fireblob', 'lizard'], scene: 'A volcanic canyon floor: glowing lava rivers, steaming vents, dark basalt columns, orange embers in a smoky sky.' },

  // ---- World 6 · Passive Glacier (9) -------------------------------------
  { id: 'w6-glacier-day', world: 6, name: 'Glacier Slide', mode: 'slide', terrain: 'ice', light: 'day', obstacles: ['ramp', 'crack', 'enemy', 'icicle', 'slope'], enemies: ['penguin', 'seal'], scene: 'A bright blue glacier: huge ice walls, snowy peaks, a frozen waterfall, crisp blue sky.' },
  { id: 'w6-snow-village', world: 6, name: 'Snow Village', mode: 'roll', terrain: 'snow', light: 'sunset', weather: 'snow', obstacles: ['enemy', 'slope', 'pit', 'step', 'spring'], enemies: ['snowman', 'penguin'], scene: 'A snowy mountain village at dusk: wooden chalets with glowing windows, pine trees, falling snow, pink-orange sky.' },
  { id: 'w6-aurora-field', world: 6, name: 'Aurora Field', mode: 'slide', terrain: 'snow', light: 'night', weather: 'stars', obstacles: ['ramp', 'enemy', 'crack', 'slope', 'icicle'], enemies: ['penguin', 'fox'], scene: 'A snowfield at night under brilliant green and purple northern lights, starry sky, snowy pines, an igloo glowing.' },
  { id: 'w6-ice-caves', world: 6, name: 'Ice Caves', mode: 'slide', terrain: 'ice', light: 'dark', weather: 'sparkles', obstacles: ['icicle', 'crack', 'ramp', 'enemy', 'step'], enemies: ['bat', 'seal'], scene: 'Inside a glittering blue ice cave: frozen arches, icicles, light glowing through the ice, frozen bubbles in the walls.' },
  { id: 'w6-under-ice', world: 6, name: 'Under the Ice', mode: 'swim', terrain: 'sand', light: 'dark', weather: 'bubbles', obstacles: ['fish', 'current', 'urchin', 'bubbles', 'eel'], enemies: ['fish', 'jelly'], scene: 'UNDERWATER beneath a frozen lake: the ice sheet above with light glowing through, pale blue water, frozen pebbles. Fully underwater.' },
  { id: 'w6-blizzard', world: 6, name: 'Blizzard Pass', mode: 'roll', terrain: 'snow', light: 'day', weather: 'blizzard', obstacles: ['enemy', 'boulder', 'slope', 'pit', 'step'], enemies: ['snowman', 'yeti'], scene: 'A mountain pass in a blizzard: whirling snow, pine trees bent by wind, a rope bridge, grey-white sky.' },
  { id: 'w6-penguin-floes', world: 6, name: 'Ice Floes', mode: 'slide', terrain: 'ice', light: 'day', obstacles: ['platform', 'crack', 'enemy', 'ramp', 'platform'], enemies: ['penguin', 'seal'], scene: 'An icy sea with floating ice floes, distant icebergs, penguins on snowy islands far away, bright cold sky.' },
  { id: 'w6-ice-palace', world: 6, name: 'Ice Palace', mode: 'slide', terrain: 'ice', light: 'dream', weather: 'sparkles', obstacles: ['icicle', 'ramp', 'enemy', 'step', 'crack'], enemies: ['snowman', 'fox'], scene: 'A sparkling ice palace hall: crystal chandeliers, frozen fountains, snowflake windows, pale blue and silver light.' },
  { id: 'w6-polar-sky', world: 6, name: 'Polar Sky', mode: 'fly', terrain: 'cloud', light: 'night', weather: 'snow', obstacles: ['gust', 'hoop', 'bird', 'storm', 'island'], enemies: ['owl'], scene: 'Flying high over the snowy mountains at night: northern lights rippling, snow clouds, a giant moon. No ground at the bottom.' },

  // ---- World 7 · Sky Library (16) ----------------------------------------
  { id: 'w7-sky-library', world: 7, name: 'Floating Stacks', mode: 'roll', terrain: 'book', light: 'day', weather: 'pages', obstacles: ['platform', 'enemy', 'pit', 'step', 'spring'], enemies: ['bookworm', 'quill'], scene: 'A library floating in the sky: enormous bookshelves on clouds, ladders, flying pages, golden reading lamps.' },
  { id: 'w7-cloud-kingdom', world: 7, name: 'Cloud Kingdom', mode: 'fly', terrain: 'cloud', light: 'day', obstacles: ['island', 'hoop', 'gust', 'bird', 'storm'], enemies: ['bird', 'paperplane'], scene: 'A kingdom built on clouds: white towers with gold domes, cloud bridges, rainbows. No ground at the bottom.' },
  { id: 'w7-paper-planes', world: 7, name: 'Paper Plane Race', mode: 'fly', terrain: 'cloud', light: 'day', weather: 'pages', obstacles: ['hoop', 'gust', 'bird', 'hoop', 'island'], enemies: ['paperplane'], scene: 'A sky full of giant paper airplanes and paper cranes gliding between clouds and floating books. No ground at the bottom.' },
  { id: 'w7-sunset-clouds', world: 7, name: 'Sunset Clouds', mode: 'roll', terrain: 'cloud', light: 'sunset', obstacles: ['spring', 'platform', 'pit', 'enemy', 'step'], enemies: ['quill', 'bird'], scene: 'A sea of golden-pink sunset clouds, floating islands with lamp posts and benches, the sun huge and low.' },
  { id: 'w7-storm-clouds', world: 7, name: 'Thunderhead', mode: 'roll', terrain: 'cloud', light: 'dark', weather: 'lightning', obstacles: ['storm', 'platform', 'pit', 'enemy', 'spring'], enemies: ['cloudling', 'bird'], scene: 'Inside a thunderstorm: dark purple clouds, lightning bolts, rain curtains, a floating library tower in the distance.' },
  { id: 'w7-giant-books', world: 7, name: 'Giant Desk', mode: 'roll', terrain: 'book', light: 'day', obstacles: ['step', 'spring', 'enemy', 'pit', 'seesaw'], enemies: ['bookworm', 'eraser'], scene: 'Giant land like Super Mario Bros. 3, but a desk: huge books, pencils, an inkwell, a lamp, a globe, everything enormous.' },
  { id: 'w7-inkwell-sea', world: 7, name: 'Ink Sea', mode: 'swim', terrain: 'sand', light: 'dark', weather: 'bubbles', obstacles: ['current', 'eel', 'weeds', 'bubbles', 'fish'], enemies: ['inkfish', 'eel'], scene: 'UNDERWATER in a sea of blue-black ink: floating letters made of ink drifting like seaweed (shapes only, not readable), sunken quills. Fully underwater.' },
  { id: 'w7-clockwork-attic', world: 7, name: 'Clockwork Attic', mode: 'roll', terrain: 'wood', light: 'dark', obstacles: ['platform', 'step', 'enemy', 'thwomp', 'pit'], enemies: ['gearbot', 'bookworm'], scene: 'An attic of the sky library: big brass clock gears turning, dusty beams, round windows showing the sky, old trunks.' },
  { id: 'w7-balloon-armada', world: 7, name: 'Balloon Armada', mode: 'roll', terrain: 'wood', light: 'day', obstacles: ['cannon', 'platform', 'pit', 'cannon', 'enemy'], enemies: ['bird', 'quill'], scene: 'A fleet of balloon-lifted wooden platforms and gondolas drifting in the sky, flags, propellers, clouds below.' },
  { id: 'w7-starlit-reading', world: 7, name: 'Starlit Reading Room', mode: 'roll', terrain: 'book', light: 'night', weather: 'stars', obstacles: ['enemy', 'platform', 'step', 'spring', 'pit'], enemies: ['owl', 'bookworm'], scene: 'An open-air reading room among the stars: telescopes, star charts, candle lamps, constellations glowing.' },
  { id: 'w7-sky-garden', world: 7, name: 'Hanging Gardens', mode: 'roll', terrain: 'meadow', light: 'day', weather: 'petals', obstacles: ['vine', 'platform', 'spring', 'enemy', 'pit'], enemies: ['bee', 'bird'], scene: 'Hanging gardens on floating rocks: waterfalls pouring into the sky, vines, flowers, stone arches, clouds.' },
  { id: 'w7-map-room', world: 7, name: 'Map Room', mode: 'roll', terrain: 'wood', light: 'sunset', obstacles: ['seesaw', 'platform', 'enemy', 'pit', 'step'], enemies: ['quill', 'gearbot'], scene: 'A grand map room: a giant spinning globe, old maps on walls, compasses, a big window to a sunset sky.' },
  { id: 'w7-rainbow-bridge', world: 7, name: 'Rainbow Bridge', mode: 'roll', terrain: 'cloud', light: 'day', weather: 'sparkles', obstacles: ['platform', 'spring', 'pit', 'enemy', 'slope'], enemies: ['cloudling', 'bird'], scene: 'A long rainbow arching between floating islands of the sky library, sparkles, soft clouds, distant towers.' },
  { id: 'w7-airship-docks', world: 7, name: 'Airship Docks', mode: 'roll', terrain: 'metal', light: 'day', obstacles: ['cannon', 'platform', 'enemy', 'pit', 'step'], enemies: ['gearbot', 'bird'], scene: 'Floating sky docks with moored airships, cranes, cargo nets, brass pipes, propellers spinning, clouds below.' },
  { id: 'w7-moon-clouds', world: 7, name: 'Moonlit Clouds', mode: 'fly', terrain: 'cloud', light: 'night', weather: 'stars', obstacles: ['island', 'gust', 'hoop', 'storm', 'bird'], enemies: ['owl', 'paperplane'], scene: 'Night sky over silver moonlit clouds, a huge glowing moon, floating lanterns rising. No ground at the bottom.' },
  { id: 'w7-aurora-archive', world: 7, name: 'Aurora Archive', mode: 'roll', terrain: 'book', light: 'dream', weather: 'pages', obstacles: ['platform', 'spring', 'enemy', 'step', 'pit'], enemies: ['quill', 'bookworm'], scene: 'The top floor of the sky library open to an aurora sky: spiral staircases, glowing book spines, floating candles.' },

  // ---- World 8 · The Citadel (5) -----------------------------------------
  { id: 'w8-citadel-walls', world: 8, name: 'Citadel Walls', mode: 'roll', terrain: 'brick', light: 'dark', weather: 'rain', obstacles: ['cannon', 'thwomp', 'pit', 'enemy', 'step'], enemies: ['knight', 'gargoyle'], scene: 'The outer walls of a great stone citadel in the rain: towers, banners, battlements, storm clouds, distant lightning.' },
  { id: 'w8-ghost-house', world: 8, name: 'Ghost House', mode: 'roll', terrain: 'wood', light: 'dark', weather: 'fog', obstacles: ['ghost', 'door', 'pit', 'platform', 'ghost'], enemies: ['ghost'], scene: 'Inside a haunted mansion like Super Mario World ghost houses: creaky wooden floors, dusty portraits, flickering candles, cobwebs, purple fog.' },
  { id: 'w8-lava-moat', world: 8, name: 'Lava Moat', mode: 'roll', terrain: 'stone', light: 'dark', weather: 'embers', obstacles: ['thwomp', 'geyser', 'pit', 'platform', 'enemy'], enemies: ['fireblob', 'knight'], scene: 'A fortress interior above a glowing lava moat: chains, stone pillars, iron grates, rising embers.' },
  { id: 'w8-dungeon', world: 8, name: 'Dungeon', mode: 'roll', terrain: 'stone', light: 'dark', obstacles: ['thwomp', 'spikes', 'enemy', 'pit', 'step'], enemies: ['skeleton', 'bat'], scene: 'A dungeon: stone arches, torches on walls, iron doors, chains, a little moss, puddles, cold blue light.' },
  { id: 'w8-bell-tower', world: 8, name: 'Bell Tower', mode: 'roll', terrain: 'wood', light: 'night', weather: 'lightning', obstacles: ['platform', 'thwomp', 'spring', 'enemy', 'pit'], enemies: ['gargoyle', 'bat'], scene: 'High in the citadel bell tower at night: giant bronze bells, ropes, wooden beams, a stormy moonlit sky through arches.' },

  // ---- World 9 · The Academy (12) ----------------------------------------
  { id: 'w9-campus-day', world: 9, name: 'Campus Green', mode: 'roll', terrain: 'grass', light: 'day', obstacles: ['enemy', 'step', 'spring', 'pit', 'slope'], enemies: ['pencil', 'eraser'], scene: 'A grand academy campus: brick buildings with ivy, a clock tower, lawns, trees, students-free benches, blue sky.' },
  { id: 'w9-giant-classroom', world: 9, name: 'Giant Classroom', mode: 'roll', terrain: 'wood', light: 'day', obstacles: ['step', 'seesaw', 'enemy', 'spring', 'pit'], enemies: ['eraser', 'pencil'], scene: 'Giant land classroom: enormous desks and chairs, a huge chalkboard with doodles (no readable words), giant crayons and rulers.' },
  { id: 'w9-chem-lab', world: 9, name: 'Bubble Lab', mode: 'roll', terrain: 'metal', light: 'day', weather: 'bubbles', obstacles: ['geyser', 'platform', 'enemy', 'pit', 'spring'], enemies: ['blob', 'gearbot'], scene: 'A colourful chemistry lab: bubbling flasks, glass tubes, giant beakers with glowing liquids, a periodic-table-like poster of colour blocks (no text).' },
  { id: 'w9-library-night', world: 9, name: 'Night Library', mode: 'roll', terrain: 'book', light: 'night', obstacles: ['platform', 'enemy', 'step', 'pit', 'ghost'], enemies: ['owl', 'ghost'], scene: 'The academy library at night: tall shelves, green reading lamps, moonlight through tall windows, rolling ladders.' },
  { id: 'w9-music-hall', world: 9, name: 'Music Hall', mode: 'roll', terrain: 'wood', light: 'dark', weather: 'sparkles', obstacles: ['note', 'note', 'enemy', 'pit', 'platform'], enemies: ['drum', 'note'], scene: 'A concert hall stage: red curtains, golden organ pipes, giant instruments (piano, drums, harp), spotlights.' },
  { id: 'w9-art-room', world: 9, name: 'Crayon World', mode: 'roll', terrain: 'meadow', light: 'dream', weather: 'confetti', obstacles: ['spring', 'enemy', 'platform', 'slope', 'pit'], enemies: ['pencil', 'blob'], scene: "Inside a child's drawing like Yoshi's Island: crayon hills, a scribbled sun, paper texture, paint splashes, a cardboard castle." },
  { id: 'w9-gym', world: 9, name: 'Bouncy Gym', mode: 'roll', terrain: 'wood', light: 'day', obstacles: ['spring', 'seesaw', 'enemy', 'spring', 'pit'], enemies: ['ball', 'eraser'], scene: 'A school gym: wooden floor stripes, basketball hoops, climbing ropes, trampolines, banners in school colours (no text).' },
  { id: 'w9-greenhouse', world: 9, name: 'Greenhouse', mode: 'roll', terrain: 'meadow', light: 'day', weather: 'petals', obstacles: ['vine', 'enemy', 'platform', 'pit', 'spring'], enemies: ['flytrap', 'bee'], scene: 'A huge glass greenhouse: tropical plants, giant leaves, hanging pots, misty sunlight through glass panes.' },
  { id: 'w9-observatory', world: 9, name: 'Observatory', mode: 'lowgrav', terrain: 'metal', light: 'night', weather: 'stars', obstacles: ['crater', 'asteroid', 'enemy', 'platform', 'laser'], enemies: ['alien', 'star'], scene: 'An observatory dome open to space: a giant brass telescope, planets and nebulae filling the sky, star charts.' },
  { id: 'w9-dream-dorm', world: 9, name: 'Dreamland', mode: 'roll', terrain: 'candy', light: 'dream', weather: 'sparkles', obstacles: ['spring', 'platform', 'enemy', 'pit', 'slope'], enemies: ['sheep', 'blob'], scene: 'A dreamland: candy-floss clouds, pillow hills, giant floating sheep, moon with a nightcap, pastel stars.' },
  { id: 'w9-sports-field', world: 9, name: 'Sports Day', mode: 'roll', terrain: 'grass', light: 'sunset', weather: 'confetti', obstacles: ['enemy', 'spring', 'pit', 'boulder', 'step'], enemies: ['ball', 'pencil'], scene: 'The academy sports field at sunset: a running track, goal posts, bleachers, pennants, a scoreboard of lights (no text).' },
  { id: 'w9-rooftop-night', world: 9, name: 'Rooftop Night', mode: 'roll', terrain: 'brick', light: 'night', weather: 'stars', obstacles: ['platform', 'pit', 'enemy', 'step', 'spring'], enemies: ['owl', 'gargoyle'], scene: 'Academy rooftops at night: chimneys, weather vanes, a glowing clock face, a starry sky with a full moon.' },

  // ---- World 10 · Logic Tower (16) ---------------------------------------
  { id: 'w10-clockwork', world: 10, name: 'Gear Works', mode: 'roll', terrain: 'metal', light: 'dark', obstacles: ['platform', 'thwomp', 'enemy', 'pit', 'step'], enemies: ['gearbot', 'spark'], scene: 'Inside the Logic Tower: giant brass gears and pistons, steam, glowing gauges, conveyor belts, warm amber light.' },
  { id: 'w10-neon-circuit', world: 10, name: 'Neon Circuit', mode: 'roll', terrain: 'circuit', light: 'dark', weather: 'glitch', obstacles: ['laser', 'platform', 'enemy', 'pit', 'spring'], enemies: ['spark', 'bit'], scene: 'A glowing circuit-board world: neon cyan and magenta traces, chips like buildings, data streams of light, dark background.' },
  { id: 'w10-space-station', world: 10, name: 'Space Station', mode: 'lowgrav', terrain: 'metal', light: 'night', weather: 'stars', obstacles: ['laser', 'crater', 'enemy', 'platform', 'asteroid'], enemies: ['alien', 'drone'], scene: 'Outside a space station: solar panels, modules, the blue Earth below, stars, a nebula glow.' },
  { id: 'w10-moon-surface', world: 10, name: 'Moon Walk', mode: 'lowgrav', terrain: 'moon', light: 'night', weather: 'stars', obstacles: ['crater', 'asteroid', 'enemy', 'crater', 'laser'], enemies: ['alien', 'ufo'], scene: 'The surface of the moon: grey craters, a flag-free landing site with a little lander, Earth rising, black starry sky.' },
  { id: 'w10-asteroid-belt', world: 10, name: 'Asteroid Belt', mode: 'fly', terrain: 'moon', light: 'night', weather: 'stars', obstacles: ['asteroid', 'island', 'hoop', 'gust', 'asteroid'], enemies: ['ufo'], scene: 'Flying through an asteroid belt: tumbling rocks of many sizes, a ringed planet, glittering stars. No ground at the bottom.' },
  { id: 'w10-nebula', world: 10, name: 'Nebula Drift', mode: 'fly', terrain: 'crystal', light: 'dream', weather: 'sparkles', obstacles: ['hoop', 'gust', 'asteroid', 'island', 'storm'], enemies: ['star', 'ufo'], scene: 'Drifting through a colourful nebula: pink, blue and violet gas clouds, newborn stars, crystal comets. No ground at the bottom.' },
  { id: 'w10-black-hole', world: 10, name: 'Event Horizon', mode: 'lowgrav', terrain: 'crystal', light: 'dark', weather: 'stars', obstacles: ['blackhole', 'crater', 'laser', 'enemy', 'blackhole'], enemies: ['drone', 'star'], scene: 'Near a swirling black hole with a glowing orange accretion disk bending starlight, floating crystal debris.' },
  { id: 'w10-candy-land', world: 10, name: 'Candy Clouds', mode: 'roll', terrain: 'candy', light: 'dream', weather: 'confetti', obstacles: ['spring', 'platform', 'enemy', 'pit', 'slope'], enemies: ['gummy', 'blob'], scene: 'A dream world of sweets: lollipop trees, candy-cane arches, cotton-candy clouds, chocolate rivers, pastel sky.' },
  { id: 'w10-mirror-world', world: 10, name: 'Mirror Hall', mode: 'roll', terrain: 'crystal', light: 'dream', weather: 'sparkles', obstacles: ['platform', 'door', 'enemy', 'pit', 'step'], enemies: ['mirror', 'spark'], scene: 'An infinite hall of mirrors: reflections of reflections, silver frames, floating glass shards, soft violet light.' },
  { id: 'w10-crystal-palace', world: 10, name: 'Crystal Palace', mode: 'slide', terrain: 'crystal', light: 'dream', weather: 'sparkles', obstacles: ['ramp', 'crack', 'enemy', 'icicle', 'step'], enemies: ['mirror', 'star'], scene: 'A palace of prismatic crystal: rainbow light refracting everywhere, crystal spires, glowing floors.' },
  { id: 'w10-zero-g-library', world: 10, name: 'Zero-G Library', mode: 'lowgrav', terrain: 'book', light: 'night', weather: 'pages', obstacles: ['crater', 'platform', 'enemy', 'laser', 'asteroid'], enemies: ['bookworm', 'drone'], scene: 'A library floating in space: books and shelves drifting in zero gravity, planets through round windows, stars.' },
  { id: 'w10-glitch-world', world: 10, name: 'Glitch Zone', mode: 'roll', terrain: 'circuit', light: 'dark', weather: 'glitch', obstacles: ['laser', 'pit', 'enemy', 'platform', 'door'], enemies: ['bit', 'spark'], scene: 'A glitched digital landscape: pixel blocks breaking apart, scan lines, colour-shifted hills, floating cubes.' },
  { id: 'w10-chess-land', world: 10, name: 'Chessboard Plains', mode: 'roll', terrain: 'stone', light: 'day', obstacles: ['enemy', 'step', 'thwomp', 'pit', 'spring'], enemies: ['pawn', 'knightpiece'], scene: 'A surreal land of giant chessboard plains: huge chess pieces as statues, checkered hills, a clear sky with clocks as clouds.' },
  { id: 'w10-pipe-maze', world: 10, name: 'Pipe Maze', mode: 'roll', terrain: 'metal', light: 'day', obstacles: ['pipe', 'pipe', 'enemy', 'pit', 'platform'], enemies: ['plant', 'gearbot'], scene: 'A maze of giant green and blue pipes like Super Mario Bros. 3 pipe land, bolts, valves, steam puffs, a blue sky.' },
  { id: 'w10-cosmic-garden', world: 10, name: 'Cosmic Garden', mode: 'lowgrav', terrain: 'meadow', light: 'dream', weather: 'sparkles', obstacles: ['crater', 'platform', 'enemy', 'spring', 'asteroid'], enemies: ['star', 'alien'], scene: 'A garden on a tiny planet in space: glowing alien flowers, floating seeds, rings of a planet in the sky.' },
  { id: 'w10-tower-summit', world: 10, name: 'Tower Summit', mode: 'roll', terrain: 'metal', light: 'night', weather: 'lightning', obstacles: ['thwomp', 'laser', 'cannon', 'pit', 'enemy'], enemies: ['drone', 'spark'], scene: 'The very top of the Logic Tower above the clouds at night: antennae crackling with lightning, glowing rune panels, a vast starry sky.' }
];

export const STOPS_PER_WORLD = [10, 9, 8, 11, 8, 9, 16, 5, 12, 16];

export function themeFor(world: number, stopIndex: number): Theme {
  const list = THEMES.filter((t) => t.world === world);
  if (!list.length) return THEMES[0];
  return list[(stopIndex - 1) % list.length];
}
