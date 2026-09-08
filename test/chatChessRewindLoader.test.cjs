const { assert, test, compile, driver, nodes, deferred, settle } = require('./helpers/chatDialogHarness.cjs');
const valid = id => ({id,userId:2,chessState:{isRewindRequest:true,isDiscussion:true}});
function fixture(fetch) {
  const d=driver(), Chess=()=>null, Button=()=>null;
  const Component=compile('src/containers/Chat/Modals/GameModals/ChessModal/Rewind.tsx',{
    react:d.hooks,'../../../Chess':Chess,'~/components/Button':Button,
    '~/contexts':{useAppContext:fn=>fn({requestHelpers:{fetchCurrentRewindRequest:fetch}}),useChatContext:fn=>fn({state:{chessThemeVersion:1}})},
    '../../../Chess/helpers/theme':{getUserChatSquareColors:()=>undefined}
  }).default;
  const props={myId:1,channelId:10,rewindRequestId:20};
  return {d,props,Chess,Button,render:()=>d.render(()=>Component(props))};
}
test('failed retry-position load exposes recovery and then renders the validated current position',async()=>{
  let calls=0; const f=fixture(async()=>{if(++calls===1)throw Error('offline');return valid(20);});
  assert.equal(nodes(f.render(),n=>n.props?.role==='status').length,1);
  await settle(); let tree=f.render(); assert.equal(nodes(tree,n=>n.props?.role==='alert').length,1);
  nodes(tree,n=>n.type===f.Button)[0].props.onClick(); f.render(); await settle(); tree=f.render();
  assert.equal(tree.type,f.Chess);assert.equal(tree.props.messageId,20);assert.equal(calls,2);f.d.dispose();
});
test('switching requests hides old data and ignores late completions, including unmount',async()=>{
  const old=deferred(),next=deferred(); const f=fixture(({rewindRequestId})=>rewindRequestId===20?old.promise:next.promise);
  f.render();f.props.rewindRequestId=21; f.render();
  next.resolve(valid(21));await settle();assert.equal(f.render().props.messageId,21);
  old.resolve(valid(20));await settle();assert.equal(f.render().props.messageId,21);
  f.props.myId=3;assert.notEqual(f.render().type,f.Chess);await settle();f.render();f.d.dispose();
  const late=deferred(),g=fixture(()=>late.promise);g.render();g.d.dispose();late.resolve(valid(20));await settle();assert.equal(g.d.lateUpdates,0);
});
test('malformed or mismatched responses never render actionable chess; invalid IDs do not fetch',async()=>{
  for(const response of [null,valid(99),{id:20,userId:2,chessState:[]},{id:20,userId:2,chessState:{}},{...valid(20),userId:0}]){
    const f=fixture(async()=>response);f.render();await settle();const tree=f.render();assert.notEqual(tree.type,f.Chess);assert.equal(nodes(tree,n=>n.props?.role==='alert').length,1);f.d.dispose();
  }
  let calls=0;const f=fixture(async()=>{calls++;return valid(20);});f.props.channelId=0;f.render();await settle();f.render();assert.equal(calls,0);f.d.dispose();
});
