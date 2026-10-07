// Dev-only sample screens for the Fit Lab (loaded only in development, never
// in production builds): /grammarbles?fitpreview=<name> opens a screen the
// audit can't reach by playing (Classic mid-game and its finish once today's
// levels are used; a Quest result without finishing a run).
export type FitPreview = 'classic-game' | 'classic-finish' | 'quest-result';

export function fitPreviewParam(): FitPreview | null {
  const p = new URLSearchParams(window.location.search).get('fitpreview');
  return p === 'classic-game' || p === 'classic-finish' || p === 'quest-result'
    ? p
    : null;
}

const QUESTIONS = [
  ['She ____ to school every day.', ['go', 'goes', 'going', 'gone']],
  ['There ____ a concert like this before.', ['has never been', 'never has been', 'have never been', 'never been']],
  ['If I ____ you, I would study harder.', ['am', 'was', 'were', 'be']],
  ['The book ____ by millions of readers.', ['has read', 'has been read', 'is reading', 'reads']],
  ['He asked me where ____.', ['did I live', 'I lived', 'do I live', 'I am living']],
  ['Neither the teacher nor the students ____ ready.', ['was', 'is', 'were', 'be']],
  ['I look forward to ____ you.', ['see', 'seeing', 'saw', 'seen']],
  ['By next year, she ____ here for ten years.', ['will work', 'will have worked', 'works', 'worked']],
  ['That is the girl ____ brother won the prize.', ['who', 'whom', 'whose', 'which']],
  ['Hardly ____ the room when the phone rang.', ['I had entered', 'had I entered', 'I entered', 'did I enter']]
] as const;

export function previewQuestions() {
  const objs: Record<number, any> = {};
  QUESTIONS.forEach(([question, choices], i) => {
    objs[i] = { question, choices: [...choices], selectedChoiceIndex: null };
  });
  return { ids: QUESTIONS.map((_, i) => i), objs };
}

export const PREVIEW_SCORES = ['S', 'S', 'A', 'S', 'B', 'S', 'A', 'S', 'S', 'C'];

export const PREVIEW_QUEST_RUN = {
  runId: 0,
  nodeId: 'w1f1',
  kind: 'fort' as const,
  worldId: 1,
  rules: { mode: 'boss', hits: 7, passPoints: 490, timeScale: 2 },
  questions: []
};

export const PREVIEW_QUEST_RESULT = {
  runId: 0,
  score: 86,
  cleared: true,
  perfect: false,
  rights: 7,
  misses: 1,
  points: 600,
  passPoints: 490,
  firstTryCorrect: 6,
  size: 7,
  xp: 1500,
  coins: 150,
  rewardedRunsLeft: 6
};

export const PREVIEW_QUEST_ANSWERS = [
  { position: 0, isCorrect: true, selectedIndex: 1, correctIndex: 1, grade: 'S', points: 100 },
  { position: 1, isCorrect: true, selectedIndex: 0, correctIndex: 0, grade: 'A', points: 90 },
  { position: 2, isCorrect: true, selectedIndex: 2, correctIndex: 2, grade: 'B', points: 70 },
  { position: 3, isCorrect: true, selectedIndex: 3, correctIndex: 3, grade: 'S', points: 100 },
  { position: 4, isCorrect: true, selectedIndex: 1, correctIndex: 1, grade: 'A', points: 90 },
  { position: 5, isCorrect: true, selectedIndex: 0, correctIndex: 0, grade: 'C', points: 50 },
  { position: 6, isCorrect: true, selectedIndex: 2, correctIndex: 2, grade: 'S', points: 100 }
];
