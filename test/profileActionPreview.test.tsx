import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfileActionPreview, {
  isProfileActionPreview
} from '../src/containers/Chat/Message/MessageBody/ProfileActionPreview';

test('the card renders exact before/after text, safely escaped, without clipping or truncating it', () => {
  const value = {
    kind: 'profile_action' as const,
    title: 'Bio',
    before: ['First line: Old'],
    after: [
      'First line: <script>hello</script>',
      'Second line: ' + 'A'.repeat(1000)
    ]
  };
  assert.equal(isProfileActionPreview(value), true);
  const html = renderToStaticMarkup(<ProfileActionPreview preview={value} />);
  assert.match(html, /Before/);
  assert.match(html, /After/);
  assert.match(html, /&lt;script&gt;hello&lt;\/script&gt;/);
  assert.ok(html.includes('A'.repeat(1000)));
  assert.doesNotMatch(html, /<script>/);
  for (const malformed of [
    null,
    {},
    { ...value, after: [1] },
    { ...value, kind: 'other' }
  ])
    assert.equal(isProfileActionPreview(malformed), false);
});

test('canonical settings receipts preserve current sibling settings and profile state', async () => {
  const { applyCanonicalUserSettingsPatch } =
    await import('../src/contexts/User/profileState');
  const current = {
    userId: 7,
    state: { profile: { sectionOrder: ['intro'] } },
    settings: { homeAssistant: 'Zero', aiImage: { engine: 'gemini' } }
  };
  const imageSaved = applyCanonicalUserSettingsPatch(current, {
    aiImage: { engine: 'openai', quality: 'high' }
  });
  const assistantSaved = applyCanonicalUserSettingsPatch(imageSaved, {
    homeAssistant: 'Ciel'
  });
  assert.deepEqual(assistantSaved.settings, {
    homeAssistant: 'Ciel',
    aiImage: { engine: 'openai', quality: 'high' }
  });
  assert.equal(assistantSaved.state, current.state);
  assert.equal(current.settings.homeAssistant, 'Zero');
});
