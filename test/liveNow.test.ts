import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupLiveNowApps,
  LIVE_NOW_MAX_APPS,
  LIVE_NOW_MAX_FACES
} from '../src/helpers/liveNow';

const ME = 7;
const ZERO = 900;
const app = (id: number, extra: Record<string, unknown> = {}) => ({
  kind: 'app',
  id,
  title: `App ${id}`,
  thumbnailUrl: `/thumb/${id}.png`,
  ...extra
});
const member = (
  id: number,
  activity: any,
  extra: Record<string, unknown> = {}
) => ({
  id,
  username: `user${id}`,
  profilePicUrl: `/pic/${id}.png`,
  isOnline: true,
  isAway: false,
  activity,
  ...extra
});
function statusOf(...entries: any[]) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry]));
}
const group = (chatStatus: any) =>
  groupLiveNowApps({ chatStatus, myId: ME, hiddenUserIds: [ZERO] });

test('groups people by app, multiplayer first, then by head count', () => {
  const minecraft = app(5, {
    title: 'Twinkle Minecraft World',
    multiplayer: true
  });
  const apps = group(
    statusOf(
      member(11, app(1)),
      member(12, app(1)),
      member(13, app(1)),
      member(14, minecraft),
      member(15, app(2)),
      member(16, app(2))
    )
  );
  assert.deepEqual(
    apps.map((entry) => [entry.appId, entry.count, entry.multiplayer]),
    [
      [5, 1, true],
      [1, 3, false],
      [2, 2, false]
    ]
  );
  assert.equal(apps[0].title, 'Twinkle Minecraft World');
  assert.deepEqual(
    apps[1].members.map((entry) => entry.id),
    [11, 12, 13]
  );
});

test('shows only what avatar badges show: online, not away, apps only, never the viewer', () => {
  const apps = group(
    statusOf(
      member(ME, app(1)),
      member(11, app(1), { isAway: true }),
      member(12, app(1), { isOnline: false }),
      member(13, {
        kind: 'game',
        id: 'chess',
        title: 'Chess',
        thumbnailUrl: null
      }),
      member(14, {
        kind: 'arena',
        id: 'c1-advanced',
        title: 'C1',
        thumbnailUrl: null
      }),
      member(15, null),
      member(16, app(-3)),
      member(17, app(1), { username: '' }),
      // Zero/Ciel: their app shows on their avatar even when "away", as badges do.
      member(ZERO, app(2), { isAway: true })
    )
  );
  assert.deepEqual(
    apps.map((entry) => [entry.appId, entry.members.map((m) => m.id)]),
    [[2, [ZERO]]]
  );
  // Only the viewer in an app: nothing to join, so the row stays absent.
  assert.deepEqual(group(statusOf(member(ME, app(1)))), []);
  assert.deepEqual(group({}), []);
  assert.deepEqual(group(undefined), []);
  assert.deepEqual(group({ 3: undefined }), []);
});

test('bounded output with stable faces', () => {
  const entries = [];
  for (let id = 100; id < 100 + LIVE_NOW_MAX_APPS + 5; id++) {
    entries.push(member(id, app(id)));
  }
  for (const id of [60, 52, 58, 51, 59]) entries.push(member(id, app(100)));
  const apps = group(statusOf(...entries));
  assert.equal(apps.length, LIVE_NOW_MAX_APPS);
  assert.equal(apps[0].appId, 100);
  assert.equal(apps[0].count, 6);
  assert.equal(apps[0].members.length, LIVE_NOW_MAX_FACES);
  assert.deepEqual(
    apps[0].members.map((entry) => entry.id),
    [51, 52, 58]
  );
});

test('"Live now shown" fires the first time, then at most once per 10 minutes per tab', async () => {
  const { createLiveNowShownTracker, LIVE_NOW_SHOWN_INTERVAL_MS } =
    await import('../src/helpers/liveNow');
  let clock = 1_000_000;
  const shouldTrack = createLiveNowShownTracker({ now: () => clock });
  const apps = [{ appId: 1 }];
  assert.equal(shouldTrack([]), false, 'nothing live: nothing to report');
  assert.equal(shouldTrack(apps), true, 'first appearance');
  clock += 60_000;
  assert.equal(
    shouldTrack([{ appId: 2 }]),
    false,
    'a new set inside the window still waits'
  );
  assert.equal(
    shouldTrack(apps),
    false,
    'remounts inside the window are quiet'
  );
  clock += LIVE_NOW_SHOWN_INTERVAL_MS;
  assert.equal(
    shouldTrack(apps),
    true,
    'no hard cap: a later appearance counts again'
  );
  for (let i = 0; i < 30; i++) {
    clock += LIVE_NOW_SHOWN_INTERVAL_MS;
    assert.equal(shouldTrack(apps), true);
  }
});

test('the selector reader groups a chatStatus object once per block list; unrelated dispatches do no work', async () => {
  const { createLiveNowSignatureReader, groupLiveNowApps } =
    await import('../src/helpers/liveNow');
  let calls = 0;
  const read = createLiveNowSignatureReader({
    hiddenUserIds: [ZERO],
    group: (args) => {
      calls++;
      return groupLiveNowApps(args);
    }
  });
  const status = statusOf(member(11, app(1)), member(12, app(1)));
  const first = read(status, ME);
  for (let i = 0; i < 50; i++) assert.equal(read(status, ME), first);
  assert.equal(calls, 1, 'same chatStatus object: grouped once');
  assert.equal(JSON.parse(first)[0].count, 2);
  read({ ...status }, ME);
  assert.equal(calls, 2, 'a new chatStatus object is grouped again');
  const blocked = new Set([12]);
  const withBlock = JSON.parse(read(status, ME, blocked));
  assert.equal(calls, 3, 'a new block list is a new key');
  assert.deepEqual(
    withBlock[0].members.map((m: any) => m.id),
    [11]
  );
  assert.equal(withBlock[0].count, 1);
  read(status, ME, blocked);
  assert.equal(calls, 3);
  assert.equal(read(status, 0), '[]');
});

test('blocked members are never a face or a count; their app stays if others are in it', () => {
  const apps = groupLiveNowApps({
    chatStatus: statusOf(
      member(11, app(1)),
      member(12, app(1)),
      member(13, app(2))
    ),
    myId: ME,
    hiddenUserIds: [],
    blockedUserIds: new Set([12, 13])
  });
  assert.deepEqual(
    apps.map((entry) => [
      entry.appId,
      entry.count,
      entry.members.map((m) => m.id)
    ]),
    [[1, 1, [11]]]
  );
});
