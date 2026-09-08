const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {transformSync}=require('esbuild');

function fixture() {
  const slots=[],effects=[],requests=[],navigations=[];
  let cursor=0,dirty=false,disposed=false,updatesAfterDispose=0,userId=5,tree;
  let props={src:'/shared-prompts/7',isPreview:true};
  const hooks={...React,useMemo:fn=>fn(),useState(initial){
    const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;
    return [slots[index],next=>{if(disposed)updatesAfterDispose++;const value=typeof next==='function'?next(slots[index]):next;if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}}];
  },useEffect(effect,deps){
    const index=cursor++,previous=slots[index];
    if(!previous||deps.length!==previous.deps.length||deps.some((v,i)=>!Object.is(v,previous.deps[i]))){slots[index]={deps,cleanup:previous?.cleanup};effects.push(()=>{slots[index].cleanup?.();slots[index].cleanup=effect();});}
  }};
  const ErrorState=({onRetry})=>React.createElement('section',{role:'alert'},React.createElement('button',{onClick:onRetry},'Retry attachment'));
  const loadSharedPrompt=id=>new Promise((resolve,reject)=>requests.push({id,resolve,reject}));
  const dependencies={
    react:hooks,'@emotion/css':require('@emotion/css'),
    '~/contexts':{useKeyContext:selector=>selector({myState:{userId}}),useAppContext:selector=>selector({requestHelpers:{loadSharedPrompt}})},
    '~/components/Loading':()=>React.createElement('span',null,'Loading preview'),
    '../../InvalidContent':()=>React.createElement('span',null,'Invalid Content'),
    '../../EmbedLoadError':ErrorState,
    '~/components/ErrorBoundary':({children})=>children,
    '~/components/Buttons/CloneButtons':()=>React.createElement('button',null,'Clone controls'),
    '~/components/SharedPromptBlock':({title,children,footer})=>React.createElement('section',null,React.createElement('h3',null,title),children,footer),
    '~/components/Texts/RichText':({children})=>React.createElement('p',null,children),
    '~/components/Texts/UsernameText':({user})=>React.createElement('span',null,user.username),
    '../DefaultComponent':()=>React.createElement('span',null,'Browse shared prompts'),
    'react-router-dom':{useNavigate:()=>value=>navigations.push(value)},
    '~/constants/css':{Color:{darkerGray:()=> '#334155',gray:()=> '#64748b'},mobileMaxWidth:'767px'},
    '~/helpers/stringHelpers':{getPlainPreviewText:text=>text},
    '~/helpers/timeStampHelpers':{timeSince:()=> 'a moment ago'}
  };
  const mod={exports:{}};
  new Function('require','module','exports',transformSync(readFileSync(path.resolve(__dirname,'../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/SharedPromptComponent/index.tsx'),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{assert.ok(Object.hasOwn(dependencies,name),name);return dependencies[name];},mod,mod.exports);
  function nodes(value=tree){return React.isValidElement(value)?[value,...React.Children.toArray(value.props.children).flatMap(child=>nodes(child))]:[];}
  return {requests,navigations,
    setUser(id){userId=id;},
    render(next={}){props={...props,...next};for(let pass=0;pass<20;pass++){cursor=0;dirty=false;tree=mod.exports.default(props);while(effects.length)effects.shift()();if(!dirty)return renderToStaticMarkup(tree);}throw new Error('Unexpected render loop');},
    retry(){const error=nodes().find(node=>node.type===ErrorState);assert.ok(error,'Retry is offered');error.props.onRetry();},
    open(){let stopped=false;nodes().find(node=>node.type==='button').props.onClick({stopPropagation(){stopped=true;}});assert.ok(stopped);},
    dispose(){disposed=true;for(const slot of slots)slot?.cleanup?.();},get updatesAfterDispose(){return updatesAfterDispose;}
  };
}
const prompt=(id,title)=>({prompt:{id,content:title,userId:9,username:'Mina',customInstructions:'Keep the discussion friendly.',profileTheme:'gold'}});
async function settle(){await Promise.resolve();await Promise.resolve();await Promise.resolve();}

test('shared-prompt failures offer retry and recover without an empty initial frame',async()=>{
  const app=fixture();assert.match(app.render(),/Loading preview/);app.requests[0].reject(new Error('Isolated failure'));await settle();
  assert.match(app.render(),/Retry attachment/);app.retry();app.retry();app.render();assert.equal(app.requests.length,2);
  app.requests[1].resolve(prompt(7,'Recovered prompt'));await settle();assert.match(app.render(),/Recovered prompt/);
  app.open();assert.deepEqual(app.navigations,['/shared-prompts/7']);
});

test('a previous missing prompt cannot remain latched onto a new target',async()=>{
  const app=fixture();app.render();app.requests[0].resolve({prompt:null});await settle();assert.match(app.render(),/Invalid Content/);
  app.render({src:'/shared-prompts/8'});app.requests[1].resolve(prompt(8,'A different prompt'));await settle();
  assert.match(app.render(),/A different prompt/);assert.doesNotMatch(app.render(),/Invalid Content/);
});

test('out-of-order prompt responses cannot replace the current target',async()=>{
  const app=fixture();app.render();app.render({src:'/shared-prompts/8'});
  app.requests[1].resolve(prompt(8,'Current prompt'));await settle();app.render();
  app.requests[0].resolve(prompt(7,'Old prompt'));await settle();
  assert.match(app.render(),/Current prompt/);assert.doesNotMatch(app.render(),/Old prompt/);
  app.open();assert.deepEqual(app.navigations,['/shared-prompts/8']);
});

test('viewer changes refresh viewer-specific clone data and retain ownership gates',async()=>{
  const app=fixture();app.render({isPreview:false});app.requests[0].resolve(prompt(7,'Community prompt'));await settle();
  assert.match(app.render(),/Clone controls/);app.setUser(9);assert.match(app.render(),/Loading preview/);assert.equal(app.requests.length,2);
  app.requests[1].resolve(prompt(7,'Owner prompt'));await settle();assert.doesNotMatch(app.render(),/Clone controls/);
  app.setUser(0);app.render();app.requests[2].resolve(prompt(7,'Public prompt'));await settle();assert.doesNotMatch(app.render(),/Clone controls/);
});

test('leaving for the prompt listing and unmounting ignore obsolete requests',async()=>{
  const app=fixture();app.render();assert.match(app.render({src:'/shared-prompts/'}),/Browse shared prompts/);
  app.requests[0].reject(new Error('Obsolete failure'));await settle();assert.match(app.render(),/Browse shared prompts/);
  const closed=fixture();closed.render();closed.dispose();closed.requests[0].resolve(prompt(7,'Closed'));await settle();assert.equal(closed.updatesAfterDispose,0);
});

test('prompt links parse query and fragment boundaries and reject invalid IDs before requests',()=>{
  for(const [src,id] of [['/shared-prompts/7#details',7],['/shared-prompts/?promptId=9#details',9],['/shared-prompts/7/?from=chat',7]]) {
    const app=fixture();app.render({src});assert.equal(app.requests[0].id,id);
  }
  for(const value of ['0','-1','abc','1.5','Infinity','9007199254740992']) {
    const app=fixture();assert.match(app.render({src:`/shared-prompts/${value}`}),/Invalid Content/);assert.equal(app.requests.length,0);
  }
});
