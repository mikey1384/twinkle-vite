// Twinkle.ai.decide with images (preview): the app iframe sends each picture
// as an upload URL or a Blob snapshot (structured clone over postMessage).
// The host turns Blobs into base64 for the JSON API request. The API checks
// everything again; this only keeps an app from pushing huge or odd payloads
// through the host.

export const DECISION_IMAGE_MAX_COUNT = 4;
export const DECISION_IMAGE_SNAPSHOT_MAX_BYTES = 3 * 1024 * 1024;
export const DECISION_IMAGE_INLINE_TOTAL_MAX_BYTES = 5 * 1024 * 1024;
const SNAPSHOT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type SerializedDecisionImage =
  | { kind: 'upload'; url: string }
  | { kind: 'snapshot'; mimeType: string; dataBase64: string };

function invalid(message: string): never {
  throw Object.assign(new Error(message), { code: 'invalid_ai_decision' });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export async function serializeBuildDecisionImages(
  images: unknown
): Promise<Record<string, SerializedDecisionImage>> {
  if (!images || typeof images !== 'object' || Array.isArray(images)) {
    invalid('images must map names to pictures.');
  }
  const entries = Object.entries(images as Record<string, unknown>);
  if (!entries.length || entries.length > DECISION_IMAGE_MAX_COUNT) {
    invalid(`Send 1 to ${DECISION_IMAGE_MAX_COUNT} images in one decision.`);
  }
  const serialized: Record<string, SerializedDecisionImage> = {};
  let inlineBytes = 0;
  for (const [name, value] of entries) {
    if (!/^[a-z][a-z0-9_]{0,31}$/.test(name)) {
      invalid('Image names use lowercase letters, digits and underscores.');
    }
    const item = value as { kind?: unknown; url?: unknown; blob?: unknown };
    if (item?.kind === 'upload' && typeof item.url === 'string' && item.url.length <= 2048) {
      serialized[name] = { kind: 'upload', url: item.url };
      continue;
    }
    const blob = item?.kind === 'snapshot' ? item.blob : null;
    if (typeof Blob !== 'function' || !(blob instanceof Blob)) {
      invalid('Each image is an upload URL from this app or a picture snapshot.');
    }
    if (!SNAPSHOT_TYPES.includes(blob.type)) {
      invalid('Images must be PNG, JPEG or WebP.');
    }
    if (blob.size > DECISION_IMAGE_SNAPSHOT_MAX_BYTES) {
      invalid('Each image must be at most 3 MB.');
    }
    inlineBytes += blob.size;
    if (inlineBytes > DECISION_IMAGE_INLINE_TOTAL_MAX_BYTES) {
      invalid('Images in one decision must total at most 5 MB.');
    }
    serialized[name] = {
      kind: 'snapshot',
      mimeType: blob.type,
      dataBase64: bytesToBase64(new Uint8Array(await blob.arrayBuffer()))
    };
  }
  return serialized;
}

// An API that did not look at every picture (for example an older server
// that ignores `images`) must never pass for an image decision.
export function assertDecisionSawImages(response: any, expected: number) {
  if (Number(response?.imageCount) !== expected) {
    throw Object.assign(
      new Error('Image decisions are not available right now. Nothing was decided.'),
      { code: 'ai_decision_unavailable', reason: 'images_not_supported' }
    );
  }
  return response;
}
