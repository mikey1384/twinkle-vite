import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getBuildReleaseAction,
  releaseBuild
} from '../src/helpers/buildRelease';
import type { RewardSettings } from '../src/components/Build/Rewards/types';
import { createRewardStatusReader } from '../src/helpers/buildRewardStatus';

function settings(overrides: Partial<RewardSettings> = {}): RewardSettings {
  return {
    policy: null,
    state: 'needs_review',
    configured: true,
    approvalRequired: true,
    canSubmit: true,
    isUpdate: true,
    liveActive: true,
    reviewId: null,
    reviewNote: '',
    sourceVersionId: 41,
    summary: [],
    approvalMatches: false,
    canPublish: false,
    ...overrides
  };
}

function fixture(initial = settings()) {
  const calls: string[] = [];
  const published = {
    success: true,
    build: { id: 7, isPublic: true },
    eventTimeMs: 123
  };
  const options = {
    buildId: 7,
    save: async () => {
      calls.push('save');
      return true;
    },
    loadRewards: async () => {
      calls.push('status');
      return initial;
    },
    requestReview: async () => {
      calls.push('review');
      return settings({ state: 'in_review', reviewId: 19 });
    },
    preparePublish: async () => {
      calls.push('thumbnail');
      return { thumbnailUrl: 'owned.png' };
    },
    publish: async (input: { buildId: number; thumbnailUrl?: string }) => {
      calls.push('publish');
      assert.deepEqual(input, { buildId: 7, thumbnailUrl: 'owned.png' });
      return published;
    }
  };
  return { options, calls, published };
}

test('one update saves the latest draft and submits its approval without thumbnail or publishing work', async () => {
  const f = fixture();
  let version = 40;
  f.options.save = async () => {
    version = 41;
    f.calls.push('save');
    return true;
  };
  f.options.loadRewards = async () => {
    assert.equal(version, 41);
    f.calls.push('status');
    return settings();
  };
  const result = await releaseBuild(f.options);
  assert.ok(result.kind === 'approval');
  assert.deepEqual(f.calls, ['save', 'status', 'review']);
  assert.equal(result.settings.reviewId, 19);
  const action = getBuildReleaseAction({
    settings: result.settings,
    isPublic: true,
    hasUnpublishedChanges: true
  });
  assert.equal(action.label, 'Approval requested');
  assert.equal(action.disabled, true);
  assert.match(action.notice, /current app stays live/);
});

test('approval requested is never invented while submission is waiting or after it fails', async () => {
  const f = fixture();
  let reject!: (error: Error) => void;
  f.options.requestReview = () =>
    new Promise((_, fail) => {
      reject = fail;
    });
  const task = releaseBuild(f.options);
  let completed = false;
  void task.then(
    () => { completed = true; },
    () => { completed = true; }
  );
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, false);
  reject(new Error('Offline'));
  await assert.rejects(task, /Offline/);
  const action = getBuildReleaseAction({
    settings: settings(),
    isPublic: true,
    hasUnpublishedChanges: true
  });
  assert.equal(action.label, 'Update App');
  assert.equal(action.disabled, false);
  f.options.requestReview = async () =>
    settings({ state: 'in_review', reviewId: 19 });
  assert.equal((await releaseBuild(f.options)).kind, 'approval');
});

test('a failed save cannot submit a review or publish older saved code', async () => {
  const f = fixture();
  f.options.save = async () => false;
  assert.deepEqual(await releaseBuild(f.options), { kind: 'cancelled' });
  assert.deepEqual(f.calls, []);
});

test('ordinary updates and removal of rewards publish through the same flow', async () => {
  for (const state of ['needs_review', 'removed'] as const) {
    const f = fixture(
      settings({ state, approvalRequired: false, configured: false })
    );
    assert.deepEqual(await releaseBuild(f.options), {
      kind: 'published',
      result: f.published
    });
    assert.deepEqual(f.calls, ['save', 'status', 'thumbnail', 'publish']);
  }
});

test('an already approved private version can be republished without another review', async () => {
  const f = fixture(
    settings({ state: 'approved', canPublish: true, approvalMatches: true })
  );
  assert.equal((await releaseBuild(f.options)).kind, 'published');
  assert.equal(f.calls.includes('review'), false);
});

test('existing pending requests, proposals and reviewer feedback are not replaced or re-announced', async () => {
  for (const state of [
    'in_review',
    'changes_offered',
    'changes_requested',
    'paused'
  ] as const) {
    const current = settings({ state, reviewId: 19 });
    const f = fixture(current);
    assert.deepEqual(await releaseBuild(f.options), {
      kind: 'approval',
      settings: current
    });
    assert.deepEqual(f.calls, ['save', 'status']);
  }
});

test('a newer draft enables Update even while the saved version is under review', () => {
  const pending = settings({ state: 'in_review', reviewId: 19 });
  const action = getBuildReleaseAction({
    settings: pending,
    isPublic: true,
    hasUnpublishedChanges: true,
    hasUnsavedChanges: true
  });
  assert.equal(action.label, 'Update App');
  assert.equal(action.disabled, false);
  assert.equal(action.notice, '');
});

test('a new version created during submission cannot look like an approval request for the current draft', async () => {
  const f = fixture();
  f.options.requestReview = async () => settings({ sourceVersionId: 42 });
  await assert.rejects(releaseBuild(f.options), /app changed/);
  assert.equal(
    getBuildReleaseAction({
      settings: settings({ sourceVersionId: 42 }),
      isPublic: true,
      hasUnpublishedChanges: true
    }).disabled,
    false
  );
});

test('the server publish guard can route a changed candidate into approval in the same click', async () => {
  const f = fixture(settings({ approvalRequired: false }));
  let loads = 0;
  f.options.loadRewards = async () =>
    settings({ approvalRequired: ++loads > 1 });
  f.options.publish = async () => {
    throw { response: { data: { code: 'build_reward_approval_required' } } };
  };
  const result = await releaseBuild(f.options);
  assert.ok(result.kind === 'approval');
  assert.equal(loads, 2);
  assert.equal(f.calls.filter((value) => value === 'review').length, 1);
  assert.equal(result.settings.state, 'in_review');
});

test('another surface already publishing the version reconciles the canonical release status', async () => {
  const f = fixture(settings({ state: 'published', approvalMatches: true }));
  const releaseStatus = { isPublic: true, hasUnpublishedChanges: false };
  f.options.publish = async () => {
    throw {
      response: {
        data: {
          code: 'build_release_up_to_date',
          releaseStatus,
          eventTimeMs: 123
        }
      }
    };
  };
  assert.deepEqual(await releaseBuild(f.options), {
    kind: 'published',
    result: {
      eventTimeMs: 123,
      build: { id: 7, isPublic: true, releaseStatus }
    }
  });
  assert.equal(f.calls.includes('review'), false);
});

test('an incomplete reward setup directs the creator to Lumine without submitting or publishing', async () => {
  const f = fixture(
    settings({ declaration: { ok: false } as RewardSettings['declaration'] })
  );
  await assert.rejects(releaseBuild(f.options), /Ask Lumine/);
  assert.deepEqual(f.calls, ['save', 'status']);
});

test('initial publishing, proposals, feedback and completed releases have consistent actions', () => {
  assert.equal(
    getBuildReleaseAction({ settings: settings(), isPublic: false }).label,
    'Publish'
  );
  assert.equal(
    getBuildReleaseAction({
      settings: settings({ state: 'changes_offered' }),
      isPublic: true
    }).label,
    'Review changes'
  );
  assert.equal(
    getBuildReleaseAction({
      settings: settings({ state: 'changes_requested' }),
      isPublic: true
    }).label,
    'Review feedback'
  );
  const published = getBuildReleaseAction({
    settings: settings({ state: 'published', approvalMatches: true }),
    isPublic: true,
    hasUnpublishedChanges: true
  });
  assert.equal(published.label, 'Up to Date');
  assert.equal(published.disabled, true);
  assert.equal(
    getBuildReleaseAction({
      settings: settings({ state: 'in_review' }),
      isPublic: false
    }).disabled,
    true
  );
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('an older pending preflight cannot disable a newer draft or skip its approval request', async () => {
  const applied: RewardSettings[] = [];
  const read = createRewardStatusReader((_, value) => applied.push(value));
  const old = deferred<RewardSettings>();
  let current = settings({ sourceVersionId: 42 });
  let reads = 0;
  const load = () =>
    ++reads === 1 ? old.promise : Promise.resolve(current);
  const f = fixture();
  f.options.loadRewards = () => read('42:7', 'old-draft', load, true);
  f.options.requestReview = async () => {
    f.calls.push('review');
    current = { ...current, state: 'in_review', reviewId: 20 };
    return read('42:7', 'new-draft', load, true);
  };
  const release = releaseBuild(f.options);
  await new Promise((resolve) => setImmediate(resolve));
  await read('42:7', 'new-draft', load);
  old.resolve(settings({ state: 'in_review', reviewId: 19 }));
  const result = await release;
  assert.ok(result.kind === 'approval');
  assert.equal(result.settings.sourceVersionId, 42);
  assert.equal(result.settings.reviewId, 20);
  assert.equal(f.calls.filter((call) => call === 'review').length, 1);
  assert.ok(applied.every((value) => value.sourceVersionId === 42));
});

test('shared reads coalesce and superseded failures follow the newer response', async () => {
  const applied: RewardSettings[] = [];
  const read = createRewardStatusReader((_, value) => applied.push(value));
  const old = deferred<RewardSettings>();
  const next = deferred<RewardSettings>();
  let loads = 0;
  const load = () => (++loads === 1 ? old.promise : next.promise);
  const first = read('42:7', 'draft-41', load);
  const duplicate = read('42:7', 'draft-41', load);
  const newer = read('42:7', 'draft-42', load);
  old.reject(new Error('Older request timed out'));
  const current = settings({ sourceVersionId: 42 });
  next.resolve(current);
  assert.deepEqual(await Promise.all([first, duplicate, newer]), [
    current, current, current
  ]);
  assert.equal(loads, 2);
  assert.deepEqual(applied, [current]);
});

test('confirmation after submission supersedes a background read for the same draft', async () => {
  const applied: RewardSettings[] = [];
  const read = createRewardStatusReader((_, value) => applied.push(value));
  const old = deferred<RewardSettings>();
  const confirmed = settings({ state: 'in_review', reviewId: 19 });
  let loads = 0;
  const load = () =>
    ++loads === 1 ? old.promise : Promise.resolve(confirmed);
  const background = read('42:7', 'draft-41', load);
  await read('42:7', 'draft-41', load, true);
  old.resolve(settings());
  assert.deepEqual(await background, confirmed);
  assert.ok(applied.every((value) => value.state === 'in_review'));
});

test('status reads isolate accounts and apps, and a failed current read can be retried', async () => {
  const applied: string[] = [];
  const read = createRewardStatusReader((scope) => applied.push(scope));
  const load = async () => settings();
  await Promise.all([
    read('42:7', 'draft', load),
    read('50:7', 'draft', load),
    read('42:8', 'draft', load)
  ]);
  assert.deepEqual(applied.sort(), ['42:7', '42:8', '50:7']);
  await assert.rejects(
    read('42:7', 'draft', async () => { throw new Error('Offline'); }),
    /Offline/
  );
  assert.deepEqual(await read('42:7', 'draft', load), settings());
});
