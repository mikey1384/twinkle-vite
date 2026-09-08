const { assert, test, React, compile, css, nodes } = require('./helpers/chatDialogHarness.cjs');
const Component = compile('src/containers/Chat/Chess/Game/CastlingButton.tsx', {
  react: React, '@emotion/css': { css },
  '~/constants/defaultValues': { cloudFrontURL: 'https://example.invalid' },
  '~/constants/css': { Color: { pink: () => 'pink' }, tabletMaxWidth: '1024px' },
  '~/helpers': { isTablet: () => false }
}, { navigator: {} }).default;
function board(color) {
  const squares = Array.from({ length: 64 }, () => ({}));
  squares[56] = { type: 'rook', isPiece: true };
  squares[63] = { type: 'rook', isPiece: true };
  squares[color === 'white' ? 60 : 59] = { type: 'king', isPiece: true };
  return squares;
}
function buttons(color, squares, interactable = true, onCastling = () => {}) {
  return nodes(Component({ myColor: color, squares, interactable, onCastling }), n => n.type === 'button');
}
test('castling controls are named native buttons with orientation-correct callbacks', () => {
  for (const color of ['white', 'black']) {
    const calls = [], controls = buttons(color, board(color), true, direction => calls.push(direction));
    assert.equal(controls.length, 2);
    assert.deepEqual(controls.map(n => n.props['aria-label']), color === 'white'
      ? ['Castle queenside', 'Castle kingside'] : ['Castle kingside', 'Castle queenside']);
    for (const control of controls) {
      assert.equal(control.props.type, 'button');
      assert.match(control.props.className, /focus-visible/);
      assert.match(control.props.className, /background: pink/);
      assert.equal(control.props.onKeyDown, undefined);
      assert.equal(control.props.onPointerDown, undefined);
      control.props.onClick();
    }
    assert.deepEqual(calls, ['left', 'right']);
  }
});
test('castling visibility retains turn, moved-king, check and blocked-path guards', () => {
  for (const color of ['white', 'black']) {
    assert.equal(buttons(color, board(color), false).length, 0);
    for (const patch of [{ moved: true }, { state: 'check' }, { state: 'checkmate' }]) {
      const squares = board(color);
      Object.assign(squares[color === 'white' ? 60 : 59], patch);
      assert.equal(buttons(color, squares).length, 0);
    }
    const blocked = board(color); blocked[57] = { isPiece: true };
    assert.equal(buttons(color, blocked).length, 1);
    const moved = board(color); moved[63].moved = true;
    assert.equal(buttons(color, moved).length, 1);
  }
});
