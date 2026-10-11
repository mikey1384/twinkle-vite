// A lesson's worked question is shown as a question (Mikey 10-11: the old
// card showed it already filled in, so nobody could see what was asked).
// Its text keeps the bank's blank, a run of underscores; the card draws an
// empty slot there. The parts around each blank, in order: one blank gives
// two parts, none gives the whole text as one part.
export function questionParts(text: string): string[] {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/_{3,}/);
}

// The lesson card's pages. A lesson is one page; one that doesn't fit the
// screen (a long rule, three long pairs and a long question on a phone) is
// split in two: its rule and pairs, then its worked question. A lesson with
// no worked question is never split (there is nothing to move).
export type LessonPart = 'whole' | 'rule' | 'worked';
export interface LessonStep {
  lesson: number;
  part: LessonPart;
}

export function lessonSteps(
  lessons: { question: unknown }[],
  split: ReadonlySet<number>
): LessonStep[] {
  const steps: LessonStep[] = [];
  lessons.forEach((lesson, i) => {
    if (split.has(i) && lesson.question)
      steps.push({ lesson: i, part: 'rule' }, { lesson: i, part: 'worked' });
    else steps.push({ lesson: i, part: 'whole' });
  });
  return steps;
}

// Where a step sits after the pages changed (a lesson was just split, or
// the screen turned and nothing is split any more): the same part of the
// same lesson, else that lesson's first page.
export function stepIndexOf(steps: LessonStep[], step: LessonStep): number {
  const same = steps.findIndex(
    (s) => s.lesson === step.lesson && s.part === step.part
  );
  if (same >= 0) return same;
  const lesson = steps.findIndex((s) => s.lesson === step.lesson);
  return lesson >= 0 ? lesson : 0;
}
