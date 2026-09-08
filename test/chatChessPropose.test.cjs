const { assert, test, React, compile, css, source } = require('./helpers/chatDialogHarness.cjs');
test('retry proposal is a named native button with readable wrapping and keyboard focus', () => {
  const Propose = compile('src/containers/Chat/Message/MessageBody/TargetChessPosition/ProposeButton.tsx', {
    react:React,'~/components/Icon':()=>null,'@emotion/css':{css},
    '~/constants/css':{mobileMaxWidth:'767px',Color:{black:()=> '#000',vantaBlack:()=> '#000'}}
  }).default;
  let calls=0; const button=Propose({label:'Propose retrying this move',onClick:()=>calls++});
  assert.equal(button.type,'button'); assert.equal(button.props.type,'button');
  assert.equal(button.props['aria-label'],'Propose retrying this move');
  assert.match(button.props.className,/min-height: 44px/);
  assert.match(button.props.className,/focus-visible/);
  assert.match(button.props.className,/overflow-wrap: anywhere/);
  button.props.onClick(); assert.equal(calls,1);
  assert.equal(button.props.onPointerDown,undefined);
});
test('quoted chess position keeps proposal in flow rather than covering its board', () => {
  const target=source('src/containers/Chat/Message/MessageBody/TargetChessPosition/index.tsx');
  assert.doesNotMatch(target,/position: 'absolute'/);
  assert.match(target,/flexDirection: 'column'/);
  assert.match(target,/boxSizing: 'border-box'/);
  assert.match(target,/!chessState.isRewindRequest/);
});
