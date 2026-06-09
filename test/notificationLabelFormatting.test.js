import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('notification labels cover known camelCase content identifiers', () => {
  const source = readFileSync(
    new URL('../src/components/Notification/notificationLabels.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /contentType === 'aiStory'[\s\S]*return 'AI Story'/);
  assert.match(source, /contentType === 'xpChange'[\s\S]*return DAILY_GOAL_COMPLETION_LABEL/);
  assert.match(source, /contentType === 'sharedTopic'[\s\S]*return SHARED_SYSTEM_PROMPT_LABEL/);
  assert.match(source, /contentType === 'dailyReflection'[\s\S]*return 'reflection'/);
  assert.match(source, /contentType === 'missionPass'[\s\S]*getMissionPassNotificationLabel/);
  assert.match(source, /contentType === 'achievementPass'[\s\S]*return 'achievement'/);
  assert.match(source, /replace\(\/\(\[a-z0-9\]\)\(\[A-Z\]\)\/g, '\$1 \$2'\)/);
});

test('notification drawer hides xpChange machine target details', () => {
  const source = readFileSync(
    new URL(
      '../src/components/Notification/MainFeeds/NotiItem/NotiMessage.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(source, /shouldShowNotificationContentDetail\(targetObj\.contentType\)/);
  assert.match(source, /getNotificationContentTypeLabel\(\{/);
  assert.doesNotMatch(source, /: targetObj\.contentType\s*\n\s*\}\s*\$\{/);
});

test('reward notifications format content labels through notification label helper', () => {
  const source = readFileSync(
    new URL(
      '../src/components/Notification/MainFeeds/RewardItem/RewardText.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(source, /function getRewardContentLabel\(\)/);
  assert.match(source, /getNotificationContentTypeLabel\(\{/);
  assert.match(source, /shouldShowNotificationContentDetail\(contentType\)/);
  assert.doesNotMatch(source, /label=\{`\$\{contentType\}/);
});
