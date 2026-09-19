// MKV (Matroska) never plays on iOS — every iOS browser is WebKit, and WebKit
// has no Matroska demuxer — and only plays by accident elsewhere. The streams
// inside are usually plain H.264 + AAC (OBS records MKV by default), so the file
// is rewrapped as MP4 in the uploader's browser before it is uploaded: a copy,
// not a re-encode, unless a track is something iOS cannot play inside MP4.
//
// Conversion is best effort. Anything that would lose a track, fail, or be
// cancelled hands back the original file untouched; the player's "can't play on
// this device" fallback covers whatever still gets uploaded as MKV.

import { readMatroskaTrackTypes } from './matroskaTrackInventory';

const CONVERTIBLE_VIDEO_EXTENSIONS = ['mkv'];
// Below this size the MP4 index is assembled in memory for a regular
// fast-start file. Above it the output is fragmented MP4, which streams to the
// result without holding the whole video in memory (uploads go up to 2 GB).
const IN_MEMORY_FAST_START_MAX_BYTES = 256 * 1024 * 1024;
const IOS_PLAYABLE_MP4_VIDEO_CODECS = ['avc', 'hevc'];
const IOS_PLAYABLE_MP4_AUDIO_CODECS = ['aac', 'mp3'];

export type VideoUploadConversionResult =
  | { status: 'converted'; file: File }
  | {
      status: 'unchanged';
      file: File;
      reason: 'not_needed' | 'cancelled' | 'track_loss' | 'failed';
    };

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex < 0 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

export function needsVideoUploadConversion(file: { name: string }) {
  return CONVERTIBLE_VIDEO_EXTENSIONS.includes(getExtension(file.name || ''));
}

export function getConvertedVideoFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex <= 0 ? fileName : fileName.slice(0, dotIndex);
  return `${baseName || 'video'}.mp4`;
}

// Copy what iOS already plays inside MP4; re-encode the rest. An empty options
// object means "leave the track alone", which the library resolves to a copy.
export function getVideoTrackConversionOptions(codec: string | null) {
  return codec && IOS_PLAYABLE_MP4_VIDEO_CODECS.includes(codec)
    ? {}
    : { codec: 'avc' as const };
}

export function getAudioTrackConversionOptions(codec: string | null) {
  return codec && IOS_PLAYABLE_MP4_AUDIO_CODECS.includes(codec)
    ? {}
    : { codec: 'aac' as const };
}

export function isTrackLossReason(reason: string) {
  return reason !== 'discarded_by_user';
}

export async function convertVideoForUpload({
  file,
  onProgress,
  signal
}: {
  file: File;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}): Promise<VideoUploadConversionResult> {
  if (!needsVideoUploadConversion(file)) {
    return { status: 'unchanged', file, reason: 'not_needed' };
  }
  if (signal?.aborted) {
    return { status: 'unchanged', file, reason: 'cancelled' };
  }

  let input: { dispose: () => void } | null = null;
  let conversion: { cancel: () => Promise<void> } | null = null;
  let cancellation: Promise<void> | undefined;
  const release = () => {
    // Disposing cancels reads even while Conversion.init is still pending.
    input?.dispose();
    if (conversion && !cancellation) {
      cancellation = conversion.cancel().catch(() => {
        // Cleanup failure must not replace the original-file fallback.
      });
    }
  };
  signal?.addEventListener('abort', release, { once: true });
  try {
    const trackTypes = await readMatroskaTrackTypes(file, signal);
    signal?.throwIfAborted();
    if (!trackTypes || trackTypes.some((type) => type !== 1 && type !== 2)) {
      return { status: 'unchanged', file, reason: 'track_loss' };
    }
    // Loaded on demand: only someone who picks an MKV ever downloads it.
    const {
      ALL_FORMATS,
      BlobSource,
      Conversion,
      Input,
      Mp4OutputFormat,
      Output,
      StreamTarget
    } = await import('mediabunny');
    signal?.throwIfAborted();

    // Blob parts, not byte arrays: the browser owns blob storage and can move it
    // to disk, so a large video does not have to sit in the JS heap twice.
    const parts: Blob[] = [];
    let bytesWritten = 0;
    const writable = new WritableStream<{
      type: 'write';
      data: Uint8Array<ArrayBuffer>;
      position: number;
    }>({
      write(chunk) {
        // Both fast-start modes used below write in order. A seek back would
        // mean the parts no longer describe the file, so fail instead.
        if (chunk.position !== bytesWritten) {
          throw new Error('Converted video was not written in order');
        }
        parts.push(new Blob([chunk.data]));
        bytesWritten += chunk.data.byteLength;
      }
    });

    const mediaInput = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS
    });
    input = mediaInput;
    const output = new Output({
      format: new Mp4OutputFormat({
        fastStart:
          file.size <= IN_MEMORY_FAST_START_MAX_BYTES
            ? 'in-memory'
            : 'fragmented'
      }),
      target: new StreamTarget(writable)
    });
    const prepared = await Conversion.init({
      input: mediaInput,
      output,
      video: (track) => getVideoTrackConversionOptions(track.codec),
      audio: (track) => getAudioTrackConversionOptions(track.codec)
    });
    conversion = prepared;
    signal?.throwIfAborted();

    const losesTrack = prepared.discardedTracks.some(({ reason }) =>
      isTrackLossReason(reason)
    );
    if (
      !prepared.isValid ||
      losesTrack ||
      new Set(prepared.utilizedTracks).size !== trackTypes.length
    ) {
      return { status: 'unchanged', file, reason: 'track_loss' };
    }

    prepared.onProgress = (progress) => {
      if (!signal?.aborted) onProgress?.(progress);
    };
    await prepared.execute();
    if (signal?.aborted) {
      return { status: 'unchanged', file, reason: 'cancelled' };
    }

    return {
      status: 'converted',
      file: new File(parts, getConvertedVideoFileName(file.name), {
        type: 'video/mp4',
        lastModified: file.lastModified
      })
    };
  } catch (error) {
    if (signal?.aborted) {
      return { status: 'unchanged', file, reason: 'cancelled' };
    }
    console.error('Video upload conversion failed:', error);
    return { status: 'unchanged', file, reason: 'failed' };
  } finally {
    signal?.removeEventListener('abort', release);
    release();
    await cancellation;
  }
}
