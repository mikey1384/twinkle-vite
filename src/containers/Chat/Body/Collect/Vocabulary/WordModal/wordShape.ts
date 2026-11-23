// The word modal's view of a word object, built defensively. On 11-23 (website
// 2.6.29) a battle finished from the Monster Den opened this modal on its
// first render before the unlocked definitions reached wordsObj, so the order
// it kept had no definitionOrder at all; the next render had definitions and
// crashed the modal at `definitionOrder[pos]`. A missing or malformed part of
// speech, order or definition list is skipped here, never read through.
export const WORD_MODAL_POS_KEYS = [
  'noun',
  'verb',
  'adjective',
  'preposition',
  'adverb',
  'pronoun',
  'conjunction',
  'interjection',
  'determiner',
  'phrase',
  'other'
] as const;

export type DefinitionOrder = Record<string, number[]>;

interface Definition {
  id: number;
  definition: string;
}

// {pos: [{id, definition}]} for every part of speech, each an array (entries
// without an id dropped).
export function definitionsByPos(wordObj: Record<string, any> | null | undefined) {
  const result: Record<string, Definition[]> = {};
  for (const key of WORD_MODAL_POS_KEYS) {
    const value = wordObj?.[key];
    result[key] = Array.isArray(value)
      ? value.filter((def: any) => def && typeof def === 'object' && def.id != null)
      : [];
  }
  return result;
}

// {pos: {id: {id, title}}}: every key present, so `posObj[pos]` is an object.
export function buildPosObj(partOfSpeeches: Record<string, Definition[]>) {
  const result: Record<string, Record<number, { id: number; title: string }>> = {};
  for (const key of WORD_MODAL_POS_KEYS) {
    result[key] = {};
    for (const { id, definition } of partOfSpeeches[key] || []) {
      result[key][id] = { id, title: definition };
    }
  }
  return result;
}

// The word's definitionOrder, one id array per part of speech that has
// definitions. A part of speech the order is missing (or the whole order:
// undefined, null, a string) falls back to its definitions' own order.
export function normalizeDefinitionOrder(
  definitionOrder: unknown,
  partOfSpeeches: Record<string, Definition[]>
): DefinitionOrder {
  const source =
    definitionOrder && typeof definitionOrder === 'object' && !Array.isArray(definitionOrder)
      ? (definitionOrder as Record<string, unknown>)
      : {};
  const result: DefinitionOrder = {};
  for (const key of WORD_MODAL_POS_KEYS) {
    const ids = source[key];
    if (Array.isArray(ids)) {
      result[key] = ids.filter((id) => id != null).map(Number);
    } else if (partOfSpeeches[key]?.length) {
      result[key] = partOfSpeeches[key].map((def) => Number(def.id));
    }
  }
  return result;
}

// The word's partOfSpeechOrder when it is a list of names, else the default.
export function normalizePosOrder(partOfSpeechOrder: unknown): string[] {
  if (Array.isArray(partOfSpeechOrder)) {
    return partOfSpeechOrder.filter((pos): pos is string => typeof pos === 'string');
  }
  return [...WORD_MODAL_POS_KEYS];
}
