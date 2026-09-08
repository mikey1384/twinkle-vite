const { assert, test, compile, driver, nodes } = require('./helpers/chatDialogHarness.cjs');
test('retry request reserves layout space, wraps long names and keeps distinct sender/recipient controls', () => {
  for (const isMyMessage of [true, false]) {
    const d = driver(), Button = () => null;
    const Component = compile('src/containers/Chat/Chess/RewindRequestButton.tsx', {
      react: d.hooks, '~/constants/css': { Color: { black: () => '#000', white: () => '#fff' } },
      '../Modals/useChatDialogRequest': compile('src/containers/Chat/Modals/useChatDialogRequest.ts', {react:d.hooks}).default,
      '~/components/Button': Button, '~/components/Icon': () => null
    }).default;
    const tree = d.render(() => Component({ isMyMessage, username: 'VeryLongName'.repeat(20), onAcceptRewind: () => {} }));
    assert.equal(tree.props.style.position, undefined);
    assert.equal(tree.props.style.width, '100%');
    assert.equal(tree.props.style.boxSizing, 'border-box');
    const title = nodes(tree, n => n.type === 'p')[0];
    assert.equal(title.props.style.overflowWrap, 'anywhere');
    assert.equal(title.props.style.fontSize, 16);
    const buttons = nodes(tree, n => n.type === Button);
    assert.deepEqual(buttons.map(n => n.props['aria-label']), isMyMessage ? ['Cancel chess retry request'] : ['Accept chess retry request', 'Decline chess retry request']);
    assert.ok(buttons.every(n => n.props.style.minHeight === 44 && n.props.style.fontSize === 14));
    d.dispose();
  }
});
