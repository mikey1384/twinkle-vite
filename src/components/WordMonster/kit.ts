// Word Monster parts kit (original pixel art, 2026-11-22).
// Everything is pixel-grid DATA on one fixed 64x64 grid. Nothing here is an image file.
//
// Two kinds of part:
//  - Blob   : a left/right symmetric mass (heads, bodies) written as half-widths per row.
//             Row value n means the row spans 2n pixels centred on the sprite's middle line.
//             [n, g] also leaves a 2g-pixel notch open in the middle (the apple head's cleft).
//  - Sprite : a small hand-drawn grid of letters with one anchor pixel (ax, ay) that is placed
//             on an attachment point the generator computes from the blobs.
//
// Letters in sprite rows (indexed colours, see PALETTE_SLOTS):
//   .  empty
//   p  primary   s  secondary   a  accent   g  gold     -> auto-shaded (light top-left, dark bottom-right)
//   P  primary shade   S  secondary shade   A  accent shade   G  gold shade
//   k  outline   w  eye white   e  pupil   m  mouth inside   t  tongue   T  tooth   h  shine   j  gem   b  blush

export const SIZE = 64; // canvas is SIZE x SIZE
export const CX = 32; // middle line sits between pixel 31 and 32
export const GROUND = 58; // feet stand on row 57

export type BlobRow = number | [number, number];
export interface Blob {
  name: string;
  rows: BlobRow[];
  /** head only: row where the eye box starts */
  faceY?: number;
  /** head only: how far from the middle the horns / ears / antennae sit */
  topDx?: number;
}
export interface Sprite {
  name: string;
  rows: string[];
  ax: number;
  ay: number;
}

// ---------------------------------------------------------------------------------------------
// Palette slots. A palette is 24 colours; index 0 is transparent.
// ---------------------------------------------------------------------------------------------
export const PALETTE_SLOTS = [
  'clear', // 0
  'outline', // 1
  'primaryShade', 'primary', 'primaryLight', // 2 3 4
  'secondaryShade', 'secondary', 'secondaryLight', // 5 6 7
  'accentShade', 'accent', 'accentLight', // 8 9 10
  'eyeWhite', 'pupil', 'mouth', 'tongue', 'tooth', // 11..15
  'aura', 'auraLight', // 16 17
  'goldShade', 'gold', 'goldLight', // 18 19 20
  'shine', 'gem', 'blush' // 21 22 23
] as const;

export interface PaletteDef {
  name: string;
  letters: string; // the letters that wear it (see RULES.md, colour chart)
  primary: [string, string, string]; // shade, base, light
  secondary: [string, string, string];
  accent: [string, string, string];
  outline: string;
  aura: [string, string];
}

// 13 hand-picked palettes. Each vowel (and Y) owns one; the consonants take turns through the
// other seven in alphabet order: b c d f g h j | k l m n p q r | s t v w x z.
export const PALETTES: PaletteDef[] = [
  { name: 'Ember', letters: 'a', primary: ['#a82f3c', '#e04e3c', '#f98a5c'], secondary: ['#d9a25c', '#f9d88e', '#fff1c6'], accent: ['#3f3a5e', '#655d8c', '#9a94bd'], outline: '#3b1524', aura: ['#ff9d3d', '#ffe27a'] },
  { name: 'Tangerine', letters: 'o', primary: ['#bb5a1c', '#f28c28', '#ffbc5e'], secondary: ['#cdb98c', '#f7edcb', '#fffbe9'], accent: ['#256b63', '#35a08e', '#7dd6bd'], outline: '#432210', aura: ['#ff7a45', '#ffd58a'] },
  { name: 'Sunny', letters: 'bks', primary: ['#bd8c12', '#f4c62e', '#ffe872'], secondary: ['#cc7e3c', '#f4a85c', '#ffd29c'], accent: ['#74388c', '#a45cc4', '#cf98e6'], outline: '#47320a', aura: ['#fff27a', '#fffde0'] },
  { name: 'Sprout', letters: 'dmv', primary: ['#4f8c28', '#82c63f', '#b9ea6d'], secondary: ['#c4c97a', '#f0f2b2', '#fcfde2'], accent: ['#b3442e', '#e56c4a', '#fa9f80'], outline: '#1f3b16', aura: ['#b8ff6a', '#ecffc4'] },
  { name: 'Jade', letters: 'e', primary: ['#187a60', '#27b08a', '#6fdcb6'], secondary: ['#a3d5c2', '#d8f6e8', '#f3fffb'], accent: ['#b4742a', '#ecaa3e', '#ffd67c'], outline: '#0d362e', aura: ['#5effd0', '#d2fff3'] },
  { name: 'Lagoon', letters: 'clt', primary: ['#177a96', '#25b0cc', '#74dcec'], secondary: ['#e0c48a', '#fbe9bc', '#fff8e2'], accent: ['#b83a5e', '#ea5c84', '#ff9ab6'], outline: '#0c3442', aura: ['#6aeaff', '#d8faff'] },
  { name: 'Sky', letters: 'i', primary: ['#2a60b4', '#4a8fe4', '#8cc2f8'], secondary: ['#abc8ea', '#deecfc', '#f6fbff'], accent: ['#c0442e', '#f26a3c', '#ff9e72'], outline: '#142954', aura: ['#7acfff', '#d8f2ff'] },
  { name: 'Midnight', letters: 'fnw', primary: ['#383a8c', '#585cd0', '#9094f2'], secondary: ['#a7a2dc', '#d8d4f6', '#f1efff'], accent: ['#c59a1c', '#f6d03c', '#ffec8c'], outline: '#191846', aura: ['#9c8eff', '#ded8ff'] },
  { name: 'Grape', letters: 'u', primary: ['#6c2e90', '#9c4ec8', '#c88eec'], secondary: ['#d2a4da', '#f1d4f6', '#fdf1ff'], accent: ['#288e6a', '#3ec894', '#8cf2c6'], outline: '#2f1144', aura: ['#e27cff', '#f8d8ff'] },
  { name: 'Bubblegum', letters: 'hqz', primary: ['#ba3a74', '#f06ca4', '#ffa8ca'], secondary: ['#eabaca', '#ffe4ed', '#fff6f9'], accent: ['#3a6eb8', '#5c9cf0', '#9ec8ff'], outline: '#4b1530', aura: ['#ff8cd2', '#ffdaf1'] },
  { name: 'Cocoa', letters: 'gpx', primary: ['#6e4426', '#a06a3c', '#cc9a66'], secondary: ['#d8b88a', '#f4e0b8', '#fff4dc'], accent: ['#2c7a8c', '#3eaec4', '#86dcec'], outline: '#2e1a0e', aura: ['#ffb86a', '#ffe6c0'] },
  { name: 'Slate', letters: 'y', primary: ['#565c6c', '#868ea2', '#b9c0d0'], secondary: ['#b5a790', '#e4d8c3', '#f8f1e4'], accent: ['#b83e2e', '#ea643e', '#ff9870'], outline: '#22252e', aura: ['#c6e4ff', '#f0f8ff'] },
  { name: 'Frost', letters: 'jr', primary: ['#6e9cc4', '#a8d0ec', '#dff2ff'], secondary: ['#d6c8ee', '#efe6ff', '#fbf8ff'], accent: ['#3a4a9c', '#5a70d8', '#98a8f4'], outline: '#1e2c4c', aura: ['#aef0ff', '#f0fdff'] }
];

export const SHARED_COLOURS = {
  eyeWhite: '#fffdf6',
  pupil: '#1b1826',
  mouth: '#5c1a30',
  tongue: '#f2647c',
  tooth: '#fffdf2',
  gold: ['#b8791c', '#f2c230', '#fff0a0'] as [string, string, string],
  shine: '#ffffff',
  gem: '#e8455e'
};

// ---------------------------------------------------------------------------------------------
// Heads (8). Picked by the phone-keypad key of the FIRST letter.
// Every head keeps at least 24 px of width across the eye rows and 20 px across the mouth rows,
// so all eye layouts and mouths fit on all heads.
// ---------------------------------------------------------------------------------------------
export const HEADS: Blob[] = [
  { name: 'Round', rows: [6, 9, 11, 12, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 12, 11, 9, 6] },
  { name: 'Block', rows: [11, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 11] },
  { name: 'Drop', rows: [1, 1, 2, 3, 5, 7, 10, 12, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 12, 11, 10, 8, 5], faceY: 8, topDx: 8 },
  { name: 'Bean', rows: [7, 10, 12, 14, 15, 15, 16, 16, 16, 16, 16, 16, 16, 16, 15, 15, 14, 13, 12, 10, 7], faceY: 3, topDx: 9 },
  { name: 'Bell', rows: [8, 10, 11, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 14, 15, 15, 15, 15, 15, 15, 14, 12], topDx: 6 },
  { name: 'Apple', rows: [[8, 3], [11, 2], [13, 1], 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 12, 11, 10, 8, 6], topDx: 9 },
  { name: 'Gem', rows: [8, 9, 10, 11, 12, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 12, 11, 10, 9, 8, 7], faceY: 5 },
  { name: 'Woolly', rows: [6, 9, 12, 14, 15, 15, 13, 13, 15, 16, 15, 13, 13, 15, 16, 15, 13, 13, 12, 11, 9, 6] }
];

// ---------------------------------------------------------------------------------------------
// Bodies (8). Picked by word length: longer words get bigger bodies.
// ---------------------------------------------------------------------------------------------
export const BODIES: Blob[] = [
  { name: 'Mite', rows: [5, 6, 7, 7, 7, 7, 6, 5] },
  { name: 'Bud', rows: [6, 7, 8, 9, 9, 9, 9, 9, 9, 8, 7] },
  { name: 'Pear', rows: [7, 8, 9, 10, 10, 11, 11, 11, 11, 11, 11, 10, 8] },
  { name: 'Tub', rows: [8, 9, 10, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 11, 9] },
  { name: 'Barrel', rows: [9, 11, 12, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 12, 10] },
  { name: 'Gourd', rows: [9, 10, 11, 12, 12, 13, 13, 14, 14, 14, 15, 15, 15, 15, 15, 15, 15, 15, 14, 13, 11] },
  { name: 'Brute', rows: [12, 14, 15, 16, 17, 17, 17, 17, 17, 17, 17, 17, 16, 16, 16, 16, 15, 15, 15, 14, 14, 13, 11] },
  { name: 'Titan', rows: [13, 15, 17, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 18, 18, 18, 18, 17, 17, 17, 16, 15, 13] }
];
/** how many rows of the body the head covers, per body */
export const HEAD_OVERLAP = [4, 5, 6, 7, 8, 8, 8, 8];

// ---------------------------------------------------------------------------------------------
// Toppers (4). Picked by the first letter's PLACE on its keypad key. Drawn as the LEFT one;
// the generator mirrors it for the right. Anchor = root pixel, sunk 2 px into the head.
// ---------------------------------------------------------------------------------------------
export const TOPPERS: Sprite[] = [
  { name: 'Horns', ax: 4, ay: 8, rows: [
    '.a....',
    'aa....',
    'aa....',
    'aaa...',
    '.aaa..',
    '.aaaa.',
    '..aaaa',
    '..aaaa',
    '..aaaa'] },
  { name: 'Antennae', ax: 3, ay: 9, rows: [
    '.aaa.',
    'aaaaa',
    'aaaaa',
    '.aaa.',
    '..P..',
    '..P..',
    '..PP.',
    '...P.',
    '...P.',
    '...P.'] },
  { name: 'Ears', ax: 4, ay: 8, rows: [
    'p.......',
    'pp......',
    'psp.....',
    'pssp....',
    'psssp...',
    'pssssp..',
    'ppssssp.',
    '.ppssspp',
    '..pppppp'] },
  // Crest is centred (12 wide), not mirrored.
  { name: 'Crest', ax: 6, ay: 8, rows: [
    '.....aa.....',
    '.....aa.....',
    '.a..aaaa..a.',
    '.aa.aaaa.aa.',
    '.aa.aaaa.aa.',
    'aaaaaaaaaaaa',
    'aaaaaaaaaaaa',
    'aaaaaaaaaaaa',
    'aaaaaaaaaaaa'] }
];

// ---------------------------------------------------------------------------------------------
// Mouths (6). Picked by the FIRST vowel: the mouth makes that vowel's shape. Even widths, centred.
// ---------------------------------------------------------------------------------------------
export const MOUTHS: Sprite[] = [
  { name: 'A: wide open', ax: 5, ay: 0, rows: [
    'kkkkkkkkkk',
    'kTTmmmmTTk',
    'kmmmmmmmmk',
    '.kmmttmmk.',
    '..kkkkkk..'] },
  { name: 'E: toothy grin', ax: 5, ay: 0, rows: [
    'k........k',
    'kkkkkkkkkk',
    '.kTkTTkTk.',
    '..kkkkkk..'] },
  { name: 'I: little smile', ax: 4, ay: 0, rows: [
    '........',
    'k......k',
    '.kkkkkk.',
    '..T.....'] },
  { name: 'O: round', ax: 3, ay: 0, rows: [
    '.kkkk.',
    'kmmmmk',
    'kmmmmk',
    'kmttmk',
    '.kkkk.'] },
  { name: 'U: underbite', ax: 4, ay: 0, rows: [
    '........',
    '.T....T.',
    'kkkkkkkk',
    'k......k'] },
  { name: 'No vowel: wavy', ax: 5, ay: 0, rows: [
    '..........',
    '..kk..kk..',
    'kk..kk..kk'] }
];

// ---------------------------------------------------------------------------------------------
// Eyes (6 layouts). The number of vowels IS the number of eyes (0 = asleep, 5 or more = five).
// x is the left edge measured from the middle line, y from the top of the eye box.
// ---------------------------------------------------------------------------------------------
export interface EyeRect { x: number; y: number; w: number; h: number }
export const EYES: { name: string; eyes: EyeRect[] }[] = [
  { name: 'Asleep', eyes: [] },
  { name: 'One big eye', eyes: [{ x: -5, y: 0, w: 10, h: 9 }] },
  { name: 'Two eyes', eyes: [{ x: -8, y: 1, w: 6, h: 7 }, { x: 2, y: 1, w: 6, h: 7 }] },
  { name: 'Three eyes', eyes: [{ x: -10, y: 2, w: 5, h: 6 }, { x: -3, y: 0, w: 6, h: 7 }, { x: 5, y: 2, w: 5, h: 6 }] },
  { name: 'Four eyes', eyes: [{ x: -7, y: 3, w: 5, h: 6 }, { x: 2, y: 3, w: 5, h: 6 }, { x: -11, y: 0, w: 3, h: 3 }, { x: 8, y: 0, w: 3, h: 3 }] },
  { name: 'Five eyes', eyes: [{ x: -3, y: 1, w: 6, h: 7 }, { x: -9, y: 0, w: 3, h: 3 }, { x: 6, y: 0, w: 3, h: 3 }, { x: -9, y: 5, w: 3, h: 3 }, { x: 6, y: 5, w: 3, h: 3 }] }
];
/** closed eyes, used for "Asleep" and for the blink frame */
export const CLOSED_EYES: Sprite = { name: 'Closed', ax: 8, ay: 0, rows: [
  '................',
  '................',
  '................',
  '................',
  'k....k....k....k',
  '.kkkk......kkkk.'] };
export const MOUTH_Y = 11; // mouth top, measured from the top of the eye box

// ---------------------------------------------------------------------------------------------
// Arms (3 kinds x 2 sizes). Picked by the number of TALL letters (b d f h k l t).
// LEFT arm; anchor = top-right pixel, sunk 2 px into the body.
// ---------------------------------------------------------------------------------------------
export const ARMS: { name: string; small: Sprite; large: Sprite }[] = [
  { name: 'Nubs',
    small: { name: 'Nubs (small)', ax: 2, ay: 0, rows: ['.pp', 'ppp', '.pp'] },
    large: { name: 'Nubs', ax: 3, ay: 0, rows: ['.ppp', 'pppp', 'pppp', '.ppp'] } },
  { name: 'Arms',
    small: { name: 'Arms (small)', ax: 3, ay: 0, rows: ['..pp', '.ppp', 'ppp.', 'ppp.', 'ppp.', '.p..'] },
    large: { name: 'Arms', ax: 4, ay: 0, rows: ['..ppp', '.pppp', '.ppp.', 'ppp..', 'ppp..', 'ppp..', 'pppp.', 'pppp.', '.pp..'] } },
  { name: 'Claws',
    small: { name: 'Claws (small)', ax: 4, ay: 0, rows: ['..ppp', '.pppp', 'pppp.', 'pppp.', 'pppp.', 'aaaa.', 'a.a..'] },
    large: { name: 'Claws', ax: 6, ay: 0, rows: ['...pppp', '..ppppp', '.ppppp.', '.pppp..', 'ppppp..', 'ppppp..', 'ppppp..', 'ppppp..', 'ppppp..', 'aaaaa..', 'a.a.a..'] } }
];

// ---------------------------------------------------------------------------------------------
// Legs (3 kinds). Picked by the number of HANGING letters (g j p q y).
// LEFT leg, foot pointing out; anchor = top middle, sunk 2 px into the body.
// ---------------------------------------------------------------------------------------------
export const LEGS: { name: string; visible: number; sprite: Sprite }[] = [
  { name: 'Feet', visible: 3, sprite: { name: 'Feet', ax: 3, ay: 0, rows: ['..ppp.', '..ppp.', '.pppp.', 'pppppp', 'pppppp'] } },
  { name: 'Legs', visible: 5, sprite: { name: 'Legs', ax: 3, ay: 0, rows: ['..ppp.', '..ppp.', '..ppp.', '..ppp.', '.pppp.', 'pppppp', 'pppppp'] } },
  { name: 'Stompers', visible: 7, sprite: { name: 'Stompers', ax: 4, ay: 0, rows: ['..pppp.', '..pppp.', '..pppp.', '..pppp.', '..pppp.', '..pppp.', '.ppppp.', 'ppppppp', 'aapaapp'] } }
];

// ---------------------------------------------------------------------------------------------
// Tails (8). Picked by the keypad key of the LAST letter. Drawn on the monster's right side;
// anchor = root pixel on the left edge, sunk 2 px into the body.
// ---------------------------------------------------------------------------------------------
export const TAILS: Sprite[] = [
  { name: 'Stub', ax: 0, ay: 2, rows: [
    '.......pp.',
    'pppppppppp',
    'pppppppppp',
    'ppppppppp.'] },
  { name: 'Ring', ax: 0, ay: 7, rows: [
    '.........pppp.',
    '........pppppp',
    '........pp..pp',
    '........pp..pp',
    '........pppppp',
    '.......ppppp..',
    '.....pppp.....',
    'pppppppp......',
    'pppppp........'] },
  { name: 'Lizard', ax: 0, ay: 7, rows: [
    '.............p',
    '...........ppp',
    '..........ppp.',
    '.........pppp.',
    '........pppp..',
    '......ppppp...',
    'pppppppppp....',
    'ppppppppp.....',
    '.ppppppp......'] },
  { name: 'Arrow', ax: 0, ay: 8, rows: [
    '..........aa..',
    '.........aaaa.',
    '........aaaaaa',
    '.......aaaaaaa',
    '..........pp..',
    '..........pp..',
    '.........pp...',
    '.......ppp....',
    'pppppppp......',
    'pppppp........'] },
  { name: 'Pom', ax: 0, ay: 7, rows: [
    '.........sss..',
    '........sssss.',
    '.......sssssss',
    '.......sssssss',
    '........sssss.',
    '........psss..',
    '......ppp.....',
    'pppppppp......',
    'pppppp........'] },
  { name: 'Fin', ax: 0, ay: 4, rows: [
    '..........ss.',
    '........ssss.',
    '.......ssss..',
    'ppppppsssss..',
    'pppppppsss...',
    'ppppppsssss..',
    '.......ssss..',
    '........ssss.',
    '..........ss.'] },
  { name: 'Club', ax: 0, ay: 7, rows: [
    '.........a.a..',
    '........aaaaa.',
    '.......aaaaaaa',
    '........aaaaa.',
    '.......aaaaaaa',
    '.......ppaaa..',
    '......pp......',
    'pppppppp......',
    'pppppp........'] },
  { name: 'Bolt', ax: 0, ay: 8, rows: [
    '.........aaa.',
    '........aaa..',
    '.......aaa...',
    '......aaaaaa.',
    '.........aaa.',
    '........aaa..',
    '.......aa....',
    '.....ppp.....',
    'pppppp.......',
    'pppp.........'] }
];

// ---------------------------------------------------------------------------------------------
// Bellies (8). Picked by the keypad key of the letter BEFORE the last. They are patterns on the
// body, not sprites, so they fit every body size; the generator paints them.
// ---------------------------------------------------------------------------------------------
export const BELLIES: { name: string; patch: 'plain' | 'hstripes' | 'vstripes' | 'scales' | 'accent' | 'none' }[] = [
  { name: 'Plain', patch: 'plain' },
  { name: 'Stripes', patch: 'hstripes' },
  { name: 'Spots', patch: 'none' },
  { name: 'Badge', patch: 'plain' },
  { name: 'Pinstripes', patch: 'vstripes' },
  { name: 'Bare', patch: 'none' },
  { name: 'Bright', patch: 'accent' },
  { name: 'Scales', patch: 'scales' }
];

// ---------------------------------------------------------------------------------------------
// Wings (2). A double letter gives wings: double consonant = bat wings, double vowel = feather
// wings. LEFT wing; anchor = root pixel near the bottom right.
// ---------------------------------------------------------------------------------------------
export const WINGS: Sprite[] = [
  { name: 'Bat wings', ax: 10, ay: 10, rows: [
    'p..........',
    'pp.........',
    'psp........',
    'pssp.......',
    'psssp......',
    'pssssp.....',
    'psssssp....',
    'pssssssp...',
    'psssssssp..',
    'pspsspsssp.',
    'pp.pp.psssp',
    'p..p...pppp'] },
  { name: 'Feather wings', ax: 12, ay: 9, rows: [
    '.sss.........',
    'sssss........',
    'ssssss.......',
    'sssssss......',
    'sSssssss.....',
    'sSsssssss....',
    'sSsSssssss...',
    '.sSsSsssssss.',
    '.s.SsSsssssss',
    '...s.Ssssssss',
    '.....s.sssss.'] }
];

// ---------------------------------------------------------------------------------------------
// Level overlays.
// ---------------------------------------------------------------------------------------------
/** cheek spikes, LEFT side; anchor = base pixel sunk 1 px into the head */
export const SPIKES: { small: Sprite; large: Sprite } = {
  small: { name: 'Spike (small)', ax: 4, ay: 1, rows: ['..aaa', 'aaaaa', '..aaa'] },
  large: { name: 'Spike', ax: 4, ay: 2, rows: ['...aa', '.aaaa', 'aaaaa', '.aaaa', '...aa'] }
};
/** boss crown, centred (12 wide); anchor = bottom middle */
export const CROWN: Sprite = { name: 'Crown', ax: 6, ay: 5, rows: [
  'g....gg....g',
  'g....gg....g',
  'gg..gggg..gg',
  'gggggggggggg',
  'gjgggjjgggjg',
  'GGGGGGGGGGGG'] };
/** sidekick: one per extra word in a phrase (at most 2) */
export const SIDEKICK: Sprite = { name: 'Sidekick', ax: 0, ay: 6, rows: [
  '..pppp..',
  '.pppppp.',
  'pppppppp',
  'ppkppkpp',
  'ppkppkpp',
  'pppppppp',
  '.pppppp.'] };

/** flame heights (in px) for the level-5 aura, read left to right and wrapped */
export const FLAME_PATTERN = [0, 1, 2, 4, 2, 1, 0, 2, 3, 1, 0, 1, 3, 5, 3, 1];
/** 4x4 ordered-dither thresholds for the defeat dissolve */
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
