const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

// Actual picker state/effects; rendered leaves, timers and requests are isolated.
function fixture(kind = 'modern', overrides = {}) {
  const slots = [], effects = [], requests = [], timers = new Map();
  let cursor = 0, dirty = false, timerId = 0, disposed = false, updatesAfterDispose = 0;
  let props = {channelId:3,channelName:'Community',creatorId:5,currentTopic:{},displayedThemeColor:'gold',
    isTwoPeopleChat:false,isAIChannel:false,canChangeSubject:'all',onHide(){},onSelectTopic(){},onSelectSubject(){},
    pinnedTopicIds:[],pathId:'preview',currentSubjectId:0,userIsOwner:false,...overrides};
  const hooks = {
    ...React, useMemo: fn => fn(), useContext: () => ({requests:helpers}),
    useRef(initial) {const index=cursor++;slots[index]??={current:initial};return slots[index];},
    useState(initial) {const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;
      return [slots[index],next=>{if(disposed)updatesAfterDispose++;const value=typeof next==='function'?next(slots[index]):next;
        if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}}];},
    useEffect(effect,deps){const index=cursor++,previous=slots[index];
      if(!previous||!deps||deps.some((value,i)=>!Object.is(value,previous.deps[i]))){slots[index]={deps,cleanup:previous?.cleanup};effects.push(()=>{slots[index].cleanup?.();slots[index].cleanup=effect();});}}
  };
  const helpers=Object.fromEntries(['loadChatSubjects','loadMoreChatSubjects','loadOtherUserTopics','loadMoreOtherUserTopics','searchChatSubject','deleteChatSubject'].map(name=>[name,args=>new Promise((resolve,reject)=>requests.push({name,args,resolve,reject}))]));
  const Button=({children,onClick,loading,disabled})=>React.createElement('button',{onClick,disabled:loading||disabled},children);
  const LoadMore=props=>React.createElement(Button,props,'Load More');
  const Status=({message,onRetry})=>React.createElement('div',{role:'alert'},message,React.createElement(Button,{onClick:onRetry},'Retry'));
  const Topic=({content})=>React.createElement('p',null,content);
  const Main=({allTopicObj,isLoaded})=>React.createElement('div',null,isLoaded?allTopicObj.subjects.map(t=>t.content).join(', '):'Loading topics');
  const Search=({searchError,searchedTopics})=>React.createElement('div',null,searchError?'Search failed':searchedTopics.map(t=>t.content).join(', '));
  const Input=()=>null;
  const deps={
    react:hooks,'@emotion/css':require('@emotion/css'),
    '~/components/Modal':({children,footer,...rest})=>React.createElement('section',{role:'dialog','aria-label':rest['aria-label']},children,footer),
    '~/components/Button':Button,'~/components/Buttons/LoadMoreButton':LoadMore,
    '~/components/FilterBar':({children})=>React.createElement('div',null,children),
    '~/components/Loading':({text})=>React.createElement('span',null,text),
    '~/components/Icon':()=>null,'~/components/Modals/ConfirmModal':()=>null,
    '~/contexts':{useAppContext:s=>s({requestHelpers:helpers}),useKeyContext:s=>s({myState:{userId:5}})},
    '~/helpers/stringHelpers':{stringIsEmpty:t=>!t?.trim()},'~/constants/defaultValues':{charLimit:{chat:{topic:200}}},
    '../../Context':{},'../TopicRequestStatus':Status,
    '../topicStyles':{chatTopicThemeStyle:()=>({}),chatTopicActionStyle:{minHeight:44,fontSize:'14px'},chatTopicFiltersClass:'filters',chatTopicSectionClass:'section',chatTopicModalClass:'modal'},
    './Main':Main,'./Search':Search,'./TopicInput':Input,
    './NoTopicPosted':({canAddTopic})=>React.createElement('div',null,canAddTopic?'Create first topic':'No topics for read-only member'),
    './SubjectItem':Topic,'./TopicItem':Topic,'./SharedTopicsList':()=>null
  };
  const file=kind==='legacy'?'SubjectsModal/index.tsx':kind==='main'?'TopicSelectorModal/Main.tsx':'TopicSelectorModal/index.tsx';
  const mod={exports:{}};
  new Function('require','module','exports','console','setTimeout','clearTimeout',transformSync(readFileSync(path.resolve(__dirname,'../src/containers/Chat/Modals',file),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{assert.ok(Object.hasOwn(deps,name),`Unexpected dependency: ${name}`);return deps[name];},mod,mod.exports,{error(){}},fn=>{timers.set(++timerId,fn);return timerId;},id=>timers.delete(id));
  if(kind==='main'){
    for(const [prop,setter] of [['allTopicObj','onSetAllTopicObj'],['myTopicObj','onSetMyTopicObj'],['sharedTopicObj','onSetSharedTopicObj']]){
      props[prop]??={subjects:[],loadMoreButton:false,loading:false};
      props[setter]=next=>{props[prop]=typeof next==='function'?next(props[prop]):next;dirty=true;};
    }
    props.onRetrySharedTopics=()=>{};
  }
  let tree;
  function nodes(node=tree){return React.isValidElement(node)?[node,...React.Children.toArray(node.props.children).flatMap(child=>nodes(child))]:[];}
  return {requests,
    render(next={}){props={...props,...next};for(let pass=0;pass<12;pass++){cursor=0;dirty=false;tree=mod.exports.default(props);while(effects.length)effects.shift()();if(!dirty)return renderToStaticMarkup(tree);}throw new Error('Unexpected render loop');},
    find(type){return nodes().find(n=>n.type===deps[type])?.props;},
    retry(){const node=nodes().find(n=>n.type===Status);assert.ok(node);node.props.onRetry();},
    more(){const node=nodes().find(n=>n.type===LoadMore);assert.ok(node);return node.props;},
    nativeButton(label){return nodes().find(n=>n.type==='button'&&n.props.children===label)?.props;},
    flushTimers(){const pending=[...timers.values()];timers.clear();for(const fn of pending)fn();},
    dispose(){disposed=true;for(const slot of slots)slot?.cleanup?.();},
    get updatesAfterDispose(){return updatesAfterDispose;}
  };
}
const empty={mySubjects:{subjects:[],loadMoreButton:false},allSubjects:{subjects:[],loadMoreButton:false}};
const loaded={mySubjects:{subjects:[],loadMoreButton:false},allSubjects:{subjects:[{id:1,content:'Existing topic',timeStamp:100}],loadMoreButton:true}};
async function settle(){await Promise.resolve();await Promise.resolve();}

for(const kind of ['modern','legacy']){
  test(`${kind} topic list initial failure retries and an empty response stops loading`,async()=>{
    const app=fixture(kind);assert.match(app.render(),/Loading topics/);
    app.requests[0].reject(new Error('Test failure'));await settle();assert.match(app.render(),/role="alert"/);
    app.retry();app.render();assert.equal(app.requests.length,2);
    app.requests[1].resolve(empty);await settle();const html=app.render();
    assert.doesNotMatch(html,/Loading topics|role="alert"/);
    assert.match(html,kind==='legacy'?/No topics/:/Create first topic/);
  });
  test(`${kind} ignores stale channel responses and requests completed after close`,async()=>{
    const app=fixture(kind);app.render();app.render({channelId:4});
    app.requests[1].resolve(loaded);await settle();assert.match(app.render(),/Existing topic/);
    app.requests[0].resolve(empty);await settle();assert.match(app.render(),/Existing topic/);
    app.render({channelId:5});app.dispose();app.requests[2].resolve(empty);await settle();assert.equal(app.updatesAfterDispose,0);
  });
}
test('read-only empty picker receives no create permission and uses canonical 200-character limit',async()=>{
  const app=fixture('modern',{creatorId:9,canChangeSubject:'owner'});app.render();app.requests[0].resolve(empty);await settle();
  assert.match(app.render(),/No topics for read-only member/);
  app.render({channelId:4});app.requests[1].resolve(loaded);await settle();app.render();
  assert.equal(app.find('./TopicInput').maxTopicLength,200);
});
test('failed search is not an empty result, retries, and retains direct-message permissions',async()=>{
  const app=fixture('modern',{isTwoPeopleChat:true});app.render();app.requests[0].resolve(loaded);await settle();app.render();
  app.find('./TopicInput').onSetTopicSearchText('plan');app.render();app.flushTimers();
  app.requests[1].reject(new Error('Search failed'));await settle();assert.match(app.render(),/Search failed/);
  const search=app.find('./Search');assert.equal(search.isTwoPeopleChat,true);assert.equal(search.currentTopicId,0);
  search.onRetry();app.render();app.flushTimers();app.requests[2].resolve([{id:8,content:'Plans recovered'}]);await settle();assert.match(app.render(),/Plans recovered/);
  app.find('./TopicInput').onSetTopicSearchText('late');app.render();app.flushTimers();app.dispose();app.requests[3].resolve([]);await settle();assert.equal(app.updatesAfterDispose,0);
});
test('legacy paging failure keeps existing topics and retries without duplicate rows',async()=>{
  const app=fixture('legacy');app.render();app.requests[0].resolve(loaded);await settle();app.render();app.more().onClick();app.render();
  app.requests[1].reject(new Error('Page failed'));await settle();assert.match(app.render(),/Existing topic/);app.retry();app.render();
  assert.deepEqual(app.requests[2].args.lastSubject,{id:1,content:'Existing topic',timeStamp:100});
  app.requests[2].resolve({subjects:[{id:1,content:'Duplicate'},{id:2,content:'More topics'}],loadMoreButton:false});await settle();
  const html=app.render();assert.match(html,/Existing topic|More topics/);assert.doesNotMatch(html,/Duplicate|role="alert"/);
});
test('modern filters are native keyboard buttons and paging updates preserve acknowledged edits',async()=>{
  const app=fixture('main',{isLoaded:true,canAddTopic:true,allTopicObj:loaded.allSubjects,myTopicObj:{subjects:[{id:1,content:'Existing topic'}],loadMoreButton:false}});
  app.render();assert.equal(app.nativeButton('My Topics').type,'button');assert.equal(app.nativeButton('All Topics')['aria-pressed'],true);
  app.find('./TopicItem').onEditTopic({topicText:'Edited topic',isOwnerPostingOnly:false});assert.match(app.render(),/Edited topic/);
  app.more().onClick();app.render();app.requests[0].reject(new Error('Page failed'));await settle();assert.match(app.render(),/Edited topic/);app.retry();app.render();
  app.requests[1].resolve({subjects:[{id:2,content:'Next topic'}],loadMoreButton:false});await settle();const html=app.render();assert.match(html,/Edited topic/);assert.match(html,/Next topic/);assert.doesNotMatch(html,/Existing topic|role="alert"/);
});

test('pin limits use the whole canonical pin list, including topics outside the loaded page',()=>{
  const app=fixture('main',{isLoaded:true,canAddTopic:true,allTopicObj:loaded.allSubjects,pinnedTopicIds:[11,12,13,14,15]});
  app.render();assert.deepEqual(app.find('./TopicItem').pinnedTopicIds,[11,12,13,14,15]);
});
