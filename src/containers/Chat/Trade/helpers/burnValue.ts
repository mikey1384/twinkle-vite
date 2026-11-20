import { calculateCardBurnSummary } from '~/helpers/aiCardBurnValue';
import { isUnrevealedTotalMystery } from '~/helpers/aiCardDisplay';
import type { TradeBundle } from '../types';
import { summarizeBundle } from './terms';

export function bundleBurnValueLabel(
  bundle: Pick<TradeBundle, 'cards' | 'cardIds' | 'burnSummary'>
) {
  if (!bundle.cardIds.length) return '';
  const { xp, unknownCount } =
    bundle.burnSummary ??
    calculateCardBurnSummary(
      bundle.cardIds.map((id) => {
        const card = bundle.cards?.find((card) => Number(card?.id) === Number(id));
        if (
          !card ||
          (card.isBurned !== undefined &&
            (card.isBurned === null || Number(card.isBurned) !== 0)) ||
          (card.isLive !== undefined && Number(card.isLive) !== 1) ||
          isUnrevealedTotalMystery(card)
        ) {
          return undefined;
        }
        return card;
      }),
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
  const original = bundle.cardIds.map(Number).sort((a, b) => a - b);
  const selected = ids.map(Number).sort((a, b) => a - b);
  if (original.every((id, index) => id === selected[index])) {
    return bundle.burnSummary;
  }
}
