// Which look each answered marble in a Quest run gets (Mikey 11-15); the
// drawing is QuestMarble. Kept free of the drawing code so it can be tested.

export type MarbleLook =
  'empty' | 'clear' | 'shiny' | 'gold' | 'dull' | 'locked';

export const GOLD_STREAK = 5;

export interface StreakAnswer {
  isCorrect: boolean;
  forgiven?: boolean;
}

// The length of the right-answer streak each answer belongs to (0 for a
// miss). Same rule as the server's combo: a right answer adds one, a miss
// ends the streak, a forgiven miss neither adds nor breaks it. A streak
// still going counts what it has so far.
export function streakLengths(answers: StreakAnswer[]) {
  const lengths = answers.map(() => 0);
  let start = -1;
  let count = 0;
  const close = (end: number) => {
    for (let i = start; i >= 0 && i < end; i++) {
      if (answers[i].isCorrect && !answers[i].forgiven) lengths[i] = count;
    }
    start = -1;
    count = 0;
  };
  answers.forEach((answer, i) => {
    if (answer.forgiven) return;
    if (answer.isCorrect) {
      if (start < 0) start = i;
      count++;
    } else close(i);
  });
  close(answers.length);
  return lengths;
}

export function bestStreak(answers: StreakAnswer[]) {
  return Math.max(0, ...streakLengths(answers));
}

// The look of every answered marble in a run, in answer order, so the
// fight and the finish screen can never disagree.
export function answerLooks(answers: StreakAnswer[]): MarbleLook[] {
  const lengths = streakLengths(answers);
  return answers.map((answer, i) =>
    answer.forgiven
      ? 'clear'
      : !answer.isCorrect
        ? 'dull'
        : lengths[i] >= GOLD_STREAK
          ? 'gold'
          : 'shiny'
  );
}
