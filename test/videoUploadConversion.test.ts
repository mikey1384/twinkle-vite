import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { readMatroskaTrackTypes } from '../src/helpers/matroskaTrackInventory';
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
    'max_track_count_of_type_reached',
    'max_track_count_reached',
    'future_unknown_loss_reason'
  ]) {
    assert.equal(isTrackLossReason(reason), true);
  }
  assert.equal(isTrackLossReason('discarded_by_user'), false);
});

function fixtureFile(name = 'audio-video.mkv') {
  return new File(
    [readFileSync(new URL(`./fixtures/video-upload/${name}`, import.meta.url))],
    name,
    { type: 'video/x-matroska', lastModified: 123456 }
  );
}

function ebmlElement(id: number, payload: Uint8Array) {
  const idBytes = Buffer.from(id.toString(16), 'hex');
  let sizeWidth = 1;
  while (payload.length >= 2 ** (7 * sizeWidth) - 1) sizeWidth++;
  const size = Buffer.alloc(sizeWidth);
  size.writeUIntBE(payload.length, 0, sizeWidth);
  size[0] |= 0x80 >> (sizeWidth - 1);
  return Buffer.concat([idBytes, size, payload]);
}

function inventoryFile(entries: Uint8Array[], beforeTracks = Buffer.alloc(0)) {
  return new File([
    ebmlElement(0x1a45dfa3, Buffer.alloc(0)),
    // Unknown Segment length is normal for recordings; child lengths are known.
    Buffer.from('1853806701ffffffffffffff', 'hex'),
    beforeTracks,
    ebmlElement(0x1654ae6b, Buffer.concat(entries))
  ], 'tracks.mkv');
}

const trackEntry = (type: number) =>
  ebmlElement(0xae, ebmlElement(0x83, Buffer.from([type])));

test('a real H.264/AAC MKV still converts and retains both playable tracks', async () => {
  const file = fixtureFile();
  assert.deepEqual(await readMatroskaTrackTypes(file), [1, 2]);
  const result = await convertVideoForUpload({ file });
  assert.equal(result.status, 'converted');
  assert.equal(result.file.name, 'audio-video.mp4');
  assert.equal(result.file.type, 'video/mp4');
  assert.equal(result.file.lastModified, file.lastModified);
  const { Input, BlobSource, ALL_FORMATS } = await import('mediabunny');
  const output = new Input({ source: new BlobSource(result.file), formats: ALL_FORMATS });
  try {
    const tracks = await output.getTracks();
    assert.deepEqual(tracks.map((track) => track.codec), ['avc', 'aac']);
    assert.ok(await output.computeDuration() > 0.9);
  } finally {
    output.dispose();
  }
});

test('a real MKV with subtitles uploads the original bytes instead of stripping the subtitle', async () => {
  const file = fixtureFile('with-subtitles.mkv');
  assert.deepEqual(await readMatroskaTrackTypes(file), [1, 2, 17]);
  assert.deepEqual(await convertVideoForUpload({ file }), {
    status: 'unchanged', file, reason: 'track_loss'
  });
});

test('unsupported track types and incomplete or ambiguous track tables preserve the original', async () => {
  const invalidEntries = [
    [],
    [trackEntry(1), trackEntry(17)],
    [trackEntry(1), trackEntry(0x20)],
    [ebmlElement(0xae, Buffer.alloc(0))],
    [ebmlElement(0xae, Buffer.concat([
      ebmlElement(0x83, Buffer.from([1])), ebmlElement(0x83, Buffer.from([2]))
    ]))],
    [Buffer.from('aeff838101', 'hex')],
    [Buffer.from('ae8183', 'hex')]
  ];
  for (const entries of invalidEntries) {
    const file = inventoryFile(entries);
    assert.deepEqual(await convertVideoForUpload({ file }), {
      status: 'unchanged', file, reason: 'track_loss'
    });
  }
  for (const bytes of ['00', '1a45dfa3ff', '1a45dfa38018538067ff1f43b675ff']) {
    assert.equal(await readMatroskaTrackTypes(new Blob([Buffer.from(bytes, 'hex')])), null);
  }
});

test('track inventory seeks over large payloads with bounded reads and stops on excessive elements', async (t) => {
  const file = inventoryFile([trackEntry(1), trackEntry(2)],
    ebmlElement(0xec, Buffer.alloc(2 * 1024 * 1024)));
  let readBytes = 0;
  const slice = file.slice.bind(file);
  t.mock.method(file, 'slice', (start = 0, end = file.size) => {
    assert.ok(end - start <= 4096);
    readBytes += end - start;
    return slice(start, end);
  });
  assert.deepEqual(await readMatroskaTrackTypes(file), [1, 2]);
  assert.ok(readBytes < 8192, `read ${readBytes} bytes`);
  const excessive = inventoryFile([trackEntry(1)],
    Buffer.concat(Array.from({ length: 9000 }, () => ebmlElement(0xec, Buffer.alloc(0)))));
  assert.equal(await readMatroskaTrackTypes(excessive), null);
});

test('an abort during inventory reads never initializes conversion', async (t) => {
  const { Conversion } = await import('mediabunny');
  const init = t.mock.method(Conversion, 'init', () => { throw new Error('must not initialize'); });
  const controller = new AbortController();
  const file = fixtureFile();
  const slice = file.slice.bind(file);
  t.mock.method(file, 'slice', (start?: number, end?: number) => {
    controller.abort();
    return slice(start, end);
  });
  assert.deepEqual(await convertVideoForUpload({ file, signal: controller.signal }), {
    status: 'unchanged', file, reason: 'cancelled'
  });
  assert.equal(init.mock.callCount(), 0);
});

test('an abort while Conversion.init is pending disposes input and never executes', async (t) => {
  const { Conversion, Input } = await import('mediabunny');
  const controller = new AbortController();
  const file = fixtureFile();
  let executions = 0;
  let cancellations = 0;
  const dispose = t.mock.method(Input.prototype, 'dispose');
  t.mock.method(Conversion, 'init', async () => {
    controller.abort();
    assert.ok(dispose.mock.callCount() > 0, 'initialization reads are cancelled immediately');
    return {
      isValid: true, discardedTracks: [], utilizedTracks: [{}, {}],
      execute: async () => { executions++; },
      cancel: async () => { cancellations++; }
    };
  });
  assert.deepEqual(await convertVideoForUpload({ file, signal: controller.signal }), {
    status: 'unchanged', file, reason: 'cancelled'
  });
  assert.equal(executions, 0);
  assert.equal(cancellations, 1);
});

test('aborting an executing conversion cancels once, suppresses late progress and retains the original', async (t) => {
  const { Conversion } = await import('mediabunny');
  const controller = new AbortController();
  const file = fixtureFile();
  const progress: number[] = [];
  let cancellations = 0;
  const prepared = {
    isValid: true, discardedTracks: [], utilizedTracks: [{}, {}],
    onProgress: (_progress: number) => {},
    execute: async () => {
      prepared.onProgress(0.1);
      controller.abort();
      prepared.onProgress(0.8);
      throw new Error('input disposed');
    },
    cancel: async () => {
      cancellations++;
      throw new Error('cleanup also failed');
    }
  };
  t.mock.method(Conversion, 'init', async () => prepared);
  assert.deepEqual(await convertVideoForUpload({ file, signal: controller.signal,
    onProgress: (value) => progress.push(value) }), {
    status: 'unchanged', file, reason: 'cancelled'
  });
  assert.deepEqual(progress, [0.1]);
  assert.equal(cancellations, 1);
});

test('a track omitted by the demuxer also preserves the original', async (t) => {
  const { Conversion } = await import('mediabunny');
  let executions = 0;
  t.mock.method(Conversion, 'init', async () => ({
    isValid: true, discardedTracks: [], utilizedTracks: [{}],
    execute: async () => { executions++; }, cancel: async () => {}
  }));
  const file = fixtureFile();
  assert.deepEqual(await convertVideoForUpload({ file }), {
    status: 'unchanged', file, reason: 'track_loss'
  });
  assert.equal(executions, 0);
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
