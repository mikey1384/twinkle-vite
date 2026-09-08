const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const React=require('react');
const {transformSync}=require('esbuild');

function fixture() {
  const writes=[],effects=[];
  const StatusMsg=()=>null;
  const actions={onSetEditedStatusColor:color=>writes.push(['color',color]),onSetEditedStatusMsg:text=>writes.push(['text',text])};
  const noop=()=>{};
  const deps={
    react:{...React,useMemo:fn=>fn(),useRef:value=>({current:value}),useState:value=>[value,noop],useEffect:effect=>effects.push(effect)},
    '@emotion/css':require('@emotion/css'),axios:{},
    '~/contexts':{
      useAppContext:selector=>selector({requestHelpers:{auth:noop}}),
      useContentContext:selector=>selector({actions:{onReloadContent:noop}}),
      useProfileContext:selector=>selector({actions:{onResetProfile:noop}}),
      useInputContext:selector=>selector({state:{editedStatusColor:'pink',editedStatusMsg:'My unsaved draft'},actions})
    },
    '~/constants/URL':'https://unused.invalid','~/constants/css':{Color:{logoBlue:()=> '#418ceb',darkerGray:()=> '#334155',darkGray:()=> '#526176',gray:()=> '#64748b'},tabletMaxWidth:'820px'},
    '~/helpers/stringHelpers':{addEmoji:noop,finalizeEmoji:noop,renderText:noop,replaceFakeAtSymbol:noop},
    '~/helpers/profileCanonicalState':{getCanonicalProfileStatus:noop},'./StatusMsg':StatusMsg
  };
  for(const name of ['~/components/Link','./StatusInput','~/components/Button','~/components/Icon','~/components/Modals/ConfirmModal','~/components/Texts/UserTitle','~/components/ErrorBoundary','~/components/Texts/Bio'])deps[name]=()=>null;
  const mod={exports:{}};
  new Function('require','module','exports',transformSync(readFileSync(path.resolve(__dirname,'../src/components/UserDetails/index.tsx'),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{assert.ok(Object.hasOwn(deps,name),name);return deps[name];},mod,mod.exports);
  function nodes(node){return React.isValidElement(node)?[node,...React.Children.toArray(node.props.children).flatMap(nodes)]:[];}
  return {writes,render(extra={}){const tree=mod.exports.default({profile:{id:7,username:'Mina',statusColor:'purple',statusMsg:'Saved public status'},userId:7,unEditable:true,...extra});while(effects.length)effects.shift()();return nodes(tree).find(node=>node.type===StatusMsg)?.props;}};
}

test('read-only profile embeds do not clear or display a separate status draft',()=>{
  const app=fixture(),status=app.render();assert.deepEqual(app.writes,[]);assert.equal(status.statusMsg,'Saved public status');assert.equal(status.statusColor,'purple');
});

test('an empty saved status stays empty in a read-only embed despite an existing draft',()=>{
  const app=fixture();assert.equal(app.render({profile:{id:7,username:'Mina',statusMsg:''}}),undefined);assert.deepEqual(app.writes,[]);
});

test('editable profile details retain their existing draft display and initialization behavior',()=>{
  const app=fixture(),status=app.render({unEditable:false});assert.deepEqual(app.writes,[['color','']]);assert.equal(status.statusMsg,'My unsaved draft');assert.equal(status.statusColor,'pink');
});

test('hidden avatar editing overlays do not announce Change Picture on read-only profile cards',()=>{
  const mod={exports:{}};
  new Function('require','module','exports',transformSync(readFileSync(path.resolve(__dirname,'../src/components/ProfilePic/ChangePicture.tsx'),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{
    if(name==='react')return React;
    assert.equal(name,'~/components/Icon');return ()=>null;
  },mod,mod.exports);
  assert.equal(mod.exports.default({shown:false}).props['aria-hidden'],true);
  assert.equal(mod.exports.default({shown:true}).props['aria-hidden'],false);
});
