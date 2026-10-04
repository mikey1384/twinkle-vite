// The suggestion bubbles under the dock's message box after the member
// presses "Ask" on something: one tap sends it, with the item attached, and
// the agent takes it from there. Text the member can read gets what the old
// "Ask Zero" window offered (rewrites); everything else gets the questions a
// member most likes to ask about that kind of thing.
const REWRITE_IDEAS = [
  'Rewrite it in your own style',
  'Rewrite it as a poem',
  'Rewrite it in K-pop lyrics style',
  'Rewrite it in Shakespearean style',
  'Rewrite it in rap style',
  'Rewrite it in YouTuber style'
];
const TEXT_IDEAS = ['Make it easy to understand', ...REWRITE_IDEAS];

const KIND_IDEAS: Record<string, string[]> = {
  comment: TEXT_IDEAS,
  subject: TEXT_IDEAS,
  video: ['What is this video about?', ...TEXT_IDEAS],
  url: ['What is this link about?', ...TEXT_IDEAS],
  dailyReflection: ['How do I write one like this?', ...TEXT_IDEAS],
  // An AI story's text and quiz are the reader's to work out (Mikey,
  // 2026-10-04): how it works, never its answers.
  aiStory: ['How does AI Story work?', 'How do I get more XP from this?'],
  build: ['How do I play this?', 'Any tips to play better?', 'What is this app?'],
  bounty: ['How do I earn this bounty?', 'Is it open for me today?'],
  achievement: ['How do I unlock this?', 'How close am I?'],
  mission: ['How do I pass this mission?', "What's my next step?"],
  xpChange: ['How do I get a reward like this?', 'How does the multiplier work?'],
  meetupQuestStep: ['What is Bridge Builder?', 'How do I start a crew?'],
  aiCard: ['How rare is this card?', 'How do I summon cards?'],
  sharedTopic: ['What does this prompt do?', 'How do I try it?']
};

export function askIdeasFor(
  context: { kind: string; rootType?: string; path?: string; focus?: string } | null
): string[] {
  if (!context) return [];
  if (context.kind === 'build' && context.focus === 'rewards') {
    return ['How do I earn the rewards?', 'Which reward should I try first?'];
  }
  if (context.kind === 'pass') {
    return context.rootType === 'achievement' ? KIND_IDEAS.achievement : KIND_IDEAS.mission;
  }
  if (context.kind === 'page') {
    const path = context.path || '';
    if (path.startsWith('/achievements/bridge-builder')) {
      return ["What's my next step?", 'How does Bridge Builder work?'];
    }
    if (path.startsWith('/achievements/')) return KIND_IDEAS.achievement;
    if (path.startsWith('/missions')) return KIND_IDEAS.mission;
    if (path.startsWith('/earn')) return ['Which bounty should I try?', 'How do bounties work?'];
    return [];
  }
  return KIND_IDEAS[context.kind] || [];
}
