import type { EarnHubRule } from './useEarnHub';

// A long reward list reads as a few sections with one row per series
// (vigil-friend-1/2/3 → one "up to 3 a day" row). The app names sections and
// series in rewards.json (`category`, `series`). An app that names no series
// still gets its obvious repeats collapsed: ids x-1/x-2/x-3 or x/x-2/x-3
// paying the same amounts. Pure, so the dialog and the card lines agree.

export interface RewardRow {
  key: string;
  // One rule, or every rule of a series in declared order.
  rules: EarnHubRule[];
}
export interface RewardSection {
  // null: the app names no categories, so the list has no headers.
  title: string | null;
  rows: RewardRow[];
}

// Rules an app leaves out of its named categories.
export const OTHER_REWARDS_TITLE = 'More rewards';

export function groupRewardRules(rules: EarnHubRule[]): RewardSection[] {
  const hasCategories = rules.some((rule) => rule.category);
  const hasSeries = rules.some((rule) => rule.series);
  const seriesKeyOf = hasSeries
    ? (rule: EarnHubRule) => (rule.series ? `series:${rule.series}` : null)
    : inferSeriesKeys(rules);
  const sections: RewardSection[] = [];
  const sectionByTitle = new Map<string, RewardSection>();
  const rowBySeries = new Map<string, RewardRow>();
  for (const rule of rules) {
    const title = hasCategories ? rule.category || OTHER_REWARDS_TITLE : '';
    let section = sectionByTitle.get(title);
    if (!section) {
      section = { title: hasCategories ? title : null, rows: [] };
      sectionByTitle.set(title, section);
      sections.push(section);
    }
    const seriesKey = seriesKeyOf(rule);
    // The server keeps a series in one category; the section is part of the
    // key anyway so a stale payload can never pull a row across headers.
    const rowKey = seriesKey ? `${title}\n${seriesKey}` : null;
    const existing = rowKey ? rowBySeries.get(rowKey) : undefined;
    if (existing) {
      existing.rules.push(rule);
      continue;
    }
    const row = { key: rule.id, rules: [rule] };
    if (rowKey) rowBySeries.set(rowKey, row);
    section.rows.push(row);
  }
  return sections;
}

// How many rows the dialog shows: what the cards call "N rewards".
export function countRewardRows(rules: EarnHubRule[]) {
  return groupRewardRules(rules).reduce(
    (sum, section) => sum + section.rows.length,
    0
  );
}

// Obvious repeats in an app that names no series: a base id and its
// numbered siblings (x-1, x-2, x-3 or x, x-2, x-3): at least two, numbered
// 1..n with no gaps (a bare x is 1), all paying the same amounts the same way.
function inferSeriesKeys(rules: EarnHubRule[]) {
  const candidates = new Map<string, Array<{ rule: EarnHubRule; n: number }>>();
  for (const rule of rules) {
    const match = /^(.+)-(\d{1,2})$/.exec(rule.id);
    const base = match ? match[1] : rule.id;
    const n = match ? Number(match[2]) : 1;
    // A bare id only starts a series when numbered siblings follow it.
    if (!match && !rules.some((other) => other.id.startsWith(`${base}-`)))
      continue;
    if (!candidates.has(base)) candidates.set(base, []);
    candidates.get(base)!.push({ rule, n });
  }
  const keyById = new Map<string, string>();
  for (const [base, members] of candidates) {
    if (members.length < 2) continue;
    const numbers = members.map((member) => member.n).sort((a, b) => a - b);
    // Gaps, or a bare x beside x-1 (two firsts): not an obvious series.
    if (numbers.some((value, index) => value !== index + 1)) continue;
    const [first] = members;
    const same = members.every(
      ({ rule }) =>
        rule.xp === first.rule.xp &&
        rule.coins === first.rule.coins &&
        rule.verifier === first.rule.verifier &&
        (rule.category || '') === (first.rule.category || '')
    );
    if (!same) continue;
    for (const { rule } of members) keyById.set(rule.id, `auto:${base}`);
  }
  return (rule: EarnHubRule) => keyById.get(rule.id) || null;
}
