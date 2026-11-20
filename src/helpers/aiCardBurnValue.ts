import type { Card } from '~/types';
import { isTotalMysteryQuality } from '~/components/AICard/totalMysteryGlow';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { returnCardBurnXP } from '~/constants/defaultValues';

// Unrevealed total mystery cards keep their quality hidden from everyone,
// including their owner, so their burn value is genuinely unknown. They are
// left out of the sum and represented by a trailing "???" term: counting them
// at a floored quality would misreport the total, and counting them at their
// real quality would leak the secret the card exists to keep.
export function returnBurnValueLabel({
  totalBv,
  numHiddenCards
}: {
  totalBv: number;
  numHiddenCards: number;
}) {
  if (!totalBv && !numHiddenCards) return '';
  if (!totalBv) return '???';
  return numHiddenCards
    ? `${addCommasToNumber(totalBv)} + ???`
    : addCommasToNumber(totalBv);
}

export function returnTotalBurnValueLabel(
  cards: (Partial<Pick<Card, 'level' | 'quality'>> | undefined)[],
  { includeIncomplete = false } = {}
) {
  let totalBv = 0;
  let numUnknownCards = 0;
  for (const card of cards) {
    if (isTotalMysteryQuality(card?.quality)) {
      numUnknownCards++;
      continue;
    }
    if (!card?.level || !card.quality) {
      if (includeIncomplete) numUnknownCards++;
      continue;
    }
    totalBv += returnCardBurnXP({
      cardLevel: card.level,
      cardQuality: card.quality
    });
  }
  return returnBurnValueLabel({ totalBv, numHiddenCards: numUnknownCards });
}
