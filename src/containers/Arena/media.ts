import { cloudFrontURL } from '~/constants/defaultValues';

// Arena's pre-built media (listening recordings, exam pictures) is stored
// as keys under one arena/ folder, e.g. audio/suneung-eng/eng-03/4.mp3 or
// img/suneung-eng/eng-03-4.png. Local dev serves them from public/arena-media.
const MEDIA_BASE = import.meta.env.DEV
  ? '/arena-media/'
  : `${cloudFrontURL}/arena/`;

export function arenaMediaURL(key: string) {
  return `${MEDIA_BASE}${key.replace(/^\/+/, '')}`;
}
