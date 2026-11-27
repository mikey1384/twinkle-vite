import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  dailyPictureJobs,
  type PictureDayState
} from '../src/helpers/dailyPictureJobs';

function readSrc(relativePath: string) {
  return readFileSync(new URL(`../src/${relativePath}`, import.meta.url), 'utf8');
}

function makePictureState(paths: string[], chosenPath = ''): PictureDayState {
  return {
    prompt: 'A fox',
    style: 'Clay',
    chosenPath,
    freeAvailable: false,
    candidates: paths.map((path, index) => ({
      path,
      prompt: `prompt ${index}`,
      style: 'Clay',
      quality: 'high',
      paidBy: index === 0 ? 'site' : 'battery',
      requestId: `req-${index}`
    }))
  };
}

test('dailyPictureJobs.removePicture drops deleted ready jobs, strips cached candidates, and blocks stale socket resurrection', () => {
  const pathA = 'daily-reflection/pic-a.png';
  const pathB = 'daily-reflection/pic-b.png';
  dailyPictureJobs.activate(101);
  dailyPictureJobs.receive({
    userId: 101,
    questionId: 42,
    requestId: 'req-0',
    isToday: true,
    path: pathA,
    picture: makePictureState([pathA], pathA)
  });
  dailyPictureJobs.receive({
    userId: 101,
    questionId: 42,
    requestId: 'req-1',
    isToday: true,
    path: pathB,
    picture: makePictureState([pathA, pathB], pathA)
  });
  assert.equal(dailyPictureJobs.getSnapshot().jobs.length, 2);

  // Deleting pathA removes its ready job and strips pathA from req-1's cached picture
  dailyPictureJobs.removePicture({ questionId: 42, path: pathA });
  const afterRemove = dailyPictureJobs.getSnapshot().jobs;
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0].requestId, 'req-1');
  assert.deepEqual(
    afterRemove[0].picture?.candidates.map((c) => c.path),
    [pathB]
  );
  assert.equal(afterRemove[0].picture?.chosenPath, '');

  // A late socket broadcast for the deleted pathA cannot resurrect it
  dailyPictureJobs.receive({
    userId: 101,
    questionId: 42,
    requestId: 'req-0',
    isToday: true,
    path: pathA,
    picture: makePictureState([pathA], pathA)
  });
  assert.equal(dailyPictureJobs.getSnapshot().jobs.length, 1);

  // Deleting without a specific path clears remaining ready jobs for that day
  dailyPictureJobs.removePicture({ questionId: 42 });
  assert.equal(dailyPictureJobs.getSnapshot().jobs.length, 0);
});

test('dailyPictureJobs.reconcileServerState removes stale ready jobs deleted elsewhere', () => {
  const pathA = 'daily-reflection/stale-a.png';
  const pathB = 'daily-reflection/live-b.png';
  dailyPictureJobs.activate(102);
  dailyPictureJobs.receive({
    userId: 102,
    questionId: 55,
    requestId: 'req-0',
    isToday: true,
    path: pathA,
    picture: makePictureState([pathA], pathA)
  });
  dailyPictureJobs.receive({
    userId: 102,
    questionId: 55,
    requestId: 'req-1',
    isToday: true,
    path: pathB,
    picture: makePictureState([pathA, pathB], pathA)
  });

  // Server snapshot fetched after those jobs settled no longer contains pathA
  const serverPicture = makePictureState([pathB], '');
  dailyPictureJobs.reconcileServerState({
    questionId: 55,
    picture: serverPicture,
    fetchedAt: Date.now() + 1000
  });
  const jobs = dailyPictureJobs.getSnapshot().jobs;
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].path, pathB);
  assert.deepEqual(jobs[0].picture, serverPicture);
});

test('dailyPictureJobs.start handles a concurrently deleted picture response cleanly without hanging in checking', async () => {
  dailyPictureJobs.activate(103);
  const emptyPicture = makePictureState([], '');
  await dailyPictureJobs.start({
    userId: 103,
    questionId: 66,
    prompt: 'A whale',
    style: 'Ink',
    quality: 'high',
    generate: async ({ requestId }) => ({
      userId: 103,
      questionId: 66,
      requestId,
      isToday: true,
      deleted: true,
      picture: emptyPicture
    }),
    load: async () => ({
      questionId: 66,
      isToday: true,
      picture: emptyPicture
    })
  });
  const [job] = dailyPictureJobs.getSnapshot().jobs;
  assert.ok(job);
  assert.equal(job.status, 'ready');
  assert.equal(job.path, undefined);
  assert.equal(job.notified, true);
  assert.deepEqual(job.picture, emptyPicture);
});

test('DailyPictureViewer, DailyReflectionPicture, and ContentPreview clear deleted pictures immediately', () => {
  const viewer = readSrc('components/DailyPictureViewer.tsx');
  assert.match(viewer, /const shownPath = changed \? changed\.picturePath : syncedPath;/);
  assert.doesNotMatch(viewer, /changed\?\.picturePath\s*\|\|/);
  assert.match(viewer, /setChanged\(\{\s+picturePath:\s+nextPath,\s+pictureStyle:\s+nextStyle,\s+previousPath:\s+null\s+\}\)/);
  assert.match(viewer, /dailyPictureJobs\.removePicture/);

  const reflectionPic = readSrc('components/DailyReflectionPicture.tsx');
  const guardIndex = reflectionPic.indexOf('if (!shownPath) return null;');
  const imgIndex = reflectionPic.indexOf('<img');
  assert.ok(guardIndex > 0 && guardIndex < imgIndex);

  const preview = readSrc('components/ContentPreview.tsx');
  assert.match(preview, /useContentContext/);
  assert.match(preview, /dailyReflection\$\{contentId\}/);
});

test('PictureGallery and ImageHistory keep Load More reachable when page 1 is emptied', () => {
  const gallery = readSrc('containers/DailyReflection/PictureGallery.tsx');
  const galleryNextIdx = gallery.indexOf(') : nextBefore ? (');
  const galleryEmptyIdx = gallery.indexOf(') : days.length === 0 ? (');
  assert.ok(galleryNextIdx > 0 && galleryEmptyIdx > galleryNextIdx);

  const history = readSrc('components/Modals/UploadModal/ImageGenerator/ImageHistory.tsx');
  const historyMoreIdx = history.indexOf(') : hasMore ? (');
  const historyEmptyIdx = history.indexOf(') : images.length === 0 ? (');
  assert.ok(historyMoreIdx > 0 && historyEmptyIdx > historyMoreIdx);
});

test('ConfirmModal blocks dismissal while submitting and ImageHistory/ImageGenerator handle edit warnings, sync, and a11y', () => {
  const confirmModal = readSrc('components/Modals/ConfirmModal.tsx');
  assert.match(confirmModal, /closeOnBackdropClick=\{!submitting\}/);
  assert.match(confirmModal, /closeOnEscape=\{!submitting\}/);
  assert.match(confirmModal, /showCloseButton=\{!submitting\}/);
  assert.match(confirmModal, /disabled=\{submitting\}/);

  const history = readSrc('components/Modals/UploadModal/ImageGenerator/ImageHistory.tsx');
  assert.match(history, /confirmingDelete\.source === 'edit'/);
  assert.match(history, /aria-label=\{`Delete "\$\{image\.prompt \|\| 'this image'\}"`\}/);
  assert.match(history, /width:\s+44px;\s+height:\s+44px;/);
  assert.match(history, /&:focus-visible\s*\{[\s\S]*?outline:\s+2px\s+solid/);
  const errorIdx = history.indexOf('{deleteError && (');
  const gridIdx = history.indexOf('{images.length > 0 && (');
  assert.ok(errorIdx > 0 && errorIdx < gridIdx);

  const generator = readSrc('components/Modals/UploadModal/ImageGenerator/index.tsx');
  assert.match(generator, /deletedHistoryIdsRef\.current\.add\(image\.id\)/);
  assert.match(generator, /onEditContent\(\{\s+contentType:\s+'dailyReflection'/);
  assert.match(generator, /dailyPictureJobs\.removePicture/);
});
