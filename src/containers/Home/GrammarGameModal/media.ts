import { cloudFrontURL } from '~/constants/defaultValues';
import { GQ_MEDIA, GQ_MEDIA_PREFIX } from './media.generated';

// Grammar Quest's art and music URLs. The files live on the CDN under
// grammar-quest/v1/ with content-hashed names, cached forever (Mikey 10-07);
// the dev server serves the same files from public/gq-media (gitignored,
// filled by quest/media/build.mjs). `path` is the old public path, e.g.
// 'img/grammar-quest/levels/w1-flower-meadow.png'.
const BASE = import.meta.env.DEV
  ? '/gq-media/'
  : `${cloudFrontURL}/${GQ_MEDIA_PREFIX}/`;

export function gqMedia(path: string) {
  const file = GQ_MEDIA[path.replace(/^\//, '')];
  if (!file) {
    console.warn(`[grammar-quest] no media for ${path}`);
    return '';
  }
  return BASE + file;
}
