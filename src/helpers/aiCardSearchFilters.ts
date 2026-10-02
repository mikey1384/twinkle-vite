// Complete mystery is the subset whose artwork, word, and quality are hidden.
// Hidden facets cannot narrow that search, including when opening a shared URL.
export function normalizeAICardMysteryFilters(filters: Record<string, any>) {
  const result = { ...filters };
  const isTotalMystery =
    result.isTotalMystery === true || result.isTotalMystery === 'true';
  const isMystery =
    isTotalMystery || result.isMystery === true || result.isMystery === 'true';

  if (isTotalMystery) {
    result.isTotalMystery = true;
    delete result.quality;
    delete result.word;
  } else {
    delete result.isTotalMystery;
  }
  if (isMystery) {
    result.isMystery = true;
    delete result.style;
    delete result.engine;
  } else {
    delete result.isMystery;
  }
  return result;
}
