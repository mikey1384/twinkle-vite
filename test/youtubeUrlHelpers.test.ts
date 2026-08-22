import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getYouTubeVideoId,
  isYouTubeVideoUrl
} from '../src/helpers/youtubeUrlHelpers';

const VIDEO_ID = 'dQw4w9WgXcQ';

test('extracts the same YouTube id from supported share URL forms', () => {
  const urls = [
    `https://www.youtube.com/watch?v=${VIDEO_ID}&feature=shared`,
    `https://m.youtube.com/watch?app=desktop&v=${VIDEO_ID}`,
    `youtube.com/shorts/${VIDEO_ID}?feature=share`,
    `https://youtu.be/${VIDEO_ID}?si=share-token`,
    `https://www.youtube.com/embed/${VIDEO_ID}`,
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
    `https://youtube.com/live/${VIDEO_ID}`,
    `https://www.youtube.com/watch?v\\=${VIDEO_ID}`,
    `https://www.youtube.com/watch?v%5C=${VIDEO_ID}`
  ];

  for (const url of urls) {
    assert.equal(getYouTubeVideoId(url), VIDEO_ID, url);
    assert.equal(isYouTubeVideoUrl(url), true, url);
  }
});

test('rejects non-YouTube and malformed video URLs', () => {
  const urls = [
    `https://example.com/watch?v=${VIDEO_ID}`,
    'https://www.youtube.com/watch',
    'https://www.youtube.com/shorts/not-a-video-id',
    `javascript://youtube.com/watch?v=${VIDEO_ID}`,
    ''
  ];

  for (const url of urls) {
    assert.equal(getYouTubeVideoId(url), '', url);
    assert.equal(isYouTubeVideoUrl(url), false, url);
  }
});
