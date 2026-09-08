const { assert, test, React, compile, css, nodes, driver, source } = require('./helpers/chatDialogHarness.cjs');
const Cell = compile('src/containers/Chat/Omok/Game/OmokCell.tsx', {
  react: { ...React, memo: fn => fn }, '@emotion/css': { css },
  '~/constants/css': { Color: new Proxy({}, { get: () => () => '#333' }) }
}).default;
test('inline Omok status sits below the board while modal timer placement is preserved', () => {
  const parent = source('src/containers/Chat/Omok/index.tsx');
  assert.match(parent, /timerPlacement=\{\s*isFromModal \? 'overlay' : 'inline'\s*\}/);
  assert.match(parent, /const axisSize = isInline \|\| deviceIsMobile \? '16px' : '20px'/);
});
test('playable Omok cell activates through a named native button, not pointerdown or duplicate key handlers', () => {
  let clicks = 0;
  const tree = Cell({ label: 'A15, empty', value: null, isLastMove: false, canInteract: true, onClick: () => clicks++ });
  assert.equal(tree.type, 'button'); assert.equal(tree.props.type, 'button');
  assert.equal(tree.props['aria-label'], 'A15, empty');
  assert.equal(tree.props.onPointerDown, undefined); assert.equal(tree.props.onKeyDown, undefined);
  assert.equal(clicks, 0); tree.props.onClick(); assert.equal(clicks, 1);
  assert.match(tree.props.className, /focus-visible/);
});
test('occupied/read-only cells retain descriptive state and existing click propagation contract', () => {
  let clicks = 0;
  const tree = Cell({ label: 'H8, black, last move', value: 'black', isLastMove: true, canInteract: false, onClick: () => clicks++ });
  assert.equal(tree.type, 'div'); assert.equal(tree.props.role, 'img');
  assert.equal(tree.props.tabIndex, undefined); assert.equal(tree.props['aria-label'], 'H8, black, last move');
  tree.props.onClick(); assert.equal(clicks, 1);
});

test('actual Omok grid labels and callbacks agree in black and reversed white orientations', () => {
  const Leaf = () => null, BOARD_SIZE = 19;
  const runtime = driver();
  const Game = compile('src/containers/Chat/Omok/Game/index.tsx', {
    react: runtime.hooks, '@emotion/css': { css },
    '~/components/Loading': Leaf, '../../BoardSpoiler': Leaf, './OmokCell': Cell,
    '../helpers': { BOARD_SIZE }, '~/constants/css': { Color: new Proxy({}, { get: () => () => '#333' }), borderRadius: '8px', mobileMaxWidth: '767px' }
  }).default;
  for (const color of ['black', 'white']) {
    const colLabels = Array.from({ length: 19 }, (_, i) => String.fromCharCode(65 + i));
    const rowLabels = Array.from({ length: 19 }, (_, i) => 19 - i);
    if (color === 'white') { colLabels.reverse(); rowLabels.reverse(); }
    const board = Array.from({ length: 19 }, () => Array(19).fill(null)), clicked = [];
    const source = color === 'white' ? 18 : 0; board[source][source] = 'black';
    const tree = runtime.render(() => Game({ boardSizeStyle: {}, boardVisible: true, colLabels, rowLabels,
      interactable: true, isMyTurn: true, hasPendingMove: false, loading: false,
      lastMovePosition: { row: source, col: source }, myAssignedColor: color,
      onCellClick: (...coords) => clicked.push(coords), onReveal() {}, winningMap: {}, boardToRender: board }));
    const cells = nodes(tree, node => node.type === Cell); assert.equal(cells.length, 361);
    const axes = nodes(tree, node => node.type === 'div' && /font-size: 10px/.test(node.props.className || ''));
    assert.equal(axes.length, 38); assert.ok(axes.every(node => /line-height: 1/.test(node.props.className)));
    assert.equal(cells.filter(cell => cell.props.tabIndex === 0).length, 1);
    const grid = nodes(tree, node => node.props?.role === 'group')[0];
    let focused = '', prevented = 0;
    const target = { dataset: { omokIndex: '180' } };
    grid.props.onKeyDown({ key: 'ArrowRight', nativeEvent: {}, target: { closest: () => target },
      currentTarget: { contains: () => true, querySelector: selector => ({ focus() { focused = selector; } }) },
      preventDefault() { prevented++; }, stopPropagation() {} });
    assert.equal(focused, '[data-omok-index="181"]'); assert.equal(prevented, 1);
    assert.equal(clicked.length, 0, 'navigation does not select a move');
    for (const [index, key, ctrlKey, expected] of [
      [0, 'ArrowLeft', false, 0], [18, 'ArrowRight', false, 18],
      [0, 'ArrowUp', false, 0], [360, 'ArrowDown', false, 360],
      [180, 'ArrowUp', false, 161], [180, 'ArrowDown', false, 199],
      [180, 'Home', false, 171], [180, 'End', false, 189],
      [180, 'Home', true, 0], [180, 'End', true, 360]
    ]) {
      target.dataset.omokIndex = String(index);
      grid.props.onKeyDown({ key, ctrlKey, nativeEvent: {}, target: { closest: () => target },
        currentTarget: { contains: () => true, querySelector: selector => ({ focus() { focused = selector; } }) },
        preventDefault() {}, stopPropagation() {} });
      assert.equal(focused, `[data-omok-index="${expected}"]`);
    }
    for (const event of [{ key: 'Tab' }, { key: 'Enter' }, { key: 'ArrowRight', altKey: true }, { key: 'ArrowRight', nativeEvent: { isComposing: true } }]) {
      grid.props.onKeyDown({ nativeEvent: {}, target: { closest: () => target }, currentTarget: { contains: () => true },
        preventDefault() { assert.fail('Unrelated key intercepted'); }, stopPropagation() { assert.fail('Unrelated key swallowed'); }, ...event });
    }
    assert.equal(cells[0].props.label, `${colLabels[0]}${rowLabels[0]}, black, last move`);
    assert.equal(cells[0].props.canInteract, false);
    cells[1].props.onClick(); assert.deepEqual(clicked, [[source, color === 'white' ? 17 : 1]]);
  }
});
