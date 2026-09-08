const { assert, test, compile, driver, css, nodes, deferred, settle } = require('./helpers/chatDialogHarness.cjs');
test('record presentation keeps readable text, full-size controls and a keyboard-scrollable PGN', async () => {
  const f = fixture(async () => ({finished:true,fen:'position',pgn:'moves '.repeat(100)}));
  f.buttons(f.render())[0].props.onClick(); await settle();
  const tree = f.render(), pgn = nodes(tree, n => n.type === 'pre')[0];
  assert.equal(pgn.props.tabIndex, 0);
  assert.equal(pgn.props['aria-label'], 'PGN move list');
  assert.match(pgn.props.className, /font-size: 14px/);
  assert.match(pgn.props.className, /min-width: 0/);
  assert.match(pgn.props.className, /overflow-y: auto/);
  assert.ok(nodes(tree, n => typeof n.props?.className === 'string' && n.props.className.includes('min-height: 44px')).length);
  f.d.dispose();
});
function fixture(fetch,write=async()=>{}) {
  const d=driver(),timers=new Map();let timerId=0,userId=1;
  const Wrapper=compile('src/containers/Chat/Chess/GameRecord.tsx',{
    react:d.hooks,'~/components/ErrorBoundary':()=>null,'@emotion/css':{css},
    '~/constants/css':{mobileMaxWidth:'767px',Color:new Proxy({},{get:()=>()=> '#555'})},
    '~/contexts':{useKeyContext:fn=>fn({myState:{userId}}),useAppContext:fn=>fn({requestHelpers:{fetchChessGameRecord:fetch}})}
  },{navigator:{clipboard:{writeText:write}},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)}).default;
  const props={channelId:10,messageId:20,showPgn:true};const wrapper=()=>Wrapper(props);
  const render=()=>d.render(()=>{const node=wrapper();return node.type(node.props);});
  return {d,timers,props,wrapper,render,setUser:id=>{userId=id;},buttons:tree=>nodes(tree,n=>n.type==='button')};
}
test('record reveal locks duplicates and rejects malformed data while allowing retry',async()=>{
  const pending=deferred();let calls=0;const f=fixture(()=>{calls++;return pending.promise;});
  const button=f.buttons(f.render())[0];button.props.onClick();button.props.onClick();assert.equal(calls,1);
  pending.resolve({finished:true});await settle();let tree=f.render();assert.equal(nodes(tree,n=>n.props?.role==='alert').length,1);
  assert.equal(f.buttons(tree)[0].props.disabled,false);f.d.dispose();
});
test('record identity includes viewer/channel/message/mode and late requests cannot update unmounted state',async()=>{
  const pending=deferred(),f=fixture(()=>pending.promise);const keys=[f.wrapper().key];
  f.setUser(2);keys.push(f.wrapper().key);f.props.channelId=11;keys.push(f.wrapper().key);f.props.messageId=21;keys.push(f.wrapper().key);f.props.showPgn=false;keys.push(f.wrapper().key);
  assert.equal(new Set(keys).size,5);
  f.buttons(f.render())[0].props.onClick();f.d.dispose();pending.resolve({finished:false});await settle();assert.equal(f.d.lateUpdates,0);
});
test('clipboard failure is visible, newer copy wins and unmount clears feedback timers',async()=>{
  const copies=[];const f=fixture(async()=>({finished:true,fen:'position',pgn:'moves'}),()=>{const p=deferred();copies.push(p);return p.promise;});
  f.buttons(f.render())[0].props.onClick();await settle();let tree=f.render();
  let buttons=f.buttons(tree);buttons[0].props.onClick();copies[0].reject(Error('denied'));await settle();tree=f.render();assert.equal(nodes(tree,n=>n.props?.role==='alert').length,1);
  buttons=f.buttons(tree);buttons[0].props.onClick();buttons[1].props.onClick();copies[2].resolve();await settle();copies[1].resolve();await settle();tree=f.render();
  assert.equal(f.buttons(tree)[1].props['aria-label'],'PGN copied');assert.equal(f.timers.size,1);
  f.d.dispose();assert.equal(f.timers.size,0);assert.equal(f.d.lateUpdates,0);
});
