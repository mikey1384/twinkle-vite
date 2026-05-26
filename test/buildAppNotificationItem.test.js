import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Build app notification settings button keeps keyboard activation local', () => {
  const source = readFileSync(
    new URL(
      '../src/components/Notification/MainFeeds/NotiItem/index.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    source,
    /function handleSettingsButtonKeyDown\([\s\S]*?event\.stopPropagation\(\);[\s\S]*?\}/
  );
  assert.match(source, /onKeyDown=\{handleSettingsButtonKeyDown\}/);
});

test('Build app notification launch state includes payload JSON', () => {
  const source = readFileSync(
    new URL(
      '../src/components/Notification/MainFeeds/NotiItem/index.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(source, /payload: actionObj\.payload \|\| null/);
  assert.match(source, /actionObj\.payload/);
});

test('Build app notification settings hide event toggle without an event key', () => {
  const source = readFileSync(
    new URL(
      '../src/components/Notification/MainFeeds/NotiItem/BuildAppNotificationSettingsModal.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    source,
    /\{eventKey \? \([\s\S]*Mute \{eventMuteLabel\}[\s\S]*\) : null\}/
  );
  assert.match(source, /onPreferencesChangeRef\.current\?\.\(result\)/);
});
