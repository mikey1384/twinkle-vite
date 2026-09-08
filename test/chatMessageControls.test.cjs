const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transformSync } = require('esbuild');

const mod = { exports: {} };
new Function('require', 'module', 'exports', transformSync(
  readFileSync(path.resolve(__dirname, '../src/containers/Chat/Message/MessageBody/messageControlStyles.ts'), 'utf8'),
  { loader: 'ts', format: 'cjs' }
).code)(name => {
  assert.equal(name, '@emotion/css');
  return { css: parts => parts.join('') };
}, mod, mod.exports);
const styles = mod.exports.messageControlClass;

test('message controls stay 30px with 14px icons and inherit the original Button colors', () => {
  for (const property of ['width', 'min-width', 'height', 'min-height']) {
    assert.match(styles, new RegExp(`${property}: 30px;`));
  }
  assert.match(styles, /font-size: 14px/);
  assert.doesNotMatch(styles, /(?:background|color|box-shadow|outline)\s*:/,
    'shared Button must retain its original colors, shadow and keyboard focus ring');
});

test('adjacent controls use a consistent 4px gap without invisible horizontal padding', () => {
  assert.doesNotMatch(styles, /::before|44px|@media/);
  assert.match(styles, /padding: 0/);
  const actions = readFileSync(path.resolve(__dirname, '../src/containers/Chat/Message/MessageBody/ActionButtons.tsx'), 'utf8');
  assert.match(actions, /marginRight: dropdownButtonShown \? 4 : 0/);
});
