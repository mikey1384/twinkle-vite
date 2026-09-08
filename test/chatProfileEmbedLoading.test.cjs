const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {transformSync}=require('esbuild');
function load(file,dependencies,clock={}){
  const mod={exports:{}};
  new Function('require','module','exports','setTimeout','clearTimeout',transformSync(readFileSync(path.resolve(__dirname,'../',file),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{assert.ok(Object.hasOwn(dependencies,name),name);return dependencies[name];},mod,mod.exports,clock.setTimeout,clock.clearTimeout);
  return mod.exports.default;
}
const reducer=load('src/contexts/Profile/reducer.ts',{});
function fixture(initial={}) {
  const slots=[],effects=[],requests=[],writes=[],timers=new Map();
  let cursor=0,dirty=false,disposed=false,lateUpdates=0,timerId=0,tree;
  let profiles=initial.profiles||{},users=initial.users||{},props={src:'/users/Mina',isPreview:true};
  const hooks={...React,useMemo:fn=>fn(),useState(value){const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return [slots[i],next=>{if(disposed)lateUpdates++;const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},useEffect(effect,deps){const i=cursor++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j]))){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=effect();});}}};
  const dispatch=action=>{writes.push(action);profiles=reducer(profiles,action);dirty=true;};
  const actions={onUserNotExist:username=>dispatch({type:'USER_NOT_EXIST',username}),onSetProfileId:args=>dispatch({type:'SET_PROFILE_ID',...args})};
  const onSetUserState=args=>{writes.push({type:'SET_USER_STATE',...args});users={...users,[args.userId]:{...users[args.userId],...args.newState}};dirty=true;};
  const onInitContent=args=>writes.push({type:'INIT_CONTENT',...args});
  const loadProfileViaUsername=username=>new Promise((resolve,reject)=>requests.push({username,resolve,reject}));
  const ErrorState=({onRetry})=>React.createElement('button',{onClick:onRetry},'Retry attachment');
  const Preview=props=>React.createElement('p',null,JSON.stringify(props));
  const Component=load('src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/UserComponent/index.tsx',{
    react:hooks,'~/helpers/hooks':{useProfileState:username=>profiles[username]||{}},
    '~/contexts':{useAppContext:selector=>selector({requestHelpers:{loadProfileViaUsername},user:{state:{userObj:users},actions:{onSetUserState}}}),useProfileContext:selector=>selector({actions}),useContentContext:selector=>selector({actions:{onInitContent}})},
    '~/components/Loading':()=>React.createElement('span',null,'Loading profile'),
    './DefaultComponent':Preview,'../../EmbedLoadError':ErrorState,'../../InvalidContent':()=>React.createElement('span',null,'Invalid Content')
  },{setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id)});
  return {requests,writes,timers,get profiles(){return profiles;},get users(){return users;},get tree(){return tree;},get lateUpdates(){return lateUpdates;},
    render(next={}){props={...props,...next};for(let n=0;n<20;n++){dirty=false;cursor=0;tree=Component(props);while(effects.length)effects.shift()();if(!dirty)return renderToStaticMarkup(tree);}throw new Error('Render loop');},
    tick(){for(const [id,timer] of [...timers]){timers.delete(id);timer.fn();}},
    retry(){assert.equal(tree.type,ErrorState);tree.props.onRetry();},
    dispose(){disposed=true;for(const slot of slots)slot?.cleanup?.();}
  };
}
async function settle(){await Promise.resolve();await Promise.resolve();await Promise.resolve();}
const user={id:7,username:'Mina',profileTheme:'gold',rank:2,twinkleXP:1000};

test('transient profile failures retain bounded retries without claiming the username is nonexistent',async()=>{
  const app=fixture();assert.match(app.render(),/Loading profile/);
  for(let i=0;i<4;i++){app.requests[i].reject(new Error('Isolated network failure'));await settle();app.render();if(i<3){assert.equal([...app.timers.values()][0].delay,500);app.tick();}}
  assert.equal(app.requests.length,4);assert.equal(app.timers.size,0);
  assert.match(app.render(),/Retry attachment/);assert.equal(app.profiles.Mina?.notExist,undefined);assert.equal(app.writes.length,0);
  app.retry();app.render();app.requests[4].resolve({user});await settle();
  assert.match(app.render(),/Mina/);assert.equal(app.users[7].loaded,true);assert.equal(app.profiles.Mina.profileId,7);
  assert.deepEqual(app.writes.map(w=>w.type),['SET_PROFILE_ID','SET_USER_STATE','INIT_CONTENT']);
});

test('only authoritative not-found responses populate the missing-profile cache and show unavailable content',async()=>{
  const app=fixture();app.render();app.requests[0].resolve({pageNotExists:true});await settle();
  assert.match(app.render(),/Invalid Content/);assert.equal(app.profiles.Mina.notExist,true);assert.equal(app.requests.length,1);
  const cached=fixture({profiles:{Mina:{notExist:true}}});assert.match(cached.render(),/Invalid Content/);assert.equal(cached.requests.length,0);
});

test('changing usernames cancels scheduled retries and ignores obsolete profile responses',async()=>{
  const app=fixture();app.render();app.requests[0].reject(new Error('Retry later'));await settle();app.render();assert.equal(app.timers.size,1);
  app.render({src:'/users/Noah'});assert.equal(app.timers.size,0);app.tick();assert.equal(app.requests.length,2);
  app.requests[1].resolve({user:{...user,id:8,username:'Noah'}});await settle();assert.match(app.render(),/Noah/);
  const pending=fixture();pending.render();pending.render({src:'/users/Noah'});
  pending.requests[0].resolve({pageNotExists:true});await settle();assert.equal(pending.writes.length,0);
  pending.requests[1].resolve({user:{...user,id:8,username:'Noah'}});await settle();assert.match(pending.render(),/Noah/);assert.equal(pending.profiles.Mina,undefined);
});

test('unmount cancels profile retries and blocks cache writes or local updates after an in-flight request',async()=>{
  const app=fixture();app.render();app.requests[0].reject(new Error('Failure'));await settle();app.dispose();assert.equal(app.timers.size,0);app.tick();assert.equal(app.requests.length,1);
  const pending=fixture();pending.render();pending.dispose();pending.requests[0].resolve({user});await settle();assert.equal(pending.writes.length,0);assert.equal(pending.lateUpdates,0);
});

test('profile routes ignore queries/fragments while keeping subpage and canonical display data',async()=>{
  const app=fixture();app.render({src:'/users/Mina/videos/byuser/?from=chat#more'});assert.equal(app.requests[0].username,'Mina');
  app.requests[0].resolve({user});await settle();app.render();assert.equal(app.tree.props.pageType,'videos');assert.equal(app.tree.props.subPageType,'byuser');assert.equal(app.tree.props.src,'/users/Mina/videos/byuser/?from=chat#more');
  const root=fixture();root.render({src:'/users/Mina?from=chat#more'});assert.equal(root.requests[0].username,'Mina');
  const invalid=fixture();assert.match(invalid.render({src:'/users/'}),/Invalid Content/);assert.equal(invalid.requests.length,0);
});

test('cached profiles render immediately and malformed successful payloads never enter shared caches',async()=>{
  const cached=fixture({profiles:{Mina:{profileId:7}},users:{7:{...user,loaded:true}}});assert.match(cached.render(),/Mina/);assert.equal(cached.requests.length,0);
  const app=fixture();app.render();for(let i=0;i<4;i++){app.requests[i].resolve({user:{id:0}});await settle();app.render();if(i<3)app.tick();}
  assert.match(app.render(),/Retry attachment/);assert.equal(app.writes.length,0);
});
