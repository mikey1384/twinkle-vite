// The Bonus Chance roulette's definitions merged into a word: only
// {pos: [definitions]} is applied. Anything else in the response (a locked
// word's `battle`, null, an object) is skipped; on 11-22 one such field
// crashed the whole app in the reducer (`partOfSpeeches[key].map`).
export function applyAIGeneratedDefinitions({
  wordObj,
  partOfSpeeches,
  partOfSpeechOrder
}: {
  wordObj: Record<string, any> | undefined;
  partOfSpeeches: unknown;
  partOfSpeechOrder: unknown;
}) {
  const definitionOrder: Record<string, number[]> = {};
  const definitionsByPos: Record<string, any[]> = {};
  const source =
    partOfSpeeches && typeof partOfSpeeches === 'object'
      ? (partOfSpeeches as Record<string, unknown>)
      : {};
  for (const key of Object.keys(source)) {
    const definitions = source[key];
    if (!Array.isArray(definitions)) continue;
    const kept = definitions.filter(
      (def: { id?: number } | null) => def && typeof def === 'object' && def.id != null
    );
    definitionsByPos[key] = kept;
    definitionOrder[key] = kept.map((def: { id: number }) => def.id);
  }
  return {
    ...(wordObj || {}),
    ...definitionsByPos,
    definitionOrder,
    partOfSpeechOrder: Array.isArray(partOfSpeechOrder)
      ? partOfSpeechOrder
      : Object.keys(definitionsByPos)
  };
}
