const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const source = readFileSync(path.resolve(__dirname,
  '../src/containers/Chat/LeftMenu/PinnedTopics/TopicItem.tsx'), 'utf8');
let revealProps;
const dependencies = {
  react: React,
  '~/components/Icon': () => null,
  '~/components/Texts/FullTextReveal': props => { revealProps = props; return null; },
  '~/helpers': { isMobile: () => false, textIsOverflown: () => false },
  '~/helpers/hooks': { useOutsideClick: () => {} },
  '../../containers': { chatSubnavRowClass: 'topic-row' }
};
const mod = { exports: {} };
new Function('require', 'module', 'exports',
  transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code
)(name => {
  assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
  return dependencies[name];
}, mod, mod.exports);
function render(isSelected) {
  return renderToStaticMarkup(React.createElement(mod.exports.default, {
    icon: 'thumb-tack', isSelected,
    onClick: () => assert.fail('render must not navigate')
  }, 'A long topic title & unread discussion'));
}

test('pinned topic is a named native button with a current-page indicator', () => {
  const markup = render(true);
  assert.match(markup, /<button[^>]*type="button"/);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /A long topic title &amp; unread discussion/);
  assert.doesNotMatch(markup, /<nav\b/);
  assert.doesNotMatch(render(false), /aria-current/);
});

test('topic tooltip is anchored to the row and has a dismissal callback', () => {
  render(false);
  assert.ok(revealProps.anchorRef && Object.hasOwn(revealProps.anchorRef, 'current'));
  assert.equal(typeof revealProps.onDismiss, 'function');
  assert.equal(revealProps.style.fontSize, 'max(14px, 1.4rem)');
});
