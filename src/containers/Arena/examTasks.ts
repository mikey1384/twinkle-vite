import type { ArenaItem } from './types';

// Presentation adapters interpret the known bank format, never the answer key.
export const C1_READING_TASKS = [
  {
    type: 'cae.uoe.clozeMC',
    instruction: 'Choose the word or phrase that fits each numbered gap.'
  },
  {
    type: 'cae.uoe.openCloze',
    instruction: 'Write one word in each numbered gap.'
  },
  {
    type: 'cae.uoe.wordFormation',
    instruction:
      'Use each given word to form one word that fits the corresponding gap.'
  },
  {
    type: 'cae.uoe.keyWordTransformation',
    instruction:
      'Complete the second sentence with 3–6 words, including the given key word unchanged, so that it means the same as the first. Use full forms, not contractions.'
  },
  {
    type: 'cae.r.longTextMC',
    instruction: 'Read the passage and choose the best answer to each question.'
  },
  {
    type: 'cae.r.crossText',
    instruction:
      'Read the four texts and choose the writer for each question. You may choose a writer more than once.'
  },
  {
    type: 'cae.r.gappedParagraphs',
    instruction:
      'Place the paragraphs in the gaps. Use each paragraph once. One paragraph is not needed.'
  },
  {
    type: 'cae.r.multipleMatching',
    instruction:
      'Match each statement to a text. You may choose a text more than once.'
  }
];

export function isC1Reading(item: ArenaItem) {
  return C1_READING_TASKS.some((task) => task.type === item.type);
}

export function gapLabel(item: ArenaItem) {
  return item.stem.match(/gap \[([A-Z0-9]+)\]/)?.[1];
}

export function givenWord(item: ArenaItem) {
  return (
    item.keyword ||
    item.stem.match(/Use ([A-Z]+) (?:to form|unchanged)/)?.[1] ||
    ''
  );
}

export function taskQuestion(item: ArenaItem) {
  return item.stem
    .replace(/^Reading and Use of English Part \d+\.\s*/, '')
    .replace(
      /^(?:Choose the best answer\.|Choose the writer\. You may choose a writer more than once\.)\s*/,
      ''
    )
    .replace(/\s*You may choose each person more than once\.$/, '');
}

export function paragraphBank(body: string) {
  const [passage, ...bank] = body.split(/\n\nPARAGRAPHS\n\n/);
  const parts = bank.join('\n\n').split(/(?:^|\n\n)([A-Z])\n/);
  const paragraphs: { label: string; text: string }[] = [];
  for (let i = 1; i < parts.length; i += 2)
    paragraphs.push({ label: parts[i], text: parts[i + 1].trim() });
  return { passage, paragraphs };
}

export function paragraphMoves(
  items: ArenaItem[],
  answers: Record<number, number | string | null>,
  no: number,
  choice: number
) {
  return [
    ...items
      .filter((item) => item.no !== no && answers[item.no] === choice)
      .map((item) => ({ no: item.no, answer: null as number | null })),
    { no, answer: choice }
  ];
}
