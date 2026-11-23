// Smaller copies of large stored images, for places that draw them small.
//
// The API's image worker writes WebP copies of every app cover at fixed widths
// (twinkle-api helpers/build/coverSizes.ts owns the rules; keep both in step):
//   https://d3jvoamd2k4p0s.cloudfront.net/thumbs/builds/<user>/<build>/<file>
//   -> .../thumbs/builds/sized/w<width>/<user>/<build>/<file>.webp
// A copy can be missing (an old cover before the backfill, or a cover saved a
// moment ago), so callers keep the original as src and drop the copies if one
// fails to load.
const COVER_PREFIX = 'https://d3jvoamd2k4p0s.cloudfront.net/thumbs/builds/';
const COVER_PATH_PATTERN = /^(\d+)\/(\d+)\/([A-Za-z0-9_-]+\.(?:png|jpe?g|webp))$/i;
export const SIZED_IMAGE_WIDTHS = [240, 480, 960] as const;

export function getSizedImageUrl(src: unknown, width: number) {
  const url = String(src || '').trim();
  if (!url.startsWith(COVER_PREFIX)) return '';
  const match = COVER_PATH_PATTERN.exec(url.slice(COVER_PREFIX.length));
  if (!match) return '';
  const [, userId, buildId, file] = match;
  return `${COVER_PREFIX}sized/w${width}/${userId}/${buildId}/${file}.webp`;
}

// srcset for an image that has sized copies, or '' when it has none.
export function getSizedImageSrcSet(src: unknown) {
  if (!getSizedImageUrl(src, SIZED_IMAGE_WIDTHS[0])) return '';
  return SIZED_IMAGE_WIDTHS.map(
    (width) => `${getSizedImageUrl(src, width)} ${width}w`
  ).join(', ');
}
