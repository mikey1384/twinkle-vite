import { calculateCardBurnSummary } from '~/helpers/aiCardBurnValue';
import type { TradeBundle } from '../types';
import { summarizeBundle } from './terms';

export function bundleBurnValueLabel(
  bundle: Pick<TradeBundle, 'cards' | 'cardIds' | 'burnSummary'>
) {
  if (!bundle.cardIds.length) return '';
  const { xp, unknownCount } =
    bundle.burnSummary ??
    calculateCardBurnSummary(
      bundle.cardIds.map((id) => bundle.cards?.find((card) => card?.id === id)),
      { includeIncomplete: true }
    );
  return `${xp.toLocaleString('en-US')} XP${unknownCount > 0 ? ' + ???' : ''}`;
}

export function summarizeBundleWithBurnValue(bundle: TradeBundle) {
  const summary = summarizeBundle(bundle);
  const burnValue = bundleBurnValueLabel(bundle);
  return burnValue ? `${summary} (burn value ${burnValue})` : summary;
}

// A counteroffer can reuse the loaded total while its selected cards still match.
export function matchingBurnSummary(
  bundle: TradeBundle | undefined,
  ids: number[]
) {
  if (!bundle?.burnSummary || bundle.cardIds.length !== ids.length) return;
  const selected = new Set(ids);
  if (bundle.cardIds.every((id) => selected.has(id))) return bundle.burnSummary;
}
