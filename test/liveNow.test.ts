import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupLiveNowApps,
  liveNowRowChoice,
  LIVE_NOW_MAX_APPS,
  LIVE_NOW_MAX_CHOICES,
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

test('apps with something to tap (Join, Play with someone, Watch) come before ones that only open', () => {
  const breadface = app(1, { title: 'Breadface', multiplayer: true });
  const cr7 = app(2, { title: 'CR7', multiplayer: true });
  const busy = app(4, { title: 'Busy duel', multiplayer: true, joinable: { state: 'busy', mode: '1v1' } });
  const redSquare = app(3, {
    title: 'The Adventure of a Red Square',
    joinable: { state: 'busy-watchable', mode: 'watch', label: 'Playing World 2-C' }
  });
  const apps = group(
    statusOf(
      member(11, breadface),
      member(12, breadface),
      member(13, cr7),
      member(14, busy),
      member(15, redSquare)
    )
  );
  // Red Square's Watch first; busy (nothing to tap) sorts with the plain
  // rows, by head count then title.
  assert.deepEqual(
    apps.map((entry) => entry.appId),
    [3, 1, 4, 2]
  );
});

test('shows only what avatar badges show: online, apps only, never the viewer', () => {
  const apps = group(
    statusOf(
      member(ME, app(1)),
      // Away (a hidden page within its grace) still shows: the server sends
      // an activity only while it counts.
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
    [
      [1, [11]],
      [2, [ZERO]]
    ]
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

// ---- "Who do you want to watch?" ------------------------------------------

const watching = (label = '') => ({ state: 'busy-watchable', label, mode: 'watch' });
const queueOpen = { state: 'open', label: 'Looking for a game', mode: '1v1' };
const roomOpen = { state: 'open', label: 'Waiting for crews', mode: 'room', dropIn: true };
const inApp = (joinable?: any) => app(1, joinable ? { joinable } : {});

test('choices: everyone actionable, past the face cap, best verb first then stable; busy and plain members left out', () => {
  const apps = group(
    statusOf(
      member(31, inApp(watching('Level 3'))),
      member(22, inApp(watching('Level 12'))),
      member(40, inApp(queueOpen)),
      member(12, inApp({ state: 'busy', label: 'In a game', mode: '1v1' })),
      member(11, inApp()),
      member(50, inApp(roomOpen)),
      member(25, inApp(watching()))
    )
  );
  assert.equal(apps[0].members.length, LIVE_NOW_MAX_FACES);
  assert.deepEqual(
    apps[0].choices.map((entry) => entry.id),
    [50, 40, 22, 25, 31]
  );
});

test('choices are bounded apart from the faces', () => {
  const entries = [];
  for (let id = 100; id < 100 + LIVE_NOW_MAX_CHOICES + 4; id++)
    entries.push(member(id, inApp(watching())));
  const [only] = group(statusOf(...entries));
  assert.equal(only.count, LIVE_NOW_MAX_CHOICES + 4);
  assert.equal(only.members.length, LIVE_NOW_MAX_FACES);
  assert.equal(only.choices.length, LIVE_NOW_MAX_CHOICES);
  assert.deepEqual(
    only.choices.map((entry) => entry.id),
    Array.from({ length: LIVE_NOW_MAX_CHOICES }, (_, i) => 100 + i)
  );
});

test('row choice: nobody to join (the default Play) opens the app and never shows the picker', () => {
  assert.deepEqual(liveNowRowChoice({ choices: [] }), { kind: 'open' });
  // Several people in the app, none offering anything (plain, busy, or a
  // watch-only member who is not watchable): still just opens the app.
  const [plain] = group(
    statusOf(
      member(11, inApp()),
      member(12, inApp()),
      member(13, inApp({ state: 'busy', label: '', mode: '1v1' })),
      member(14, inApp({ state: 'open', label: '', mode: 'watch' }))
    )
  );
  assert.equal(plain.count, 4);
  assert.deepEqual(plain.choices, []);
  assert.deepEqual(liveNowRowChoice(plain), { kind: 'open' });
});

test('row choice: one actionable person walks up directly', () => {
  const [one] = group(
    statusOf(member(11, inApp()), member(12, inApp(watching('Level 4'))))
  );
  const choice = liveNowRowChoice(one);
  assert.equal(choice.kind, 'walk');
  assert.ok(choice.kind === 'walk');
  assert.equal(choice.member.id, 12);
  assert.equal(choice.verb, 'watch');
  assert.equal(choice.intent, 'watch');
});

test('row choice: two or more offering the row verb open the picker with everyone actionable', () => {
  const [two] = group(
    statusOf(
      member(21, inApp(watching('Level 12'))),
      member(22, inApp(watching('Level 3'))),
      member(23, inApp())
    )
  );
  const choice = liveNowRowChoice(two);
  assert.equal(choice.kind, 'pick');
  assert.ok(choice.kind === 'pick');
  assert.equal(choice.verb, 'watch');
  assert.deepEqual(choice.members.map((entry) => entry.id), [21, 22]);
});

test('row choice with mixed verbs: the best verb decides; one of it walks, two of it pick (listing the others too)', () => {
  // One open room and two watchable: the row says Join and one tap joins.
  const [oneRoom] = group(
    statusOf(
      member(31, inApp(watching())),
      member(32, inApp(watching())),
      member(33, inApp(roomOpen))
    )
  );
  const walk = liveNowRowChoice(oneRoom);
  assert.ok(walk.kind === 'walk');
  assert.equal(walk.verb, 'join');
  assert.equal(walk.member.id, 33);
  // Two people ready for a game and one watchable: Play, picker lists all
  // three, Play lines first.
  const [twoReady] = group(
    statusOf(
      member(41, inApp(watching())),
      member(43, inApp(queueOpen)),
      member(42, inApp(queueOpen))
    )
  );
  const pick = liveNowRowChoice(twoReady);
  assert.ok(pick.kind === 'pick');
  assert.equal(pick.verb, 'play');
  assert.deepEqual(pick.members.map((entry) => entry.id), [42, 43, 41]);
});

test('row choice: blocked and hidden-presence members are never offered', () => {
  const apps = groupLiveNowApps({
    chatStatus: statusOf(
      member(51, inApp(watching())),
      member(52, inApp(watching())),
      member(ZERO, inApp(watching()))
    ),
    myId: ME,
    hiddenUserIds: [ZERO],
    blockedUserIds: new Set([52])
  });
  // Zero is hidden from presence altogether; ana (52) is blocked.
  const choice = liveNowRowChoice(apps[0]);
  assert.ok(choice.kind === 'walk');
  assert.equal(choice.member.id, 51);
  assert.deepEqual(apps[0].choices.map((entry) => entry.id), [51]);
});
