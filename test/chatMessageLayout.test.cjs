const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const readSource = (file) => readFileSync(path.resolve(__dirname, '../src/containers/Chat', file), 'utf8');
const compiled = transformSync(readSource('Message/MessageBody/Reactions/index.tsx'), {
  loader: 'tsx', format: 'cjs', jsx: 'transform'
}).code;
const mod = { exports: {} };
// Render the real list while isolating the interactive reaction chip's app contexts.
new Function('require', 'module', 'exports', compiled)((name) => {
  if (name === 'react') return React;
  if (name === './Reaction') return (props) => React.createElement('button', {
    'data-reaction': props.reaction,
    'data-count': props.reactionCount,
    'data-pending': props.pendingMutation
  });
  throw new Error(`Unexpected dependency: ${name}`);
}, mod, mod.exports);
const Reactions = mod.exports.default;
const render = (props) => renderToStaticMarkup(React.createElement(Reactions, {
  pendingReactionMutations: {}, onAddReaction() {}, onRemoveReaction() {},
  reactionsMenuShown: false, theme: 'logoBlue', ...props
}));

test('empty reactions render no row or reserved vertical space', () => {
  assert.equal(render({}), '');
  assert.equal(render({ reactions: [] }), '');
  assert.equal(render({ pendingReactionMutations: { thumb: 'remove' } }), '');
});

test('pending additions stay visible without inventing confirmed counts', () => {
  const markup = render({ pendingReactionMutations: { thumb: 'add' } });
  assert.match(markup, /data-reaction="thumb"/);
  assert.match(markup, /data-count="0"/);
  assert.match(markup, /data-pending="add"/);
});

test('confirmed reaction counts and pending removals survive the compact layout', () => {
  const markup = render({
    reactions: [{ type: 'thumb', userId: 1 }, { type: 'thumb', userId: 2 }],
    pendingReactionMutations: { thumb: 'remove', heart: 'add' }
  });
  assert.equal((markup.match(/data-reaction="thumb"/g) || []).length, 1);
  assert.match(markup, /data-count="2" data-pending="remove"/);
  assert.match(markup, /flex-wrap:wrap/);
});

test('AI controls flow with content, and search results retain independent headers', () => {
  assert.match(readSource('Message/MessageBody/TextMessage/index.tsx'), /aiActionPlacement="inline"/);
  assert.doesNotMatch(readSource('Message/MessageBody/Content.tsx'), /marginTop: '2rem', height: '2.5rem'/);
  assert.match(readSource('Body/MessagesContainer/DisplayedMessages.tsx'), /!isSearchActive &&\s*canGroupChatMessages\(messages\[index \+ 1\], message\)/);
});
