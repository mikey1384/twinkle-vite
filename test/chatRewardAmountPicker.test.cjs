const {
  assert,
  test,
  compile,
  css,
  nodes
} = require('./helpers/chatDialogHarness.cjs');
const React = require('react');
const Component = compile(
  'src/containers/Chat/Modals/MessageRewardModal/RewardAmountPicker.tsx',
  { react: React, '~/components/Icon': () => null, '@emotion/css': { css } }
).default;
test('reward amounts retain all original values with named native controls and selected state', () => {
  let selected;
  const tree = Component({
    rewardLevel: 25,
    onSetRewardLevel: (v) => (selected = v)
  });
  const buttons = nodes(tree, (n) => n.type === 'button');
  assert.equal(buttons.length, 8);
  for (const [index, level] of [1, 2, 3, 4, 5, 25, 50].entries()) {
    const button = buttons[index];
    assert.equal(button.props.type, 'button');
    assert.equal(
      button.props['aria-label'],
      `${level * 200} XP for ${level * 200} coins`
    );
    assert.equal(button.props['aria-pressed'], level === 25);
    button.props.onClick();
    assert.equal(selected, level);
  }
  buttons[7].props.onClick();
  assert.equal(selected, 0);
  assert.match(tree.props.className, /min-height: 44px/);
});
test('locked reward choices cannot change pending submission', () => {
  let calls = 0;
  const tree = Component({
    rewardLevel: 1,
    disabled: true,
    onSetRewardLevel: () => calls++
  });
  for (const button of nodes(tree, (n) => n.type === 'button')) {
    assert.equal(button.props.disabled, true);
    button.props.onClick();
  }
  assert.equal(calls, 0);
});
