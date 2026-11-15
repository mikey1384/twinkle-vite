// Mikey's Apprentice (Mikey, 2026-11-15): the role page at /apprentice and
// its application. The limits match twinkle-api
// controllers/user/services/apprentice.ts, which enforces them.
export const APPRENTICE_PATH = '/apprentice';
// Mikey's original posting (Subject 37282, 2026-10-31). The page links to it;
// the post itself gets no special treatment (Mikey, 11-15).
export const APPRENTICE_POSTING_SUBJECT_ID = 37282;
export const APPRENTICE_TEXT_MAX = 3000;
export const APPRENTICE_MAX_PICKS = 6;

export type ApprenticeTextField =
  | 'built'
  | 'justDid'
  | 'aiUse'
  | 'improve'
  | 'more';
export type ApprenticePickType = 'build' | 'subject';
export interface ApprenticePick {
  type: ApprenticePickType;
  id: number;
}
export interface ApprenticeResolvedPick extends ApprenticePick {
  title: string;
  path: string;
}
export interface ApprenticeAnswers {
  picks: ApprenticePick[];
  built: string;
  justDid: string;
  aiUse: string;
  improve: string;
  more: string;
}
export interface ApprenticeApplication {
  status: 'none' | 'draft' | 'submitted';
  answers: ApprenticeAnswers;
  picks: ApprenticeResolvedPick[];
  revision: number;
  draftSavedAt: number | null;
  firstSubmittedAt: number | null;
  lastSubmittedAt: number | null;
  hasUnsentChanges: boolean;
  unchanged?: boolean;
}
export interface ApprenticeChoice extends ApprenticePick {
  title: string;
  description: string;
  at: number | null;
}

// The questions, in the order the form asks them (the server's labels).
export const APPRENTICE_QUESTIONS: {
  field: ApprenticeTextField;
  label: string;
  hint: string;
  optional?: boolean;
  rows: number;
}[] = [
  {
    field: 'built',
    label: 'What have you built?',
    hint: 'Apps, games, posts, anything you made. What was it for, who used it, and what are you proudest of? Pick your builds and posts above so they are one tap away.',
    rows: 4
  },
  {
    field: 'justDid',
    label: 'Tell us about a time you just did something',
    hint: 'Something you saw could be better and started on, without waiting for anyone to ask or say yes. What happened?',
    rows: 4
  },
  {
    field: 'aiUse',
    label: 'How do you use AI?',
    hint: 'What you use it for, how you ask, what you do when it gets something wrong, and something it helped you make or learn.',
    rows: 4
  },
  {
    field: 'improve',
    label: 'What would you improve about Twinkle?',
    hint: 'One thing that would make Twinkle better for the people who use it, and how you would go about it.',
    rows: 4
  },
  {
    field: 'more',
    label: 'Anything else?',
    hint: 'Whatever you want Mikey to know: what you are working on, what you are learning, what you have changed about yourself lately.',
    optional: true,
    rows: 3
  }
];

export function emptyApprenticeAnswers(): ApprenticeAnswers {
  return { picks: [], built: '', justDid: '', aiUse: '', improve: '', more: '' };
}

/** What still needs an answer before sending (same rule as the server). */
export function apprenticeMissing(answers: ApprenticeAnswers) {
  const missing: ApprenticeTextField[] = [];
  if (!answers.built.trim() && !answers.picks.length) missing.push('built');
  for (const field of ['justDid', 'aiUse', 'improve'] as const) {
    if (!answers[field].trim()) missing.push(field);
  }
  return missing;
}

/** "via Zero" / "via Ciel" for a version Zero or Ciel sent for the member. */
export function apprenticeSentViaLabel(sentVia?: string | null) {
  if (sentVia === 'zero') return 'via Zero';
  if (sentVia === 'ciel') return 'via Ciel';
  if (sentVia) return 'via Zero or Ciel';
  return '';
}
