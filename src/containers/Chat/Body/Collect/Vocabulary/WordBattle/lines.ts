// Battle text: short, punchy, a little witty; written for every age (Mikey
// 11-22: "not just kids... teens and adults should too, just like pokemons").
// The pick is steady per word so a replayed screenshot reads the same.

export type QuestionType =
  | 'meaning'
  | 'gap'
  | 'use'
  | 'truefalse'
  | 'bee'
  | 'mirror';

export const COMMAND_NAMES: Record<QuestionType, string> = {
  meaning: 'FIGHT',
  gap: 'SPELL SLOT',
  use: 'CHARM',
  truefalse: 'COMBO',
  bee: 'INCANTATION',
  mirror: 'MIRROR'
};

function pick<T>(list: T[], seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

export function encounterLines(word: string, level: number) {
  const W = word.toUpperCase();
  const lines = [`A wild ${W} appears!`];
  if (level >= 5) {
    lines.push(pick(['It wears a crown. That is never a good sign.', 'A boss. Of course it is a boss.', 'The ground shakes. Rude.'], word));
  } else if (level === 4) {
    lines.push(pick(['It looks like it reads the dictionary for fun.', 'It sizes you up. Confidently.'], word));
  } else if (level <= 2) {
    lines.push(pick(['It seems friendly. Mostly.', 'It wiggles at you.', 'It is small, but it believes in itself.'], word));
  }
  return lines;
}

// A Monster Den rematch: practice only, so the lines say so up front.
export function rematchLines(word: string) {
  const W = word.toUpperCase();
  return [`${W} is back for a rematch!`, 'Practice round: no loot, just glory.'];
}

export function practiceWinLine(word: string) {
  return pick(
    ['Still got it. Practice complete!', 'Beaten again. It remembers you now.', 'Twice beaten. Legend.'],
    word
  );
}

// When today's battles come back, in the member's own clock ("9:00 AM").
export function resetTimeLabel(resetAt?: number) {
  if (!resetAt) return 'tomorrow';
  return new Date(resetAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function commandLine(type: QuestionType, word: string) {
  const W = word.toUpperCase();
  switch (type) {
    case 'meaning':
      return `Command: FIGHT! Show ${W} you know what it means.`;
    case 'gap':
      return 'Command: SPELL SLOT! Power the spell.';
    case 'use':
      return `Command: CHARM! Use ${W} the right way.`;
    case 'truefalse':
      return 'Command: COMBO! Three strikes, all must land.';
    case 'bee':
      return `Command: INCANTATION! ${W} chants a word of its kin. Listen closely...`;
    case 'mirror':
      return 'Command: MIRROR! Find its reflection.';
  }
}

export function hitLine(type: QuestionType, word: string, final: boolean) {
  const W = word.toUpperCase();
  const base: Record<QuestionType, string[]> = {
    meaning: ['A clean hit! You clearly know your stuff.', 'Direct hit! Meaning: understood.'],
    gap: ['The spell ignites! Perfect fit.', 'Click. The spell slot locks in.'],
    use: [`${W} is charmed by your fine usage.`, 'Smooth. It did not see that coming.'],
    truefalse: ['Three for three. COMBO!', 'Hit, hit, hit! Combo lands!'],
    bee: ['The incantation lands, letter-perfect!', 'Every letter in place. Spell cast!'],
    mirror: ['The mirror flashes. Gotcha!', 'Reflection found. It is dazzled!']
  };
  const line = pick(base[type], word + type);
  return final ? `${line} It's super effective!` : line;
}

export function missLine(word: string, timedOut: boolean) {
  const W = word.toUpperCase();
  if (timedOut) return pick([`Too slow! ${W} strikes first.`, `You hesitate... ${W} does not.`], word);
  return pick([`Miss! ${W} hits back.`, `Not quite! ${W} counters.`, `Whiff! ${W} takes its shot.`], word);
}

export function defeatLines(word: string) {
  return [`${word.toUpperCase()} is defeated!`, `${word.toUpperCase()} dropped something...`];
}

export function ranAwayLines(word: string) {
  const W = word.toUpperCase();
  return [`${W} ran away...`, pick(['...but it left its meaning behind.', '...dropping its meaning on the way out.'], word)];
}
