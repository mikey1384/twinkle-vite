import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatBuildAppReferenceMessage,
  getBuildAppReferenceLabel,
  parseBuildAppReferenceMessage
} from '../src/containers/Build/Editor/helpers/appReferences';

test('same-name app chips retain their owner labels after reload', () => {
  const apps = [
    { id: 4, title: 'Math Lab', username: 'mikey' },
    { id: 9, title: 'Math Lab', username: 'Alex "Demo" \\' }
  ];
  const restored = parseBuildAppReferenceMessage(
    formatBuildAppReferenceMessage('Use these.', apps)
  );
  assert.deepEqual(restored.apps, apps);
  assert.equal(
    getBuildAppReferenceLabel(restored.apps[0], restored.apps),
    'Math Lab · mikey'
  );
  assert.equal(
    getBuildAppReferenceLabel(restored.apps[1], restored.apps),
    'Math Lab · Alex "Demo" \\'
  );
  assert.equal(getBuildAppReferenceLabel(apps[0], [apps[0]]), 'Math Lab');
  assert.equal(
    getBuildAppReferenceLabel(apps[0], [apps[0], { ...apps[0], id: 10 }]),
    'Math Lab (#4)'
  );
});

test('app bindings survive message persistence, queueing, and markdown characters in titles', () => {
  const apps = [
    { id: 4, title: 'Math [Lab] \\ <x> * 🌟' },
    { id: 9, title: 'Math [Lab] \\ <x> * 🌟' }
  ];
  const message = 'Use its question layout.\nKeep our colors.';
  const encoded = formatBuildAppReferenceMessage(message, apps);
  assert.deepEqual(
    parseBuildAppReferenceMessage(JSON.parse(JSON.stringify(encoded))),
    { text: message, apps }
  );
  assert.ok(encoded.includes('/build/4') && encoded.includes('/build/9'));
  assert.equal(formatBuildAppReferenceMessage(message, []), message);
});

test('ordinary links and malformed reference blocks remain visible as written', () => {
  for (const text of [
    'See [Math Lab](/build/4)',
    'Referenced apps:\n- [App](https://example.com)\n\nDo this',
    'Referenced apps:\n- [App](/build/9007199254740992)\n\nDo this',
    'Referenced apps:\n- [App](/build/4)\n- [App](/build/4)\n\nDo this',
    'Referenced apps:\n- [App](/build/4)\n- [App](/build/5)\n- [App](/build/6)\n\nDo this',
    'Referenced apps:\n- [App](/build/4)'
  ])
    assert.deepEqual(parseBuildAppReferenceMessage(text), { text, apps: [] });
});

test('reference bindings stay present when existing upload notes shorten long captions', () => {
  const encoded = formatBuildAppReferenceMessage('Long idea. '.repeat(400), [
    { id: 4, title: 'Math Lab' }
  ]);
  const parsed = parseBuildAppReferenceMessage(encoded.slice(0, 2000));
  assert.deepEqual(parsed.apps, [{ id: 4, title: 'Math Lab' }]);
  assert.ok(parsed.text.startsWith('Long idea.'));
});
