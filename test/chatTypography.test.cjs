const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const source = (file) => readFileSync(path.resolve(__dirname, '../src/containers/Chat', file), 'utf8');
const colors = { mobileMaxWidth: '767px', Color: new Proxy({}, { get: () => () => '#999' }) };
function compile(text, dependencies) {
  const mod = { exports: {} };
  const code = transformSync(text, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', code)((name) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  }, mod, mod.exports);
  return mod.exports;
}
const typography = compile(source('typography.ts'), {
  '@emotion/css': require('@emotion/css'), '~/constants/css': colors
});
const TextMessage = compile(source('Message/MessageBody/TextMessage/index.tsx'), {
  react: React, '@emotion/css': require('@emotion/css'),
  '~/components/Button': () => null,
  '~/components/Texts/EditTextArea': () => null,
  '~/components/ErrorBoundary': ({ children }) => children,
  '~/components/Icon': () => null,
  '~/components/Texts/RichText': (props) => React.createElement('div', {
    'data-line-height': props.lineHeight,
    'data-max-lines': props.maxLines,
    'data-ai-actions': props.aiActionPlacement,
    className: props.className
  }, props.children),
  './VideoAttachment': () => null,
  '~/constants/css': colors,
  '~/helpers/stringHelpers': { isValidSpoiler: value => /^\/(spoiler|secret) /.test(value), stringIsEmpty: value => !value?.trim(), isValidYoutubeUrl: () => false, extractVideoIdFromTwinkleVideoUrl: () => '' },
  '~/helpers': { isMobile: () => false },
  uuid: { v1: () => 'preview' },
  '../Spoiler': () => null,
  './ThinkingIndicator': () => null,
  '../../../typography': typography
}).default;

for (const isAIMessage of [false, true]) {
  test(`${isAIMessage ? 'AI' : 'human'} messages share measured typography without changing content`, () => {
    const content = 'First paragraph.\n\n**Emphasis**, `code`, and a [link](https://example.com).';
    const markup = renderToStaticMarkup(React.createElement(TextMessage, {
      isAIMessage, content, messageId: 1, extractedUrl: '',
      MessageStyle: { messageWrapper: 'wrapper' }, displayedThemeColor: 'gold'
    }));
    assert.match(markup, /data-line-height="1.625"/);
    assert.match(markup, /data-ai-actions="inline"/);
    assert.ok(markup.includes(typography.chatTextClass));
    assert.ok(markup.includes(content));
    if (isAIMessage) assert.match(markup, /data-max-lines="5000"/);
  });
}

test('revealed spoilers and topic response dialogs use the same measured text style', () => {
  for (const filename of ['Message/MessageBody/Spoiler.tsx', 'Modals/SubjectMsgsModal/Message.tsx']) {
    assert.match(source(filename), /className=\{chatTextClass\}/);
    assert.match(source(filename), /lineHeight=\{CHAT_TEXT_LINE_HEIGHT\}/);
  }
});

test('message surfaces distinguish actual ownership from edit permission', () => {
  const render = props => renderToStaticMarkup(React.createElement(TextMessage, {
    content: 'Hello', messageId: 1, extractedUrl: '',
    MessageStyle: { messageWrapper: 'wrapper', messageSurface: 'surface' },
    displayedThemeColor: 'gold', ...props
  }));
  assert.match(render({ userCanEditThis: true }), /data-message-surface="peer"/);
  assert.match(render({ isOwnMessage: true }), /data-message-surface="own"/);
  assert.match(render({ isAIMessage: true }), /data-message-surface="ai"/);
});

test('empty captions, system notices, calls and topics do not get empty chat bubbles', () => {
  for (const extra of [{ content: '' }, { content: '/spoiler Hidden text' }, { isNotification: true }, { isCallMsg: true }, { isSubject: true }, { isReloadedSubject: true }]) {
    const markup = renderToStaticMarkup(React.createElement(TextMessage, {
      content: 'A system update', messageId: 1, extractedUrl: '',
      MessageStyle: { messageWrapper: 'wrapper', messageSurface: 'surface' },
      displayedThemeColor: 'gold', ...extra
    }));
    assert.doesNotMatch(markup, /data-message-surface/);
  }
});

test('message and metadata ink remain legible on white panels', () => {
  for (const hex of ['273449', '334155', '64748b']) {
    const linear = [0, 2, 4].map(index => {
      const value = parseInt(hex.slice(index, index + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    assert.ok(1.05 / (luminance + 0.05) >= 4.5, `#${hex} has at least 4.5:1 contrast on white`);
    assert.ok(source('typography.ts').includes(`#${hex}`));
  }
});
