import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeLumineWork,
  nextLuminePose,
  POSE_TICKS,
  resolveLumineRunActivity,
  resolveLumineWorkMode
} from '../src/containers/Build/PreviewPanel/LumineAtWork/activity';
import {
  renderScene,
  SCENE_H
} from '../src/containers/Build/PreviewPanel/LumineAtWork/pixelScene';
import {
  describeLumineRunFinished,
  isLumineBuildPage,
  normalizeLumineRunFinishedNotice
} from '../src/helpers/lumineRunFinished';
import {
  diffLines,
  foldRows,
  freshLineNumbers
} from '../src/containers/Build/PreviewPanel/LiveCode/liveDiff';

test('run activity reads structured signals: reasoning events mean thinking, labels skip thoughts', () => {
  const activity = resolveLumineRunActivity({
    runEvents: [
      { kind: 'action', message: 'Drafting changes in /game.js...' },
      { kind: 'usage', message: 'tokens' },
      { kind: 'status', message: 'Thinking...', details: { thoughtContent: 'hmm' } }
    ],
    queue: null,
    assistantStatusSteps: []
  });
  assert.equal(activity.thinking, true);
  assert.equal(activity.label, 'Drafting changes in /game.js...');

  const finishedThought = resolveLumineRunActivity({
    runEvents: [{ kind: 'status', message: 'x', details: { thoughtContent: 'done', isComplete: true } }],
    queue: { position: 2 },
    assistantStatusSteps: ['Planning the update']
  });
  assert.equal(finishedThought.thinking, false);
  assert.equal(finishedThought.queued, true);
  assert.equal(finishedThought.label, 'Planning the update');
});

test('work mode: idle when not running, then queued > writing > thinking > working', () => {
  const base = { thinking: true, testing: false, queued: false, label: null, terminalState: null };
  assert.equal(resolveLumineWorkMode({ running: false, activity: base, writingRecently: true }), 'idle');
  assert.equal(resolveLumineWorkMode({ running: true, activity: { ...base, queued: true }, writingRecently: true }), 'queued');
  assert.equal(resolveLumineWorkMode({ running: true, activity: base, writingRecently: true }), 'writing');
  assert.equal(resolveLumineWorkMode({ running: true, activity: base, writingRecently: false }), 'thinking');
  assert.equal(resolveLumineWorkMode({ running: true, activity: { ...base, thinking: false }, writingRecently: false }), 'working');
  assert.equal(describeLumineWork({ mode: 'idle', lingering: false, label: null, focusFilePath: null, isOwner: false }).subtitle, 'This build has no code yet');
  assert.equal(describeLumineWork({ mode: 'writing', lingering: false, label: 'x', focusFilePath: '/src/game.js', isOwner: true }).subtitle, 'Working on game.js');
});

test('poses never repeat back to back, follow an idea with a burst, and keep their lengths', () => {
  for (const mode of ['writing', 'thinking', 'working', 'queued', 'idle'] as const) {
    let previous: any = null;
    for (let i = 0; i < 200; i++) {
      const next = nextLuminePose({ mode, previous, roll: (i * 0.137) % 1, lengthRoll: (i * 0.71) % 1 });
      assert.notEqual(next.pose, previous, `${mode} repeated ${previous}`);
      const [low, high] = POSE_TICKS[next.pose];
      assert.ok(next.ticks >= low && next.ticks <= high);
      previous = next.pose;
    }
  }
  assert.equal(nextLuminePose({ mode: 'working', previous: 'think', roll: 0.5, lengthRoll: 0 }).pose, 'burst');
});

test('every pose renders a full frame at the narrowest and widest scene sizes', () => {
  const poses = ['type', 'burst', 'think', 'sip', 'stretch', 'glance', 'celebrate', 'wave', 'rest', 'slam', 'flow', 'test'] as const;
  for (const width of [112, 160, 232]) {
    for (const pose of poses) {
      for (const poseFrame of [0, 5, 11, 30]) {
        const pixels = renderScene(width, { pose, frame: 40 + poseFrame, poseFrame, typed: 300, compact: width === 112 });
        assert.equal(pixels.length, width * SCENE_H * 4);
        for (let i = 3; i < pixels.length; i += 4 * 97) assert.equal(pixels[i], 255);
      }
    }
  }
});

test('inline diff pairs removed lines with the added lines that replace them', () => {
  const rows = diffLines('a\nb\nc\nd', 'a\nB\nc\nd\ne');
  assert.deepEqual(
    rows.map((row) => [row.kind, row.text, row.oldNo, row.newNo, row.modified]),
    [
      ['context', 'a', 1, 1, false],
      ['removed', 'b', 2, null, false],
      ['added', 'B', null, 2, true],
      ['context', 'c', 3, 3, false],
      ['context', 'd', 4, 4, false],
      ['added', 'e', null, 5, false]
    ]
  );
  assert.ok(diffLines('', 'x\ny').every((row) => row.kind === 'added'));
});

test('long unchanged runs fold, keeping three lines of context, and expand on request', () => {
  const old = Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n');
  const next = old.replace('line 20', 'LINE 20');
  const folded = foldRows(diffLines(old, next));
  const folds = folded.filter((item) => item.kind === 'fold');
  assert.equal(folds.length, 2);
  assert.equal(folds[0].kind === 'fold' && folds[0].count, 17);
  const keys = new Set(folds.map((item) => (item.kind === 'fold' ? item.key : '')));
  assert.equal(foldRows(diffLines(old, next), { expanded: keys }).length, 41);
  assert.equal(foldRows(diffLines(old, old)).length, 40);
});

test('the typing cursor only types lines the latest update brought', () => {
  assert.deepEqual(freshLineNumbers('a\nb', 'a\nnew\nb\n\nlast'), [2, 5]);
  assert.deepEqual(freshLineNumbers('same', 'same'), []);
});

test('a preview-test tool event (named by the API) puts Lumine in testing mode', () => {
  const activity = resolveLumineRunActivity({
    runEvents: [{ kind: 'action', message: 'Lumine checked the preview.', details: { toolName: 'run_preview_test', toolPhase: 'inspect' } }],
    queue: null,
    assistantStatusSteps: []
  });
  assert.equal(activity.testing, true);
  assert.equal(resolveLumineWorkMode({ running: true, activity, writingRecently: false }), 'testing');
  const edit = resolveLumineRunActivity({
    runEvents: [{ kind: 'action', message: 'x', details: { toolName: 'edit_project_file' } }],
    queue: null,
    assistantStatusSteps: []
  });
  assert.equal(edit.testing, false);
});

test('Lumine finished notices: wording per outcome, and the build page is recognised', () => {
  const saved = normalizeLumineRunFinishedNotice({ buildId: 3, requestId: 'r', title: 'Star Catcher', outcome: 'saved', versionNumber: 12 });
  assert.ok(saved);
  assert.deepEqual(describeLumineRunFinished(saved!), { title: 'Your app is ready!', message: 'Star Catcher: version 12 saved.', success: true });
  assert.match(describeLumineRunFinished({ ...saved!, unfinished: true }).message, /stopped before finishing/);
  assert.equal(describeLumineRunFinished({ ...saved!, outcome: 'failed', message: null, title: null }).message, 'Your project: something went wrong. You can try again.');
  assert.equal(describeLumineRunFinished({ ...saved!, outcome: 'stopped' }).success, false);
  assert.equal(normalizeLumineRunFinishedNotice({ buildId: 0, outcome: 'saved' }), null);
  assert.equal(normalizeLumineRunFinishedNotice({ buildId: 3, outcome: 'weird' }), null);
  assert.equal(isLumineBuildPage('/build/3', 3), true);
  assert.equal(isLumineBuildPage('/build/3/branches', 3), true);
  assert.equal(isLumineBuildPage('/build/33', 3), false);
  assert.equal(isLumineBuildPage('/home', 3), false);
});
