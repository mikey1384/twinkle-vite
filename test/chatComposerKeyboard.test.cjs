const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { transformSync } = require('esbuild');

// Exercise the actual component handlers without app bootstrap, network or sends.
function createInput({ mobile = false, overLimit = false, ...overrides } = {}) {
  const source = readFileSync(path.resolve(__dirname,
    '../src/containers/Chat/Body/MessagesContainer/MessageInput/InputArea.tsx'), 'utf8');
  const dependencies = {
    react: { ...React, useEffect: () => {}, useMemo: fn => fn(), useRef: value => ({ current: value }) },
    '~/components/Texts/Textarea': () => null,
    '~/helpers/stringHelpers': {
      addEmoji: value => value.replace(':)', '🙂'),
      exceedsCharLimit: () => overLimit,
      stringIsEmpty: value => !value?.trim()
    },
    '~/helpers': { isMobile: () => mobile },
    '~/contexts': { useKeyContext: selector => selector({ myState: { userId: 5 } }) },
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
    currentTopic: null, innerRef: { current: null }, inputText: 'Hello',
    isBanned: false, isRestrictedChannel: false, isOnlyOwnerPostingTopic: false,
    isOwnerPostingOnly: false, isTwoPeopleChannel: false, isOwner: false,
    isMain: true, loading: false,
    onSendMsg: () => { calls.sends++; }, onHeightChange: () => {},
    onSetText: text => calls.text.push(text), ...overrides
  });
  return { props: tree.props.children.props, calls };
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

test('restricted DM topic with missing topic data stays disabled without crashing', () => {
  const { props } = createInput({ isOnlyOwnerPostingTopic: true, isTwoPeopleChannel: true,
    isMain: false, partner: { id: 9, username: 'Mina' } });
  assert.equal(props.disabled, true);
  assert.match(props.placeholder, /Only Mina can post/);
});
