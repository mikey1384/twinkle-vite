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
