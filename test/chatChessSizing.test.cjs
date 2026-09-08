const { assert, test, React, compile, css, source } = require('./helpers/chatDialogHarness.cjs');
function game(tablet) {
  return compile('src/containers/Chat/Chess/Game/index.tsx', {
    react: { ...React, useMemo: fn => fn() }, './Board': () => null,
    '~/components/Loading': () => null, '@emotion/css': { css },
    '~/helpers': { isTablet: () => tablet },
    '~/constants/css': { mobileMaxWidth: '767px', borderRadius: '8px', Color: { white: () => 'white', black: () => 'black' } }
  }, { navigator: {} }).default;
}
test('all chess sizes reserve the same CSS dimension that the actual board consumes', () => {
  for (const tablet of [false, true]) {
    const Game = game(tablet);
    for (const size of ['regular', 'compact', 'inline']) {
      const tree = Game({ size, loading: false, squares: Array(64).fill({}) });
      assert.match(tree.props.className, /width: calc\(var\(--chat-chess-board-size\) \+ 2rem\)/);
      assert.match(tree.props.className, /min-height: calc\(var\(--chat-chess-board-size\) \+ 2.5rem\)/);
      assert.equal((tree.props.className.match(/--chat-chess-board-size:/g) || []).length, 2);
      if (size === 'compact') {
        assert.match(tree.props.className, /--chat-chess-board-size: 16rem/);
        assert.match(tree.props.className, /--chat-chess-board-size: min\(90vw, 14rem\)/);
      }
    }
  }
  const board = source('src/containers/Chat/Chess/Game/Board.tsx');
  assert.match(board, /grid-template-columns: 2rem var\(--chat-chess-board-size\)/);
  assert.match(board, /grid-template-rows: var\(--chat-chess-board-size\) 2.5rem/);
  assert.doesNotMatch(board, /const (mobileBoardWidth|boardWidth|defaultBoardWidth)/);
  assert.match(board, /'\. castling'/);
  assert.match(board, /grid-template-rows: var\(--chat-chess-board-size\) 2.5rem auto/);
  const castling = source('src/containers/Chat/Chess/Game/CastlingButton.tsx');
  assert.match(castling, /gridArea: 'castling'/);
  assert.doesNotMatch(castling, /position: absolute|mobileTop|boardHeight/);
});
