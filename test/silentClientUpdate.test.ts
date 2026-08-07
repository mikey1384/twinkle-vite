import assert from 'node:assert/strict';
import test from 'node:test';
import {
  attemptSilentClientUpdate,
  clearSilentClientUpdateMemory,
  hasLiveBuildRuntimeSession,
  hasStoreDraft,
  hasUnsavedTypedInput,
  hasUnsavedUserWork,
  hasVisibleTypedContent,
  isClientUpdatePending,
  markClientUpdatePending,
  noteStaleClientActionError
} from '../src/helpers/clientUpdate';
import { LOADED_BUILD_RUNTIME_SESSION_SELECTOR } from '../src/constants/appShell';

function createStorage() {
  const entries = new Map<string, string>();
  return {
    getItem(key: string) {
      return entries.get(key) || null;
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    }
  };
}

test('a stale tab silently reloads once, then falls back to the popup', () => {
  clearSilentClientUpdateMemory();
  const storage = createStorage();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };

  assert.equal(
    attemptSilentClientUpdate({ storage, now: 1000, version: '2.0.65', reload }),
    true
  );
  assert.equal(reloads, 1);

  // A second mismatch in the same page context (e.g. connect and pageshow
  // racing) must not double-reload, but must still suppress the popup because
  // a reload is already on the way.
  assert.equal(
    attemptSilentClientUpdate({ storage, now: 1500, version: '2.0.65', reload }),
    true
  );
  assert.equal(reloads, 1);

  // The reload landed the same stale bundle (fresh page context, same
  // version, within the TTL): no second silent attempt — show the popup.
  clearSilentClientUpdateMemory();
  assert.equal(
    attemptSilentClientUpdate({ storage, now: 2000, version: '2.0.65', reload }),
    false
  );
  assert.equal(reloads, 1);
});

test('the budget resets after the TTL and after a successful upgrade', () => {
  clearSilentClientUpdateMemory();
  const storage = createStorage();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };

  assert.equal(
    attemptSilentClientUpdate({ storage, now: 1000, version: '2.0.65', reload }),
    true
  );

  // Same stale version long after the TTL: worth one more silent attempt.
  clearSilentClientUpdateMemory();
  assert.equal(
    attemptSilentClientUpdate({
      storage,
      now: 1000 + 60 * 60 * 1000 + 1,
      version: '2.0.65',
      reload
    }),
    true
  );

  // The upgrade succeeded and later the bundle went stale again (new deploy):
  // the recorded attempt is for another version, so silence is allowed.
  clearSilentClientUpdateMemory();
  assert.equal(
    attemptSilentClientUpdate({ storage, now: 2000, version: '2.0.66', reload }),
    true
  );
  assert.equal(reloads, 3);
});

test('a stale-action error defers first, reloads on a real retry, pops up only when reloads stop working', () => {
  clearSilentClientUpdateMemory();
  const storage = createStorage();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };
  const base = 100_000;

  // First failed upload: stay quiet, remember an update is due.
  assert.equal(
    noteStaleClientActionError({ storage, now: base, version: '2.0.65', reload }),
    'deferred'
  );
  assert.equal(isClientUpdatePending(), true);

  // The same failure emits a second signal moments later (chunk helper +
  // generic error handler): still one action, no escalation.
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 100,
      version: '2.0.65',
      reload
    }),
    'deferred'
  );
  assert.equal(reloads, 0);

  // The user retries after reading the error: the old bundle can never
  // complete this flow, so reload now.
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 10_000,
      version: '2.0.65',
      reload
    }),
    'reloading'
  );
  assert.equal(reloads, 1);

  // Fresh page context, same stale bundle (reload did not fix it), another
  // failed action cycle: budget is spent, so the popup is the answer.
  clearSilentClientUpdateMemory();
  markClientUpdatePending();
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 20_000,
      version: '2.0.65',
      reload
    }),
    'popup'
  );
  assert.equal(reloads, 1);
});

test('a stale-action retry never reloads over unsaved work — the popup informs instead', () => {
  clearSilentClientUpdateMemory();
  const storage = createStorage();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };
  const base = 200_000;

  // First failed submit: deferred as usual, the draft stays on screen.
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base,
      version: '2.0.65',
      reload,
      hasUnsavedWork: () => true
    }),
    'deferred'
  );

  // The user retries the submit while the comment they were submitting is
  // still in memory: reloading would destroy the very text they are trying to
  // post, so the popup is the escalation — it leaves the draft on screen.
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 10_000,
      version: '2.0.65',
      reload,
      hasUnsavedWork: () => true
    }),
    'popup'
  );
  assert.equal(reloads, 0);

  // The draft is gone (posted elsewhere, cleared, copied out): the next retry
  // is free to reload silently, and the budget was not consumed by the popup.
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 20_000,
      version: '2.0.65',
      reload,
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);
});

test('retained form drafts of every shape count as unsaved work', () => {
  // Edit forms retain their fields (editedTitle/editedDescription/...) in the
  // Input context after unmount so navigation back restores them — a silent
  // reload at a navigation boundary must see them even though no .text field
  // or visible DOM field exists.
  assert.equal(
    hasUnsavedTypedInput({
      editurl123: { editedTitle: 'better title', editedUrl: 'https://a.b' }
    }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ editcomment55: { editedComment: 'reworded' } }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ 'edit-interactive-3-9': { editedHeading: 'h' } }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ 'mission-feedback-7': { feedback: 'notes' } }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ reward57: { comment: 'reward reason' } }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ userInfo: { editedWebsite: 'https://me.example' } }),
    true
  );
  // Top-level string drafts (status message, profile title) count too.
  assert.equal(hasUnsavedTypedInput({ editedStatusMsg: 'brb' }), true);
  assert.equal(hasUnsavedTypedInput({ editedProfileTitle: 'the boss' }), true);
  // Attachments count at any depth.
  assert.equal(
    hasUnsavedTypedInput({ editsubject9: { attachment: { file: {} } } }),
    true
  );
  // Empty retained shells and search strings are not precious.
  assert.equal(
    hasUnsavedTypedInput({
      editurl123: { editedTitle: '', editedDescription: '  ' },
      userInfo: { userInfoOnEdit: true },
      userSearchText: 'zero',
      chatSearchText: 'hello'
    }),
    false
  );
  // Fetched, non-precious composer data must not defer updates forever.
  assert.equal(
    hasUnsavedTypedInput({
      content: {
        alreadyPosted: { title: 'existing post', id: 3 },
        ytDetails: { ytTitle: 'video title' },
        form: { url: '', title: '' }
      }
    }),
    false
  );
});

test('un-persisted typed input is detected so silent reloads never destroy it', () => {
  // Shapes mirror the Input context: keyed entries carry `.text`
  // (chat/comment inputs); `subject`/`content` are the structured composers.
  assert.equal(hasUnsavedTypedInput(undefined), false);
  assert.equal(hasUnsavedTypedInput({}), false);
  assert.equal(
    hasUnsavedTypedInput({
      subject: { details: { title: '', description: '' } },
      content: { form: { url: '', title: '' } },
      userSearchText: 'zero'
    }),
    false
  );
  assert.equal(
    hasUnsavedTypedInput({ 'chat123/45': { text: '  ' } }),
    false
  );
  assert.equal(
    hasUnsavedTypedInput({ 'chat123/45': { text: 'unsent message' } }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ comment777: { text: 'half a reply' } }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ subject: { details: { title: 'New post' } } }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ content: { form: { url: 'https://y.t/v' } } }),
    true
  );
  // Selected file attachments are in-memory File objects — always precious.
  assert.equal(
    hasUnsavedTypedInput({
      comment777: { text: '', attachment: { file: {}, contentType: 'file' } }
    }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({
      subject: { details: { title: '', attachment: { file: {} } } }
    }),
    true
  );
  assert.equal(
    hasUnsavedTypedInput({ comment777: { text: '', attachment: null } }),
    false
  );
  assert.equal(
    hasUnsavedTypedInput({
      subject: { details: { title: '', secretAttachment: { file: {} } } }
    }),
    true
  );
});

test('module text stores (comment inputStates, edit forms) count as unsaved work', () => {
  // inputStates entries are objects with .text; editFormTextStates values are
  // raw strings — both persist after their component unmounts.
  assert.equal(hasStoreDraft({}), false);
  assert.equal(hasStoreDraft({ comment42: { text: '  ' } }), false);
  assert.equal(hasStoreDraft({ comment42: { text: 'typed reply' } }), true);
  assert.equal(hasStoreDraft({ '42commentpinned': 'edited text' }), true);
  assert.equal(hasStoreDraft({ '42comment': '' }), false);
  assert.equal(
    hasStoreDraft({ comment42: { attachment: { file: {} } } }),
    true
  );
});

test('the DOM sweep catches typed text in stores the helper does not know about', () => {
  const fakeRoot = (fields: Array<{ value?: string; textContent?: string }>) =>
    ({
      querySelectorAll: () => fields
    }) as any;
  assert.equal(hasVisibleTypedContent(null), false);
  assert.equal(hasVisibleTypedContent(fakeRoot([])), false);
  assert.equal(
    hasVisibleTypedContent(fakeRoot([{ value: '' }, { value: '   ' }])),
    false
  );
  assert.equal(
    hasVisibleTypedContent(fakeRoot([{ value: 'half-typed thing' }])),
    true
  );
  assert.equal(
    hasVisibleTypedContent(
      fakeRoot([{ value: undefined, textContent: 'editable words' }])
    ),
    true
  );

  // hasUnsavedUserWork ORs all three signals.
  assert.equal(
    hasUnsavedUserWork({ inputState: {}, moduleStores: [{}], root: null }),
    false
  );
  assert.equal(
    hasUnsavedUserWork({
      inputState: {},
      moduleStores: [{ comment1: { text: 'x' } }],
      root: null
    }),
    true
  );
  assert.equal(
    hasUnsavedUserWork({
      inputState: {},
      moduleStores: [{}],
      root: fakeRoot([{ value: 'typed' }])
    }),
    true
  );
});

test('a loaded Build runtime session blocks silent reloads; a loading one does not', () => {
  // The runtime app lives in a sandboxed iframe: its in-memory state (typed
  // text, game progress) is invisible to every parent-side scan, and hidden
  // keep-alive layers hold state deliberately. Presence of a LOADED session
  // must therefore count as unsaved work on its own. A still-loading session
  // has no user state yet — blocking it would waste the one guaranteed-
  // lossless reload moment (fresh arrival on an /app route).
  const selectorAwareRoot = (matchingLayers: number) =>
    ({
      querySelectorAll: (selector: string) =>
        selector === LOADED_BUILD_RUNTIME_SESSION_SELECTOR
          ? Array.from({ length: matchingLayers }, () => ({}))
          : []
    }) as any;
  assert.equal(hasLiveBuildRuntimeSession(null), false);
  assert.equal(hasLiveBuildRuntimeSession(selectorAwareRoot(0)), false);
  assert.equal(hasLiveBuildRuntimeSession(selectorAwareRoot(1)), true);
  // The gate every silent path calls must pick the signal up even with no
  // typed text anywhere else.
  assert.equal(
    hasUnsavedUserWork({
      inputState: {},
      moduleStores: [{}],
      root: selectorAwareRoot(1)
    }),
    true
  );
  assert.equal(
    hasUnsavedUserWork({
      inputState: {},
      moduleStores: [{}],
      root: selectorAwareRoot(0)
    }),
    false
  );
  // The selector pairs the keep-alive layer marker with loaded="true"; an
  // unloaded layer must not match it.
  assert.match(
    LOADED_BUILD_RUNTIME_SESSION_SELECTOR,
    /^\[data-build-runtime-keepalive-layer="true"\]\[data-runtime-session-loaded="true"\]$/
  );
});

test('an unusable storage disables silent reloads entirely', () => {
  clearSilentClientUpdateMemory();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };

  assert.equal(
    attemptSilentClientUpdate({
      storage: null,
      now: 1000,
      version: '2.0.65',
      reload
    }),
    false
  );
  const throwingStorage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error('quota');
    }
  };
  assert.equal(
    attemptSilentClientUpdate({
      storage: throwingStorage,
      now: 1000,
      version: '2.0.65',
      reload
    }),
    false
  );
  assert.equal(reloads, 0);
});
