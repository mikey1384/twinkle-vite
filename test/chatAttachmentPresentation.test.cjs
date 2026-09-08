const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {transformSync} = require('esbuild');

function load(file, dependencies) {
  const mod = {exports:{}};
  new Function('require','module','exports',transformSync(readFileSync(path.resolve(__dirname,'../',file),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{
    assert.ok(Object.hasOwn(dependencies,name), `Unexpected dependency ${name}`);
    return dependencies[name];
  },mod,mod.exports);
  return mod.exports.default;
}
const navigations=[];
const Mission=load('src/components/ChatMissionEmbedPreview.tsx', {
  react:React,'@emotion/css':require('@emotion/css'),
  'react-router-dom':{useNavigate:()=>url=>navigations.push(url)},
  '~/constants/defaultValues':{returnMissionThumb:type=>`/mission-${type}.jpg`}
});
const mission={id:7,missionType:'community',title:'Community workshop',subtitle:'Make something together.',xpReward:1000,coinReward:25};

test('chat mission attachments are native buttons with decorative thumbnails and canonical navigation',()=>{
  for(const isPreview of [false,true]) {
    const card=Mission({mission,missionLink:'/missions/community?from=chat',isPreview});
    assert.equal(card.type,'button');assert.equal(card.props.type,'button');
    const thumbnail=React.Children.toArray(card.props.children).find(child=>child.type==='img');
    assert.equal(thumbnail.props.alt,'');assert.equal(thumbnail.props.src,'/mission-community.jpg');
    let stopped=false;card.props.onClick({stopPropagation(){stopped=true;}});
    assert.ok(stopped);assert.equal(navigations.at(-1),'/missions/community?from=chat');
  }
});

test('chat rewards keep XP and coin amounts without an extra zero or dangling separator',()=>{
  const render=(data,isPreview=false)=>renderToStaticMarkup(Mission({mission:{...mission,...data},missionLink:'/missions/community',isPreview}));
  assert.match(render({}),/1,000 XP · 25 coins/);
  const xpOnly=render({coinReward:0});assert.match(xpOnly,/1,000 XP</);assert.doesNotMatch(xpOnly,/XP0|XP<!-- -->0|·|0 coins/);
  const coinsOnly=render({xpReward:0});assert.match(coinsOnly,/>25 coins</);assert.doesNotMatch(coinsOnly,/ XP|·/);
  assert.doesNotMatch(render({xpReward:0,coinReward:0}),/chat-mission-embed__rewards/);
  assert.match(render({xpReward:0,coinReward:0,repeatXpReward:250,repeatCoinReward:5},true),/250 XP · 5 coins/);
  assert.doesNotMatch(render({xpReward:0,coinReward:0,repeatXpReward:250,repeatCoinReward:5}),/chat-mission-embed__rewards/,'Full attachments retain original non-repeat reward semantics');
});

test('mission copy is rendered as text and chat sizing cannot shrink with the legacy phone root',()=>{
  const card=Mission({mission:{...mission,title:'<img src=x>',subtitle:'A < B & C'},missionLink:'/missions/community'});
  const html=renderToStaticMarkup(card);assert.match(html,/&lt;img src=x&gt;/);assert.match(html,/A &lt; B &amp; C/);
  const source=readFileSync(path.resolve(__dirname,'../src/components/ChatMissionEmbedPreview.tsx'),'utf8');
  for(const rule of ['font-size: 17px','font-size: 15px','font-size: 14px','font-size: 13px','overflow-wrap: anywhere',':focus-visible','outline: 2px solid #334155','minmax(0, 1fr)'])assert.ok(source.includes(rule),rule);
});

test('only chat roots opt into the mission, prompt and profile presentation changes',()=>{
  const MissionLeaf=()=>null,PromptLeaf=()=>null,UserLeaf=()=>null;
  const dependencies={react:{...React,useMemo:fn=>fn()},'~/components/ErrorBoundary':({children})=>children};
  for(const file of ['MainContentComponent','UserComponent','DefaultComponent','AICardComponent','AchievementUnlockComponent','AchievementComponent'])dependencies[`./${file}`]=()=>null;
  dependencies['./MissionComponent']=MissionLeaf;dependencies['./SharedPromptComponent']=PromptLeaf;
  dependencies['./UserComponent']=UserLeaf;
  const Internal=load('src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/index.tsx',dependencies);
  for(const rootType of ['chat','subject','user',undefined]) {
    for(const [src,leaf] of [['/missions/community',MissionLeaf],['/shared-prompts/7',PromptLeaf],['/users/Mina',UserLeaf]]) {
      const child=Internal({src,rootType,isPreview:true}).props.children;
      assert.equal(child.type,leaf);assert.equal(child.props.isChat,rootType==='chat');assert.equal(child.props.isPreview,true);assert.equal(child.props.src,src);
    }
  }
});
