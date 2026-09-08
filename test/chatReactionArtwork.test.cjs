const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { transformSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
function load(file, dependencies = {}) {
  const mod = {exports:{}};
  new Function('require','module','exports',transformSync(readFileSync(path.join(root,file),'utf8'),{loader:file.endsWith('.tsx')?'tsx':'ts',format:'cjs',jsx:'transform'}).code)(name=>{assert.ok(Object.hasOwn(dependencies,name),name);return dependencies[name];},mod,mod.exports);
  return mod.exports;
}
const registry = load('src/constants/chatReactions.ts');

test('reaction artwork preserves existing keys and enables the five approved additions safely', () => {
  assert.deepEqual(registry.chatReactionOptions.map(item=>item.key), ['thumb','heart','laughing','surprised','wave','crying','angry','fire','eyes','thinking','celebrate','clap','thanks']);
  assert.equal(registry.getChatReaction('fire').fallback,'🔥');
  assert.deepEqual(registry.chatReactionOptions.slice(8).map(item=>item.fallback), ['👀','🤔','🎉','👏','🙏']);
  for (const unsafe of ['unknown','__proto__','constructor','../../outside']) assert.equal(registry.getChatReaction(unsafe),undefined);
});

test('each generated reaction is a small project-local RGBA PNG with matching dimensions', () => {
  for (const key of registry.chatReactionOptions.map(item=>item.key)) {
    const png = readFileSync(path.join(root,`public/img/chat-reactions/${key}-v2.png`));
    assert.equal(png.subarray(1,4).toString(),'PNG',key);
    assert.equal(png.readUInt32BE(16),160,key); assert.equal(png.readUInt32BE(20),160,key);
    assert.equal(png[25],6,`${key} must have an alpha channel`);
    assert.ok(png.length < 45000,`${key} must remain a compact UI asset`);
  }
});

test('emoji renderer is decorative, has a fixed layout and recovers from failed or unknown artwork', () => {
  let failed = '';
  const Emoji = load('src/components/ChatReactionEmoji.tsx', {
    react:{...React,useState:()=>[failed,value=>{failed=value;}]}, '~/constants/chatReactions':registry
  }).default;
  const image = Emoji({reaction:'thumb',size:28});
  assert.equal(image.type,'img'); assert.equal(image.props.src,'/img/chat-reactions/thumb-v2.png');
  assert.equal(image.props.alt,''); assert.equal(image.props['aria-hidden'],'true');
  assert.equal(image.props.width,28); assert.equal(image.props.height,28); assert.equal(image.props.draggable,false);
  image.props.onError();
  assert.equal(Emoji({reaction:'thumb'}).props.children,'👍');
  assert.equal(Emoji({reaction:'heart'}).type,'img','failure must not leak into another reaction');
  assert.equal(Emoji({reaction:'unknown'}).props.children,'?');
});
