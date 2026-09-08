const { assert, test, compile, driver, nodes, deferred, settle, source } = require('./helpers/chatDialogHarness.cjs');
function fixture(callbacks = {}) {
  const d = driver(), Button = () => null;
  const Component = compile('src/containers/Chat/Chess/RewindRequestButton.tsx', {
    react:d.hooks, '~/constants/css':{Color:{black:()=> '#000',white:()=> '#fff'}},
    '~/components/Button':Button, '~/components/Icon':()=>null,
    '../Modals/useChatDialogRequest':compile('src/containers/Chat/Modals/useChatDialogRequest.ts',{react:d.hooks}).default
  }).default;
  const render = () => d.render(()=>Component({isMyMessage:false,...callbacks}));
  return {d,render,buttons:tree=>nodes(tree,n=>n.type===Button)};
}
test('retry responses lock conflicting actions and allow recovery after rejection', async () => {
  const pending = deferred(); let accepted = 0, declined = 0;
  const f = fixture({onAcceptRewind:()=>{accepted++;return pending.promise;},onDeclineRewind:async()=>{declined++;}});
  const old = f.buttons(f.render()); old[0].props.onClick(); old[1].props.onClick(); old[0].props.onClick();
  assert.equal(accepted,1); assert.equal(declined,0);
  assert.ok(f.buttons(f.render()).every(b=>b.props.disabled));
  pending.reject(Error('offline')); await settle();
  const failed = f.render(); assert.equal(nodes(failed,n=>n.props?.role==='alert').length,1);
  assert.ok(f.buttons(failed).every(b=>!b.props.disabled));
  await f.buttons(failed)[1].props.onClick(); await settle();
  assert.equal(declined,1);
  const done = f.render(); assert.equal(nodes(done,n=>n.props?.role==='status').length,1);
  assert.ok(f.buttons(done).every(b=>b.props.disabled));
  old[0].props.onClick(); assert.equal(accepted,1);
  f.d.dispose();
});
test('missing actions are disabled and late completion after unmount does not update state', async () => {
  const absent = fixture(); assert.ok(absent.buttons(absent.render()).every(b=>b.props.disabled)); absent.d.dispose();
  const pending=deferred(), f=fixture({onAcceptRewind:()=>pending.promise});
  f.buttons(f.render())[0].props.onClick(); f.d.dispose(); pending.resolve(); await settle();
  assert.equal(f.d.lateUpdates,0);
  assert.match(source('src/containers/Chat/Chess/index.tsx'), /key=\{`\$\{userId\}:\$\{channelId\}:\$\{rewindRequestId\}`\}/);
});

test('sender cancellation announces pending and success without contradictory opponent waiting text', async () => {
  const pending=deferred(); let calls=0;
  const f=fixture({isMyMessage:true,onCancelRewindRequest:()=>{calls++;return pending.promise;}});
  const start=f.render();
  assert.equal(nodes(start,n=>n.props?.children==='Waiting for response...').length,1);
  const button=f.buttons(start)[0]; button.props.onClick(); button.props.onClick();
  const busy=f.render(); assert.equal(calls,1);
  assert.equal(nodes(busy,n=>n.props?.children==='Waiting for response...').length,0);
  assert.equal(nodes(busy,n=>n.props?.role==='status')[0].props.children,'Canceling request…');
  assert.equal(f.buttons(busy)[0].props.loading,true);
  pending.resolve(); await settle();
  const done=f.render();
  assert.equal(nodes(done,n=>n.props?.children==='Waiting for response...').length,0);
  assert.match(nodes(done,n=>n.props?.role==='status')[0].props.children,/Request canceled/);
  assert.equal(f.buttons(done)[0].props.disabled,true);
  f.d.dispose();
});
