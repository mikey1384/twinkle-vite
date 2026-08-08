import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  applyClientUpdateAtSafeBoundary,
  applyClientVersionResult,
  armUpdateIfDeployedBundleNewer,
  attemptSilentClientUpdate,
  buildClientVersionCheckUrl,
  clearSilentClientUpdateMemory,
  getDeployedEntryScripts,
  getRunningEntryScripts,
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

const socketInitSource = readFileSync(
  fileURLToPath(
    new URL(
      '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts',
      import.meta.url
    )
  ),
  'utf8'
);
const appSource = readFileSync(
  fileURLToPath(
    new URL('../src/containers/App/index.tsx', import.meta.url)
  ),
  'utf8'
);

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

function entryDocument(srcs: string[]) {
  return {
    querySelectorAll: (selector: string) =>
      selector === 'script[src]'
        ? srcs.map((src) => ({ getAttribute: () => src }))
        : []
  } as any;
}

function entryHtml(basename: string) {
  return `<!doctype html><script type="module" crossorigin src="https://x.vercel.app/assets/${basename}"></script>`;
}

function fetcherFor(html: string, calls: string[] = []) {
  return async (url: string) => {
    calls.push(url);
    return { ok: true, text: async () => html };
  };
}

function createVersionResultEffects() {
  const statuses: boolean[] = [];
  let compatibleArrivals = 0;
  return {
    statuses,
    get compatibleArrivals() {
      return compatibleArrivals;
    },
    onVersionStatus(data: { match: boolean }) {
      statuses.push(data.match);
    },
    onCompatibleArrival() {
      compatibleArrivals += 1;
    }
  };
}

test('every version check gets a unique cache-busting URL', () => {
  assert.equal(
    buildClientVersionCheckUrl({
      apiUrl: 'https://api.twinkle.network',
      version: '2.0.68',
      requestId: 100
    }),
    'https://api.twinkle.network/notification/version?version=2.0.68&t=100'
  );
  assert.notEqual(
    buildClientVersionCheckUrl({
      apiUrl: 'https://api.twinkle.network',
      version: '2.0.68',
      requestId: 100
    }),
    buildClientVersionCheckUrl({
      apiUrl: 'https://api.twinkle.network',
      version: '2.0.68',
      requestId: 101
    })
  );
});

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

test('a usable upload-stale client updates quietly and never escalates to the popup', () => {
  clearSilentClientUpdateMemory();
  const storage = createStorage();
  let reloads = 0;
  const reload = () => {
    reloads += 1;
  };
  const base = 300_000;

  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base,
      version: '2.0.64',
      reload,
      allowPopup: false
    }),
    'deferred'
  );
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 10_000,
      version: '2.0.64',
      reload,
      allowPopup: false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);

  clearSilentClientUpdateMemory();
  markClientUpdatePending();
  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 20_000,
      version: '2.0.64',
      reload,
      hasUnsavedWork: () => true,
      allowPopup: false
    }),
    'deferred'
  );
  assert.equal(reloads, 1);

  assert.equal(
    noteStaleClientActionError({
      storage,
      now: base + 30_000,
      version: '2.0.64',
      reload,
      hasUnsavedWork: () => false,
      allowPopup: false
    }),
    'deferred'
  );
  assert.equal(reloads, 1);
});

test('the version-result boundary ignores non-canonical answers and probes compatible arrivals', () => {
  clearSilentClientUpdateMemory();
  const effects = createVersionResultEffects();
  const base = {
    trigger: 'arrival' as const,
    version: '2.0.68',
    interactedSinceArrival: false,
    hasUnsavedWork: () => false,
    onVersionStatus: effects.onVersionStatus,
    onCompatibleArrival: effects.onCompatibleArrival
  };

  assert.equal(applyClientVersionResult({ ...base, data: undefined }), 'ignored');
  assert.equal(applyClientVersionResult({ ...base, data: {} }), 'ignored');
  assert.equal(
    applyClientVersionResult({ ...base, data: { match: 'true' } }),
    'ignored'
  );
  assert.deepEqual(effects.statuses, []);
  assert.equal(effects.compatibleArrivals, 0);

  assert.equal(
    applyClientVersionResult({
      ...base,
      data: { match: true, version: '2.0.68' }
    }),
    'compatible'
  );
  assert.deepEqual(effects.statuses, [true]);
  assert.equal(effects.compatibleArrivals, 1);
  assert.match(
    socketInitSource,
    /applyClientVersionResult\(\{[\s\S]*?onVersionStatus: onCheckVersion[\s\S]*?onCompatibleArrival:/
  );
});

test('the complete usable-426 branch updates quietly and cannot produce a popup', () => {
  clearSilentClientUpdateMemory();
  const effects = createVersionResultEffects();
  const storage = createStorage();
  let reloads = 0;
  const base = {
    data: { match: true, version: '2.0.64' },
    trigger: 'staleActionError' as const,
    version: '2.0.64',
    interactedSinceArrival: true,
    onVersionStatus: effects.onVersionStatus,
    onCompatibleArrival: effects.onCompatibleArrival,
    storage,
    reload: () => {
      reloads += 1;
    }
  };

  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 400_000,
      hasUnsavedWork: () => false
    }),
    'deferred'
  );
  assert.equal(isClientUpdatePending(), true);
  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 410_000,
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);

  clearSilentClientUpdateMemory();
  markClientUpdatePending();
  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 420_000,
      hasUnsavedWork: () => true
    }),
    'deferred'
  );
  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 430_000,
      hasUnsavedWork: () => false
    }),
    'deferred'
  );
  assert.deepEqual(effects.statuses, [true, true, true, true]);
  assert.equal(effects.compatibleArrivals, 0);
  assert.equal(reloads, 1);
});

test('a mandatory arrival reloads silently, defers over work, and only then permits the popup', () => {
  clearSilentClientUpdateMemory();
  const effects = createVersionResultEffects();
  const storage = createStorage();
  let reloads = 0;
  const base = {
    data: { match: false, version: '1.9.99' },
    trigger: 'arrival' as const,
    version: '1.9.99',
    onVersionStatus: effects.onVersionStatus,
    onCompatibleArrival: effects.onCompatibleArrival,
    storage,
    reload: () => {
      reloads += 1;
    }
  };

  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 500_000,
      interactedSinceArrival: false,
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);
  assert.deepEqual(effects.statuses, []);

  clearSilentClientUpdateMemory();
  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 510_000,
      interactedSinceArrival: true,
      hasUnsavedWork: () => false
    }),
    'deferred'
  );
  clearSilentClientUpdateMemory();
  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 520_000,
      interactedSinceArrival: false,
      hasUnsavedWork: () => true
    }),
    'deferred'
  );
  assert.deepEqual(effects.statuses, []);

  clearSilentClientUpdateMemory();
  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 530_000,
      interactedSinceArrival: false,
      hasUnsavedWork: () => false
    }),
    'popup'
  );
  assert.deepEqual(effects.statuses, [false]);
  assert.equal(reloads, 1);
});

test('a mandatory stale-action retry preserves work but retains genuine popup escalation', () => {
  clearSilentClientUpdateMemory();
  const effects = createVersionResultEffects();
  const storage = createStorage();
  let reloads = 0;
  const base = {
    data: { match: false, version: '1.9.99' },
    trigger: 'staleActionError' as const,
    version: '1.9.99',
    interactedSinceArrival: true,
    onVersionStatus: effects.onVersionStatus,
    onCompatibleArrival: effects.onCompatibleArrival,
    storage,
    reload: () => {
      reloads += 1;
    }
  };

  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 600_000,
      hasUnsavedWork: () => true
    }),
    'deferred'
  );
  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 610_000,
      hasUnsavedWork: () => true
    }),
    'popup'
  );
  assert.deepEqual(effects.statuses, [false]);
  assert.equal(reloads, 0);

  assert.equal(
    applyClientVersionResult({
      ...base,
      now: 620_000,
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

test('a newer deployed entry bundle arms the pending update, nothing else does', async () => {
  // The probe compares the running tab's fingerprinted entry script against
  // the one index.html currently serves. A mismatch only ARMS the pending
  // update (the reload happens at the next safe boundary); evidence is held
  // to the captive-portal standard, so garbage on either side is not a
  // conclusion in either direction.
  const runningSrc = 'https://x.vercel.app/assets/index-AAA1.js';

  // Parsers: entry scripts only — runtime <link> preloads and non-entry
  // chunks must not pollute the identity.
  assert.deepEqual(getRunningEntryScripts(entryDocument([runningSrc])), [
    'index-AAA1.js'
  ]);
  assert.deepEqual(
    getRunningEntryScripts(
      entryDocument(['https://x.vercel.app/assets/Chat-BBB2.js'])
    ),
    []
  );
  assert.deepEqual(getDeployedEntryScripts(entryHtml('index-CCC3.js')), [
    'index-CCC3.js'
  ]);
  assert.deepEqual(getDeployedEntryScripts('<html>captive portal</html>'), []);

  // Same entry deployed -> not armed.
  clearSilentClientUpdateMemory();
  assert.equal(
    await armUpdateIfDeployedBundleNewer({
      now: 1_000_000,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor(entryHtml('index-AAA1.js'))
    }),
    false
  );
  assert.equal(isClientUpdatePending(), false);

  // Newer entry deployed -> armed, but throttled: the second probe inside the
  // window must not even fetch.
  clearSilentClientUpdateMemory();
  const calls: string[] = [];
  assert.equal(
    await armUpdateIfDeployedBundleNewer({
      now: 1_000_000,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor(entryHtml('index-DDD4.js'), calls)
    }),
    true
  );
  assert.equal(isClientUpdatePending(), true);
  clearSilentClientUpdateMemory();
  await armUpdateIfDeployedBundleNewer({
    now: 2_000_000,
    doc: entryDocument([runningSrc]),
    fetcher: fetcherFor(entryHtml('index-EEE5.js'), calls)
  });
  assert.equal(
    await armUpdateIfDeployedBundleNewer({
      now: 2_000_100,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor(entryHtml('index-FFF6.js'), calls)
    }),
    false
  );
  assert.equal(calls.length, 2);

  // Garbage from the network, a dev-server document with no fingerprinted
  // entry, or an already-pending update -> no probe conclusion.
  clearSilentClientUpdateMemory();
  assert.equal(
    await armUpdateIfDeployedBundleNewer({
      now: 3_000_000,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor('<html>captive portal</html>')
    }),
    false
  );
  assert.equal(isClientUpdatePending(), false);
  clearSilentClientUpdateMemory();
  const devCalls: string[] = [];
  assert.equal(
    await armUpdateIfDeployedBundleNewer({
      now: 4_000_000,
      doc: entryDocument(['/src/main.tsx']),
      fetcher: fetcherFor(entryHtml('index-GGG7.js'), devCalls)
    }),
    false
  );
  assert.equal(devCalls.length, 0);
  clearSilentClientUpdateMemory();
  markClientUpdatePending();
  const pendingCalls: string[] = [];
  assert.equal(
    await armUpdateIfDeployedBundleNewer({
      now: 5_000_000,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor(entryHtml('index-HHH8.js'), pendingCalls)
    }),
    false
  );
  assert.equal(pendingCalls.length, 0);
  clearSilentClientUpdateMemory();
});

test('navigation converges to the deployed bundle immediately when safe and does nothing offline', async () => {
  const runningSrc = 'https://x.vercel.app/assets/index-AAA1.js';
  const storage = createStorage();
  let reloads = 0;

  clearSilentClientUpdateMemory();
  assert.equal(
    await applyClientUpdateAtSafeBoundary({
      version: '2.0.68',
      now: 6_000_000,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor(entryHtml('index-BBB2.js')),
      storage,
      reload: () => {
        reloads += 1;
      },
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(reloads, 1);

  clearSilentClientUpdateMemory();
  assert.equal(
    await applyClientUpdateAtSafeBoundary({
      version: '2.0.68',
      now: 7_000_000,
      doc: entryDocument([runningSrc]),
      fetcher: async () => {
        throw new Error('offline');
      },
      storage: createStorage(),
      reload: () => {
        reloads += 1;
      },
      hasUnsavedWork: () => false
    }),
    'current'
  );
  assert.equal(reloads, 1);
  assert.equal(isClientUpdatePending(), false);

  clearSilentClientUpdateMemory();
  const deferredStorage = createStorage();
  const calls: string[] = [];
  assert.equal(
    await applyClientUpdateAtSafeBoundary({
      version: '2.0.68',
      now: 8_000_000,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor(entryHtml('index-CCC3.js'), calls),
      storage: deferredStorage,
      reload: () => {
        reloads += 1;
      },
      hasUnsavedWork: () => true
    }),
    'deferred'
  );
  assert.equal(isClientUpdatePending(), true);
  assert.equal(
    await applyClientUpdateAtSafeBoundary({
      version: '2.0.68',
      now: 8_010_000,
      doc: entryDocument([runningSrc]),
      fetcher: fetcherFor(entryHtml('index-DDD4.js'), calls),
      storage: deferredStorage,
      reload: () => {
        reloads += 1;
      },
      hasUnsavedWork: () => false
    }),
    'reloading'
  );
  assert.equal(calls.length, 1);
  assert.equal(reloads, 2);

  // The behavior above is wired to every React Router location dimension, so
  // query-tab and hash navigation converge just like pathname navigation.
  assert.match(appSource, /applyClientUpdateAtSafeBoundary\(\{/);
  assert.match(
    appSource,
    /\[location\.hash, location\.pathname, location\.search\]/
  );
  clearSilentClientUpdateMemory();
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
