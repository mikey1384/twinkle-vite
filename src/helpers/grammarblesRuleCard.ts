// Labels often quote the choice already ("\"whom\" for a thing"); then the
// choice is not repeated. Only a quoted match counts: a bare substring would
// let "a" match "Uses a plural verb" and drop the choice's name.
const QUOTES: [string, string][] = [
  ['"', '"'],
  ['“', '”'],
  ["'", "'"],
  ['‘', '’']
];

export function mistakeText(w: { choice: string; error: string }) {
  const choice = w.choice.trim().toLowerCase();
  const error = w.error.toLowerCase();
  const quoted = QUOTES.some(([open, close]) =>
    error.includes(`${open}${choice}${close}`)
  );
  return quoted ? w.error : `“${w.choice}”: ${w.error}`;
}

const KO_PREF_KEY = 'grammarblesRuleCardKorean';

// Korean notes on rule cards are on by default for Korean-language browsers
// (rec 8; Mikey 10-06: learning aids may show Korean). Anyone can switch them
// on or off, and the choice is remembered.
export function initialKoreanShown() {
  try {
    const saved = localStorage.getItem(KO_PREF_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch {
    // storage can be blocked; fall back to the browser language
  }
  if (typeof navigator === 'undefined') return false;
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return languages.some((lang) => /^ko\b/i.test(String(lang || '')));
}

export function saveKoreanShown(shown: boolean) {
  try {
    localStorage.setItem(KO_PREF_KEY, shown ? '1' : '0');
  } catch {
    // not remembered; the toggle still works for this visit
  }
}
