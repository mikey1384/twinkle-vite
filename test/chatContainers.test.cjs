const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const readSource = (file) => readFileSync(path.resolve(__dirname, '../src/containers/Chat', file), 'utf8');
const compiled = transformSync(readSource('Body/MessagesContainer/TargetSubjectPreview.tsx'), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
const mod = { exports: {} };
new Function('require', 'module', 'exports', compiled)((name) => {
  if (name === 'react') return React;
  if (name === '@emotion/css') return require('@emotion/css');
  if (name === '~/constants/css') return { mobileMaxWidth: '767px' };
  if (name === '~/components/Icon') return () => null;
  if (name === '~/constants/defaultValues') return { defaultChatSubject: 'Default topic' };
  throw new Error(`Unexpected dependency: ${name}`);
}, mod, mod.exports);
const TargetSubjectPreview = mod.exports.default;

test('topic reply keeps its full content, reserved height and accessible cancel control', () => {
  const content = 'A long topic '.repeat(40);
  const markup = renderToStaticMarkup(React.createElement(TargetSubjectPreview, { legacyTopicObj: { content }, onClose() {} }));
  assert.ok(markup.includes(content));
  assert.match(markup, /height:8rem/);
  assert.match(markup, /role="region" aria-label="Replying to topic"/);
  assert.match(markup, /<button type="button" aria-label="Cancel topic reply"/);
  assert.doesNotMatch(readSource('Body/MessagesContainer/TargetSubjectPreview.tsx'), /overflow: 'scroll'/);
});

test('topic reply retains the default topic fallback', () => {
  const markup = renderToStaticMarkup(React.createElement(TargetSubjectPreview, { legacyTopicObj: {}, onClose() {} }));
  assert.match(markup, /Default topic/);
});

test('surface styling does not clip menus or reduce the mobile workspace', () => {
  const source = readSource('containers.ts');
  assert.doesNotMatch(source, /overflow:\s*(hidden|clip)/);
  assert.match(source, /width: 170vw/);
  assert.match(source, /--chat-panel-radius: 0px/);
  assert.match(source, /prefers-reduced-motion: reduce/);
});

test('channel styling keeps canonical unread projection and adds keyboard navigation', () => {
  const source = readSource('LeftMenu/Channels/Channel.tsx');
  assert.match(source, /!selected && canonicalUnreadBadgeIsShown\(totalNumUnreads\)/);
  assert.match(source, /aria-current=\{selected \? 'page' : undefined\}/);
  assert.match(source, /<Link\s/);
  assert.match(source, /to=\{pathId \?/);
  assert.match(source, /aria-label="Unread messages"/);
});
