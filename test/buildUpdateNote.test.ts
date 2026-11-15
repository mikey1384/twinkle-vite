import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseBuild } from '../src/helpers/buildRelease';
import { readFileSync } from 'node:fs';
import {
  finishUpdateNoteAfterPublish,
  UPDATE_NOTE_PENDING_DRAFT_WAIT_MS,
  UPDATE_NOTE_RELEASE_STATE_TIMEOUT_MS,
  formatUpdateNoteLabel,
  getBuildUpdateNoteNumber,
  getUpdateNoteDialogBody,
  resolveUpdateNoteToastTarget,
  getPublishedUpdateVersionId,
  ONE_TAP_CHOICE,
  resolveUpdateNoteReleaseStep
} from '../src/helpers/buildUpdateNote';
import { noteFromResponse } from '../src/containers/Build/Runtime/hooks/useUpdateNote';

const readySettings = {
  policy: null,
  state: 'published',
  configured: false,
  approvalRequired: false,
  canSubmit: false,
  isUpdate: true,
  liveActive: true,
  reviewId: null,
  reviewNote: '',
  sourceVersionId: 41,
  summary: [],
  approvalMatches: true,
  canPublish: true
} as any;

function releaseFixture(confirm: boolean) {
  const calls: string[] = [];
  return {
    calls,
    options: {
      buildId: 7,
      save: async () => {
        calls.push('save');
        return true;
      },
      loadRewards: async () => {
        calls.push('status');
        return readySettings;
      },
      requestReview: async () => readySettings,
      confirmUpdate: async () => {
        calls.push('confirm');
        return confirm;
      },
      preparePublish: async () => {
        calls.push('thumbnail');
        return {};
      },
      publish: async () => {
        calls.push('publish');
        return { success: true, build: { id: 7, isPublic: true, publishedArtifactVersionId: 50 } };
      }
    }
  };
}

test('an update asks the owner first; Cancel publishes nothing', async () => {
  const cancelled = releaseFixture(false);
  assert.deepEqual(await releaseBuild(cancelled.options), { kind: 'cancelled' });
  assert.deepEqual(cancelled.calls, ['save', 'status', 'confirm']);

  const confirmed = releaseFixture(true);
  const outcome = await releaseBuild(confirmed.options);
  assert.equal(outcome.kind, 'published');
  assert.deepEqual(confirmed.calls, ['save', 'status', 'confirm', 'thumbnail', 'publish']);
});

function noteFixture() {
  const calls: any[] = [];
  return {
    calls,
    post: async (args: any) => {
      calls.push(['post', args]);
      return { commentId: 9001, versionNumber: 12, alreadyPosted: false };
    },
    skip: async (args: any) => {
      calls.push(['skip', args]);
      return { skipped: true };
    }
  };
}

const published = { success: true, build: { id: 7, isPublic: true, publishedArtifactVersionId: 50 } };

test('the note posts only after a publish that made a new live version', async () => {
  assert.equal(getPublishedUpdateVersionId(published), 50);
  // The "already up to date" recovery result has no new version id.
  assert.equal(getPublishedUpdateVersionId({ build: { id: 7, isPublic: true, releaseStatus: {} } }), 0);
  assert.equal(getPublishedUpdateVersionId({ build: { id: 7, isPublic: false, publishedArtifactVersionId: 50 } }), 0);

  const f = noteFixture();
  const upToDate = await finishUpdateNoteAfterPublish({
    buildId: 7,
    choice: { dialogShown: true, post: true, content: '- New boss', draftId: 3 },
    result: { build: { id: 7, isPublic: true } },
    post: f.post,
    skip: f.skip
  });
  assert.deepEqual(upToDate, { kind: 'no_new_version' });
  assert.equal(f.calls.length, 0);

  const posted = await finishUpdateNoteAfterPublish({
    buildId: 7,
    choice: { dialogShown: true, post: true, content: '- New boss', draftId: 3 },
    result: published,
    post: f.post,
    skip: f.skip
  });
  assert.equal(posted.kind, 'posted');
  assert.deepEqual(f.calls, [
    ['post', { buildId: 7, artifactVersionId: 50, content: '- New boss', draftId: 3, source: 'dialog' }]
  ]);
});

test('switch off (or an empty note) counts a skip and posts nothing', async () => {
  const f = noteFixture();
  assert.deepEqual(
    await finishUpdateNoteAfterPublish({ buildId: 7, choice: { dialogShown: true, post: false, content: '', draftId: null }, result: published, post: f.post, skip: f.skip }),
    { kind: 'skipped' }
  );
  assert.deepEqual(
    await finishUpdateNoteAfterPublish({ buildId: 7, choice: { dialogShown: true, post: true, content: '   ', draftId: 4 }, result: published, post: f.post, skip: f.skip }),
    { kind: 'skipped' }
  );
  assert.deepEqual(f.calls.map(([kind]) => kind), ['skip', 'skip']);
});

test('Update pressed while Lumine was writing never posts the unseen draft', async () => {
  const f = noteFixture();
  let finishDraft!: (value: { content: string; draftId: number }) => void;
  const pendingDraft = new Promise<{ content: string; draftId: number }>((resolve) => {
    finishDraft = resolve;
  });
  const task = finishUpdateNoteAfterPublish({
    buildId: 7,
    choice: { dialogShown: true, post: true, content: '', draftId: null, pendingDraft },
    result: published,
    post: f.post,
    skip: f.skip
  });
  finishDraft({ content: '- Added a shop', draftId: 8 });
  // Handed back for "Your note is ready: review and post"; nothing posted.
  assert.deepEqual(await task, {
    kind: 'draft_ready',
    artifactVersionId: 50,
    content: '- Added a shop',
    draftId: 8
  });
  assert.equal(f.calls.length, 0);

  // The page waits through the server's whole model budget (2 x 45 s).
  assert.ok(UPDATE_NOTE_PENDING_DRAFT_WAIT_MS >= 95_000);
  // A draft that does not arrive on this page posts nothing and is not
  // counted as skipped: the workspace shows it later for review.
  const slow = noteFixture();
  const gaveUp = await finishUpdateNoteAfterPublish({
    buildId: 7,
    choice: { dialogShown: true, post: true, content: '', draftId: null, pendingDraft: new Promise(() => {}) },
    result: published,
    post: slow.post,
    skip: slow.skip,
    pendingDraftWaitMs: 5
  });
  assert.deepEqual(gaveUp, { kind: 'draft_not_ready' });
  assert.equal(slow.calls.length, 0, 'neither posted nor skipped');
});

test('Update stays one tap: the dialog only when the server says first time or choice on', () => {
  assert.equal(resolveUpdateNoteReleaseStep({ showDialog: true, firstTime: true, enabled: false }), 'dialog');
  assert.equal(resolveUpdateNoteReleaseStep({ showDialog: true, firstTime: false, enabled: true }), 'dialog');
  assert.equal(resolveUpdateNoteReleaseStep({ showDialog: false, firstTime: false, enabled: false }), 'one_tap');
  // No answer (offline, old API): one tap, the update is never blocked.
  assert.equal(resolveUpdateNoteReleaseStep(null), 'one_tap');
  assert.equal(resolveUpdateNoteReleaseStep(undefined), 'one_tap');
});

test('a one-tap update offers the link for the new version and posts or skips nothing', async () => {
  const f = noteFixture();
  assert.deepEqual(
    await finishUpdateNoteAfterPublish({ buildId: 7, choice: ONE_TAP_CHOICE, result: published, post: f.post, skip: f.skip }),
    { kind: 'one_tap', artifactVersionId: 50 }
  );
  assert.deepEqual(
    await finishUpdateNoteAfterPublish({ buildId: 7, choice: ONE_TAP_CHOICE, result: { build: { id: 7, isPublic: true } }, post: f.post, skip: f.skip }),
    { kind: 'no_new_version' }
  );
  assert.equal(f.calls.length, 0);
});

test('a note that fails to post is reported, never thrown', async () => {
  const outcome = await finishUpdateNoteAfterPublish({
    buildId: 7,
    choice: { dialogShown: true, post: true, content: '- Hi', draftId: null },
    result: published,
    post: async () => {
      const error: any = new Error('Request failed');
      error.response = { data: { error: 'This app has a newer version now, so this note was not posted.' } };
      throw error;
    },
    skip: async () => ({})
  });
  assert.deepEqual(outcome, {
    kind: 'failed',
    message: 'This app has a newer version now, so this note was not posted.'
  });
});

test('the comment tag reads "Update #N" only from the server marker', () => {
  assert.equal(getBuildUpdateNoteNumber({ settings: { buildUpdateNote: { updateNumber: 3, version: 12 } } }), 3);
  assert.equal(getBuildUpdateNoteNumber({ settings: JSON.stringify({ buildUpdateNote: { updateNumber: 7 } }) }), 7);
  assert.equal(getBuildUpdateNoteNumber({ settings: { buildUpdateNote: { version: 12 } } }), 0);
  assert.equal(getBuildUpdateNoteNumber({ settings: { mentions: [] } }), null);
  assert.equal(getBuildUpdateNoteNumber(null), null);
  assert.equal(formatUpdateNoteLabel(3), 'Update #3');
  assert.equal(formatUpdateNoteLabel(0), 'Update');
});

test('the in-app notice uses a note only for the version it announces', () => {
  const note = { commentId: 5, versionNumber: 12, updateNumber: 3, artifactVersionId: 50, content: '- New boss', username: 'maker' };
  assert.equal(noteFromResponse({ note }, 50)?.commentId, 5);
  assert.equal(noteFromResponse({ note }, 50)?.updateNumber, 3);
  assert.equal(noteFromResponse({ note }, 51), null);
  assert.equal(noteFromResponse({ note: { ...note, content: '  ' } }, 50), null);
  assert.equal(noteFromResponse({ note: null }, 50), null);
});

test('the one-tap check is short and never retried', () => {
  assert.ok(UPDATE_NOTE_RELEASE_STATE_TIMEOUT_MS <= 2_500);
  const source = readFileSync(new URL('../src/contexts/requestHelpers/build.ts', import.meta.url), 'utf8');
  const start = source.indexOf('async loadBuildUpdateNoteReleaseState(');
  assert.ok(start > 0);
  const body = source.slice(start, start + 700);
  assert.match(body, /totalTimeoutMs: UPDATE_NOTE_RELEASE_STATE_TIMEOUT_MS/);
  assert.match(body, /maxRetries: 0/);
  const release = readFileSync(new URL('../src/components/Build/hooks/useRelease.ts', import.meta.url), 'utf8');
  assert.match(release, /await loadUpdateNoteReleaseState\(buildId\)/);
});

test('a note toast tapped after leaving (or switching apps) goes to that app\'s workspace', () => {
  assert.equal(resolveUpdateNoteToastTarget({ mounted: true, currentBuildId: 7, releasedBuildId: 7 }), 'dialog');
  assert.equal(resolveUpdateNoteToastTarget({ mounted: false, currentBuildId: 7, releasedBuildId: 7 }), 'workspace');
  assert.equal(resolveUpdateNoteToastTarget({ mounted: true, currentBuildId: 8, releasedBuildId: 7 }), 'workspace');
});

test('"already has a note" keeps the owner\'s text visible, read-only', () => {
  const posted = getUpdateNoteDialogBody({
    mode: 'after_publish',
    enabled: true,
    draftStatus: 'already_posted',
    draftMessage: '',
    text: '- My own words'
  });
  assert.equal(posted.showAlreadyPosted, true);
  assert.equal(posted.showTextarea, true);
  assert.equal(posted.textareaReadOnly, true);
  assert.equal(posted.showRetry, false);
  const editing = getUpdateNoteDialogBody({ mode: 'after_publish', enabled: true, draftStatus: 'ready', draftMessage: '', text: '- x' });
  assert.equal(editing.showTextarea, true);
  assert.equal(editing.textareaReadOnly, false);
  const writing = getUpdateNoteDialogBody({ mode: 'before_publish', enabled: true, draftStatus: 'drafting', draftMessage: '', text: '' });
  assert.deepEqual([writing.showSwitch, writing.showWriting, writing.showTextarea], [true, true, false]);
  const off = getUpdateNoteDialogBody({ mode: 'before_publish', enabled: false, draftStatus: 'idle', draftMessage: '', text: '' });
  assert.deepEqual([off.showSwitch, off.showWriting, off.showTextarea], [true, false, false]);
});
