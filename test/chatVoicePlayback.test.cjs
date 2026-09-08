const assert = require('node:assert/strict');
const test = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const base = 'src/components/Texts/RichText/';

function compile(file, dependencies, globals = {}) {
  const module = { exports: {} };
  const source = readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const code = transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected import: ${name}`);
    return dependencies[name];
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}

function driver() {
  const slots = [], effects = [];
  let cursor = 0, dirty = false, disposed = false, lateUpdates = 0;
  const hooks = {
    ...React, useMemo: fn => fn(), memo: fn => fn,
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], next => {
        if (disposed) lateUpdates++;
        const value = typeof next === 'function' ? next(slots[i]) : next;
        if (!Object.is(value, slots[i])) { slots[i] = value; dirty = true; }
      }];
    },
    useEffect(effect, deps) {
      const i = cursor++, old = slots[i];
      if (!old || deps.some((item, j) => !Object.is(item, old.deps[j]))) {
        slots[i] = { deps, cleanup: old?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = effect(); });
      }
    }
  };
  return {
    hooks, get lateUpdates() { return lateUpdates; },
    render(fn) {
      for (let i = 0; i < 20; i++) {
        cursor = 0; dirty = false;
        const result = fn();
        while (effects.length) effects.shift()();
        if (!dirty) return result;
      }
      throw new Error('Render loop');
    },
    dispose() { disposed = true; slots.forEach(slot => slot?.cleanup?.()); }
  };
}

function environment() {
  const shared = compile('src/constants/state.ts', {});
  const requests = [], players = [], urls = [], revoked = [], keys = [];
  let active, audioKey = '';
  class FakeAudio extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; this.ended = false; this.listeners = new Set(); players.push(this); }
    addEventListener(name, listener) { this.listeners.add(listener); super.addEventListener(name, listener); }
    removeEventListener(name, listener) { this.listeners.delete(listener); super.removeEventListener(name, listener); }
    play() {
      this.playCalls = (this.playCalls || 0) + 1;
      if (this.src.startsWith('blob:') && this.failure) return Promise.reject(this.failure);
      if (this.src.startsWith('blob:') && this.pendingPlay) return this.pendingPlay;
      this.paused = false; this.ended = false; this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
    finish() { this.paused = true; this.ended = true; this.dispatchEvent(new Event('ended')); }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() { this.loads = (this.loads || 0) + 1; }
  }
  const hook = compile(base + 'useVoicePlayback.ts', {
    react: new Proxy({}, { get: (_, name) => active.hooks[name] }),
    '~/contexts': {
      useAppContext: fn => fn({ requestHelpers: { textToSpeech: (text, voice) => new Promise((resolve, reject) => requests.push({ text, voice, resolve, reject })) } }),
      useViewContext: fn => fn({ state: { audioKey }, actions: { onSetAudioKey: value => { keys.push(value); audioKey = value; } } })
    },
    '~/constants/state': shared
  }, { Audio: FakeAudio, URL: { createObjectURL: blob => { const url = `blob:voice-${urls.length + 1}`; urls.push({ blob, url }); return url; }, revokeObjectURL: url => revoked.push(url) } }).default;
  return {
    shared, requests, players, urls, revoked, keys, FakeAudio,
    setKey(value) { audioKey = value; shared.audioRef.key = value; },
    mount(initial = {}) {
      const runtime = driver();
      let props = { contentKey: '1-chat-main', text: 'Hello there', voice: 'nova', ...initial };
      return { ...runtime, render(next = {}) { props = { ...props, ...next }; active = runtime; return runtime.render(() => hook(props)); }, get lateUpdates() { return runtime.lateUpdates; } };
    }
  };
}
async function settle() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
const speech = () => new Blob(['sample voice'], { type: 'audio/mpeg' });

test('voice loads only on explicit intent, guards duplicate clicks, and keeps gesture activation before the request', async () => {
  const env = environment(), app = env.mount();
  let ui = app.render(); assert.equal(ui.prepared, false); assert.equal(env.requests.length, 0);
  ui.playOrPause(); ui.playOrPause(); ui = app.render();
  assert.equal(ui.preparing, true); assert.equal(env.players[0].playCalls, 1); assert.equal(env.requests.length, 1);
  assert.deepEqual([env.requests[0].text, env.requests[0].voice], ['Hello there', 'nova']);
  env.requests[0].resolve(speech()); await settle(); ui = app.render();
  assert.equal(ui.playing, true); assert.equal(ui.preparing, false); assert.equal(ui.downloadUrl, 'blob:voice-1');
  assert.equal(env.shared.audioRef.player, env.players[0]);
});

test('pause, resume and ended replay use the same prepared player without another TTS request', async () => {
  const env = environment(), app = env.mount(); app.render().playOrPause(); app.render();
  env.requests[0].resolve(speech()); await settle(); await app.render().playOrPause();
  assert.equal(app.render().playing, false); assert.equal(env.players[0].paused, true);
  await app.render().playOrPause(); assert.equal(app.render().playing, true);
  env.players[0].finish(); assert.equal(app.render().ended, true);
  await app.render().playOrPause(); assert.equal(app.render().ended, false); assert.equal(env.requests.length, 1);
});

test('preparation rejection, empty bytes and malformed data recover with an explicit retry', async () => {
  const env = environment(), app = env.mount(); app.render().playOrPause(); app.render();
  env.requests[0].reject(new Error('Offline')); await settle();
  assert.match(app.render().error, /Could not prepare/); assert.equal(app.render().preparing, false);
  for (const data of [null, {}, new Blob([])]) {
    app.render().playOrPause(); env.requests.at(-1).resolve(data); await settle(); assert.match(app.render().error, /Could not prepare/);
  }
  assert.equal(env.urls.length, 0);
  app.render().playOrPause(); env.requests.at(-1).resolve(speech()); await settle();
  assert.equal(app.render().error, ''); assert.equal(app.render().playing, true);
});

test('content key, text and voice changes cancel pending work and never install old audio or a stale download', async () => {
  for (const next of [{ contentKey: '2-chat-main' }, { text: 'Revised text' }, { voice: 'alloy' }]) {
    const env = environment(), app = env.mount(); app.render().playOrPause(); app.render(); app.render(next);
    env.requests[0].resolve(speech()); await settle();
    assert.equal(env.urls.length, 0); assert.equal(env.shared.audioRef.player, null);
    assert.equal(app.render().downloadUrl, null); assert.equal(app.render().preparing, false); assert.equal(env.players[0].paused, true);
  }
});

test('unmount ignores late preparation and playback failures and removes subscriptions', async () => {
  const env = environment(), app = env.mount(); app.render().playOrPause(); app.render(); app.dispose();
  env.requests[0].resolve(speech()); await settle(); assert.equal(env.urls.length, 0); assert.equal(app.lateUpdates, 0);
  const readyEnv = environment(), ready = readyEnv.mount(); ready.render().playOrPause(); ready.render();
  let rejectPlay; readyEnv.players[0].pendingPlay = new Promise((_, reject) => { rejectPlay = reject; });
  readyEnv.requests[0].resolve(speech()); await settle(); ready.dispose(); rejectPlay(new Error('late failure')); await settle();
  assert.equal(ready.lateUpdates, 0); assert.equal(readyEnv.players[0].listeners.size, 0);
});

test('a newer global producer wins; old preparation cannot overwrite it or cancel its intent', async () => {
  const env = environment(), first = env.mount(), second = env.mount({ contentKey: '2-chat-main', text: 'Second message' });
  first.render().playOrPause(); first.render(); second.render().playOrPause(); second.render(); first.render();
  env.requests[1].resolve(speech()); await settle(); env.requests[0].resolve(speech()); await settle();
  assert.equal(env.urls.length, 1); assert.equal(env.shared.audioRef.player, env.players[1]);
  assert.equal(second.render().playing, true); assert.equal(first.render().downloadUrl, null);
});

test('permission failure retains prepared audio and shows a Listen hint without charging a second request', async () => {
  const env = environment(), app = env.mount(); app.render().playOrPause(); app.render();
  env.players[0].failure = new DOMException('Gesture required', 'NotAllowedError');
  env.requests[0].resolve(speech()); await settle();
  let ui = app.render(); assert.equal(ui.prepared, true); assert.equal(ui.error, ''); assert.match(ui.hint, /Select Listen/);
  env.players[0].failure = null; await ui.playOrPause(); ui = app.render();
  assert.equal(ui.playing, true); assert.equal(ui.hint, ''); assert.equal(env.requests.length, 1);
});

test('real playback and media errors are visible; interrupted play is not a failure alert', async () => {
  for (const error of [new Error('Decoder failed'), new DOMException('interrupted', 'AbortError')]) {
    const env = environment(), app = env.mount(); app.render().playOrPause(); app.render(); env.players[0].failure = error;
    env.requests[0].resolve(speech()); await settle();
    assert.equal(Boolean(app.render().error), error.name !== 'AbortError');
    env.players[0].dispatchEvent(new Event('error')); assert.match(app.render().error, /Could not play/);
  }
});

test('one current URL survives message unmount/remount; replacing it releases exactly the owned old source', async () => {
  const env = environment(), app = env.mount(); app.render().playOrPause(); app.render(); env.requests[0].resolve(speech()); await settle();
  app.dispose(); assert.equal(env.revoked.length, 0); assert.equal(env.players[0].paused, false); assert.equal(env.players[0].listeners.size, 0);
  const remounted = env.mount(); assert.equal(remounted.render().downloadUrl, 'blob:voice-1'); assert.equal(env.requests.length, 1);
  remounted.render({ text: 'Changed content' }); assert.deepEqual(env.revoked, ['blob:voice-1']); assert.equal(env.players[0].src, '');
  remounted.render().playOrPause(); env.requests[1].resolve(speech()); await settle(); assert.equal(remounted.render().downloadUrl, 'blob:voice-2');
  const external = new env.FakeAudio('/existing-audio.mp3'); env.shared.audioRef.player = external; env.setKey('other-producer'); remounted.render();
  assert.deepEqual(env.revoked, ['blob:voice-1', 'blob:voice-2']); assert.equal(env.shared.audioRef.player, external); assert.equal(external.src, '/existing-audio.mp3');
});

test('late play rejection does not reset a newer playback attempt', async () => {
  const env = environment(), app = env.mount(); app.render().playOrPause(); app.render(); env.requests[0].resolve(speech()); await settle(); await app.render().playOrPause();
  let reject; env.players[0].pendingPlay = new Promise((_, fail) => { reject = fail; });
  app.render().playOrPause(); env.players[0].pendingPlay = null; await app.render().playOrPause();
  reject(new Error('Old attempt')); await settle(); assert.equal(app.render().playing, true); assert.equal(app.render().error, '');
});

function findAll(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...React.Children.toArray(tree.props?.children).flatMap(child => findAll(child, predicate))];
}
test('chat controls have named 44px Listen/Pause/Retry/Download actions and readable notices; non-chat stays compact', () => {
  let state = { playing: false, prepared: false, preparing: false, error: '', hint: '', playOrPause() {} };
  const Button = ({ children, ...props }) => React.createElement('button', { 'aria-label': props['aria-label'], style: props.style }, children);
  const Component = compile(base + 'AIAudioButton.tsx', { react: { ...React, memo: fn => fn, useId: () => 'notice' }, '~/components/Button': Button, '~/components/Icon': () => null, '@emotion/css': { css: () => 'chat-audio' }, './useVoicePlayback': () => state }).default;
  const render = (chat = true) => Component({ text: 'Hello', contentKey: '1-chat-main', chat });
  let buttons = findAll(render(), node => node.type === Button);
  assert.equal(buttons[0].props['aria-label'], 'Read message aloud'); assert.equal(buttons[0].props.style.minHeight, 44); assert.match(renderToStaticMarkup(render()), /Listen/);
  state = { ...state, playing: true, prepared: true, downloadUrl: 'blob:voice' }; buttons = findAll(render(), node => node.type === Button);
  assert.equal(buttons[0].props['aria-label'], 'Pause voice audio'); assert.equal(buttons[1].props['aria-label'], 'Download voice audio'); assert.equal(buttons[1].props.style.minWidth, 44);
  state = { ...state, playing: false, error: 'Could not play voice audio. Try again.' }; assert.match(renderToStaticMarkup(render()), /Retry voice audio/); assert.match(renderToStaticMarkup(render()), /role="alert"/);
  state = { ...state, error: '', preparing: true }; assert.match(renderToStaticMarkup(render()), /role="status"/);
  buttons = findAll(render(), node => node.type === Button);
  assert.equal(buttons[0].props.loading, undefined, 'busy intent stays focusable; hook guards duplicate requests');
  assert.equal(buttons[0].props['aria-busy'], true);
  assert.equal(findAll(render(false), node => node.type === Button)[0].props.style.minHeight, undefined);
});

function copyTools() {
  const runtime = driver(), writes = [], timeouts = new Map(), removed = [], focusCalls = [];
  let id = 0, copyWorks = true;
  class Element { constructor() { this.isConnected = true; } focus(value) { focusCalls.push(value); } }
  const document = { activeElement: new Element(), body: { appendChild() {} }, execCommand: () => copyWorks, createElement: () => ({ style: {}, select() {}, remove() { removed.push(this); } }) };
  const Button = () => null;
  const Component = compile(base + 'ChatMessageTools.tsx', { react: runtime.hooks, '~/components/Button': Button, '~/components/Icon': () => null, './AIAudioButton': () => null }, {
    document, HTMLElement: Element, navigator: { clipboard: { writeText: text => new Promise((resolve, reject) => writes.push({ text, resolve, reject })) } },
    setTimeout: fn => { timeouts.set(++id, fn); return id; }, clearTimeout: value => timeouts.delete(value)
  }).default;
  let props = { text: 'Original message', contentKey: '1-chat-main', audioShown: true };
  return { ...runtime, writes, timeouts, removed, focusCalls, setFallback(value) { copyWorks = value; }, render(next = {}) { props = { ...props, ...next }; return runtime.render(() => Component(props)); }, click(tree) { return findAll(tree, el => el.type === Button)[0].props.onClick(); }, get lateUpdates() { return runtime.lateUpdates; } };
}

test('chat copy success clears its timer and ignores old-content or unmounted completions', async () => {
  const app = copyTools(); app.click(app.render()); app.writes[0].resolve(); await settle();
  assert.match(JSON.stringify(app.render()), /Message copied/); assert.equal(app.timeouts.size, 1);
  app.render({ text: 'Edited message' }); assert.equal(app.timeouts.size, 0);
  app.click(app.render()); app.dispose(); app.writes[1].resolve(); await settle(); assert.equal(app.lateUpdates, 0); assert.equal(app.timeouts.size, 0);
});

test('chat copy fallback removes its textarea and restores focus; failed fallback reports a recoverable error', async () => {
  const app = copyTools(); app.click(app.render()); app.writes[0].reject(new Error('Clipboard unavailable')); await settle();
  assert.equal(app.removed.length, 1); assert.deepEqual(app.focusCalls, [{ preventScroll: true }]); assert.match(JSON.stringify(app.render()), /Message copied/);
  app.setFallback(false); app.click(app.render()); app.writes[1].reject(new Error('Clipboard unavailable')); await settle();
  assert.match(JSON.stringify(app.render()), /Could not copy this message/); assert.equal(app.removed.length, 2);
});

test('chat toolbar is gated to complete AI chat messages; shared Button forwards busy and description semantics', () => {
  const source = readFileSync(path.resolve(__dirname, '..', base + 'index.tsx'), 'utf8');
  assert.match(source, /isAIMessage && !hideDictation && !isStreaming/); assert.match(source, /contentType === 'chat' \? \(\s*<ChatMessageTools/); assert.match(source, /audioShown=\{isAudioButtonShown\}/);
  const Button = compile('src/components/Button.tsx', { react: { ...React, useMemo: fn => fn() }, '@emotion/css': { css: () => '', cx: () => '' }, '~/constants/css': { Color: new Proxy({}, { get: () => () => '#456' }), mobileMaxWidth: '767px' }, '~/components/Icon': () => null }).default;
  const html = renderToStaticMarkup(Button({ onClick() {}, 'aria-label': 'Preparing', 'aria-describedby': 'hint', 'aria-busy': true }));
  assert.match(html, /aria-describedby="hint"/); assert.match(html, /aria-busy="true"/);
});
