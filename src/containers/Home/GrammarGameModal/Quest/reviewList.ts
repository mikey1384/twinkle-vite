import type { QuestAnswer } from './types';

// The result's list of questions to look back at: every miss that can
// challenge its question (a stop's, a nemesis's, a boss hit that took wrong
// clicks, a missed counter) and every miss later ruled the question's fault.
// One entry per question (one ruling per question): the first time it was
// asked, marked forgiven if any of its misses was.
export function reviewList(answers: QuestAnswer[]) {
  const list: QuestAnswer[] = [];
  const byQuestion = new Map<number, number>();
  for (const a of answers) {
    if (!a.questionText || (!a.challenge && !a.forgiven)) continue;
    const id = a.challenge?.questionId;
    const at = id != null ? byQuestion.get(id) : undefined;
    if (at != null) {
      if (a.forgiven) list[at] = { ...list[at], forgiven: true };
      continue;
    }
    if (id != null) byQuestion.set(id, list.length);
    list.push(a);
  }
  return list;
}

// a miss forgiven by the time the run finished (the finish says so per
// position) shows as forgiven, whatever the screen saw while playing
export function withForgiven(
  answers: QuestAnswer[],
  finished?: Pick<QuestAnswer, 'position' | 'forgiven'>[]
) {
  const forgiven = new Set(
    (finished || []).filter((a) => a.forgiven).map((a) => a.position)
  );
  return forgiven.size
    ? answers.map((a) =>
        forgiven.has(a.position) ? { ...a, forgiven: true } : a
      )
    : answers;
}
