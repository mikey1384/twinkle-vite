const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

function load(relative, dependencies = {}) {
  const mod = {exports:{}};
  const source = readFileSync(path.resolve(__dirname,'../',relative),'utf8');
  new Function('require','module','exports',transformSync(source,{loader:'tsx',format:'cjs',jsx:'transform'}).code)(name=>{
    assert.ok(Object.hasOwn(dependencies,name),`Unexpected dependency: ${name}`);
    return dependencies[name];
  },mod,mod.exports);
  return mod.exports;
}
const theme = load('src/theme/index.ts');
const styles = load('src/components/Buttons/chatScrollButtonStyles.ts',{
  '@emotion/css':require('@emotion/css'),'~/theme':theme
});
function component(file, profileTheme='gold') {
  return load(`src/components/Buttons/${file}.tsx`,{
    react:React,'@emotion/css':require('@emotion/css'),
    '~/contexts':{useKeyContext:selector=>selector({myState:{profileTheme}})},
    './chatScrollButtonStyles':styles
  }).default;
}
function luminance(color) {
  const channels=color==='#fff'?[255,255,255]:color==='#000'?[0,0,0]:color.match(/[\d.]+/g).slice(0,3).map(Number);
  return channels.map(value=>value/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4)
    .reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
}

test('floating chat labels and arrows retain 4.5:1 contrast in every profile palette and hover state',()=>{
  assert.equal(Object.keys(theme.themeRegistry).length,11);
  for(const name of Object.keys(theme.themeRegistry)) {
    const colors=styles.chatScrollButtonStyle(name);
    assert.equal(colors['--chat-scroll-text'], name === 'gold' ? '#000' : '#fff', name);
    assert.equal(colors['--chat-scroll-hover-text'], colors['--chat-scroll-text'], name + ' hover');
    for(const [background,foreground] of [['--chat-scroll-bg','--chat-scroll-text'],['--chat-scroll-hover-bg','--chat-scroll-hover-text']]) {
      const values=[luminance(colors[background]),luminance(colors[foreground])].sort((a,b)=>b-a);
      assert.ok((values[0]+0.05)/(values[1]+0.05)>=4.5,`${name}/${background}`);
    }
  }
  assert.deepEqual(styles.chatScrollButtonStyle('unknown'),styles.chatScrollButtonStyle('logoBlue'));
});

test('floating chat controls use named native buttons and decorative arrows',()=>{
  for(const [name,label] of [['NewMessagesButton','New Messages (12)'],['ChatGoToBottomButton','Go to bottom']]) {
    const button=component(name)({theme:'gold',count:12,onClick(){}});
    assert.equal(button.type,'button');
    assert.equal(button.props.type,'button');
    assert.equal(button.props['aria-label'],label);
    const svg=React.Children.toArray(button.props.children).find(child=>child.type==='svg');
    assert.equal(svg.props['aria-hidden'],'true');
    assert.equal(svg.props.focusable,'false');
    assert.match(renderToStaticMarkup(button),/--chat-scroll-text:#000/);
  }
});

test('unseen counts and click behavior are preserved while profile fallback stays safe',()=>{
  let clicks=0;
  const onClick=()=>clicks++;
  const NewMessages=component('NewMessagesButton');
  const single=NewMessages({theme:'',count:1,onClick});
  assert.equal(single.props['aria-label'],'New Message');
  assert.deepEqual(single.props.style,styles.chatScrollButtonStyle('gold'));
  const multiple=NewMessages({theme:'purple',count:1234,onClick});
  assert.equal(multiple.props['aria-label'],'New Messages (1234)');
  assert.equal(multiple.props.onClick,onClick);
  multiple.props.onClick();
  assert.equal(clicks,1);
  const GoToBottom=component('ChatGoToBottomButton','missing-theme');
  assert.deepEqual(GoToBottom({theme:'',onClick}).props.style,styles.chatScrollButtonStyle('logoBlue'));
});

test('chat-only scroll controls have readable type, 44px targets and a visible focus ring',()=>{
  const source=readFileSync(path.resolve(__dirname,'../src/components/Buttons/chatScrollButtonStyles.ts'),'utf8');
  for(const rule of ['min-width: 44px','min-height: 44px','font-size: 14px',':focus-visible','outline: 2px solid #273449','max-width: calc(100% - 24px)']) assert.ok(source.includes(rule),rule);
  for(const [file,animation] of [['NewMessagesButton','newMessagesPopIn'],['ChatGoToBottomButton','bounce']]) {
    assert.match(readFileSync(path.resolve(__dirname,`../src/components/Buttons/${file}.tsx`),'utf8'),new RegExp(`@keyframes ${animation}`));
  }
  const legacy=readFileSync(path.resolve(__dirname,'../src/components/Buttons/GoToBottomButton.tsx'),'utf8');
  assert.doesNotMatch(legacy,/chatScrollButtonStyle/,'excluded collection consumers retain their existing component');
});
