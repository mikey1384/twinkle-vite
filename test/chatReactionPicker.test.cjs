const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { transformSync } = require('esbuild');
const registry = { exports: {} };
new Function('module', 'exports', transformSync(readFileSync(path.resolve(__dirname, '../src/constants/chatReactions.ts'), 'utf8'), {loader:'ts',format:'cjs'}).code)(registry,registry.exports);

function loadModule(file, deps) {
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', transformSync(readFileSync(path.resolve(__dirname, file), 'utf8'), { loader: 'ts', format: 'cjs' }).code)(name => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; }, mod, mod.exports);
  return mod.exports;
}

function fixture(mobile = false) {
  const refs = [], reactions = [];
  let cursor = 0, shown = false, tree, outside, userId = 1;
  const Button = () => null;
  const Picker = () => null;
  const deps = {
    react: { ...React, useId: () => 'reaction-fixture', useLayoutEffect() {}, useState: value => [value, () => {}], useRef(value) { return refs[cursor++] ||= { current: value }; } },
    './reactionPickerLayout': {},
    './ReactionPicker': Picker,
    './messageControlStyles': {messageControlClass:'compact-message-control'},
    '~/contexts': {useKeyContext: fn => fn({myState:{userId}})},
    '~/components/Button': Button,
    '~/components/ErrorBoundary': () => null,
    '~/components/Icon': () => null,
    '~/constants/chatReactions': registry.exports,
    '~/components/ChatReactionEmoji': () => null,
    '~/constants/css': { Color: { black: () => '#000' }, mobileMaxWidth: '767px' },
    '@emotion/css': require('@emotion/css'),
    '~/helpers': { isMobile: () => mobile },
    '~/helpers/hooks': { useOutsideClick(ref, close, options) { outside = { ref, close, options }; } }
  };
  deps['./hooks/usePointerBlurGuard'] = loadModule('../src/containers/Chat/Message/MessageBody/hooks/usePointerBlurGuard.ts', deps);
  const source = readFileSync(path.resolve(__dirname, '../src/containers/Chat/Message/MessageBody/ReactionButton.tsx'), 'utf8');
  const mod = { exports: {} };
  const doc = { activeElement: {} };
  new Function('require', 'module', 'exports', 'navigator', 'document', transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code)(name => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; }, mod, mod.exports, {}, doc);
  const walk = node => React.isValidElement(node) ? [node, ...React.Children.toArray(node.props.children).flatMap(walk)] : [];
  return {
    reactions, refs,
    get shown() { return shown; },
    get outside() { return outside; },
    get nodes() { return walk(tree); },
    get root() { return tree.props.children; },
    get trigger() { return walk(tree).find(node => node.type === Button); },
    get picker() { return walk(tree).find(node => node.type === Picker); },
    setUser(value) {userId = value;},
    render(open = shown) {
      shown = open; cursor = 0;
      tree = mod.exports.default({ reactionsMenuShown: shown, onReactionClick: reaction => reactions.push(reaction), onSetReactionsMenuShown: value => { shown = typeof value === 'function' ? value(shown) : value; } });
      return tree;
    }
  };
}

test('reaction trigger has a stable name, expanded state and controlled picker relationship', () => {
  const app = fixture(); app.render();
  assert.equal(app.trigger.props['aria-label'], 'Add reaction');
  assert.equal(app.trigger.props['aria-expanded'], false);
  assert.equal(app.trigger.props['aria-controls'], 'reaction-fixture');
  assert.equal(app.trigger.props.className, 'menu-button compact-message-control');
  assert.equal(app.trigger.props.color, 'darkerGray');
  assert.equal(app.trigger.props.variant, 'solid');
  assert.equal(app.trigger.props.tone, 'raised');
  assert.equal(app.trigger.props.style, undefined);
  app.render(true); assert.equal(app.trigger.props['aria-expanded'], true);
  assert.equal(app.picker.props.id, 'reaction-fixture');
  app.render(false); assert.equal(app.picker, undefined, 'closed messages must not mount a preferences subscriber or all choices');
});

test('choosing any reaction closes the picker and restores its trigger focus', () => {
  const app = fixture(); app.render(true);
  let focused = 0; app.trigger.props.buttonRef.current = { focus() { focused++; } };
  const keys = registry.exports.chatReactionOptions.map(item => item.key);
  keys.forEach(key => { app.render(true); app.picker.props.onReact(key); });
  assert.deepEqual(app.reactions, keys);
  assert.equal(focused, 13); assert.equal(app.shown, false);
});

test('account changes remount the picker so customization drafts cannot leak', () => {
  const app = fixture(); app.render(true); const firstKey = app.picker.key;
  app.setUser(2); app.render(true); assert.notEqual(app.picker.key, firstKey);
  assert.equal(app.picker.props.userId, 2);
  app.setUser(1); app.render(true); assert.equal(app.picker.key, firstKey);
});

test('the expanded picker sits above the later message reaction chips', () => {
  const app = fixture(); app.render(true); assert.ok(app.root.props.style.zIndex > 5000);
  app.render(false); assert.equal(app.root.props.style.zIndex, undefined);
});

test('desktop keyboard opens the picker and Escape dismisses without reacting', () => {
  const app = fixture(); app.render(); app.trigger.props.onClick({ detail: 0, stopPropagation() {} }); assert.equal(app.shown, true);
  app.render(); let focused = false, prevented = false, stopped = false;
  app.trigger.props.buttonRef.current = { focus() { focused = true; } };
  app.root.props.onKeyDown({ key: 'Escape', preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
  assert.ok(focused && prevented && stopped); assert.equal(app.shown, false); assert.deepEqual(app.reactions, []);
});

test('touch toggles while desktop mouse click preserves hover-to-open behavior', () => {
  const touch = fixture(true); touch.render(); touch.trigger.props.onClick({ detail: 1, stopPropagation() {} }); assert.equal(touch.shown, true);
  touch.render(); touch.trigger.props.onClick({ detail: 1, stopPropagation() {} }); assert.equal(touch.shown, false);
  const desktop = fixture(); desktop.render(); desktop.root.props.onMouseEnter(); assert.equal(desktop.shown, true);
  desktop.render(); desktop.trigger.props.onClick({ detail: 1, stopPropagation() {} }); assert.equal(desktop.shown, true);
});

test('picker keeps keyboard focus on mouse leave and dismisses when focus or pointer leaves', () => {
  const app = fixture(); app.render(true); app.refs[0].current = { contains: () => true };
  app.root.props.onMouseLeave(); assert.equal(app.shown, true);
  app.root.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: {} }); assert.equal(app.shown, false);
  app.render(true); assert.equal(app.outside.options.enabled, true); assert.equal(app.outside.options.closeOnScroll, false, 'the picker owns focus-aware scroll handling');
  app.outside.close(); assert.equal(app.shown, false); assert.deepEqual(app.reactions, []);
});

test('a press that starts inside the picker survives the Safari blur that carries no relatedTarget', () => {
  // Safari never focuses a pressed button, so tapping "Customize quick reactions"
  // blurs the focused heading with relatedTarget = null. That must not dismiss.
  const app = fixture(); app.render(true);
  app.root.props.onPointerDownCapture();
  app.root.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null }); assert.equal(app.shown, true);
  app.root.props.onClickCapture();
  app.root.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null }); assert.equal(app.shown, false, 'after the press completes, a real focus loss still dismisses');
  app.render(true); app.root.props.onTouchStartCapture(); app.root.props.onPointerCancelCapture();
  app.root.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null }); assert.equal(app.shown, false, 'a cancelled gesture releases the guard');
});
