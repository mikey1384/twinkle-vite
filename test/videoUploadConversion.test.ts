import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  convertVideoForUpload,
  getAudioTrackConversionOptions,
  getConvertedVideoFileName,
  getVideoTrackConversionOptions,
  isTrackLossReason,
  needsVideoUploadConversion
} from '../src/helpers/videoUploadConversion';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('only MKV uploads are converted, whatever the case of the extension', () => {
  assert.equal(needsVideoUploadConversion({ name: 'clip.mkv' }), true);
  assert.equal(needsVideoUploadConversion({ name: 'My.Recording.MKV' }), true);
  for (const name of ['clip.mp4', 'clip.mov', 'clip.webm', 'mkv', 'clip', '']) {
    assert.equal(needsVideoUploadConversion({ name }), false);
  }
});

test('the converted file keeps its name and swaps the extension for mp4', () => {
  assert.equal(getConvertedVideoFileName('clip.mkv'), 'clip.mp4');
  assert.equal(
    getConvertedVideoFileName('1789475420312-md220n.mkv'),
    '1789475420312-md220n.mp4'
  );
  assert.equal(getConvertedVideoFileName('a.b.c.MKV'), 'a.b.c.mp4');
  assert.equal(getConvertedVideoFileName('.mkv'), '.mkv.mp4');
});

test('tracks iOS plays inside MP4 are copied; everything else is re-encoded', () => {
  assert.deepEqual(getVideoTrackConversionOptions('avc'), {});
  assert.deepEqual(getVideoTrackConversionOptions('hevc'), {});
  for (const codec of ['vp9', 'vp8', 'av1', 'prores', null]) {
    assert.deepEqual(getVideoTrackConversionOptions(codec), { codec: 'avc' });
  }
  assert.deepEqual(getAudioTrackConversionOptions('aac'), {});
  assert.deepEqual(getAudioTrackConversionOptions('mp3'), {});
  for (const codec of ['opus', 'vorbis', 'flac', 'ac3', null]) {
    assert.deepEqual(getAudioTrackConversionOptions(codec), { codec: 'aac' });
  }
});

test('a conversion that would drop a track is refused, a deliberate discard is not', () => {
  for (const reason of [
    'unknown_source_codec',
    'undecodable_source_codec',
    'no_encodable_target_codec',
    'cannot_copy',
    'max_track_count_of_type_reached'
  ]) {
    assert.equal(isTrackLossReason(reason), true);
  }
  assert.equal(isTrackLossReason('discarded_by_user'), false);
});

test('files that need no conversion pass through without loading the converter', async () => {
  const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
  const result = await convertVideoForUpload({ file });
  assert.equal(result.status, 'unchanged');
  assert.equal(result.file, file);

  const aborted = new AbortController();
  aborted.abort();
  const mkv = new File(['x'], 'clip.mkv');
  const cancelled = await convertVideoForUpload({
    file: mkv,
    signal: aborted.signal
  });
  assert.deepEqual(
    { status: cancelled.status, sameFile: cancelled.file === mkv },
    { status: 'unchanged', sameFile: true }
  );
});

test('the converter stays out of the main bundle and both upload doors use it', () => {
  const helper = readSource('src/helpers/videoUploadConversion.ts');
  assert.match(helper, /await import\('mediabunny'\)/);
  assert.doesNotMatch(helper, /^import .* from 'mediabunny'/m);
  for (const path of [
    'src/components/Modals/UploadModal/index.tsx',
    'src/components/Forms/SecretMessageInput.tsx'
  ]) {
    assert.match(readSource(path), /convertVideoForUpload\(/);
  }
});

test('a file video the browser refuses shows the notice instead of a dead player', () => {
  const player = readSource('src/components/VideoPlayer/index.tsx');
  assert.match(player, /MediaError\.MEDIA_ERR_SRC_NOT_SUPPORTED/);
  assert.match(
    player,
    /if \(unsupportedSource && props\?\.fileType === 'video'\) \{\s*return <UnsupportedVideoNotice/
  );
  assert.equal(
    (player.match(/onError=\{handleNativeVideoError\}/g) || []).length,
    2
  );
});
