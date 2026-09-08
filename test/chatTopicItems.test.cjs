const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

function fixture(relative, initialProps = {}, options = {}) {
  const slots = [];
  let cursor = 0, props = initialProps;
  const hooks = {
    ...React, memo: fn => fn, useEffect() {}, useId: () => 'topic-test',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useMemo(fn, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || !deps || deps.some((item, i) => !Object.is(item, previous.deps[i]))) slots[index] = { value: fn(), deps };
      return slots[index].value;
    }
  };
  const Button = ({children, onClick, disabled, style, ...rest}) => React.createElement('button', {type:'button',onClick,disabled,style,'aria-label':rest['aria-label'],'aria-pressed':rest['aria-pressed']},children);
  const requests = [];
  const sanitizations = [];
  const dependencies = {
    react: hooks, moment: require('moment'), '@emotion/css': require('@emotion/css'),
    // This is a renderer/configuration test, not a replacement for DOMPurify.
    // The isolated Chrome preview exercises the real browser sanitizer.
    dompurify: {sanitize(content, config) {
      sanitizations.push({content, config});
      return options.sanitizedTitle ?? content;
    }},
    '~/components/Button': Button,
    '~/components/Buttons/ButtonGroup': ({buttons,style}) => React.createElement('div',{style},buttons.map((button,index)=>React.createElement(Button,{...button,key:index},button.label))),
    '~/components/Texts/UsernameText': ({user}) => React.createElement('span',null,user.username),
    '~/components/Texts/RichText': ({children,...rest}) => React.createElement('span',{className:rest.className,style:rest.style},children),
    '~/components/Texts/Input': ({onChange,...rest}) => React.createElement('input', {...rest,onChange:event=>onChange(event.target.value)}),
    '~/components/ErrorBoundary': ({children}) => children,
    '~/components/Icon': () => null,
    '../TopicSettingsModal': () => null,
    '~/components/Modals/ConfirmModal': () => null,
    '~/constants/css': { Color: new Proxy({}, {get:()=>()=>'#334155'}),borderRadius:'8px' },
    '~/constants/defaultValues': {charLimit:{chat:{topic:200}}},
    '~/helpers': {isSupermod:level=>level>=200},
    '~/helpers/hooks': {useMyLevel:()=>({canDelete:!!options.canDelete})},
    '~/helpers/stringHelpers': {stringIsEmpty:value=>!value?.trim(),exceedsCharLimit:({text})=>text.length>200?{style:{color:'red'},message:'Over limit'}:null},
    '~/theme/ScopedTheme': ({children})=>children,
    '~/contexts': {
      useKeyContext:selector=>selector({myState:{userId:5,level:options.level||0}}),
      useAppContext:selector=>selector({requestHelpers:new Proxy({}, {get:(_,name)=>(...args)=>{requests.push({name,args});return options.request ? options.request(name,args) : Promise.resolve({});}})}),
      useChatContext:selector=>selector({actions:new Proxy({}, {get:()=>()=>{}})})
    },
    '~/constants/sockets/api': {socket:{emit:()=>assert.fail('No socket writes in rendering tests')}},
    'react-router-dom': {useNavigate:()=>()=>{}},
    '../topicStyles': {
      chatTopicThemeStyle: () => ({}),
      chatTopicButtonStyle: () => ({}),
      chatTopicRowClass:'topic-row',chatTopicTitleClass:'topic-title',chatTopicMetadataClass:'topic-meta',chatTopicActionsClass:'topic-actions',
      chatTopicActionStyle:{minHeight:44,minWidth:44,fontSize:'14px',color:'#334155'}
    },
    './StartTopicButton': () => React.createElement('button',null,'Start this Topic'),
    '../StartTopicButton': () => React.createElement('button',null,'Start this Topic'),
    './Results': props => React.createElement('div',{'data-dm':props.isTwoPeopleChat},'Search results'),
    '../../TopicRequestStatus': ({message}) => React.createElement('div',{role:'alert'},message),
    '../../topicStyles': {chatTopicSectionClass:'topic-section'},
    '~/components/Loading': () => React.createElement('span',null,'Searching topics')
  };
  const mod={exports:{}};
  new Function('require','module','exports','console',transformSync(readFileSync(path.resolve(__dirname,'../',relative),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{
    assert.ok(Object.hasOwn(dependencies,name),`Unexpected dependency: ${name}`);return dependencies[name];
  },mod,mod.exports,{error(){}});
  let tree;
  function nodes(node=tree) {return React.isValidElement(node)?[node,...React.Children.toArray(node.props.children).flatMap(child=>nodes(child))]:[];}
  return {
    requests, sanitizations,
    render(next={}) {props={...props,...next};cursor=0;tree=mod.exports.default(props);return renderToStaticMarkup(tree);},
    nodes,
    buttons() {return nodes().filter(node=>node.type===Button);}
  };
}
const legacy='src/containers/Chat/Modals/SubjectsModal/SubjectItem.tsx';
const picker='src/containers/Chat/Modals/TopicSelectorModal/TopicItem.tsx';
const base={id:1,content:'A long community topic & its important context',userId:9,username:'Mina',timeStamp:1786712100,
  currentSubjectId:2,currentTopicId:2,displayedThemeColor:'gold',channelId:3,pathId:'preview',pinnedTopicIds:[],settings:{},
  onDeleteSubject(){},onSelectSubject(){},onSelectTopic(){},isOwner:false,isAIChannel:false,isFeatured:false};

test('legacy topic controls are in flow and permission changes are reflected on rerender',()=>{
  const app=fixture(legacy,base);
  assert.doesNotMatch(app.render(),/Remove/);
  const html=app.render({userIsOwner:true});
  assert.match(html,/Remove/);
  assert.match(html,/data-chat-topic-actions/);
  assert.doesNotMatch(html,/position:absolute/);
  assert.match(html,/A long community topic (?:&amp;|&) its important context/);
  assert.equal(app.buttons().find(node=>node.props.children==='Remove').props.style.minHeight,44);
});

test('legacy select really disables after selection without changing moderator rules',()=>{
  const app=fixture(legacy,base,{level:200,canDelete:true});
  assert.match(app.render(),/Remove/);
  app.buttons().find(node=>node.props.children==='Select').props.onClick();
  app.render();
  assert.equal(app.buttons().find(node=>node.props.children==='Select').props.disabled,true);
  assert.doesNotMatch(fixture(legacy,{...base,currentSubjectId:1},{level:200,canDelete:true}).render(),/Remove|Select/);
});

test('legacy titles render the sanitizer result and restrict markup to inline formatting',()=>{
  const content = '<b>Planning &amp; ideas</b><img src="preview-only" onerror="void 0">';
  const app = fixture(legacy, {...base, content}, {sanitizedTitle:'<b>Planning &amp; ideas</b>'});
  const html = app.render();
  assert.match(html, /<b>Planning &amp; ideas<\/b>/);
  assert.doesNotMatch(html, /<img|onerror|preview-only/);
  assert.equal(app.sanitizations[0].content, content);
  const config = app.sanitizations[0].config;
  assert.deepEqual(config.ALLOWED_TAGS, ['a','b','br','code','del','em','i','s','small','span','strong','sub','sup','u']);
  assert.deepEqual(config.ALLOWED_ATTR, ['href','title']);
  assert.equal(config.ALLOW_ARIA_ATTR, false);
  assert.equal(config.ALLOW_DATA_ATTR, false);
  app.render();
  assert.equal(app.sanitizations.length, 1, 'unchanged titles retain their memoized sanitized result');
  app.render({content:'A changed topic'});
  assert.equal(app.sanitizations[1].content, 'A changed topic');
});

test('topic picker actions have explicit names and retain ownership/pin/featured gates',()=>{
  const app=fixture(picker,{...base,isOwner:true});
  const html=app.render();
  for(const label of ['Topic settings','Pin topic','Feature topic','Open topic']) assert.match(html,new RegExp(`aria-label="${label}"`));
  assert.match(html,/data-chat-topic-actions/);
  assert.doesNotMatch(html,/Delete topic/);
  const pinned=app.render({pinnedTopicIds:[1],isFeatured:true});
  assert.match(pinned,/aria-label="Unpin topic"/);
  assert.equal(app.buttons().find(node=>node.props['aria-label']==='Featured topic').props.disabled,true);
  const ownNonOwner=fixture(picker,{...base,userId:5}).render();
  assert.match(ownNonOwner,/aria-label="Delete topic"/);
  assert.doesNotMatch(ownNonOwner,/Topic settings|Pin topic|Feature topic/);
});

test('the empty topic state does not offer creation to read-only members',()=>{
  const app=fixture('src/containers/Chat/Modals/TopicSelectorModal/NoTopicPosted.tsx',{channelId:3,pathId:'preview',displayedThemeColor:'gold',canAddTopic:false,onHide(){}});
  assert.doesNotMatch(app.render(),/Start this Topic|<input/);
  assert.match(app.render(),/No topics/);
  assert.match(app.render({canAddTopic:true}),/Start this Topic/);
});

test('topic creation rejects empty and over-limit labels before any request',async()=>{
  for(const title of ['', '  ', 'x'.repeat(201)]){
    const app=fixture('src/containers/Chat/Modals/TopicSelectorModal/StartTopicButton.tsx',{channelId:3,pathId:'preview',themeColor:'gold',topicTitle:title});
    const html=app.render();
    assert.match(html,/type="button"/);
    assert.match(html,/disabled/);
    await app.nodes().find(node=>node.type==='button').props.onClick();
    assert.deepEqual(app.requests,[]);
  }
});

test('topic creation uses one request for rapid repeated clicks and shows a recoverable failure',async()=>{
  let reject;
  const app=fixture('src/containers/Chat/Modals/TopicSelectorModal/StartTopicButton.tsx',
    {channelId:3,pathId:'preview',themeColor:'gold',topicTitle:'x'.repeat(200)},
    {request:()=>new Promise((_,rejectRequest)=>{reject=rejectRequest;})});
  assert.doesNotMatch(app.render(),/disabled/);
  const button=app.nodes().find(node=>node.type==='button');
  const first=button.props.onClick();await button.props.onClick();assert.equal(app.requests.length,1);
  reject(new Error('Isolated failure'));await first;const html=app.render();
  assert.match(html,/role="alert"/);assert.doesNotMatch(html,/disabled/);
});

test('pin limits and direct-message ownership are retained in the refreshed row',()=>{
  const app=fixture(picker,{...base,isOwner:true,pinnedTopicIds:[2,3,4,5,6]});
  assert.doesNotMatch(app.render(),/aria-label="Pin topic"/);
  assert.match(app.render({pinnedTopicIds:[1,2,3,4,5]}),/aria-label="Unpin topic"/);
  const dm=fixture(picker,{...base,userId:5,isTwoPeopleChat:true}).render();
  assert.match(dm,/Topic settings/);assert.doesNotMatch(dm,/Delete topic|Pin topic|Feature topic/);
});

test('search errors and pending searches cannot offer topic creation',()=>{
  const app=fixture('src/containers/Chat/Modals/TopicSelectorModal/Search/index.tsx',{
    ...base,canAddTopic:true,maxTopicLength:200,searchedTopics:[],searched:true,searchError:true,searchText:'Community',isTwoPeopleChat:true,onRetry(){},onHide(){}
  });
  assert.match(app.render(),/role="alert"/);assert.doesNotMatch(app.render(),/Start this Topic|No topics found/);
  assert.doesNotMatch(app.render({searched:false,searchError:false}),/Start this Topic/);
  assert.match(app.render({searched:true,searchedTopics:[{id:3,content:'Community plans'}]}),/data-dm="true"/);
});

test('pin requests cannot overlap and failure restores usable controls',async()=>{
  let reject;
  const app=fixture(picker,{...base,isOwner:true},{request:()=>new Promise((_,rejectRequest)=>{reject=rejectRequest;})});
  app.render();const pin=app.buttons().find(node=>node.props['aria-label']==='Pin topic');
  const first=pin.props.onClick();await pin.props.onClick();app.render();
  assert.equal(app.requests.length,1);assert.equal(app.buttons().find(node=>node.props['aria-label']==='Open topic').props.disabled,true);
  reject(new Error('Isolated pin failure'));await first;assert.match(app.render(),/role="alert"/);
  assert.equal(app.buttons().find(node=>node.props['aria-label']==='Pin topic').props.disabled,false);
});
