// Shared logic for the Explore AI Cards filtered search: which filter fields
// define a search, whether two filter sets describe the same search, and
// whether a search response actually honors the filters that requested it.

const SEARCH_FILTER_FIELDS = [
  'owner',
  'style',
  'quality',
  'color',
  'word',
  'isBuyNow',
  'isMystery',
  'engine',
  'minPrice',
  'maxPrice'
] as const;

// Matches the server's colorKeys mapping in /ai-card/search.
const COLOR_LEVELS: { [key: string]: number } = {
  blue: 1,
  pink: 2,
  orange: 3,
  magenta: 4,
  gold: 5,
  black: 6
};

export function aiCardSearchFiltersDiffer(a: any, b: any) {
  return SEARCH_FILTER_FIELDS.some((field) => a?.[field] !== b?.[field]);
}

export interface AICardFilterMismatch {
  cardId: number;
  reasons: string[];
}

// Validates a filtered-search response against the filters that requested it.
// Only checks facts the client can assert without server context; each check
// is deliberately conservative so a report always means the server returned a
// card that violates the active filters (e.g. a stale or unfiltered response).
export function findAICardFilterMismatches(
  cards: any[],
  filters: any
): AICardFilterMismatch[] {
  if (!Array.isArray(cards) || !cards.length || !filters) return [];
  const mismatches: AICardFilterMismatch[] = [];
  for (const card of cards) {
    if (!card?.id) continue;
    const reasons: string[] = [];
    if (filters.isMystery && card.imagePath) {
      reasons.push('isMystery search returned a card with imagePath');
    }
    if (filters.quality && card.quality !== filters.quality) {
      reasons.push(`quality is "${card.quality}"`);
    }
    if (
      filters.color &&
      COLOR_LEVELS[filters.color] &&
      Number(card.level) !== COLOR_LEVELS[filters.color]
    ) {
      reasons.push(`level is ${card.level}`);
    }
    if (
      filters.word &&
      String(card.word || '').toLowerCase() !==
        String(filters.word).toLowerCase()
    ) {
      reasons.push(`word is "${card.word}"`);
    }
    if (
      filters.owner &&
      card.owner?.username &&
      String(card.owner.username).toLowerCase() !==
        String(filters.owner).toLowerCase()
    ) {
      reasons.push(`owner is "${card.owner.username}"`);
    }
    if (filters.isBuyNow) {
      const askPrice = Number(card.askPrice);
      if (card.askPrice == null) {
        reasons.push('isBuyNow search returned a card with no askPrice');
      } else if (Number.isFinite(askPrice)) {
        const minPrice = parseFloat(filters.minPrice);
        const maxPrice = parseFloat(filters.maxPrice);
        if (Number.isFinite(minPrice) && askPrice < minPrice) {
          reasons.push(`askPrice ${askPrice} is below minPrice`);
        }
        if (Number.isFinite(maxPrice) && askPrice > maxPrice) {
          reasons.push(`askPrice ${askPrice} is above maxPrice`);
        }
      }
    }
    if (
      filters.style &&
      !filters.isMystery &&
      card.style !== filters.style
    ) {
      reasons.push(`style is "${card.style}"`);
    }
    if (
      filters.engine &&
      !filters.isMystery &&
      card.engine !== filters.engine
    ) {
      reasons.push(`engine is "${card.engine}"`);
    }
    if (reasons.length) {
      mismatches.push({ cardId: card.id, reasons });
    }
  }
  return mismatches;
}
