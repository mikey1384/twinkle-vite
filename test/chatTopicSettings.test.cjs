const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

function fixture(kind = 'settings', overrides = {}, options = {}) {
  const slots = [], effects = [], requests = [], events = [], edits = [], navigations = [], busyChanges = [], drafts = [];
  const listeners = new Map(), timers = new Map();
  let cursor = 0, dirty = false, tree, timerId = 0, hidden = 0, deleted = 0;
  let props = {
    channelId: 3, topicId: 8, currentTopicId: 8, pathId: 'preview', topicText: 'Community plans',
    customInstructions: '', newCustomInstructions: '', isCustomInstructionsOn: false,
    isOwnerPostingOnly: false, isTwoPeopleChat: false, isAIChannel: false, canDeleteTopic: true,
    displayedThemeColor: 'gold', onHide() { hidden++; }, onDeleteTopic() { deleted++; },
    onEditTopic(data) {
      edits.push(data);
      if (options.mirrorEdits) { props = { ...props, ...data }; dirty = true; }
    }, onBusyChange(busy) { busyChanges.push(busy); },
    onSetCustomInstructions(value) { props.newCustomInstructions = value; dirty = true; },
    onSetIsCustomInstructionsOn(value) { props.isCustomInstructionsOn = typeof value === 'function' ? value(props.isCustomInstructionsOn) : value; dirty = true; },
    ...overrides
  };
  const hooks = {
    ...React, useId: () => 'topic-settings-test',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], next => {
        const value = typeof next === 'function' ? next(slots[index]) : next;
        if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useMemo(fn, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) slots[index] = { deps, value: fn() };
      return slots[index].value;
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; });
      }
    }
  };
  const Button = ({ children, onClick, disabled, loading, style }) => React.createElement('button', { onClick, disabled: disabled || loading, style }, children);
  const Modal = ({ children, footer, title, ...rest }) => React.createElement('section', { role: 'dialog', 'aria-label': rest['aria-label'] }, title, children, footer);
  const Input = ({ hasError, onChange, ...rest }) => React.createElement('input', { ...rest, onChange: event => onChange(event.target.value) });
  const Switch = ({ checked, disabled, ariaLabel }) => React.createElement('input', { type: 'checkbox', role: 'switch', checked, disabled, 'aria-label': ariaLabel, readOnly: true });
  const Menu = () => null;
  const Textarea = ({ value, id, disabled, ...rest }) => React.createElement('textarea', { id, disabled, value, readOnly: true, 'aria-invalid': rest['aria-invalid'], 'aria-describedby': rest['aria-describedby'] });
  const canonical = args => ({ topicSettings: { topicTitle: args.topicText, isOwnerPostingOnly: args.isOwnerPostingOnly, customInstructions: args.customInstructions || '' } });
  const helpers = new Proxy({}, { get: (_, name) => async args => {
    requests.push({ name, args });
    if (options.request) return options.request(name, args, requests);
    return name === 'editTopic' ? canonical(args) : {};
  } });
  const loadDraft = options.loadDraft || (async () => null);
  const dependencies = {
    react: hooks,
    '~/components/Modal': Modal, '~/components/Button': Button, '~/components/Texts/Input': Input,
    '~/components/Buttons/SwitchButton': Switch, './AIChatTopicMenu': Menu, '~/components/Texts/Textarea': Textarea,
    '~/components/Icon': () => null, '~/components/ErrorBoundary': ({ children }) => children,
    '~/components/AIDisabledNotice': ({ title }) => React.createElement('p', null, title),
    '~/components/DraftSaveIndicator': () => null,
    '~/constants/defaultValues': { charLimit: { chat: { topic: 200 }, comment: 10000 } },
    '~/contexts': {
      useAppContext: s => s({ requestHelpers: helpers }),
      useKeyContext: s => s({ myState: { userId: 5 } }),
      useViewContext: s => s({ state: { aiFeaturesDisabled: !!options.aiDisabled } }),
      useChatContext: s => s({ state: { channelsObj: { 3: { messagesObj: { 7: { id: 7, content: 'Stale' } } } } }, actions: new Proxy({}, { get: (_, name) => args => events.push({ name, args }) }) })
    },
    'react-router-dom': { useNavigate: () => url => navigations.push(url) },
    '../helpers': { buildCanonicalChannelMessagesState: args => { events.push({ name: 'hydrate', args }); return { messageIds: args.messages.map(m => m.id) }; } },
    '../topicStyles': { chatTopicModalClass: 'topic-modal', chatTopicActionStyle: { minHeight: 44, fontSize: '14px' } },
    './styles': new Proxy({}, { get: (_, name) => name.endsWith('Style') ? {} : name }),
    '~/helpers/stringHelpers': { exceedsCharLimit: ({ text }) => text.length > 10000, addEmoji: text => text.replace(':)', '🙂') },
    '~/helpers/improveCustomInstructions': { deriveImprovedInstructionsText: ({ fallbackText }) => fallbackText },
    '~/helpers/hooks': { useDraft: () => ({ savingState: 'idle', loadDraft, saveDraft: value => drafts.push(value), deleteDraft: async () => {} }) },
    '~/constants/sockets/api': { socket: {
      emit(name, args) { events.push({ name, args }); },
      on(name, fn) { listeners.set(name, fn); },
      off(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); }
    } }
  };
  const file = kind === 'settings' ? 'index.tsx' : 'AIChatTopicMenu.tsx';
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'console', 'setTimeout', 'clearTimeout', transformSync(readFileSync(path.resolve(__dirname, '../src/containers/Chat/Modals/TopicSettingsModal', file), 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code)(
    name => { assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency ${name}`); return dependencies[name]; },
    mod, mod.exports, { error() {} }, fn => { timers.set(++timerId, fn); return timerId; }, id => timers.delete(id)
  );
  function nodes(node = tree) {
    if (!React.isValidElement(node)) return [];
    return [node, ...React.Children.toArray(node.props.children).flatMap(child => nodes(child)), ...nodes(node.props.footer ?? null)];
  }
  return {
    requests, events, edits, navigations, drafts, busyChanges,
    render(next = {}) {
      props = { ...props, ...next };
      for (let pass = 0; pass < 20; pass++) {
        cursor = 0; dirty = false; tree = mod.exports.default(props);
        while (effects.length) effects.shift()();
        if (!dirty) return renderToStaticMarkup(tree);
      }
      throw new Error('Unexpected render loop');
    },
    find(name) { const found = nodes().find(node => node.type === dependencies[name]); assert.ok(found, name); return found.props; },
    buttons() { return nodes().filter(node => node.type === Button).map(node => node.props); },
    button(label) { const found = nodes().find(node => node.type === Button && node.props.children === label); assert.ok(found, label); return found.props; },
    switch(label) { const found = nodes().find(node => node.type === Switch && node.props.ariaLabel === label); assert.ok(found, label); return found.props; },
    emit(name, payload) { listeners.get(name)?.(payload); },
    dispose() { for (const slot of slots) slot?.cleanup?.(); },
    get hidden() { return hidden; }, get deleted() { return deleted; }, get listenerCount() { return listeners.size; }
  };
}
const menu = './AIChatTopicMenu', input = '~/components/Texts/Input', textarea = '~/components/Texts/Textarea';
const settled = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

test('settings label is named and empty/over-limit titles are blocked in both UI and handler', async () => {
  const app = fixture();
  assert.match(app.render(), /for="topic-settings-test"/);
  assert.match(app.render(), /aria-describedby="topic-settings-test-help"/);
  for (const title of ['  ', 'x'.repeat(201)]) {
    app.find(input).onChange(title); const html = app.render();
    assert.match(html, /aria-invalid="true"/);
    assert.equal(app.button('Save').disabled, true);
    await app.button('Save').onClick();
  }
  assert.deepEqual(app.requests, []);
  app.find(input).onChange('x'.repeat(200)); app.render();
  assert.equal(app.button('Save').disabled, false);
  assert.equal(app.button('Save').style.minHeight, 44);
});

test('save locks the form, rejects rapid duplicates, and keeps failed edits without navigating', async () => {
  let reject;
  const app = fixture('settings', {}, { request: () => new Promise((_, fail) => { reject = fail; }) });
  app.render(); app.find(input).onChange('An edited label'); app.render();
  const save = app.button('Save'), first = save.onClick(); await save.onClick(); app.render();
  assert.equal(app.requests.length, 1); assert.equal(app.find(input).disabled, true);
  assert.equal(app.switch('Only owner can post messages').disabled, true);
  app.find('~/components/Modal').onClose(); assert.equal(app.hidden, 0);
  reject(new Error('Isolated failure')); await first;
  assert.match(app.render(), /role="alert"/); assert.equal(app.find(input).value, 'An edited label');
  assert.deepEqual(app.navigations, []); assert.deepEqual(app.edits, []);
});

test('instruction streaming blocks save synchronously, and invalid instruction lengths stay blocked', async () => {
  const app = fixture('settings', { isAIChannel: true, customInstructions: 'Original' });
  app.render(); app.find(input).onChange('New title'); app.render();
  const oldSave = app.button('Save'); app.find(menu).onBusyChange(true);
  await oldSave.onClick(); assert.deepEqual(app.requests, []);
  assert.match(app.render(), /Wait for the instructions to finish/);
  app.find(menu).onBusyChange(false);
  for (const text of ['', 'x'.repeat(10001)]) {
    app.find(menu).onSetCustomInstructions(text); app.render();
    assert.equal(app.button('Save').disabled, true); await app.button('Save').onClick();
  }
  assert.deepEqual(app.requests, []);
});

test('turning custom instructions off publishes the canonical empty string', async () => {
  const app = fixture('settings', { isAIChannel: true, customInstructions: 'Old instructions' });
  app.render(); app.find(menu).onSetIsCustomInstructionsOn(false); app.render();
  await app.button('Save').onClick();
  assert.equal('customInstructions' in app.requests[0].args, false);
  assert.equal(app.edits[0].customInstructions, ''); assert.equal(app.hidden, 1);
});

test('AI navigation only happens after the canonical edit and last-topic update succeed', async () => {
  let resolve;
  const app = fixture('settings', { isAIChannel: true, customInstructions: 'Original' }, {
    request: (name, args) => name === 'editTopic' ? new Promise(done => { resolve = done; }) : Promise.resolve({})
  });
  app.render(); app.find(menu).onSetCustomInstructions('Updated'); app.render();
  const pending = app.button('Save').onClick(); assert.deepEqual(app.navigations, []);
  assert.deepEqual(app.requests.map(r => r.name), ['editTopic']);
  resolve({ topicSettings: { topicTitle: 'Canonical title', isOwnerPostingOnly: true, customInstructions: 'Canonical instructions' } });
  await pending;
  assert.deepEqual(app.requests.map(r => r.name), ['editTopic', 'updateLastTopicId']);
  assert.deepEqual(app.navigations, ['/chat/preview/topic/8']);
  assert.equal(app.edits[0].topicText, 'Canonical title');
});

for (const failedStep of ['updateTopicShareState', 'updateLastTopicId']) {
  test(`a failed ${failedStep} retries without repeating an acknowledged AI edit`, async () => {
    let failed = false;
    const app = fixture('settings', { isAIChannel: true, customInstructions: 'Original' }, {
      mirrorEdits: true,
      request: async (name, args) => {
        if (name === failedStep && !failed) { failed = true; throw new Error('Isolated follow-up failure'); }
        return name === 'editTopic' ? { topicSettings: { topicTitle: args.topicText, isOwnerPostingOnly: false, customInstructions: args.customInstructions } } : {};
      }
    });
    app.render(); app.find(menu).onSetCustomInstructions('Updated');
    if (failedStep === 'updateTopicShareState') app.switch('Share with other users').onChange();
    app.render(); await app.button('Save').onClick();
    assert.match(app.render(), /settings were saved/); assert.equal(app.hidden, 0);
    assert.equal(app.edits[0].customInstructions, 'Updated');
    await app.button('Retry save').onClick();
    assert.equal(app.requests.filter(r => r.name === 'editTopic').length, 1);
    assert.equal(app.requests.filter(r => r.name === failedStep).length, 2);
    assert.equal(app.hidden, 1);
  });
}

test('a failed post-delete refresh retries hydration, not the deletion', async () => {
  let loads = 0;
  const app = fixture('settings', {}, { request: async name => {
    if (name === 'loadChatChannel') {
      if (++loads === 1) throw new Error('Isolated refresh failure');
      return { channel: { pinnedTopicIds: [2], topicObj: {} }, messages: [{ id: 7, content: 'Canonical' }], messagesHydrated: true };
    }
    return {};
  } });
  app.render(); app.buttons().find(b => Array.isArray(b.children)).onClick(); app.render();
  await app.button('Delete Topic').onClick();
  assert.match(app.render(), /topic was deleted/); assert.equal(app.find(input).disabled, true);
  await app.button('Retry refresh').onClick();
  assert.equal(app.requests.filter(r => r.name === 'deleteTopic').length, 1);
  assert.equal(app.requests.filter(r => r.name === 'loadChatChannel').length, 2);
  assert.equal(app.requests.at(-1).args.hydrateMessages, true);
  assert.equal(app.events.find(e => e.name === 'hydrate').args.messagesHydrated, true);
  assert.equal(app.events.find(e => e.name === 'onSetChannelState').args.newState.selectedTopicId, null);
  assert.equal(app.deleted, 1); assert.deepEqual(app.navigations, ['/chat/preview']);
});

test('AI menu retains automatic generation, request guards and cleanup without cross-mode duplicates', () => {
  const app = fixture('menu'); app.render();
  const generation = app.events.find(e => e.name === 'generate_custom_instructions'); assert.ok(generation);
  assert.equal(app.busyChanges.at(-1), true);
  app.render({ isCustomInstructionsOn: true, newCustomInstructions: 'Streaming draft' });
  assert.equal(app.switch('Custom instructions').disabled, false);
  for (const button of app.buttons()) button.onClick?.();
  assert.equal(app.events.length, 1);
  app.emit('generate_custom_instructions_complete', { requestId: 'stale', content: 'Wrong' });
  app.render(); assert.equal(app.find(textarea).value, 'Streaming draft');
  app.emit('generate_custom_instructions_complete', { requestId: generation.args.requestId, content: 'Canonical result' });
  app.render(); assert.equal(app.find(textarea).value, 'Canonical result'); assert.equal(app.busyChanges.at(-1), false);
  app.dispose(); assert.equal(app.listenerCount, 0);
});

test('instruction typing preserves composition and saves emoji conversion consistently', () => {
  const app = fixture('menu', { customInstructions: 'Existing', isCustomInstructionsOn: true, newCustomInstructions: 'Hello :) ' });
  app.render(); const keyUp = app.find(textarea).onKeyUp;
  for (const nativeEvent of [{ isComposing: true }, { keyCode: 229 }]) {
    keyUp({ key: ' ', nativeEvent, currentTarget: { value: 'Hello :) ' } });
  }
  assert.deepEqual(app.drafts, []);
  keyUp({ key: ' ', nativeEvent: {}, currentTarget: { value: 'Hello :) ' } });
  assert.deepEqual(app.drafts, [{ content: 'Hello 🙂 ' }]);
  app.render(); assert.equal(app.find(textarea).value, 'Hello 🙂 ');
});

test('a late draft cannot replace another topic’s draft, and a current draft restores normally', async () => {
  const loads = [];
  const app = fixture('menu', { customInstructions: 'Existing', isCustomInstructionsOn: true, newCustomInstructions: 'Current' }, {
    loadDraft: () => new Promise(done => { loads.push(done); })
  });
  app.render(); app.render({ topicId: 9 });
  loads[0]({ content: 'Stale draft' }); await settled();
  assert.doesNotMatch(app.render(), /Restore draft/);
  loads[1]({ content: 'Current topic draft' }); await settled();
  assert.match(app.render(), /Restore draft/);
  const restore = app.buttons().find(button => React.Children.toArray(button.children).includes('Restore draft'));
  assert.ok(restore); restore.onClick(); app.render();
  assert.equal(app.find(textarea).value, 'Current topic draft');
  assert.deepEqual(app.drafts, [{ content: 'Current topic draft' }]);
});

test('failed improvements restore the original text and ignore late completion events', () => {
  const app = fixture('menu', { customInstructions: 'Original', isCustomInstructionsOn: true, newCustomInstructions: 'Original' });
  app.render();
  const improve = app.buttons()[1], generate = app.buttons()[0];
  improve.onClick(); improve.onClick(); generate.onClick(); app.render();
  assert.equal(app.events.length, 1);
  const requestId = app.events[0].args.requestId;
  app.emit('improve_custom_instructions_update', { requestId, content: 'Partial' });
  app.render(); assert.equal(app.find(textarea).value, 'Partial');
  app.emit('improve_custom_instructions_error', { requestId, error: 'Simulated failure' });
  assert.match(app.render(), /role="alert"/); assert.equal(app.find(textarea).value, 'Original');
  assert.equal(app.busyChanges.at(-1), false);
  app.emit('improve_custom_instructions_complete', { requestId, content: 'Late result' });
  app.render(); assert.equal(app.find(textarea).value, 'Original');
});

test('disabled AI features never start generation', () => {
  const app = fixture('menu', {}, { aiDisabled: true });
  assert.match(app.render(), /Unavailable/); assert.deepEqual(app.events, []);
});
