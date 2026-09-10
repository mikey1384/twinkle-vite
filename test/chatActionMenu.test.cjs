const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const {transformSync} = require('esbuild');
const base = 'src/containers/Chat/Message/MessageBody/';
function load(file, deps, doc = {}) {
  const mod = {exports:{}};
  new Function('require','module','exports','navigator','document', transformSync(readFileSync(path.resolve(__dirname,'..',file),'utf8'), {loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{assert.ok(Object.hasOwn(deps,name),name);return deps[name];},mod,mod.exports,{},doc);
  return mod.exports.default;
}
const walk = node => React.isValidElement(node) ? [node,...React.Children.toArray(node.props.children).flatMap(walk)] : [];
function loadModule(file, deps) {
  const mod = {exports:{}};
  new Function('require','module','exports', transformSync(readFileSync(path.resolve(__dirname,'..',file),'utf8'), {loader:'ts',format:'cjs'}).code)(name=>{assert.ok(Object.hasOwn(deps,name),name);return deps[name];},mod,mod.exports);
  return mod.exports;
}
function menuFixture() {
  const Button = () => null, refs = [], order = [], doc = {activeElement:null};
  let shown = false, stateCursor = 0, refCursor = 0, tree, outside;
  const deps = {
    react:{...React,useEffect(){},useLayoutEffect(){},useId:()=> 'action-options',useState(value){const slot=stateCursor++;return slot===0?[shown,value=>{shown=typeof value==='function'?value(shown):value;order.push(`shown:${shown}`);}]:[value,()=>{}];},useRef(value){return refs[refCursor++] ||= {current:value};}},
    '@emotion/css':require('@emotion/css'),'~/components/Button':Button,'~/components/Icon':()=>null,
    '~/helpers':{isMobile:()=>false},'~/helpers/hooks':{useOutsideClick(ref,close,options){outside={ref,close,options};}},'./reactionPickerLayout':{},'./messageControlStyles':{messageControlClass:'compact-message-control'}
  };
  deps['./hooks/usePointerBlurGuard'] = loadModule(base+'hooks/usePointerBlurGuard.ts', deps);
  const Menu = load(base+'ActionMenu.tsx', deps, doc);
  return {
    order,doc,refs,
    get shown(){return shown;}, get root(){return tree;}, get nodes(){return walk(tree);},get outside(){return outside;},
    get trigger(){return walk(tree).find(node=>node.type===Button);},
    render(items=[{id:'reply',label:'Reply',onClick(){order.push('action');}}]){stateCursor=refCursor=0;tree=Menu({items});return tree;}
  };
}
function event(key) { return {key,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}}; }

test('chat and Wordle actions stay discoverable on tablets and coarse pointers',()=>{
  for(const file of ['index.tsx','WordleResult.tsx']) {
    const source=readFileSync(path.resolve(__dirname,'..',base,file),'utf8');
    assert.match(source,/@media \(max-width: 1024px\), \(pointer: coarse\) \{\s*\.menu-button \{\s*display: block;/);
  }
  const source=readFileSync(path.resolve(__dirname,'..',base,'index.tsx'),'utf8');
  assert.match(source,/paddingRight: 100, minHeight: 44/);
});

test('chat action trigger is named and controls an expanded native-button group',()=>{
  const app=menuFixture();app.render();
  assert.equal(app.root.props.style.display,'inline-flex','anchor must shrink to the trigger, not a full-width parent');
  assert.equal(app.trigger.props['aria-label'],'Message actions');
  assert.equal(app.trigger.props['aria-expanded'],false);
  assert.equal(app.trigger.props.className,'menu-button compact-message-control');
  assert.equal(app.trigger.props.color,'darkerGray');
  assert.equal(app.trigger.props.variant,'solid');assert.equal(app.trigger.props.tone,'raised');
  assert.equal(app.trigger.props.style,undefined,'responsive sizing must not be overridden inline');
  app.trigger.props.onClick(event());app.render();
  assert.equal(app.trigger.props['aria-expanded'],true);
  const group=app.nodes.find(node=>node.props.role==='group');
  assert.equal(group.props.id,app.trigger.props['aria-controls']);
  assert.equal(group.props['aria-label'],'Message actions options');
  const option=app.nodes.find(node=>node.type==='button');
  assert.equal(option.props.type,'button');assert.equal(option.props.children,'Reply');
});

test('Escape closes without executing and restores trigger focus',()=>{
  const app=menuFixture();app.render();app.trigger.props.onClick(event());app.render();
  app.trigger.props.buttonRef.current={focus(){app.order.push('focus');}};
  const key=event('Escape');app.root.props.onKeyDown(key);
  assert.ok(key.prevented&&key.stopped);assert.equal(app.shown,false);
  assert.equal(app.order.at(-1),'focus');assert.ok(!app.order.includes('action'));
});

test('selection closes and restores focus before handing control to Reply/Edit/dialog callbacks',()=>{
  const app=menuFixture();app.render();app.trigger.props.onClick(event());app.render();
  app.trigger.props.buttonRef.current={focus(){app.order.push('focus');}};
  app.order.length=0;app.nodes.find(node=>node.type==='button').props.onClick(event());
  assert.deepEqual(app.order,['shown:false','focus','action']);
});

test('disabled options cannot execute and outside/blur dismiss without stealing focus',()=>{
  const app=menuFixture();const items=[{id:'blocked',label:'Unavailable',disabled:true,onClick(){assert.fail('Disabled callback');}}];
  app.render(items);app.trigger.props.onClick(event());app.render(items);
  app.nodes.find(node=>node.type==='button').props.onClick(event());assert.equal(app.shown,true);
  assert.equal(app.outside.options.enabled,true);assert.equal(app.outside.options.closeOnScroll,false);
  app.outside.close();assert.equal(app.shown,false);assert.ok(!app.order.includes('focus'));
  app.trigger.props.onClick(event());app.render(items);
  app.root.props.onBlur({currentTarget:{contains:()=>true},relatedTarget:{}});assert.equal(app.shown,true);
  app.root.props.onBlur({currentTarget:{contains:()=>false},relatedTarget:{}});assert.equal(app.shown,false);
});

test('arrow/Home/End navigation wraps through enabled native options and Tab remains native',()=>{
  const app=menuFixture();app.render();const open=event('ArrowDown');app.root.props.onKeyDown(open);assert.equal(app.shown,true);app.render();
  const options=['Reply','Remove'].map(name=>({name,focus(){app.doc.activeElement=this;}}));
  const group=app.nodes.find(node=>node.props.role==='group');group.props.ref.current={querySelectorAll(selector){assert.equal(selector,'button:not(:disabled)');return options;}};
  app.root.props.onKeyDown(event('ArrowDown'));assert.equal(app.doc.activeElement.name,'Reply');
  app.root.props.onKeyDown(event('ArrowUp'));assert.equal(app.doc.activeElement.name,'Remove');
  app.root.props.onKeyDown(event('Home'));assert.equal(app.doc.activeElement.name,'Reply');
  app.root.props.onKeyDown(event('End'));assert.equal(app.doc.activeElement.name,'Remove');
  const tab=event('Tab');app.root.props.onKeyDown(tab);assert.equal(tab.prevented,undefined);
});

test('native focus scrolling refits the actions menu; internal scrolling stays open and outside focus dismisses',()=>{
  const ts=require('typescript');
  const file=path.resolve(__dirname,'..',base,'ActionMenu.tsx');
  const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const declarations=[];
  function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='handleScroll')declarations.push(node);ts.forEachChild(node,visit);}
  visit(source);assert.equal(declarations.length,1);
  const trigger={},option={},inside={},outside={};let updates=0,closed=0;
  const root={ownerDocument:{activeElement:trigger},contains:node=>[trigger,option,inside].includes(node)};
  const panel={contains:node=>[option,inside].includes(node)};
  const body=transformSync(declarations[0].getText(source),{loader:'ts'}).code;
  const handle=new Function('rootRef','optionsRef','positionOptions','setShown',body+';return handleScroll;')({current:root},{current:panel},()=>updates++,value=>{assert.equal(value,false);closed++;});
  handle({target:inside});assert.equal(updates,0);assert.equal(closed,0);
  handle({target:outside});assert.equal(updates,1);assert.equal(closed,0);
  root.ownerDocument.activeElement=option;handle({target:outside});assert.equal(updates,2);assert.equal(closed,0);
  root.ownerDocument.activeElement=outside;handle({target:outside});assert.equal(closed,1);
});

function actionsFixture(overrides={}) {
  const calls=[], Menu=()=>null, Reactions=()=>null;
  const Component=load(base+'ActionButtons.tsx',{
    react:{...React,useMemo:fn=>fn(),useCallback:fn=>fn},'@emotion/css':require('@emotion/css'),
    './ActionMenu':Menu,'./ReactionButton':Reactions,'~/components/Icon':()=>null,
    '~/constants/css':{Color:{gold:()=> '#ffca28',magenta:()=> '#e100b4',logoBlue:()=> '#418ceb'}},
    '~/constants/defaultValues':{BOOKMARK_VIEWS:{AI:'ai',ME:'me'}}
  });
  const props={currentChannelId:22,subchannelId:9,messageId:51,myId:1,userId:1,message:{id:51,content:'hello'},
    thumbUrl:'',recentThumbUrl:'recent.png',timeStamp:123,fileName:'photo.png',filePath:'path/photo.png',
    isMenuButtonsAllowed:true,userCanEditThis:true,userCanDeleteThis:true,userCanRewardThis:false,rewardColor:'gold',
    onSetReplyTarget:value=>calls.push(['target',value]),onReplyClick:value=>calls.push(['reply',value]),
    onSetIsEditing:value=>calls.push(['edit',value]),onDelete:value=>calls.push(['delete',value]),onBookmark:(...args)=>calls.push(['bookmark',...args]),
    onOpenRewardModal:()=>calls.push(['reward']),onDropdownShown:shown=>calls.push(['shown',shown]),onSetReactionsMenuShown:shown=>calls.push(['reactions',shown]),...overrides};
  const nodes=walk(Component(props));
  return {calls,props,nodes,menu:nodes.find(node=>node.type===Menu),reaction:nodes.find(node=>node.type===Reactions)};
}

test('message menu preserves Reply/Edit/Remove payloads and closes a competing reaction picker',()=>{
  const app=actionsFixture();assert.deepEqual(app.menu.props.items.map(item=>item.id),['reply','edit','remove']);
  for(const item of app.menu.props.items)item.onClick();
  const target={id:51,content:'hello',thumbUrl:'recent.png',timeStamp:123};
  assert.deepEqual(app.calls,[['target',{channelId:22,subchannelId:9,target}],['reply',target],['edit',{contentId:51,contentType:'chat',isEditing:true}],['delete',{messageId:51,filePath:'path/photo.png',fileName:'photo.png'}]]);
  app.menu.props.onShownChange(true);assert.deepEqual(app.calls.slice(-2),[['shown',true],['reactions',false]]);
});

test('restricted, banned, streaming and delete-only permission branches remain intact',()=>{
  assert.equal(actionsFixture({isMenuButtonsAllowed:false}).nodes.length,0);
  assert.equal(actionsFixture({isBanned:true}).menu,undefined);assert.equal(actionsFixture({isBanned:true}).reaction,undefined);
  assert.equal(actionsFixture({isCurrentlyStreaming:true}).menu,undefined);
  const only=actionsFixture({isDeleteOnlyBuildSuggestion:true,isAIChat:true});assert.deepEqual(only.menu.props.items.map(item=>item.id),['remove']);assert.equal(only.reaction,undefined);
  const restricted=actionsFixture({isRestricted:true,userCanEditThis:false,userCanDeleteThis:false});assert.equal(restricted.menu,undefined);
});

test('AI/own bookmark views and reward reply targets retain canonical behavior',()=>{
  for(const [isAIMessage,userId,view] of [[true,3,'ai'],[false,1,'me']]) {
    const app=actionsFixture({isAIChat:true,isAIMessage,userId});app.menu.props.items.find(item=>item.id==='bookmark').onClick();assert.deepEqual(app.calls.at(-1),['bookmark',51,view]);
  }
  const app=actionsFixture({userId:2,userCanRewardThis:true,userCanEditThis:false,userCanDeleteThis:false});
  assert.deepEqual(app.menu.props.items.map(item=>item.id),['reply','reward']);app.menu.props.items[1].onClick();assert.deepEqual(app.calls,[['reward']]);
  const reward=actionsFixture({rewardAmount:100,targetMessage:{id:8},userCanRewardThis:true});reward.menu.props.items.find(item=>item.id==='reply').onClick();assert.deepEqual(reward.calls[1],['reply',{id:8}]);assert.ok(!reward.menu.props.items.some(item=>item.id==='reward'));
});

test('Wordle action uses the shared chat popup and preserves its exact reply target',()=>{
  const calls=[],Menu=()=>null;
  const Wordle=load(base+'WordleResult.tsx',{
    react:{...React,useContext:()=>({actions:{onSetReplyTarget:value=>calls.push(['target',value])}}),useMemo:fn=>fn(),useState:()=>[false,()=>{}]},
    './ActionMenu':Menu,'~/components/Icon':()=>null,'../../Context':{},'@emotion/css':require('@emotion/css'),
    '~/constants/css':{borderRadius:'12px',mobileMaxWidth:'767px',Color:{gold:()=> '#ffca28',gray:()=> '#777',darkBlueGray:()=> '#253247'}},
    '~/helpers/hooks':{useWordleLabels:()=>({})},'../../constants/wordlePresentation':{getWordleBannerLevelColor:()=> '#75c0ff'},moment:{unix:()=>({format:()=> 'date'})}
  });
  const props={channelId:22,messageId:7,userId:1,myId:1,username:'Mina',timeStamp:123,wordleResult:{isSolved:true,numGuesses:1},onReplyClick:target=>calls.push(['reply',target])};
  const menu=walk(Wordle(props)).find(node=>node.type===Menu);assert.equal(menu.props.label,'Wordle result actions');menu.props.items[0].onClick();
  const target={id:7,wordleResult:props.wordleResult,timeStamp:123,userId:1,username:'Mina'};
  assert.deepEqual(calls,[['target',{channelId:22,target}],['reply',target]]);
});

test('a press inside the open menu survives a Safari blur with no relatedTarget', () => {
  const app = menuFixture(); app.render(); app.trigger.props.onClick({detail:0,stopPropagation(){}}); assert.equal(app.shown,true);
  app.render(); app.root.props.onPointerDownCapture();
  app.root.props.onBlur({currentTarget:{contains:()=>false},relatedTarget:null}); assert.equal(app.shown,true);
  app.root.props.onClickCapture();
  app.root.props.onBlur({currentTarget:{contains:()=>false},relatedTarget:null}); assert.equal(app.shown,false);
});
