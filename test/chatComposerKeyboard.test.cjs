const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { transformSync } = require('esbuild');

// Exercise the actual component handlers without app bootstrap, network or sends.
function createInput({ mobile = false, overLimit = false, runEffects = false, ...overrides } = {}) {
  const source = readFileSync(path.resolve(__dirname,
    '../src/containers/Chat/Body/MessagesContainer/MessageInput/InputArea.tsx'), 'utf8');
  const dependencies = {
    react: { ...React, useEffect: runEffects ? fn => { fn(); } : () => {}, useMemo: fn => fn(), useRef: value => ({ current: value }) },
    '~/components/Texts/Textarea': () => null,
    '~/helpers/stringHelpers': {
      addEmoji: value => value.replace(':)', '🙂'),
      exceedsCharLimit: () => overLimit,
      stringIsEmpty: value => !value?.trim()
    },
    '~/helpers': { isMobile: () => mobile },
    '@emotion/css': { css: () => 'css' },
    '~/constants/css': { Color: { red: () => 'red' }, borderRadius: '5px' },
    '../../../containers': { chatComposerInputClass: 'composer' }
  };
  const mod = { exports: {} };
  const code = transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', code)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, mod, mod.exports);
  const calls = { sends: 0, text: [] };
  const tree = mod.exports.default({
    innerRef: { current: null }, inputText: 'Hello',
    isBanned: false, isRestrictedChannel: false, topicPostingNotice: '',
    isOwnerPostingOnly: false, isOwner: false,
    isMain: true, loading: false,
    onSendMsg: () => { calls.sends++; }, onHeightChange: () => {},
    onSetText: text => calls.text.push(text),
    // the parent owns the length rule and passes its message down
    lengthError: overLimit ? 'Keep it shorter' : null, ...overrides
  });
  // the textarea (an inline length notice may follow it)
  const children = [].concat(tree.props.children);
  return { props: children[0].props, notice: children.find(child => child?.props?.role === 'status') || null, calls };
}

function key(overrides = {}) {
  return {
    key: 'Enter', keyCode: 13, shiftKey: false, nativeEvent: { isComposing: false },
    prevented: false, preventDefault() { this.prevented = true; }, ...overrides
  };
}

test('desktop Enter sends, while Shift+Enter, mobile, loading and limits do not', () => {
  for (const [options, eventOptions, shouldSend] of [
    [{}, {}, true], [{}, { shiftKey: true }, false], [{ mobile: true }, {}, false],
    [{ loading: true }, {}, false], [{ overLimit: true }, {}, false],
    [{}, { key: 'a', keyCode: 65 }, false]
  ]) {
    const { props, calls } = createInput(options);
    const event = key(eventOptions);
    props.onKeyDown(event);
    assert.equal(calls.sends, Number(shouldSend));
    assert.equal(event.prevented, shouldSend);
  }
});

test('IME confirmation never sends or prevents the composition key', () => {
  for (const eventOptions of [
    { nativeEvent: { isComposing: true } },
    { keyCode: 229 },
    { key: 'Process', keyCode: 229 }
  ]) {
    const { props, calls } = createInput();
    const event = key(eventOptions);
    props.onKeyDown(event);
    assert.equal(calls.sends, 0);
    assert.equal(event.prevented, false);
    props.onKeyDown(key());
    assert.equal(calls.sends, 1, 'a subsequent ordinary Enter still works');
  }
});

test('composition Space does not rewrite text into emoji', () => {
  for (const eventOptions of [
    { nativeEvent: { isComposing: true } }, { keyCode: 229 }
  ]) {
    const { props, calls } = createInput();
    props.onKeyUp(key({ key: ' ', keyCode: 32, target: { value: ':) ' }, ...eventOptions }));
    assert.deepEqual(calls.text, []);
  }
  const { props, calls } = createInput();
  props.onKeyUp(key({ key: ' ', keyCode: 32, target: { value: ':) ' } }));
  assert.deepEqual(calls.text, ['🙂 ']);
});

test('a topic you cannot post in shows who can, in place of the message box', () => {
  const { props, notice } = createInput({
    topicPostingNotice: 'Only twosteps, Lucy and 3 others can post in this topic',
    isMain: false
  });
  assert.equal(props.disabled, true);
  assert.equal(props.style.display, 'none', 'the box gives way to the line');
  assert.equal(notice.props.children, 'Only twosteps, Lucy and 3 others can post in this topic');
  // the notice is about the topic only, never the main chat
  const main = createInput({ topicPostingNotice: 'Only twosteps can post in this topic', isMain: true });
  assert.equal(main.props.disabled, false);
  assert.equal(main.notice, null);
});

test('while the topic rule is still being checked, what was typed is kept', () => {
  const checking = createInput({
    runEffects: true, isMain: false, inputText: 'half a message',
    topicPostingNotice: 'Checking who can post in this topic…', topicPostingChecking: true
  });
  assert.equal(checking.props.disabled, true);
  assert.deepEqual(checking.calls.text, [], 'not cleared');
  const blocked = createInput({
    runEffects: true, isMain: false, inputText: 'half a message',
    topicPostingNotice: 'Only twosteps can post in this topic'
  });
  assert.deepEqual(blocked.calls.text, [''], 'a real block clears it, as before');
});
