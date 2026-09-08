const assert = require('node:assert/strict');
const test = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');
const React = require('react');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, deps = {}, globals = {}) {
  const mod = { exports: {} };
  const code = transformSync(readFileSync(path.join(root, file), 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(name => {
    assert.ok(Object.hasOwn(deps, name), name); return deps[name];
  }, mod, mod.exports, ...Object.values(globals));
  return mod.exports;
}
const registry = load('src/constants/chatReactions.ts');
const defaults = ['thumb', 'heart', 'laughing', 'surprised', 'wave', 'crying', 'angry', 'fire'];
function environment(storage = new Map()) {
  const listeners = new Map(), writes = [];
  let blocked = false;
  const win = {
    localStorage: {
      getItem(key) { if (blocked) throw Error('blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error('quota'); writes.push({ key, value }); storage.set(key, value); }
    },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatchEvent(event) { listeners.get(event.type)?.forEach(fn => fn(event)); }
  };
  const store = load('src/helpers/quickChatReactions.ts', { '~/constants/chatReactions': registry }, {
    window: win, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  });
  return { store, storage, win, writes, listeners, block() { blocked = true; } };
}

test('quick reactions default to the existing eight without writing storage', () => {
  const app = environment();
  assert.deepEqual(app.store.readQuickReactions(1), defaults);
  assert.equal(app.writes.length, 0);
  assert.ok(Object.isFrozen(app.store.readQuickReactions(1)));
});
test('stored choices reject malformed keys, deduplicate, cap at eight and preserve order', () => {
  const { store } = environment();
  assert.deepEqual(store.normalizeQuickReactions(['eyes', '__proto__', 'eyes', null, 'thanks', 'constructor', '../../outside']), ['eyes', 'thanks']);
  for (const invalid of [null, {}, 'eyes', [], ['unknown']]) assert.deepEqual(store.normalizeQuickReactions(invalid), defaults);
  assert.equal(store.normalizeQuickReactions(registry.chatReactionOptions.map(item => item.key)).length, 8);
});
test('saving is account-scoped and survives a fresh module/browser load', () => {
  const app = environment(); assert.equal(app.store.saveQuickReactions(1, ['thanks', 'eyes']), true);
  assert.deepEqual(environment(app.storage).store.readQuickReactions(1), ['thanks', 'eyes']);
  assert.deepEqual(app.store.readQuickReactions(2), defaults);
  assert.notEqual(app.store.quickReactionStorageKey(1), app.store.quickReactionStorageKey(2));
  assert.match(app.store.quickReactionStorageKey(NaN), /:guest$/);
});
test('blocked storage retains session choices and reports that they are not persisted', () => {
  const app = environment(); app.block();
  assert.deepEqual(app.store.readQuickReactions(1), defaults);
  assert.equal(app.store.saveQuickReactions(1, ['clap']), false);
  assert.deepEqual(app.store.readQuickReactions(1), ['clap']);
  assert.equal(app.writes.length, 0);
});
test('malformed JSON cannot break the picker', () => {
  const app = environment(); app.storage.set(app.store.quickReactionStorageKey(1), '{broken');
  assert.deepEqual(app.store.readQuickReactions(1), defaults);
});
test('same-tab preference changes notify only their account and clean up subscriptions', () => {
  const app = environment(); let first = 0, second = 0;
  const stop = app.store.subscribeQuickReactions(1, () => first++);
  const stopOther = app.store.subscribeQuickReactions(2, () => second++);
  app.store.saveQuickReactions(1, ['eyes']); assert.equal(first, 1); assert.equal(second, 0);
  stop(); stopOther(); app.store.saveQuickReactions(1, ['thanks']); assert.equal(first, 1);
  assert.equal([...app.listeners.values()].reduce((sum, set) => sum + set.size, 0), 0);
});
test('cross-tab updates and clearing storage invalidate only the relevant cached choices', () => {
  const app = environment(); let current;
  app.store.readQuickReactions(1);
  app.store.subscribeQuickReactions(1, () => { current = app.store.readQuickReactions(1); });
  const key = app.store.quickReactionStorageKey(1);
  app.storage.set(key, JSON.stringify(['thinking']));
  app.win.dispatchEvent({ type: 'storage', key: 'unrelated' }); assert.equal(current, undefined);
  app.win.dispatchEvent({ type: 'storage', key }); assert.deepEqual(current, ['thinking']);
  app.storage.clear(); app.win.dispatchEvent({ type: 'storage', key: null }); assert.deepEqual(current, defaults);
});

function panel(app = environment()) {
  const slots = [], effects = [], reactions = [];
  let cursor = 0, dirty = false, tree;
  const hooks = {
    ...React, useLayoutEffect() {},
    useId: () => 'quick-test',
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(initial) {
      const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], next => { const value = typeof next === 'function' ? next(slots[i]) : next; if (!Object.is(value, slots[i])) { slots[i] = value; dirty = true; } }];
    },
    useEffect(effect, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || deps.some((value, j) => !Object.is(value, previous.deps[j]))) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = effect(); });
      }
    }
  };
  const Picker = load('src/containers/Chat/Message/MessageBody/ReactionPicker.tsx', {
    react: hooks, '@emotion/css': require('@emotion/css'),
    '~/components/ChatReactionEmoji': () => null, '~/constants/chatReactions': registry,
    '~/helpers/quickChatReactions': app.store, './reactionPickerLayout': {}
  });
  const all = node => React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(all)] : [];
  const render = () => {
    for (let i = 0; i < 20; i++) {
      cursor = 0; dirty = false;
      tree = Picker.default({ id: 'picker', userId: 1, anchorRef: { current: null }, onReact: key => reactions.push(key) });
      while (effects.length) effects.shift()();
      if (!dirty) return tree;
    }
    throw Error('Render loop');
  };
  const button = label => { const matches = all(tree).filter(node => node.type === 'button' && (node.props['aria-label'] === label || node.props.children === label)); assert.equal(matches.length, 1, label); return matches[0]; };
  return {
    ...app, reactions, render, button,
    get choices() { return all(tree).filter(node => node.type === 'button' && node.props.title); },
    get notice() { return all(tree).find(node => node.props.role === 'status').props.children; },
    get heading() { return all(tree).find(node => node.type === 'h3').props.children; },
    click(label) { const target = button(label); assert.ok(!target.props.disabled, label); target.props.onClick({ stopPropagation() {} }); render(); },
    escape() { let prevented = false, stopped = false; tree.props.onKeyDown({ key: 'Escape', preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } }); render(); return { prevented, stopped }; }
  };
}
function customize(app) { app.click('More reactions'); app.click('Customize quick reactions'); }
test('the first page is eight named native choices; More exposes all thirteen without reacting', () => {
  const app = panel(); app.render(); assert.equal(app.choices.length, 8);
  app.click('More reactions'); assert.equal(app.choices.length, 13);
  assert.equal(app.heading, 'All reactions'); assert.deepEqual(app.reactions, []);
  for (const { label, key } of registry.chatReactionOptions) {
    const choice = app.button(`React with ${label}`);
    assert.equal(choice.props.type, 'button'); assert.equal(choice.props.children[0].props.size, 28);
    app.click(`React with ${label}`); assert.equal(app.reactions.at(-1), key);
  }
});
test('a full quick page gives clear feedback instead of silently replacing a reaction', () => {
  const app = panel(); app.render(); customize(app); app.click('Eyes quick reaction');
  assert.match(app.notice, /Remove one/); assert.equal(app.choices.filter(node => node.props['aria-pressed']).length, 8);
  assert.equal(app.writes.length, 0); assert.deepEqual(app.reactions, []);
});
test('all five new reactions can replace existing quick picks in a saved custom order', () => {
  const app = panel(); app.render(); customize(app);
  for (const label of ['Surprised', 'Wave', 'Crying', 'Angry', 'Fire']) app.click(`${label} quick reaction`);
  for (const label of ['Thanks', 'Clap', 'Celebrate', 'Thinking', 'Eyes']) app.click(`${label} quick reaction`);
  app.click('Save quick reactions');
  assert.deepEqual(app.choices.map(node => node.props.title), ['Thumbs up', 'Heart', 'Laughing', 'Thanks', 'Clap', 'Celebrate', 'Thinking', 'Eyes']);
  assert.equal(app.writes.length, 1); assert.deepEqual(app.reactions, []);
  assert.equal(app.heading, 'Quick reactions');
});
test('cancel and Escape discard drafts and step back through pages before closing', () => {
  const app = panel(); app.render(); customize(app); app.click('Fire quick reaction'); app.click('Cancel customization');
  assert.equal(app.heading, 'All reactions'); assert.deepEqual(app.store.readQuickReactions(1), defaults);
  assert.deepEqual(app.escape(), { prevented: true, stopped: true }); assert.equal(app.heading, 'Quick reactions');
  assert.deepEqual(app.escape(), { prevented: false, stopped: false }, 'quick-page Escape belongs to the trigger');
  assert.equal(app.writes.length, 0);
});
test('Restore defaults remains a draft until Save, and empty selection cannot be saved', () => {
  const app = panel(); app.render(); customize(app);
  for (const label of registry.chatReactionOptions.slice(0, 8).map(item => item.label)) app.click(`${label} quick reaction`);
  assert.equal(app.button('Save quick reactions').props.disabled, true);
  app.click('Restore defaults'); assert.equal(app.choices.filter(node => node.props['aria-pressed']).length, 8);
  assert.equal(app.writes.length, 0); app.click('Save quick reactions'); assert.equal(app.writes.length, 1);
});
test('blocked preference persistence gives honest session-only feedback after Save', () => {
  const app = panel(); app.render(); customize(app); app.block(); app.click('Save quick reactions');
  assert.equal(app.heading, 'Quick reactions'); assert.match(app.notice, /this session/);
});

test('native focus scrolling preserves the trigger and choices but outside scrolling dismisses', () => {
  const file = path.join(root, 'src/containers/Chat/Message/MessageBody/ReactionPicker.tsx');
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = [];
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleScroll') declarations.push(node); ts.forEachChild(node, visit); }
  visit(source); assert.equal(declarations.length, 1);
  const body = transformSync(declarations[0].getText(source), {loader:'ts'}).code;
  const trigger = {}, choice = {}, inside = {}, outside = {};
  let updates = 0, dismissals = 0;
  const panel = {contains: node => node === inside || node === choice, ownerDocument:{activeElement:trigger}};
  const anchor = {contains: node => [trigger, choice, inside].includes(node)};
  const handle = new Function('panel','anchor','updatePosition','onDismiss',body + ';return handleScroll;')(panel,anchor,()=>updates++,()=>dismissals++);
  handle({target:inside}); assert.equal(updates,0); assert.equal(dismissals,0);
  handle({target:outside}); assert.equal(updates,1); assert.equal(dismissals,0);
  panel.ownerDocument.activeElement = choice; handle({target:outside}); assert.equal(updates,2); assert.equal(dismissals,0);
  panel.ownerDocument.activeElement = outside; handle({target:outside}); assert.equal(dismissals,1);
});
