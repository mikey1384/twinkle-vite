import { cloudFrontURL } from '~/constants/defaultValues';
import type { StoryMediaItem } from './types';

// Every example page and card carries this label (Mikey, 2026-09-28: the
// examples must be clearly marked as illustrations, deliver-or-don't-claim).
export const SAMPLE_LABEL =
  'Example story — the pictures are AI illustrations made for this example';
export const SAMPLE_SHORT_LABEL = 'Example · AI illustrations';

export const EXAMPLES_PATH = '/bridge-builder/examples';
export const HALL_PATH = '/bridge-builder/stories';
export const QUEST_PATH = '/achievements/bridge-builder';

export function storyPath(storyId: number) {
  return `/bridge-builder/stories/${storyId}`;
}

export function samplePath(slug: string) {
  return `${EXAMPLES_PATH}/${slug}`;
}

export function storyEditorPath(crewId: number) {
  return `/achievements/bridge-builder/crew/${crewId}/story`;
}

export function publicUrl(key: string) {
  if (!key) return '';
  return `${cloudFrontURL}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export function mediaSrc(item: Pick<StoryMediaItem, 'url' | 'key'>) {
  return item.url || publicUrl(item.key);
}

export function posterSrc(item: Pick<StoryMediaItem, 'posterUrl' | 'posterKey'>) {
  return item.posterUrl || publicUrl(item.posterKey);
}

export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- uploads (the editor) ----

export const PHOTO_MAX_EDGE = 2400;
export const CLIP_MAX_SECONDS = 60;
export const CLIP_MAX_BYTES = 250 * 1024 * 1024;

// Re-encodes a photo in the browser: at most 2400 px, JPEG. Drawing through a
// canvas also drops the file's metadata (a phone's GPS location included);
// the server strips it again when the photo is published.
export async function prepareStoryPhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('That photo could not be opened. Try a JPG or PNG.'));
      img.src = url;
    });
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the photo.');
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    );
    if (!blob) throw new Error('Your browser could not prepare the photo.');
    return {
      file: new File([blob], 'story-photo.jpg', { type: 'image/jpeg' }),
      width,
      height
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// A clip's length and a poster frame (a JPEG from about a second in).
export async function probeStoryClip(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('That video could not be opened. Try an MP4.'));
    });
    const durationSec = Number(video.duration) || 0;
    let poster: File | null = null;
    let width = video.videoWidth;
    let height = video.videoHeight;
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('timeout')), 6000);
        video.onseeked = () => {
          window.clearTimeout(timer);
          resolve();
        };
        video.currentTime = Math.min(1, durationSec / 2);
      });
      const scale = Math.min(1, 1280 / Math.max(width, height, 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );
      if (blob) poster = new File([blob], 'story-poster.jpg', { type: 'image/jpeg' });
      width = canvas.width;
      height = canvas.height;
    } catch {
      // no poster: the clip still plays
    }
    return { durationSec, poster, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function clipExtension(fileName: string) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  return ['mp4', 'mov', 'webm', 'm4v'].includes(ext) ? ext : '';
}
