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

// The Workshop is open to every signed-in member (no preview id gate).
test('the Lumine transcript is canonical and conversation-scoped', () => {
  assert.doesNotMatch(hookSource, /BUILD_WORKSHOP_PREVIEW_USER_IDS/);
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

test('a finished job keeps its transcript, marked ended, until closed', async () => {
  const { findLumineJobOutcome } = await import(
    '../src/containers/Chat/Body/MessagesContainer/lumineDialogueMessages'
  );
  const messages = [
    { id: 30, settings: '{"buildSponsorResult":{"jobId":7,"status":"completed"}}' },
    { id: 31, settings: { buildSponsorResult: { jobId: 8, status: 'failed' } } },
    { id: 32, settings: 'not json' },
    { id: 33 }
  ];
  assert.equal(findLumineJobOutcome(messages, 7), 'completed');
  assert.equal(findLumineJobOutcome(messages, 8), 'failed');
  assert.equal(findLumineJobOutcome(messages, 9), null);

  // Only the same conversation's job turns into an ended transcript; another
  // chat or topic still clears it, and an ended job stops polling.
  assert.match(
    hookSource,
    /if \(!nextState\) \{[\s\S]*?isDialogueInScope\(currentState, scope\)[\s\S]*?\{ \.\.\.currentState, ended: true, canProgress: false \}[\s\S]*?: null;/
  );
  assert.match(hookSource, /const pollJobId = dialogueState\?\.ended \? 0 : dialogueState\?\.jobId/);
  assert.match(componentSource, /aria-label="Close Talking with Lumine"/);
  assert.match(
    componentSource,
    /dialogueState\.ended && dialogueState\.jobId === dismissedJobId/
  );
});

test('a chat or topic change never shows the previous conversation panel', async () => {
  const { isDialogueInScope } = await import(
    '../src/containers/Chat/Body/MessagesContainer/lumineDialogueMessages'
  );
  const state = { channelId: 20, topicId: null };
  assert.equal(isDialogueInScope(state, { channelId: 20, topicId: null }), true);
  assert.equal(isDialogueInScope(state, { channelId: 20, topicId: 0 }), true);
  assert.equal(isDialogueInScope(state, { channelId: 21, topicId: null }), false);
  assert.equal(isDialogueInScope(state, { channelId: 20, topicId: 3 }), false);
  // Cleared before the new scope's first load, and checked again at render
  // time in case that load fails.
  assert.match(
    hookSource,
    /setDialogueState\(null\);\s*void refreshFromServer\(\);/
  );
  assert.match(
    hookSource,
    /return shouldLoad &&\s*dialogueState &&\s*isDialogueInScope\(dialogueState, \{\s*channelId: selectedChannelId,\s*topicId\s*\}\)/
  );
});

test('a late event for another job never ends the live panel', () => {
  // The socket path names the job that ended; only that job's panel ends.
  assert.match(
    hookSource,
    /isActive \? undefined : nextState\.jobId\s*\);/
  );
  assert.match(
    hookSource,
    /if \(!nextState\) \{\s*if \(\s*endedJobId !== undefined &&\s*currentState &&\s*currentState\.jobId !== endedJobId\s*\) \{\s*return currentState;/
  );
});
