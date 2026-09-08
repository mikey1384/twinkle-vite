const { assert, test, React, compile, css, find, nodes } = require('./helpers/chatDialogHarness.cjs');
const Component = compile('src/containers/Chat/BoardSpoiler.tsx', {
  react: React, '~/components/Icon': () => null, '@emotion/css': { css }, '~/constants/css': { tabletMaxWidth: '1024px' }
}).default;
test('concealed move uses a native keyboard button and never starts a timer on pointer down', () => {
  let revealed = 0;
  const tree = Component({ revealed: false, onReveal: () => revealed++, gameType: 'chess', opponentName: 'Mina', children: 'secret board' });
  const button = find(tree, node => node.type === 'button');
  assert.equal(button.props.type, 'button'); assert.equal(button.props.disabled, false);
  assert.equal(button.props.onPointerDown, undefined); assert.equal(revealed, 0);
  button.props.onClick(); assert.equal(revealed, 1);
  assert.match(button.props.className, /focus-visible/);
  assert.match(button.props.className, /prefers-reduced-motion/);
  assert.equal(nodes(tree, node => node.props?.children === 'secret board').length, 0);
});
test('unavailable reveal is disabled and revealed boards retain their original contents', () => {
  const hidden = Component({ revealed: false, gameType: 'omok', children: 'board' });
  assert.equal(find(hidden, node => node.type === 'button').props.disabled, true);
  const style = { width: 300 }, shown = Component({ revealed: true, gameType: 'omok', style, children: 'board' });
  assert.equal(shown.props.children, 'board'); assert.equal(shown.props.style, style);
  assert.equal(nodes(shown, node => node.type === 'button').length, 0);
});

test('concealed timer warning can grow beyond compact board height without changing revealed dimensions', () => {
  const style = { width: 192, height: 192 };
  const hidden = Component({ revealed: false, gameType: 'omok', style, children: 'board' });
  assert.equal(hidden.props.style.height, 'auto'); assert.equal(hidden.props.style.minHeight, 192);
  assert.equal(find(hidden, node => node.type === 'button').props.style.minHeight, 192);
  const shown = Component({ revealed: true, gameType: 'omok', style, children: 'board' });
  assert.equal(shown.props.style.height, 192);
});
