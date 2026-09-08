const { assert, test, React, compile, css, nodes, find, driver } = require('./helpers/chatDialogHarness.cjs');
const Square = compile('src/containers/Chat/Chess/Square.tsx', {
  react: { ...React, memo: fn => fn }, '@emotion/css': { css },
  '~/constants/css': { mobileMaxWidth: '767px', Color: { brownOrange: () => 'orange' } }
}).default;
test('squares use native activation while captured pieces remain named noninteractive images', () => {
  let calls = 0;
  const button = Square({ interactive: true, label: 'e1, white king', onClick: () => calls++ });
  assert.equal(button.type, 'button'); assert.equal(button.props.type, 'button');
  assert.equal(button.props.onPointerDown, undefined); button.props.onClick(); assert.equal(calls, 1);
  assert.match(button.props.className, /focus-visible/);
  const captured = Square({ label: '2 captured white rook', count: 2 });
  assert.equal(captured.type, 'div'); assert.equal(captured.props.role, 'img');
  assert.equal(captured.props.tabIndex, undefined);
  const image = find(Square({ label: 'e1, white king', interactive: true, img: { src: 'king.svg', style: { position: 'absolute' } } }), n => n.type === 'img');
  assert.equal(image.props.style.top, 0); assert.equal(image.props.style.left, 0);
  assert.equal(image.props.style.height, '100%'); assert.equal(image.props.alt, '');
});

test('read-only squares cannot invoke move callbacks and opening remains a separate board action', () => {
  const d = driver();
  const Board = compile('src/containers/Chat/Chess/Game/Board.tsx', {
    react: d.hooks, '../Square': Square, '../helpers/piece': () => ({}),
    '~/constants/css': { mobileMaxWidth: '767px' }, '@emotion/css': { css },
    './CastlingButton': () => null, '../../BoardSpoiler': () => null
  }).default;
  for (const onBoardClick of [undefined, () => {}]) {
    const tree = d.render(() => Board({ myColor: 'white', interactable: false, spoilerOff: true, squares: Array(64).fill({}), onClick: () => assert.fail('read-only move'), onBoardClick }));
    const cells = nodes(tree, n => n.type === Square);
    assert.equal(cells.filter(n => n.props.tabIndex === 0).length, 1);
    assert.ok(cells.every(n => n.props.onClick === undefined));
    assert.ok(cells.every(n => n.props.interactive === !!onBoardClick));
    const grid = find(tree, n => !!n.props?.onKeyDown);
    for (const extra of [{key:'Tab'}, {key:'Enter'}, {key:' '}, {key:'ArrowRight',altKey:true}, {key:'ArrowRight',metaKey:true}, {key:'ArrowRight',nativeEvent:{isComposing:true}}]) {
      grid.props.onKeyDown({nativeEvent:{}, target:{closest:()=>({dataset:{chessIndex:'60'}})}, currentTarget:{contains:()=>true}, preventDefault:()=>assert.fail('unrelated key intercepted'), ...extra});
    }
  }
  d.dispose();
});
test('board navigation has one entry point, names both orientations and never selects on arrows', () => {
  for (const color of ['white', 'black']) {
    const d = driver(), moves = [];
    const Board = compile('src/containers/Chat/Chess/Game/Board.tsx', {
      react: d.hooks, '../Square': Square, '../helpers/piece': () => ({}),
      '~/constants/css': { mobileMaxWidth: '767px' }, '@emotion/css': { css },
      './CastlingButton': () => null, '../../BoardSpoiler': () => null
    }).default;
    const props = { myColor: color, interactable: true, spoilerOff: true, squares: Array.from({length:64}, () => ({})), onClick: i => moves.push(i) };
    let tree = d.render(() => Board(props));
    const cells = nodes(tree, n => n.type === Square);
    assert.equal(cells.length, 64); assert.equal(cells.filter(n => n.props.tabIndex === 0).length, 1);
    assert.equal(cells[0].props.label, color === 'white' ? 'a8, empty' : 'h1, empty');
    const grid = find(tree, n => !!n.props?.onKeyDown);
    for (const [key, index, expected, ctrlKey] of [['ArrowLeft',0,0],['ArrowRight',7,7],['ArrowUp',0,0],['ArrowDown',63,63],['ArrowUp',60,52],['ArrowRight',60,61],['Home',60,56],['End',60,63],['Home',60,0,true],['End',0,63,true]]) {
      let focused, prevented = false;
      grid.props.onKeyDown({ key, ctrlKey, nativeEvent: {}, target: { closest: () => ({dataset:{chessIndex:String(index)}}) }, currentTarget: { contains: () => true, querySelector: selector => ({ focus: () => { focused = selector; } }) }, preventDefault: () => { prevented = true; }, stopPropagation() {} });
      assert.equal(prevented, true); assert.equal(focused, `[data-chess-index="${expected}"]`);
    }
    assert.deepEqual(moves, []);
    tree = d.render(() => Board(props));
    assert.equal(nodes(tree, n => n.type === Square && n.props.tabIndex === 0).length, 1);
    cells[60].props.onClick(); assert.deepEqual(moves, [60]);
    d.dispose();
  }
});
