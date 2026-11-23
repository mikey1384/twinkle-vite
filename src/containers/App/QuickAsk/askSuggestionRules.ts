import type { AssistantAskContext } from '../AssistantDock/dockState';

// The rules for the suggestion chips (askSuggestions.ts has the why): pure,
// with no app imports, so they can be read and tested in one place.
const VOCAB_CHAT_TYPE = 'vocabulary';

export interface AskSuggestion {
  text: string;
  context?: AssistantAskContext | null;
}

export interface AskActivity {
  wordleWord?: string;
  recentWords?: string[];
  escapedWord?: string;
  arenaResult?: { battleId: number; exam: string; score: string; grade: string };
}

const MAX_CHIPS = 4;
const quote = (word: string) => `“${word}”`;

// Pure, so the rules can be read (and tested) in one place.
export function buildAskSuggestions({
  pathname,
  activity = {},
  chatType = null,
  lastChatMessage = '',
  myUsername = '',
  fallback = []
}: {
  pathname: string;
  search?: string;
  activity?: AskActivity;
  chatType?: string | null;
  lastChatMessage?: string;
  myUsername?: string;
  fallback?: string[];
}): AskSuggestion[] {
  const chips: AskSuggestion[] = [];
  const sameItem = (a?: AssistantAskContext | null, b?: AssistantAskContext | null) =>
    !!a && !!b && a.kind === b.kind && a.path === b.path && a.focus === b.focus;
  // one chip per question and per item (the Arena page's own result chip
  // stands for the anywhere one)
  const add = (text: string, context?: AssistantAskContext | null) => {
    if (
      text &&
      !chips.some(
        (chip) => chip.text === text || sameItem(chip.context, context)
      )
    ) {
      chips.push({ text, ...(context ? { context } : {}) });
    }
  };
  const { wordleWord, recentWords = [], escapedWord, arenaResult } = activity;
  const arenaContext: AssistantAskContext | null = arenaResult
    ? {
        kind: 'page',
        label: 'my last Arena result',
        path: `/arena?mode=arena&battle=${arenaResult.battleId}`,
        excerpt: `${arenaResult.exam}: ${arenaResult.score}${
          arenaResult.grade ? `, ${arenaResult.grade}` : ''
        }`
      }
    : null;
  const recentWordsContext: AssistantAskContext | null = recentWords.length
    ? {
        kind: 'page',
        label: 'my recent Word Master words',
        path: '/chat/vocabulary',
        excerpt: `Words I caught recently: ${recentWords.join(', ')}`
      }
    : null;

  // what is on screen
  const content = /^\/(subjects|comments|videos|links)\/(\d+)/.exec(pathname);
  if (content) {
    const kind = (
      { subjects: 'subject', comments: 'comment', videos: 'video', links: 'url' } as const
    )[content[1] as 'subjects' | 'comments' | 'videos' | 'links'];
    const id = Number(content[2]);
    const noun =
      kind === 'video' ? 'video' : kind === 'url' ? 'link' : kind === 'comment' ? 'comment' : 'post';
    const path = `/${content[1]}/${id}`;
    add(`Explain this ${noun}`, { kind, id, label: `this ${noun}`, path });
    add('Summarize the replies', {
      kind,
      id,
      label: `the replies on this ${noun}`,
      path,
      focus: 'replies'
    });
  } else if (
    pathname.startsWith('/chat') &&
    (chatType === VOCAB_CHAT_TYPE || pathname.startsWith('/chat/vocabulary'))
  ) {
    if (recentWordsContext) add('Quiz me on my recent words', recentWordsContext);
    if (recentWords[0]) add(`Use ${quote(recentWords[0])} in a sentence`);
    if (wordleWord) add(`What does ${quote(wordleWord)} mean?`);
    if (escapedWord) add(`Help me remember ${quote(escapedWord)}`);
    add('Give me a new word for my level');
  } else if (pathname.startsWith('/chat')) {
    const text = lastChatMessage.trim();
    if (text) {
      add('Translate the last message', {
        kind: 'page',
        label: 'the last message in this chat',
        path: pathname,
        excerpt: text.slice(0, 600)
      });
      add('Help me reply to this', {
        kind: 'page',
        label: 'the last message in this chat',
        path: pathname,
        excerpt: text.slice(0, 600)
      });
    }
  } else if (/^\/app\/\d+/.test(pathname)) {
    const id = Number(/^\/app\/(\d+)/.exec(pathname)?.[1]);
    const app: AssistantAskContext = { kind: 'build', id, label: 'this app', path: `/app/${id}` };
    add('How do I play this?', app);
    add('Any tips to play better?', app);
  } else if (/^\/build\/\d+/.test(pathname)) {
    const id = Number(/^\/build\/(\d+)/.exec(pathname)?.[1]);
    add('Help me improve this app', {
      kind: 'page',
      label: 'the app I’m building',
      path: `/build/${id}`
    });
    add('What could I add next?', {
      kind: 'page',
      label: 'the app I’m building',
      path: `/build/${id}`
    });
  } else if (pathname.startsWith('/arena')) {
    if (arenaContext) add('Explain my last result', arenaContext);
    add('How does the Arena work?');
  } else if (/^\/users\/[^/]+/.test(pathname)) {
    const segment = pathname.split('/')[2] || '';
    let username = segment;
    try {
      username = decodeURIComponent(segment);
    } catch {
      // a malformed escape stays as typed
    }
    if (myUsername && username.toLowerCase() === myUsername.toLowerCase()) {
      add('Help me make my profile look cool');
      add('How do I get more XP?');
    } else {
      // nothing about the member whose page this is
      add('How do I add a friend?');
      add('How do profile themes work?');
    }
  }

  // what they did lately, wherever they are
  if (wordleWord) add(`What does ${quote(wordleWord)} mean?`);
  if (arenaContext) add('Explain my last Arena result', arenaContext);
  if (escapedWord) add(`Help me remember ${quote(escapedWord)}`);
  if (recentWordsContext) add('Quiz me on my recent words', recentWordsContext);

  for (const idea of fallback) add(idea);
  return chips.slice(0, MAX_CHIPS);
}

