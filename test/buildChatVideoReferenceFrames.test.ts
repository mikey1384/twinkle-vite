import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BUILD_CHAT_REFERENCE_MAX_COUNT,
  getVideoFrameCountPerFile,
  getVideoFrameTimes,
  isVideoChatReferenceFile
} from '../src/containers/Build/Editor/helpers/videoReferenceFrames';

test('a bug recording is recognized by type or by extension', () => {
  assert.equal(isVideoChatReferenceFile({ name: 'bug.mp4', type: '' } as File), true);
  assert.equal(isVideoChatReferenceFile({ name: 'clip', type: 'video/webm' } as File), true);
  assert.equal(isVideoChatReferenceFile({ name: 'shot.png', type: 'image/png' } as File), false);
  assert.equal(isVideoChatReferenceFile({ name: 'memo.webm', type: 'audio/webm' } as File), false);
});

test('video frames share the four-reference budget with attached images', () => {
  assert.equal(BUILD_CHAT_REFERENCE_MAX_COUNT, 4);
  assert.equal(getVideoFrameCountPerFile({ imageCount: 0, videoCount: 1 }), 4);
  assert.equal(getVideoFrameCountPerFile({ imageCount: 1, videoCount: 1 }), 3);
  assert.equal(getVideoFrameCountPerFile({ imageCount: 0, videoCount: 2 }), 2);
  assert.equal(getVideoFrameCountPerFile({ imageCount: 0, videoCount: 3 }), 1);
  // No room for at least one frame per video: the caller explains instead.
  assert.equal(getVideoFrameCountPerFile({ imageCount: 3, videoCount: 2 }), 0);
  assert.equal(getVideoFrameCountPerFile({ imageCount: 4, videoCount: 1 }), 0);
});

test('frames are spread across the clip without its first and last instant', () => {
  assert.deepEqual(getVideoFrameTimes(8, 4), [1, 3, 5, 7]);
  assert.deepEqual(getVideoFrameTimes(Number.NaN, 4), [0]);
  const times = getVideoFrameTimes(0.2, 4);
  assert.ok(times.every((time) => time >= 0 && time <= 0.2 - 0.05));
});
