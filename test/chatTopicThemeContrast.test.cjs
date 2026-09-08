const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transformSync } = require('esbuild');

function load(relative, dependencies = {}) {
  const mod={exports:{}};
  new Function('require','module','exports',transformSync(readFileSync(path.resolve(__dirname,'../',relative),'utf8'),{loader:'ts',format:'cjs'}).code)(name=>{
    assert.ok(Object.hasOwn(dependencies,name),`Unexpected dependency: ${name}`);return dependencies[name];
  },mod,mod.exports);
  return mod.exports;
}
const theme=load('src/theme/index.ts');
const styles=load('src/containers/Chat/Modals/topicStyles.ts',{
  '@emotion/css':require('@emotion/css'),'~/theme':theme,'~/theme/resolveColor':{resolveColorValue:value=>value}
});
function luminance(color){
  const rgb=color.startsWith('#')?(color==='#fff'?[255,255,255]:[0,0,0]):color.match(/[\d.]+/g).slice(0,3).map(Number);
  return rgb.map(value=>value/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4).reduce((sum,value,i)=>sum+value*[0.2126,0.7152,0.0722][i],0);
}
test('topic creation and cloning labels have at least 4.5:1 contrast in all 11 themes, including hover',()=>{
  assert.equal(Object.keys(theme.themeRegistry).length,11);
  for(const [name,tokens] of Object.entries(theme.themeRegistry)){
    const vars=styles.chatTopicButtonStyle(name);
    for(const [background,key] of [[tokens.general.bg,'--chat-topic-button-text'],[tokens.general.hoverBg,'--chat-topic-button-hover-text']]){
      const a=luminance(background),b=luminance(vars[key]),ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
      assert.ok(ratio>=4.5,`${name}/${key}: ${ratio.toFixed(2)}`);
    }
  }
  assert.deepEqual(styles.chatTopicButtonStyle('unknown'),styles.chatTopicButtonStyle('logoBlue'));
});
