// The battle's loot window (LootWindow.tsx): what a battle paid, WoW-style
// (Mikey 11-23: "you shouldnt just be limited to one loot"). Every win pays
// XP and Coins; every battle played to the end pays base Word Master points,
// won or lost; and a win can drop several items, each rolled on its own.

export type PointsTier = 'tiny' | 'small' | 'big' | 'massive';
export type LootDrop =
  | { kind: 'points'; tier: PointsTier; points: number }
  | { kind: 'black_ai_card'; quality: string }
  | { kind: 'energy_recharge' };

// The server's loot for a finished battle (helpers/wordBattle/play.ts
// publicLoot). kind is the single landing older clients used; drops and
// reward.basePoints come from the multi-drop API. An API from before it sends
// reward.points (the guaranteed points) and no drops.
export interface ServerLoot {
  kind: 'none' | 'xp' | 'energy_recharge' | 'black_ai_card';
  amount?: number;
  quality?: string;
  reward?: { xp: number; coins: number; basePoints?: number; points?: number };
  drops?: Array<{ kind: string; tier?: string; points?: number; quality?: string }>;
  xp?: number;
  coins?: number;
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export function rarityOf(drop: LootDrop): Rarity {
  if (drop.kind === 'points') {
    if (drop.tier === 'massive') return 'legendary';
    if (drop.tier === 'big') return 'epic';
    return 'common';
  }
  if (drop.kind === 'black_ai_card') return 'legendary';
  return 'epic';
}

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const TIERS: PointsTier[] = ['tiny', 'small', 'big', 'massive'];

export interface LootSummary {
  xp: number;
  coins: number;
  basePoints: number;
  // Revealed in this order: commonest first, the best last.
  drops: LootDrop[];
}

export function summarizeLoot(loot: ServerLoot | null | undefined): LootSummary {
  const reward = loot?.reward;
  const drops: LootDrop[] = [];
  if (Array.isArray(loot?.drops)) {
    for (const drop of loot!.drops!) {
      if (drop.kind === 'points' && Number(drop.points) > 0) {
        const tier = TIERS.includes(drop.tier as PointsTier) ? (drop.tier as PointsTier) : 'tiny';
        drops.push({ kind: 'points', tier, points: Number(drop.points) });
      } else if (drop.kind === 'black_ai_card') {
        drops.push({ kind: 'black_ai_card', quality: String(drop.quality || 'common') });
      } else if (drop.kind === 'energy_recharge') {
        drops.push({ kind: 'energy_recharge' });
      }
    }
  } else if (loot?.kind === 'black_ai_card') {
    drops.push({ kind: 'black_ai_card', quality: String(loot.quality || 'common') });
  } else if (loot?.kind === 'energy_recharge') {
    drops.push({ kind: 'energy_recharge' });
  }
  drops.sort((a, b) => RARITY_ORDER.indexOf(rarityOf(a)) - RARITY_ORDER.indexOf(rarityOf(b)));
  return {
    xp: Number(reward?.xp || 0),
    coins: Number(reward?.coins || 0),
    basePoints: Number(reward?.basePoints ?? reward?.points ?? 0),
    drops
  };
}

const n = (value: number) => Number(value || 0).toLocaleString('en-US');

export function pointsLabel(points: number) {
  return `+${n(points)} ${points === 1 ? 'pt' : 'pts'}`;
}

// The slot's title line.
export function dropTitle(drop: LootDrop) {
  if (drop.kind === 'points') {
    if (drop.tier === 'massive') return `💎 MASSIVE! +${n(drop.points)} Word Master pts`;
    if (drop.tier === 'big') return 'BIG DROP! Word Master points';
    return 'Word Master points';
  }
  if (drop.kind === 'black_ai_card') return `Black AI Card (${drop.quality.toUpperCase()})`;
  return 'AI battery recharge: full again!';
}
