const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {transformSync} = require('esbuild');

function compile(relative, dependencies) {
  const mod={exports:{}};
  new Function('require','module','exports','navigator',transformSync(readFileSync(path.resolve(__dirname,'../',relative),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{
    assert.ok(Object.hasOwn(dependencies,name),`Unexpected dependency: ${name}`);
    return dependencies[name];
  },mod,mod.exports,{userAgent:'Local test'});
  return mod.exports.default;
}
const reducer=compile('src/contexts/Mission/reducer.ts',{});
function fixture(options={}) {
  const slots=[], effects=[], requests=[], writes=[];
  let cursor=0, dirty=false, disposed=false, updatesAfterDispose=0;
  let userId=options.userId??5;
  let state={missionObj:{},missionTypeIdHash:undefined,prevUserId:null,...options.state};
  let props={src:'/missions/community',isPreview:true};
  const hooks={...React,useMemo:fn=>fn(),
    useState(initial) {
      const index=cursor++;
      if(!(index in slots)) slots[index]=typeof initial==='function'?initial():initial;
      return [slots[index],next=>{
        if(disposed) updatesAfterDispose++;
        const value=typeof next==='function'?next(slots[index]):next;
        if(!Object.is(value,slots[index])) {slots[index]=value;dirty=true;}
      }];
    },
    useRef(initial) {const index=cursor++;slots[index]??={current:initial};return slots[index];},
    useEffect(effect,deps) {
      const index=cursor++, previous=slots[index];
      if(!previous||!deps||deps.length!==previous.deps.length||deps.some((value,i)=>!Object.is(value,previous.deps[i]))) {
        slots[index]={deps,cleanup:previous?.cleanup};
        effects.push(()=>{slots[index].cleanup?.();slots[index].cleanup=effect();});
      }
    }
  };
  const dispatch=action=>{writes.push(action);state=reducer(state,action);dirty=true;};
  const actions={
    onLoadMissionTypeIdHash:hash=>dispatch({type:'LOAD_MISSION_TYPE_ID_HASH',hash}),
    onLoadMission:args=>dispatch({type:'LOAD_MISSION',...args})
  };
  const request=(name,args)=>new Promise((resolve,reject)=>requests.push({name,args,resolve,reject}));
  const requestHelpers={loadMissionTypeIdHash:()=>request('definitions'),loadMission:args=>request('mission',args)};
  const ErrorState=({onRetry})=>React.createElement('section',{role:'alert'},'Could not load this attachment.',React.createElement('button',{onClick:onRetry},'Retry attachment'));
  const dependencies={
    react:hooks,'~/helpers':{isMobile:()=>false},
    '~/contexts':{
      useKeyContext:selector=>selector({myState:{userId}}),
      useAppContext:selector=>selector({requestHelpers}),
      useMissionContext:selector=>selector({state,actions})
    },
    '~/components/MissionItem':({mission})=>React.createElement('p',null,mission.title),
    '~/components/CompactMissionEmbedPreview':({mission})=>React.createElement('p',null,mission.title),
    '~/components/ChatMissionEmbedPreview':({mission})=>React.createElement('p',null,mission.title),
    '~/components/Loading':()=>React.createElement('span',null,'Loading preview'),
    '../InvalidContent':()=>React.createElement('span',null,'Invalid Content'),
    '../EmbedLoadError':ErrorState,
    '~/components/LoginToViewContent':()=>React.createElement('span',null,'Log in to view')
  };
  const Component=compile('src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/MissionComponent.tsx',dependencies);
  let tree;
  return {
    requests,writes,
    get state(){return state;},
    setUser(id){userId=id;},
    render(next={}) {
      props={...props,...next};
      for(let pass=0;pass<20;pass++) {
        cursor=0;dirty=false;tree=Component(props);
        while(effects.length) effects.shift()();
        if(!dirty) return renderToStaticMarkup(tree);
      }
      throw new Error('Unexpected mission render loop');
    },
    retry(){assert.equal(tree.type,ErrorState,'The actual loader offers retry');tree.props.onRetry();},
    dispose(){disposed=true;for(const slot of slots) slot?.cleanup?.();},
    get updatesAfterDispose(){return updatesAfterDispose;}
  };
}
async function settle(){await Promise.resolve();await Promise.resolve();await Promise.resolve();}

test('failed mission definitions stop loading and retry through canonical mission hydration',async()=>{
  const app=fixture();assert.match(app.render(),/Loading preview/);
  app.requests[0].reject(new Error('Isolated definition failure'));await settle();
  assert.match(app.render(),/Retry attachment/);assert.doesNotMatch(app.render(),/Loading preview/);
  app.retry();app.render();assert.equal(app.requests.length,2);
  app.requests[1].resolve({community:7});await settle();app.render();
  assert.deepEqual(app.requests[2].args,{missionId:7,isTask:false});
  app.requests[2].resolve({page:{id:7,title:'Community mission'}});await settle();
  assert.match(app.render(),/Community mission/);
  assert.equal(app.state.missionObj[7].loaded,true);assert.equal(app.state.missionObj[7].prevUserId,5);
});

test('missing mission IDs settle on unavailable content instead of another spinner',async()=>{
  const app=fixture();app.render();app.requests[0].resolve({another:9});await settle();
  assert.match(app.render(),/Invalid Content/);assert.equal(app.requests.length,1);
});

test('a cached current-user mission becomes visible after its definition lookup finishes',async()=>{
  const app=fixture({state:{prevUserId:5,missionObj:{7:{id:7,title:'Cached mission',loaded:true,prevUserId:5}}}});
  app.render();app.requests[0].resolve({community:7});await settle();
  assert.match(app.render(),/Cached mission/);assert.equal(app.requests.length,1);
});

test('a page failure retries once and a real missing page stays an unavailable result',async()=>{
  const app=fixture({state:{missionTypeIdHash:{community:7}}});app.render();
  app.requests[0].reject(new Error('Isolated page failure'));await settle();
  assert.match(app.render(),/Retry attachment/);
  app.retry();app.retry();app.render();assert.equal(app.requests.length,2);
  app.requests[1].resolve({page:null});await settle();
  assert.match(app.render(),/Invalid Content/);assert.equal(app.writes.length,0);
});

test('changing targets ignores both late successful pages and late errors',async()=>{
  const app=fixture({state:{missionTypeIdHash:{community:7,reading:8}}});app.render();
  app.render({src:'/missions/reading'});assert.equal(app.requests.length,2);
  app.requests[1].resolve({page:{id:8,title:'Current reading mission'}});await settle();
  assert.match(app.render(),/Current reading mission/);
  app.requests[0].resolve({page:{id:7,title:'Old community mission'}});await settle();
  assert.match(app.render(),/Current reading mission/);assert.equal(app.state.missionObj[7],undefined);
  app.render({src:'/missions/community'});app.render({src:'/missions/reading'});
  app.requests[2].reject(new Error('Late old target failure'));await settle();
  assert.match(app.render(),/Current reading mission/);assert.doesNotMatch(app.render(),/Retry attachment|Invalid Content/);
});

test('mission freshness uses its own viewer marker, not a different mission’s global marker',async()=>{
  const app=fixture({userId:6,state:{prevUserId:6,missionTypeIdHash:{community:7},missionObj:{7:{id:7,title:'Previous viewer data',loaded:true,prevUserId:5}}}});
  assert.match(app.render(),/Loading preview/);assert.equal(app.requests.length,1);
  app.setUser(9);app.render();assert.equal(app.requests.length,2);
  app.requests[0].resolve({page:{id:7,title:'Stale viewer six'}});await settle();
  assert.equal(app.writes.length,0);
  app.requests[1].resolve({page:{id:7,title:'Current viewer nine'}});await settle();
  assert.match(app.render(),/Current viewer nine/);assert.equal(app.state.missionObj[7].prevUserId,9);
});

test('logout and unmount prevent obsolete cache writes and local state updates',async()=>{
  const app=fixture();app.render();app.setUser(0);assert.match(app.render(),/Log in to view/);
  app.requests[0].resolve({community:7});await settle();assert.equal(app.writes.length,0);
  const closed=fixture({state:{missionTypeIdHash:{community:7}}});closed.render();closed.dispose();
  closed.requests[0].resolve({page:{id:7,title:'Closed'}});await settle();
  assert.equal(closed.writes.length,0);assert.equal(closed.updatesAfterDispose,0);
  const guest=fixture({userId:0});assert.match(guest.render(),/Log in to view/);assert.equal(guest.requests.length,0);
});

test('task links retain their task flag while query, fragment and trailing slash are ignored for lookup',()=>{
  const app=fixture({state:{missionTypeIdHash:{community:7,reading:8}}});
  app.render({src:'/missions/community/reading/?from=chat#details'});
  assert.deepEqual(app.requests[0],{...app.requests[0],name:'mission',args:{missionId:8,isTask:true}});
});
