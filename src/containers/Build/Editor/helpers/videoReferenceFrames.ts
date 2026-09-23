// Lumine cannot watch a video, but it can look at images. A screen recording
// attached to a bug report is turned into a few still frames here, in the
// browser, and those frames travel the ordinary image chat-reference path.

// Matches the API's BUILD_CHAT_REFERENCE_MAX_COUNT.
export const BUILD_CHAT_REFERENCE_MAX_COUNT = 4;
const FRAME_MAX_EDGE = 1280;
const LOAD_TIMEOUT_MS = 15_000;
const SEEK_TIMEOUT_MS = 8_000;
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.avi'];

export function isVideoChatReferenceFile(file: File) {
  const mimeType = String(file?.type || '').toLowerCase();
  if (mimeType.startsWith('video/')) return true;
  // A voice memo can be .webm; its audio/ type wins over the extension.
  if (mimeType.startsWith('audio/')) return false;
  const name = String(file?.name || '').toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => name.endsWith(extension));
}

// How many frames each video gets once the images already take their slots.
export function getVideoFrameCountPerFile({
  imageCount,
  videoCount
}: {
  imageCount: number;
  videoCount: number;
}) {
  const room = BUILD_CHAT_REFERENCE_MAX_COUNT - imageCount;
  if (videoCount <= 0 || room < videoCount) return 0;
  return Math.floor(room / videoCount);
}

// Evenly spaced moments across the clip, avoiding the very first and last
// frames, which are often black or mid-transition.
export function getVideoFrameTimes(duration: number, count: number) {
  if (!Number.isFinite(duration) || duration <= 0) return [0];
  return Array.from({ length: count }, (_, index) =>
    Math.min(duration * ((index + 0.5) / count), Math.max(0, duration - 0.05))
  );
}

function waitForVideoEvent(
  video: HTMLVideoElement,
  eventName: 'loadedmetadata' | 'seeked' | 'durationchange',
  timeoutMs: number
) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('The video took too long to load.'));
    }, timeoutMs);
    function cleanup() {
      window.clearTimeout(timer);
      video.removeEventListener(eventName, handleDone);
      video.removeEventListener('error', handleError);
    }
    function handleDone() {
      cleanup();
      resolve();
    }
    function handleError() {
      cleanup();
      reject(new Error('This browser cannot read the video.'));
    }
    video.addEventListener(eventName, handleDone, { once: true });
    video.addEventListener('error', handleError, { once: true });
  });
}

export async function extractVideoReferenceFrames(file: File, count: number) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  try {
    // Metadata is enough: each seek below loads the frame it draws, and iOS
    // Safari may never load frame data for a video that is not playing.
    const loaded = waitForVideoEvent(video, 'loadedmetadata', LOAD_TIMEOUT_MS);
    video.src = url;
    await loaded;
    if (!Number.isFinite(video.duration)) {
      // Browser screen recordings (WebM) often report an unknown duration
      // until the player is asked to seek past the end.
      const resolved = waitForVideoEvent(
        video,
        'durationchange',
        LOAD_TIMEOUT_MS
      );
      // Its own seeked event must land before the frame seeks below listen.
      const settled = waitForVideoEvent(video, 'seeked', SEEK_TIMEOUT_MS);
      video.currentTime = Number.MAX_SAFE_INTEGER;
      await Promise.all([
        resolved.catch(() => undefined),
        settled.catch(() => undefined)
      ]);
    }
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      throw new Error('This browser cannot read the video.');
    }
    const scale = Math.min(1, FRAME_MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not draw the video frames.');
    const baseName =
      String(file.name || 'video')
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'video';
    const times = getVideoFrameTimes(video.duration, count);
    const frames: File[] = [];
    for (const [index, time] of times.entries()) {
      const seeked = waitForVideoEvent(video, 'seeked', SEEK_TIMEOUT_MS);
      video.currentTime = time;
      await seeked;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );
      if (!blob) throw new Error('Could not save a video frame.');
      frames.push(
        new File(
          [blob],
          `${baseName}-frame-${index + 1}-of-${times.length}-at-${Math.round(
            time
          )}s.jpg`,
          { type: 'image/jpeg' }
        )
      );
    }
    return frames;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
