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
