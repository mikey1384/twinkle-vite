const { assert, test, React, compile, css, nodes } = require('./helpers/chatDialogHarness.cjs');
const Button = () => null, Modal = () => null;
const Promotion = compile('src/containers/Chat/Chess/PromotionModal.tsx', {
  react: React, '~/components/Modal': Modal, '~/components/Modal/LegacyModalLayout': () => null,
  '~/components/Button': Button, '@emotion/css': { css }, '~/constants/css': { mobileMaxWidth: '767px' },
  '~/constants/defaultValues': { cloudFrontURL: 'https://example.invalid' }
}).default;
test('promotion offers four named choices with bounded artwork and separate cancellation for both colors', () => {
  for (const color of ['white', 'black']) {
    const selected = []; let canceled = 0;
    const tree = Promotion({ color, onPromote: piece => selected.push(piece), onHide: () => canceled++ });
    assert.equal(tree.props['aria-label'], 'Promote pawn');
    assert.equal(tree.props.closeOnBackdropClick, false);
    const buttons = nodes(tree, n => n.type === Button);
    assert.equal(buttons.length, 5);
    for (const [i, type] of ['queen', 'rook', 'bishop', 'knight'].entries()) {
      const button = buttons[i];
      assert.equal(button.props['aria-label'], `Promote to ${type}`);
      assert.equal(button.props.style.fontSize, 14);
      assert.equal(button.props.style.color, color === 'black' ? '#222' : '#fff');
      const img = nodes(button, n => n.type === 'img')[0];
      assert.equal(img.props.alt, ''); assert.match(img.props.className, /width: 36px/);
      assert.ok(img.props.src.includes(color === 'white' ? 'White' : 'Black'));
      button.props.onClick();
    }
    assert.deepEqual(selected, ['queen', 'rook', 'bishop', 'knight']);
    buttons[4].props.onClick(); assert.equal(canceled, 1);
    assert.ok(nodes(tree, n => /repeat\(2, minmax/.test(n.props?.className)).length);
  }
});
