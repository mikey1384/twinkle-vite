import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applySocialWalkupEvent,
  createSocialJoinableStore,
  createSocialWalkupStore,
  EMPTY_SOCIAL_STATE,
  joinActions,
  joinableBadge,
  queueChipText,
  readJoinable,
  visitLine,
  visitorBannerText,
  withJoinable,
  type SocialVisit
} from '../src/helpers/socialWalkups';
import { groupLiveNowApps } from '../src/helpers/liveNow';
import {
  FIRST_CHAT_NOTE,
  socialCardActionLabel,
  socialCardBanner,
  socialCardLines,
  socialCardPreview
} from '../src/helpers/socialTogetherCard';

// "Meet people in apps" on the website: what Live now and the profile popup
// offer, what the page shows the host and the visitor, and the card's words.

const open = { state: 'open', label: 'Looking for a game', mode: '1v1' } as const;
const watchable = { state: 'busy-watchable', label: '', mode: '1v1' } as const;
const kengo = { id: 10, username: 'KenGo', profilePicUrl: '/k.png' };
const visitor = (id: number, username: string, extra: any = {}) => ({
  id: `w${id}`,
  user: { id, username, profilePicUrl: null },
  queuePosition: 1,
  expiresAt: 9_999_999,
  ...extra
});

test('joinable state is read only from an app activity and never trusted blindly', () => {
  assert.deepEqual(readJoinable({ kind: 'app', id: 1, joinable: open }), open);
  assert.equal(readJoinable({ kind: 'app', id: 1 }), null);
  assert.equal(readJoinable({ kind: 'game', id: 'chess', joinable: open }), null);
  assert.equal(readJoinable({ kind: 'app', id: 1, joinable: { state: 'closed' } }), null);
  assert.equal(readJoinable({ kind: 'app', id: 1, joinable: 'open' }), null);
  assert.deepEqual(readJoinable({ kind: 'app', id: 1, joinable: { state: 'busy', label: 5 } }), {
    state: 'busy',
    label: '',
    mode: ''
  });
  assert.equal(readJoinable(null), null);
});

test('the badge uses the app’s own words, with a plain default per state', () => {
  assert.equal(joinableBadge(open), 'Looking for a game');
  assert.equal(joinableBadge({ state: 'open', label: '', mode: '1v1' }), 'Looking for a game');
  assert.equal(joinableBadge({ state: 'open', label: '', mode: 'room' }), 'Come join');
  assert.equal(joinableBadge(watchable), 'In a game, come watch');
  assert.equal(joinableBadge({ state: 'busy-watchable', label: '', mode: 'coop' }), 'Busy, come watch');
  assert.equal(joinableBadge({ state: 'busy', label: '', mode: '1v1' }), 'In a game');
  assert.equal(
    joinableBadge({ state: 'busy-watchable', label: 'Drawing, come watch', mode: 'watch' }),
    'Drawing, come watch'
  );
});

test('Play or Join when they are ready; Watch and "next" when they are busy', () => {
  const labels = (joinable: any, appTitle = 'Baduk') =>
    joinActions({ joinable, appTitle, username: 'KenGo' }).map((a) => [a.intent, a.label]);
  assert.deepEqual(labels(open), [['play', 'Play Baduk with KenGo']]);
  assert.deepEqual(labels({ state: 'open', label: '', mode: 'room' }, 'Sketch Town'), [
    ['play', 'Join KenGo in Sketch Town']
  ]);
  assert.deepEqual(labels(watchable), [
    ['watch', 'Watch'],
    ['next', 'Play next']
  ]);
  assert.deepEqual(labels({ state: 'busy', label: '', mode: 'coop' }), [['next', 'Join next']]);
});

test('Live now carries each member’s joinable state and puts joinable faces first', () => {
  const entry = (id: number, joinable?: any, extra: any = {}) => ({
    id,
    username: `user${id}`,
    profilePicUrl: '',
    isOnline: true,
    isAway: false,
    activity: { kind: 'app', id: 5, title: 'Baduk', thumbnailUrl: null, multiplayer: true, joinable },
    ...extra
  });
  const chatStatus = {
    11: entry(11),
    12: entry(12),
    13: entry(13, watchable),
    14: entry(14, open),
    15: entry(15),
    // Zero/Ciel-style hidden presence: shown as playing, never joinable
    900: entry(900, open)
  };
  const [app] = groupLiveNowApps({ chatStatus, myId: 7, hiddenUserIds: [900] });
  assert.equal(app.count, 6);
  assert.deepEqual(
    app.members.map((member) => [member.id, member.joinable?.state]),
    [
      [14, 'open'],
      [13, 'busy-watchable'],
      [11, undefined]
    ]
  );
  assert.equal(app.joinable, 2);
  // an app that has not adopted this looks exactly as before
  const [plain] = groupLiveNowApps({
    chatStatus: { 11: entry(11), 12: entry(12) },
    myId: 7,
    hiddenUserIds: []
  });
  assert.equal(plain.joinable, 0);
  assert.ok(plain.members.every((member) => !('joinable' in member)));
  // a blocked member is never offered
  const [blocked] = groupLiveNowApps({
    chatStatus,
    myId: 7,
    hiddenUserIds: [900],
    blockedUserIds: new Set([14])
  });
  assert.ok(!blocked.members.some((member) => member.id === 14));
});

test('the page sends the app’s joinable state with its activity, unless walk-ups are off', () => {
  const store = createSocialJoinableStore();
  let notified = 0;
  store.subscribe(() => notified++);
  store.set(5, open);
  store.set(5, { ...open });
  assert.equal(notified, 1);
  assert.deepEqual(withJoinable({ kind: 'app', id: 5 }, { walkupsAllowed: true, store }), {
    kind: 'app',
    id: 5,
    joinable: open
  });
  // "Don't let people walk up while I play"
  assert.deepEqual(withJoinable({ kind: 'app', id: 5 }, { walkupsAllowed: false, store }), {
    kind: 'app',
    id: 5
  });
  // another app, a site game, nothing at all
  assert.deepEqual(withJoinable({ kind: 'app', id: 6 }, { walkupsAllowed: true, store }), {
    kind: 'app',
    id: 6
  });
  assert.deepEqual(withJoinable({ kind: 'game', id: 'chess' }, { walkupsAllowed: true, store }), {
    kind: 'game',
    id: 'chess'
  });
  assert.equal(withJoinable(null, { walkupsAllowed: true, store }), null);
  store.set(5, null);
  assert.equal(notified, 2);
  assert.equal(store.get(5), null);
});

test('host side: an arrival raises the banner; the banner follows its visitor', () => {
  let state = applySocialWalkupEvent(
    EMPTY_SOCIAL_STATE,
    { type: 'queue', buildId: 5, waiting: [visitor(21, 'mikey')], arrived: visitor(21, 'mikey') },
    1000
  );
  assert.equal(state.waiting.length, 1);
  assert.equal(state.banner?.user.username, 'mikey');
  assert.equal(state.banner?.shownAt, 1000);
  // someone else's queue change keeps the banner
  state = applySocialWalkupEvent(
    state,
    { type: 'queue', waiting: [visitor(21, 'mikey'), visitor(22, 'ana')], arrived: null },
    2000
  );
  assert.equal(state.banner?.id, 'w21');
  assert.equal(state.waiting.length, 2);
  // the visitor left (or was let in): the banner goes with them
  state = applySocialWalkupEvent(state, { type: 'queue', waiting: [visitor(22, 'ana')], arrived: null });
  assert.equal(state.banner, null);
  // malformed entries never reach the UI
  state = applySocialWalkupEvent(state, { type: 'queue', waiting: [{ id: 5 }, null], arrived: {} });
  assert.deepEqual(state.waiting, []);
  assert.equal(state.banner, null);
  assert.equal(applySocialWalkupEvent(state, null), state);
  assert.equal(applySocialWalkupEvent(state, { type: 'unknown' }), state);
});

test('visitor side: match ready and "they left" update the visit; nothing is ever "declined"', () => {
  const waiting: SocialVisit = { host: kengo, status: 'waiting', walkupId: 'w21', joinable: watchable };
  let state = { ...EMPTY_SOCIAL_STATE, visit: waiting };
  // someone else's walk-up being released is not ours
  assert.equal(applySocialWalkupEvent(state, { type: 'released', walkupId: 'w99' }), state);
  const released = applySocialWalkupEvent(state, { type: 'released', walkupId: 'w21' });
  assert.equal(released.visit?.status, 'released');
  state = applySocialWalkupEvent(
    state,
    { type: 'matchReady', matchKey: 'meet-aa', mode: '1v1', host: kengo },
    5000
  );
  assert.equal(state.visit?.status, 'matched');
  assert.deepEqual(state.match, { matchKey: 'meet-aa', mode: '1v1', host: kengo, at: 5000 });

  const line = (status: SocialVisit['status'], joinable: any = watchable) =>
    visitLine({ host: kengo, status, walkupId: null, joinable });
  assert.equal(line('waiting'), "You're next · KenGo is finishing up");
  assert.equal(line('waiting', open), "KenGo knows you're here");
  assert.equal(line('later'), "KenGo's still in a game. Play on your own while you wait?");
  assert.equal(
    line('later', { state: 'busy', label: '', mode: 'room' }),
    "KenGo's busy right now. Look around while you wait?"
  );
  assert.equal(line('watch'), 'Watching KenGo');
  assert.equal(line('unavailable', null), "KenGo isn't here right now");
  assert.equal(line('released'), "KenGo isn't here right now");
  assert.equal(line('matched'), "You're playing with KenGo");
  for (const status of ['waiting', 'later', 'watch', 'unavailable', 'released', 'matched'] as const) {
    assert.doesNotMatch(line(status), /declin|reject|refus|denied/i);
  }
});

test('the banner and the queue chip say it the arcade way', () => {
  assert.equal(visitorBannerText({ username: 'mikey', joinable: watchable }), 'mikey walked up · next game?');
  assert.equal(visitorBannerText({ username: 'mikey', joinable: open }), 'mikey walked up · play?');
  assert.equal(
    visitorBannerText({ username: 'mikey', joinable: { state: 'open', label: '', mode: 'room' } }),
    'mikey walked in'
  );
  assert.equal(
    visitorBannerText({ username: 'mikey', joinable: { state: 'busy', label: '', mode: 'coop' } }),
    'mikey wants to join next'
  );
  assert.equal(queueChipText(1), '1 person wants next');
  assert.equal(queueChipText(2), '2 people want next');
});

test('the page store keeps each app apart and passes "Play now" on to the app', () => {
  const store = createSocialWalkupStore({ now: () => 777 });
  let changes = 0;
  store.subscribe(() => changes++);
  store.apply({ type: 'queue', buildId: 5, waiting: [visitor(21, 'mikey')], arrived: visitor(21, 'mikey') });
  store.apply({ type: 'queue', waiting: [] }); // no buildId: ignored
  assert.equal(changes, 1);
  assert.equal(store.get(5).banner?.shownAt, 777);
  assert.equal(store.get(6), EMPTY_SOCIAL_STATE);
  const chosen: any[] = [];
  const stop = store.onPlayNow((buildId, entry) => chosen.push([buildId, entry.id]));
  store.playNow(5, 'w21');
  store.playNow(5, 'wnobody');
  assert.deepEqual(chosen, [[5, 'w21']]);
  // choosing someone puts the banner away; they stay in the queue until the
  // app accepts them
  assert.equal(store.get(5).banner, null);
  assert.equal(store.get(5).waiting.length, 1);
  stop();
  store.playNow(5, 'w21');
  assert.equal(chosen.length, 1);
  // a visit set from the walk-up answer; leaving clears everything
  store.setVisit(9, { host: kengo, status: 'waiting', walkupId: 'w1', joinable: open });
  assert.equal(store.get(9).visit?.status, 'waiting');
  store.clear(9);
  assert.equal(store.get(9), EMPTY_SOCIAL_STATE);
});

test('the notice shows only Twinkle\'s words, from each member\'s side, and no reply chips', () => {
  const card: any = {
    lines: {
      7: { headline: 'You and KenGo played Baduk together', detail: 'KenGo won' },
      10: { headline: 'You and viewer played Baduk together', detail: 'You won' }
    },
    appAvailable: true,
    action: 'play'
  };
  assert.deepEqual(socialCardLines(card, 7), card.lines[7]);
  assert.equal(socialCardLines(card, 99), null);
  // an old-shaped card (with app text) renders nothing rather than app words
  assert.equal(socialCardLines({ text: 'add me on discord' } as any, 7), null);
  assert.equal(socialCardActionLabel(card), 'Play again');
  assert.equal(socialCardActionLabel({ ...card, action: 'join' }), 'Join again');
  assert.equal(socialCardActionLabel({ ...card, appAvailable: false }), null);
  assert.equal(socialCardBanner('played'), 'Played together');
  assert.equal(socialCardBanner('made'), 'Made something together');
  // the chat list line, from Twinkle's stored plain line
  assert.equal(socialCardPreview('and KenGo played Baduk together'), 'You played Baduk together');
  assert.equal(socialCardPreview('and ana drew together in Sketch Town'), 'You drew together in Sketch Town');
  assert.equal(socialCardPreview('and ana met in Sketch Town'), 'You did something together in an app');
  // one line, not a wall of rules
  assert.ok(FIRST_CHAT_NOTE.length < 80);
  assert.doesNotMatch(FIRST_CHAT_NOTE, /\n/);
});
