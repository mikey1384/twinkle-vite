import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const componentSource = readFileSync(
  new URL(
    '../src/containers/Chat/Body/MessagesContainer/LumineDialoguePhase.tsx',
    import.meta.url
  ),
  'utf8'
);
const hookSource = readFileSync(
  new URL(
    '../src/containers/Chat/Body/MessagesContainer/hooks/useLumineDialogue.ts',
    import.meta.url
  ),
  'utf8'
);
const messagesSource = readFileSync(
  new URL(
    '../src/containers/Chat/Body/MessagesContainer/DisplayedMessages.tsx',
    import.meta.url
  ),
  'utf8'
);
const statusSource = readFileSync(
  new URL(
    '../src/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator/constants/statusMeta.ts',
    import.meta.url
  ),
  'utf8'
);
const thinkingIndicatorSource = readFileSync(
  new URL(
    '../src/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator/index.tsx',
    import.meta.url
  ),
  'utf8'
);

test('Using Lumine is a first-class distinct thinking phase', () => {
  assert.match(
    statusSource,
    /talking_with_lumine:[\s\S]*?Using Lumine\.\.\.[\s\S]*?comments[\s\S]*?Color\.darkCyan\(\)/
  );
  assert.match(messagesSource, /<LumineDialoguePhase/);
  assert.match(componentSource, /aria-label="Talking with Lumine"/);
  assert.match(componentSource, /role="log"/);
  assert.match(componentSource, /Lumine → \$\{dialogueState\.personaName\}/);
  assert.match(
    thinkingIndicatorSource,
    /status !== 'talking_with_lumine'[\s\S]*?isStreamingThoughts/
  );
  assert.doesNotMatch(componentSource, /gradient/i);
});

test('the Lumine transcript is canonical, rollout-gated, and conversation-scoped', () => {
  assert.match(hookSource, /BUILD_WORKSHOP_PREVIEW_USER_IDS\.has/);
  assert.match(
    hookSource,
    /Number\(job\.channelId \|\| 0\) !== selectedChannelId/
  );
  assert.match(
    hookSource,
    /Number\(job\.topicId \|\| 0\) !== Number\(topicId \|\| 0\)/
  );
  assert.match(
    hookSource,
    /socket\.on\('build_workshop_dialogue_updated', applyCanonicalDialogue\)/
  );
  assert.match(hookSource, /const POLL_MS = 5_000/);
  assert.match(hookSource, /replaceCanonicalDialogueState\(/);
  assert.match(
    hookSource,
    /latestDialogueId\(nextState\) < latestDialogueId\(currentState\)/
  );
  assert.doesNotMatch(hookSource, /\.push\(|concat\(|\[\.\.\.dialogue/);
});

test('provider identity never enters the user-facing Lumine transcript', () => {
  assert.doesNotMatch(componentSource, /Claude|Codex|provider|model|effort/);
  assert.doesNotMatch(hookSource, /Claude|Codex|requestedModel|requestedEffort/);
});

test('auto-minimize observes only confirmed viewer messages in the exact conversation after queuing', async () => {
  const { latestLumineChatMessage } = await import(
    '../src/containers/Chat/Body/MessagesContainer/lumineDialogueMessages'
  );
  const scope = { requesterUserId: 5, channelId: 20, topicId: null };
  const base = { userId: 5, channelId: 20, timeStamp: 101 };
  const messages = [
    { ...base, id: 12 },
    { ...base, id: '13' },
    { ...base, id: 14, timeStamp: 100 },
    { ...base, id: 15, userId: 7587 },
    { ...base, id: 16, channelId: 21 },
    { ...base, id: 17, subjectId: 2 },
    { ...base, id: 'pending-uuid' },
    { ...base }
  ];
  assert.equal(latestLumineChatMessage(messages, scope, 100), 13);
  assert.equal(latestLumineChatMessage(messages, { ...scope, topicId: 2 }, 100), 17);
  assert.equal(latestLumineChatMessage(messages, scope, 102), 0);
  assert.equal(latestLumineChatMessage([], scope, 100), 0);
});
