const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const React=require('react');
const {transformSync}=require('esbuild');
function load(file,deps){const mod={exports:{}};new Function('require','module','exports',transformSync(readFileSync(path.resolve(__dirname,'../',file),'utf8'),{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{assert.ok(Object.hasOwn(deps,name),name);return deps[name];},mod,mod.exports);return mod.exports;}
const theme=load('src/theme/index.ts',{}),colors=load('src/constants/css.ts',{'~/theme':theme});
const hooks={...React,useMemo:fn=>fn(),useState:value=>[value,()=>{}]};

function luminance(value){const channels=value==='#fff'?[255,255,255]:value==='#000'?[0,0,0]:value.match(/[\d.]+/g).slice(0,3).map(Number);return channels.map(n=>n/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[0.2126,0.7152,0.0722][i],0);}

test('chat status and read-more text have at least 4.5:1 contrast for every profile palette',()=>{
  const Status=load('src/components/UserDetails/StatusMsg.tsx',{react:React,'~/components/Texts/RichText':()=>null,'~/constants/css':colors,'@emotion/css':{css:(parts,...values)=>parts.reduce((sum,part,i)=>sum+part+(values[i]??''),'')}}).default;
  for(const name of [...Object.keys(theme.themeRegistry),'ivory','unknown']){
    const card=Status({statusColor:name,statusMsg:'Saved public status',userId:7,contrastSafe:true});
    const foreground=card.props.children.props.readMoreColor,background=(colors.Color[name]||colors.Color.logoBlue)();
    const l=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
    assert.ok((l[0]+0.05)/(l[1]+0.05)>=4.5,name);assert.ok(card.props.className.includes(`color: ${foreground}`));
  }
  assert.equal(Status({statusColor:'gold',statusMsg:'Legacy',userId:7}).props.children.props.readMoreColor,'#fff','Non-chat appearance remains opt-in');
});

test('full chat profile cards support Enter and avoid hijacking nested link clicks',()=>{
  const navigations=[];
  const Profile=load('src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/UserComponent/DefaultComponent.tsx',{
    react:hooks,'~/components/UserDetails':()=>null,'~/components/ProfilePic':()=>null,'~/components/ProfileEmbedCard':()=>null,
    'react-router-dom':{useNavigate:()=>url=>navigations.push(url)},'~/contexts':{useChatContext:selector=>selector({state:{chatStatus:{}}})},'~/constants/css':colors,'@emotion/css':require('@emotion/css')
  }).default;
  const card=Profile({profile:{id:7,username:'Mina'},profileId:7,src:'/users/Mina/videos',isChat:true});
  assert.equal(card.props.role,'link');assert.equal(card.props.tabIndex,0);
  const target={closest:()=>null};let prevented=false,stopped=false;
  card.props.onKeyDown({key:'Enter',target,currentTarget:target,preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});
  assert.ok(prevented&&stopped);assert.deepEqual(navigations,['/users/Mina/videos']);
  card.props.onClick({target:{closest:()=>({})},stopPropagation(){throw new Error('Nested link intercepted');}});assert.equal(navigations.length,1);
  const legacy=Profile({profile:{id:7},profileId:7,src:'/users/Mina'});
  assert.equal(legacy.props.role,undefined);
  legacy.props.onClick({target,stopPropagation(){throw new Error('Non-chat bubbling changed');}});
  assert.deepEqual(navigations,['/users/Mina/videos','/users/Mina']);
});

test('read-only titles cannot open account-editing dialogs from embedded profiles',()=>{
  const Title=load('src/components/Texts/UserTitle/index.tsx',{react:hooks,'./TitleSelectionModal':()=>null,'~/contexts':{useKeyContext:selector=>selector({myState:{userId:7}})},'~/helpers/hooks':{useUserLevel:()=>({level:6})},'@emotion/css':require('@emotion/css')}).default;
  const user={id:7,username:'Mina',title:'Explorer'};
  assert.equal(React.Children.toArray(Title({user,readOnly:true}).props.children)[0].props.onClick,undefined);
  assert.equal(typeof React.Children.toArray(Title({user}).props.children)[0].props.onClick,'function');
});

test('compact presence dots retain accessible online, busy and away labels',()=>{
  const StatusTag=load('src/components/ProfilePic/StatusTag.tsx',{react:{...hooks,useEffect:()=>{},useState:value=>[typeof value==='function'?value():value,()=>{}]},'~/helpers':{isPhone:()=>false},'~/constants/css':colors,'@emotion/css':require('@emotion/css')}).default;
  for(const status of ['online','busy','away']){
    const dot=StatusTag({status,size:'dot'});assert.equal(dot.props.role,'img');assert.equal(dot.props['aria-label'],status[0].toUpperCase()+status.slice(1));
  }
});
