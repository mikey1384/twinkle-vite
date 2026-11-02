// The step-by-step review (Mikey 11-02: "improve ... explanation afterwards -
// like make it more intuitive and animated"). An authored explanation is one
// paragraph; the review shows it one step at a time, and a chained
// calculation inside a step builds up one "= ..." at a time.
//
// Faithful display (math-audit rule): nothing is rewritten. Steps are the
// authored sentences in order, and joining a calculation's pieces gives back
// the authored expression exactly. twinkle-api helpers/arena/tutoring.ts
// splits the same way (same test vectors), so "step 2" means the same step
// to the member and to Zero/Ciel.

export const MAX_EXPLANATION_STEPS = 8;

const MATH = /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

// Sentence ends outside math: ". " "다. " "? " "! " or a line break. A
// decimal (1.2) or a period inside math or parentheses never splits.
export function explanationSteps(text: string, max = MAX_EXPLANATION_STEPS): string[] {
  const value = String(text ?? '').trim();
  if (!value) return [];
  const sentences: string[] = [];
  let current = '';
  let depth = 0;
  const parts = value.split(MATH).filter(Boolean);
  parts.forEach((part, index) => {
    const last = index === parts.length - 1;
    if (/^\\[[(]/.test(part) && /\\[\])]$/.test(part)) {
      current += part;
      return;
    }
    for (let i = 0; i < part.length; i++) {
      const ch = part[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === '\n') {
        if (current.trim()) sentences.push(current.trim());
        current = '';
        depth = 0;
        continue;
      }
      current += ch;
      const next = part[i + 1];
      // a sentence ends at its mark (or a closing ".)") before a space, or
      // at the very end
      const ends = /[.!?。]/.test(ch) || (ch === ')' && /[.!?。]\)$/.test(current));
      if (depth === 0 && ends && (next === undefined ? last : /\s/.test(next))) {
        sentences.push(current.trim());
        current = '';
      }
    }
  });
  if (current.trim()) sentences.push(current.trim());
  return groupSteps(sentences.filter(Boolean), max);
}

// More sentences than steps: neighbours share a step, in order.
function groupSteps(sentences: string[], max: number) {
  if (sentences.length <= max) return sentences;
  const out: string[] = [];
  const size = sentences.length / max;
  for (let i = 0; i < max; i++) {
    out.push(sentences.slice(Math.round(i * size), Math.round((i + 1) * size)).join(' '));
  }
  return out.filter(Boolean);
}

// A calculation's pieces at its top-level "=" signs: "a=b=c" -> ["a", "=b",
// "=c"]. Braces, \left...\right and \text{} keep their "=" inside. One piece
// when there is nothing to build up.
export function equationPieces(tex: string): string[] {
  // an aligned block's "&=" rows stay one piece
  if (/\\begin\{/.test(tex)) return [tex];
  const pieces: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < tex.length; i++) {
    const ch = tex[i];
    if (ch === '\\') {
      const word = /^\\[a-zA-Z]+/.exec(tex.slice(i))?.[0] || '';
      if (word === '\\left') depth++;
      else if (word === '\\right') depth = Math.max(0, depth - 1);
      i += Math.max(word.length, 2) - 1;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    else if (ch === '=' && depth === 0 && i > start && tex.slice(start, i).trim()) {
      pieces.push(tex.slice(start, i));
      start = i;
    }
  }
  pieces.push(tex.slice(start));
  return pieces.filter((piece) => piece.length > 0);
}

// A step's text as plain text and math parts, for the build-up.
export function stepParts(step: string): { math: boolean; display: boolean; tex: string; text: string }[] {
  return String(step || '')
    .split(MATH)
    .filter((part) => part !== '')
    .map((part) => {
      const display = part.startsWith('\\[') && part.endsWith('\\]');
      const inline = part.startsWith('\\(') && part.endsWith('\\)');
      return display || inline
        ? { math: true, display, tex: part.slice(2, -2), text: part }
        : { math: false, display: false, tex: '', text: part };
    });
}
