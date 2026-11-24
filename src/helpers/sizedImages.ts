// Smaller copies of large stored images, for places that draw them small.
//
// The API's image worker writes WebP copies at fixed widths of app covers and
// AI card art (twinkle-api helpers/sizedImages.ts owns the rules; keep both in
// step):
//   .../thumbs/builds/<user>/<build>/<file> -> .../thumbs/builds/sized/w<W>/<user>/<build>/<file>.webp
//   .../ai-arts/<file>                      -> .../ai-arts/sized/w<W>/<file>.webp
// on https://d3jvoamd2k4p0s.cloudfront.net. A copy can be missing (a picture
// from before the backfill reached it, or one saved a moment ago), so callers
// keep the original as src and drop the copies if one fails to load.
const CLOUDFRONT_URL = 'https://d3jvoamd2k4p0s.cloudfront.net/';
const FILE = '([A-Za-z0-9_-]+\\.(?:png|jpe?g|webp))';
const families: Array<{
  pattern: RegExp;
  copyPath: (m: RegExpExecArray, width: number) => string;
}> = [
  {
    pattern: new RegExp(`^thumbs/builds/(\\d+)/(\\d+)/${FILE}$`, 'i'),
    copyPath: (m, width) =>
      `thumbs/builds/sized/w${width}/${m[1]}/${m[2]}/${m[3]}.webp`
  },
  {
    pattern: new RegExp(`^ai-arts/${FILE}$`, 'i'),
    copyPath: (m, width) => `ai-arts/sized/w${width}/${m[1]}.webp`
  }
];
export const SIZED_IMAGE_WIDTHS = [240, 480, 960] as const;

export function getSizedImageUrl(src: unknown, width: number) {
  const url = String(src || '').trim();
  if (!url.startsWith(CLOUDFRONT_URL)) return '';
  const path = url.slice(CLOUDFRONT_URL.length);
  for (const family of families) {
    const match = family.pattern.exec(path);
    if (match) return `${CLOUDFRONT_URL}${family.copyPath(match, width)}`;
  }
  return '';
}

// srcset for an image that has sized copies, or '' when it has none.
export function getSizedImageSrcSet(src: unknown) {
  if (!getSizedImageUrl(src, SIZED_IMAGE_WIDTHS[0])) return '';
  return SIZED_IMAGE_WIDTHS.map(
    (width) => `${getSizedImageUrl(src, width)} ${width}w`
  ).join(', ');
}

// Copies of a card's art are made by the image worker right after the art is
// saved, so for its first minutes a card shows the original (no failed copy
// request, no gap while a reveal's preview hands over to the saved art).
const FRESH_ART_SECONDS = 180;
export function isFreshAICardArt(card: {
  timeStamp?: unknown;
  imageGenerationPreviewUrl?: unknown;
}) {
  if (card.imageGenerationPreviewUrl) return true;
  const savedAt = Number(card.timeStamp || 0);
  return savedAt > 0 && Date.now() / 1000 - savedAt < FRESH_ART_SECONDS;
}
