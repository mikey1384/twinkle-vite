import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeMakeIdea,
  isWelcomeBlockedSurface,
  makeTitleFor,
  orderWelcomeStops,
  stopMarks,
  welcomeBannerReady,
  welcomeGreetingLine,
  isBuildEditorPath,
  lumineStopFor,
  newerWelcomeTourState,
  projectOpenPrompt,
  welcomeTourButton,
  welcomeTourResumeKey,
  type WelcomeTourStop
} from '../src/containers/App/WelcomeTour/rules';
import { resolveWandActions } from '../src/components/SponsoredHelp/wandActions';
import {
  enterWelcomeFocusSurface,
  isWelcomeTourStarter,
  welcomeFocusSurfaces
} from '../src/containers/App/WelcomeTour/store';

// The welcome greeter's show/hide rules (Mikey 11-25): it never covers a
// running game or app, the Build editor, an Arena sitting or an open modal,
// and on an XP video page it never interrupts a playing video.
const clear = { modalOpen: false, focusSurfaces: 0, appRuntimeVisible: false };

test('hidden over running apps, the Build editor, sittings and modals; shown elsewhere', () => {
  for (const pathname of ['/', '/users/mina', '/videos/12', '/chat', '/build', '/build/new', '/arena', '/earn']) {
    assert.equal(isWelcomeBlockedSurface({ ...clear, pathname }), false, pathname);
  }
  for (const pathname of ['/app/2460', '/app/12/play', '/app-capture/5', '/build/123', '/build/preview/9']) {
    assert.equal(isWelcomeBlockedSurface({ ...clear, pathname }), true, pathname);
  }
  assert.equal(isWelcomeBlockedSurface({ ...clear, pathname: '/', modalOpen: true }), true);
  assert.equal(isWelcomeBlockedSurface({ ...clear, pathname: '/arena', focusSurfaces: 1 }), true);
  assert.equal(isWelcomeBlockedSurface({ ...clear, pathname: '/', appRuntimeVisible: true }), true);
});

test('an Arena sitting or a Grammarbles round registers itself while it runs', () => {
  const leave = enterWelcomeFocusSurface();
  assert.equal(welcomeFocusSurfaces.get(), 1);
  leave();
  leave();
  assert.equal(welcomeFocusSurfaces.get(), 0);
});

test('timing: a short beat on most pages; on an XP video never while it plays', () => {
  assert.equal(welcomeBannerReady({ pathname: '/', media: 'idle', msSinceLoad: 1000, msSinceMediaChange: 0 }), false);
  assert.equal(welcomeBannerReady({ pathname: '/', media: 'idle', msSinceLoad: 4500, msSinceMediaChange: 0 }), true);
  const video = (media: any, msSinceLoad: number, msSinceMediaChange = 0) =>
    welcomeBannerReady({ pathname: '/videos/77', media, msSinceLoad, msSinceMediaChange });
  assert.equal(video('playing', 600_000), false);
  assert.equal(video('ended', 100), true);
  assert.equal(video('paused', 60_000, 1000), false);
  assert.equal(video('paused', 60_000, 3500), true);
  assert.equal(video('idle', 10_000), false);
  assert.equal(video('idle', 21_000), true);
});

test('after a video the greeting acknowledges it', () => {
  const greeting = { line: 'Welcome!', afterVideoLine: 'Nice, video done.' };
  assert.equal(welcomeGreetingLine(greeting, { pathname: '/videos/3', media: 'ended' }), 'Nice, video done.');
  assert.equal(welcomeGreetingLine(greeting, { pathname: '/', media: 'ended' }), 'Welcome!');
});

const stop = (key: string): WelcomeTourStop => ({
  key,
  title: key,
  short: key,
  path: `/${key}`,
  target: key,
  lines: { zero: 'z', ciel: 'c' }
});
const stops = ['chat', 'lumine', 'apps', 'arena'].map(stop);

test('Chat comes first, unless the tour started on Chat: then it is last', () => {
  assert.deepEqual(orderWelcomeStops(stops, '/').map((s) => s.key), ['chat', 'lumine', 'apps', 'arena']);
  assert.deepEqual(orderWelcomeStops(stops, '/chat/12').map((s) => s.key), ['lumine', 'apps', 'arena', 'chat']);
  // the welcome card sits in a chat, but its tour keeps the tour's own order
  assert.deepEqual(
    orderWelcomeStops(stops, '/chat/12', { keepOrder: true }).map((s) => s.key),
    ['chat', 'lumine', 'apps', 'arena']
  );
});

test('the welcome card’s one button starts the tour, or continues it where they left off', () => {
  assert.equal(welcomeTourResumeKey({ status: 'started', stopKey: 'apps' }), 'apps');
  // Skip tour keeps the stop; a finished tour starts over
  assert.equal(welcomeTourResumeKey({ status: 'declined', stopKey: 'apps' }), 'apps');
  assert.equal(welcomeTourResumeKey({ status: 'finished', stopKey: 'arena' }), '');
  assert.equal(welcomeTourResumeKey(null), '');
  assert.deepEqual(welcomeTourButton({ guideName: 'Zero', stops, resumeKey: '' }), {
    label: 'Start the tour with Zero',
    progress: ''
  });
  // still on the first stop: nothing to continue yet
  assert.equal(welcomeTourButton({ guideName: 'Ciel', stops, resumeKey: 'chat' }).label, 'Start the tour with Ciel');
  assert.deepEqual(welcomeTourButton({ guideName: 'Ciel', stops, resumeKey: 'apps' }), {
    label: 'Continue the tour with Ciel',
    progress: '3 of 4'
  });
  // a stop this tour doesn't have (an older stop key): start
  assert.equal(welcomeTourButton({ guideName: 'Zero', stops, resumeKey: 'videos' }).progress, '');
});

test('the strip marks done, skipped, current and upcoming; a replay keeps its done mark elsewhere', () => {
  assert.deepEqual(stopMarks({ stops, index: 1, done: ['chat'], skipped: ['apps'] }), [
    'done',
    'current',
    'skipped',
    'upcoming'
  ]);
  // jumped back to Chat (done): it is the current one now
  assert.deepEqual(stopMarks({ stops, index: 0, done: ['chat', 'lumine'], skipped: [] }), [
    'current',
    'done',
    'upcoming',
    'upcoming'
  ]);
});

test('"What do you want to make?" turns the choices into Lumine’s idea, never empty', () => {
  assert.equal(composeMakeIdea({ ideas: ['a game', 'a puzzle game'], own: '', extra: '' }), 'Make a puzzle game.');
  assert.equal(
    composeMakeIdea({ ideas: ['a game'], own: 'a cat that runs on rooftops', extra: 'With rain.' }),
    'Make a cat that runs on rooftops. With rain.'
  );
  assert.equal(composeMakeIdea({ ideas: [], own: 'Build a flashcard app', extra: '' }), 'Build a flashcard app.');
  assert.equal(composeMakeIdea({ ideas: [], own: '', extra: '' }), '');
  assert.equal(makeTitleFor({ labels: ['Game', 'Puzzle'], own: '' }), 'My first game');
  assert.equal(makeTitleFor({ labels: [], own: 'a cat that runs on rooftops at night' }), 'a cat that runs on');
});

test('the "Show me around Twinkle" chip opens the scripted tour', () => {
  assert.equal(isWelcomeTourStarter('Show me around Twinkle'), true);
  assert.equal(isWelcomeTourStarter(' show me around twinkle '), true);
  assert.equal(isWelcomeTourStarter('Find me a fun app'), false);
});

test('resume (#4): a finished run starts over; a skipped or open run continues at its stop', () => {
  assert.equal(welcomeTourResumeKey({ status: 'finished', runStatus: 'skipped', stopKey: 'apps' }), 'apps');
  assert.equal(welcomeTourResumeKey({ status: 'declined', runStatus: 'finished', stopKey: 'arena' }), '');
  assert.equal(welcomeTourResumeKey({ status: 'started', runStatus: 'active', stopKey: 'words' }), 'words');
});

test('progress (#3): the newer confirmed state wins, and only for its own account', () => {
  const server = { status: 'started', stopKey: 'words', runId: 2, runSeq: 3 };
  // this tab's confirmed answer is older (a lagging step): the server's wins
  assert.equal(newerWelcomeTourState(server, { ...server, stopKey: 'chat', runSeq: 1, userId: 7 }, 7)!.stopKey, 'words');
  // progress made on another device reached the server: it wins
  assert.equal(newerWelcomeTourState({ ...server, runSeq: 9, stopKey: 'arena' }, { ...server, userId: 7 }, 7)!.stopKey, 'arena');
  // a later run beats any step of an earlier one
  assert.equal(newerWelcomeTourState(server, { status: 'started', stopKey: 'chat', runId: 3, runSeq: 0, userId: 7 }, 7)!.runId, 3);
  // another account signed in on this tab never resumes from it
  assert.equal(newerWelcomeTourState(server, { ...server, runSeq: 99, stopKey: 'arena', userId: 8 }, 7), server);
});

test('money (#2): opening a project sends Lumine the idea only on Twinkle’s unused free run', () => {
  assert.equal(projectOpenPrompt({ idea: 'Make a game.', autoStart: true }), 'Make a game.');
  assert.equal(projectOpenPrompt({ idea: 'Make a game.', lumineRunSponsored: true }), 'Make a game.');
  // the free claim failed or the run is used: open without starting anything
  assert.equal(projectOpenPrompt({ idea: 'Make a game.', autoStart: false }), '');
  assert.equal(projectOpenPrompt({ idea: 'Make a game.' }), '');
  assert.equal(projectOpenPrompt(null), '');
});

test('first project (#1): the Lumine stop follows the server; an older API never offers a build', () => {
  const project = { buildId: 4, title: 'My First Game', idea: 'Make a game.', autoStart: true };
  assert.deepEqual(lumineStopFor({ lumineStop: { kind: 'card_waiting', requestId: 3 } }, null), {
    kind: 'card_waiting',
    requestId: 3
  });
  // older API: the card's project, never auto-starting; otherwise nothing to press
  assert.deepEqual(lumineStopFor({}, project), { kind: 'project', project: { ...project, autoStart: false } });
  assert.deepEqual(lumineStopFor({}, null), { kind: 'readonly' });
  assert.equal(isBuildEditorPath('/build/12'), true);
  assert.equal(isBuildEditorPath('/build'), false);
});

test('wand actions: the main button always; chapters and backup only when configured', () => {
  const fallback = { mainAction: { label: 'Do all of these', runs: 'all' as const } };
  assert.deepEqual(resolveWandActions(undefined, fallback), fallback);
  // one chapter is no chapters; an empty backup takes no room
  assert.deepEqual(
    resolveWandActions({ mainAction: { label: 'Go', runs: 'all' }, chapters: [{ id: 'a', label: 'A' }], backup: { label: ' ', action: 'decline' } }, fallback),
    { mainAction: { label: 'Go', runs: 'all' } }
  );
  const full = resolveWandActions(
    {
      mainAction: { label: 'Start the tour with Zero', runs: 'all' },
      chaptersTitle: 'Take the tour with Zero:',
      chapters: [{ id: 'chat', label: 'Chat' }, { id: 'lumine', label: 'Make it with Lumine' }],
      backup: { label: 'Maybe later', action: 'decline' }
    },
    fallback
  );
  assert.equal(full.chapters!.length, 2);
  assert.equal(full.backup!.label, 'Maybe later');
});
