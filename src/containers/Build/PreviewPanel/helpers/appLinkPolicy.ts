// Twinkle.app.openLink (`app:open-link`): the Twinkle page's own check of a
// link an app asks to open (Mikey 11-25). The SDK in the frame checks the
// same rules first (twinkle-api helpers/build/preview/sdk/appLinkScript.ts),
// but the frame runs the app's code, so this page decides again:
//  - only from the viewer's tap in the app;
//  - only full http(s) addresses, no user name or password, at most 2048
//    characters; a bare "www." address is read as https, as posted links are
//    (helpers/referenceLinkHelpers.ts getExternalLinkUrl);
//  - a Twinkle content page opens in place, exactly like openContent; any
//    other Twinkle address, and the app's own preview pages, are refused;
//  - everything else is an outside site: the sheet names its real host,
//    decoded from punycode, and warns when one name mixes alphabets.
// Twinkle has no list of blocked sites for posted links (they open directly
// from profiles and comments), so there is none to reuse here; the sheet is
// the check, and the viewer always sees where the link goes.
import {
  isTwinklePublicHost,
  normalizeTwinkleContentNavigationUrl
} from './twinkleContentNavigation';

export const APP_LINK_MAX_LENGTH = 2048;

export interface AppLinkSite {
  // what the sheet shows: the host, punycode decoded, with its port if any
  displayHost: string;
  // the address-bar form when it differs (an international name)
  asciiHost: string | null;
  // one part of the name mixes alphabets (e.g. Latin with Cyrillic)
  mixedScripts: boolean;
}

export type AppLinkDecision =
  | { allowed: true; kind: 'twinkle'; url: string }
  | { allowed: true; kind: 'external'; url: string; site: AppLinkSite }
  | { allowed: false; code: string; message: string };

function refuse(code: string, message: string): AppLinkDecision {
  return { allowed: false, code, message };
}

export function authorizeAppLinkRequest({
  currentOrigin,
  target,
  userActivation,
  isAppPreviewUrl
}: {
  currentOrigin: string;
  target: unknown;
  userActivation: { isActive?: boolean } | null | undefined;
  // the app's own Build preview pages (they carry preview tokens)
  isAppPreviewUrl?: (url: URL) => boolean;
}): AppLinkDecision {
  if (userActivation?.isActive !== true) {
    return refuse(
      'USER_ACTIVATION_REQUIRED',
      'Links can only be opened from a tap or click.'
    );
  }
  let raw = typeof target === 'string' ? target.trim() : '';
  if (!raw) return refuse('INVALID_LINK_TARGET', 'openLink needs a web address.');
  if (raw.length > APP_LINK_MAX_LENGTH) {
    return refuse('LINK_TOO_LONG', 'This web address is too long to open.');
  }
  if (/^www\./i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return refuse(
      'INVALID_LINK_TARGET',
      'openLink needs a full web address that starts with https://'
    );
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return refuse(
      'LINK_SCHEME_NOT_ALLOWED',
      'Only https:// and http:// links can be opened.'
    );
  }
  if (url.username || url.password) {
    return refuse(
      'LINK_HAS_CREDENTIALS',
      'Links with a user name or password cannot be opened.'
    );
  }
  if (url.href.length > APP_LINK_MAX_LENGTH) {
    return refuse('LINK_TOO_LONG', 'This web address is too long to open.');
  }
  if (isAppPreviewUrl?.(url)) {
    return refuse(
      'INVALID_LINK_TARGET',
      'This is a page of this app: use Twinkle.app.navigate for it.'
    );
  }
  let isCurrentOrigin = false;
  try {
    isCurrentOrigin = url.origin === new URL(currentOrigin).origin;
  } catch {
    isCurrentOrigin = false;
  }
  if (isCurrentOrigin || isTwinklePublicHost(url.hostname)) {
    const contentUrl = normalizeTwinkleContentNavigationUrl({
      currentOrigin,
      target: url.href
    });
    if (!contentUrl) {
      return refuse(
        'UNSUPPORTED_TWINKLE_LINK',
        'Only Twinkle content pages (posts, apps, profiles and the like) can be opened from an app.'
      );
    }
    return { allowed: true, kind: 'twinkle', url: contentUrl };
  }
  return { allowed: true, kind: 'external', url: url.href, site: describeAppLinkSite(url) };
}

export function describeAppLinkSite(url: URL): AppLinkSite {
  const labels = url.hostname.split('.');
  let mixedScripts = false;
  let undecodable = false;
  const decoded = labels.map((label) => {
    if (!/^xn--/i.test(label)) return label;
    const unicode = decodePunycodeLabel(label.slice(4));
    if (unicode === null) {
      undecodable = true;
      return label;
    }
    if (labelMixesScripts(unicode)) mixedScripts = true;
    return unicode;
  });
  const port = url.port ? `:${url.port}` : '';
  const displayHost = `${decoded.join('.')}${port}`;
  return {
    displayHost,
    asciiHost: displayHost !== url.host ? url.host : null,
    // a name the browser accepted but that does not decode is not trusted
    mixedScripts: mixedScripts || undecodable
  };
}

// --- punycode (RFC 3492), decode only -------------------------------------

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const MAX_CODE_POINT = 0x10ffff;

function adapt(delta: number, numPoints: number, firstTime: boolean) {
  let k = 0;
  delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  for (; delta > ((BASE - T_MIN) * T_MAX) >> 1; k += BASE) {
    delta = Math.floor(delta / (BASE - T_MIN));
  }
  return Math.floor(k + ((BASE - T_MIN + 1) * delta) / (delta + SKEW));
}

function digitValue(codePoint: number) {
  if (codePoint >= 0x30 && codePoint <= 0x39) return codePoint - 22; // 0-9 -> 26-35
  if (codePoint >= 0x41 && codePoint <= 0x5a) return codePoint - 0x41; // A-Z
  if (codePoint >= 0x61 && codePoint <= 0x7a) return codePoint - 0x61; // a-z
  return BASE;
}

export function decodePunycodeLabel(input: string): string | null {
  const output: number[] = [];
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  const basicEnd = input.lastIndexOf('-');
  for (let j = 0; j < Math.max(basicEnd, 0); j += 1) {
    const code = input.charCodeAt(j);
    if (code >= 0x80) return null;
    output.push(code);
  }
  for (let index = basicEnd > 0 ? basicEnd + 1 : 0; index < input.length; ) {
    const oldi = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (index >= input.length) return null;
      const digit = digitValue(input.charCodeAt(index++));
      if (digit >= BASE) return null;
      i += digit * w;
      if (i > MAX_CODE_POINT * 64) return null;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
    }
    const length = output.length + 1;
    bias = adapt(i - oldi, length, oldi === 0);
    n += Math.floor(i / length);
    i %= length;
    if (n > MAX_CODE_POINT) return null;
    output.splice(i, 0, n);
    i += 1;
  }
  try {
    return String.fromCodePoint(...output);
  } catch {
    return null;
  }
}

// --- mixed alphabets ---------------------------------------------------------

// Chinese, Japanese and Korean names mix their own scripts (and Latin) by
// design, so they count as one group. Latin with Cyrillic or Greek, the
// usual look-alike trick (аpple.com with a Cyrillic а), does not.
const SCRIPT_GROUPS: Array<[RegExp, string]> = [
  [/\p{Script=Latin}/u, 'Latin'],
  [/\p{Script=Cyrillic}/u, 'Cyrillic'],
  [/\p{Script=Greek}/u, 'Greek'],
  [/\p{Script=Armenian}/u, 'Armenian'],
  [/\p{Script=Hebrew}/u, 'Hebrew'],
  [/\p{Script=Arabic}/u, 'Arabic'],
  [/\p{Script=Georgian}/u, 'Georgian'],
  [/\p{Script=Thai}/u, 'Thai'],
  [/\p{Script=Devanagari}/u, 'Devanagari'],
  [/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}]/u, 'CJK']
];

export function labelMixesScripts(label: string) {
  const groups = new Set<string>();
  for (const character of label) {
    if (!/\p{L}/u.test(character)) continue;
    const match = SCRIPT_GROUPS.find(([pattern]) => pattern.test(character));
    groups.add(match ? match[1] : `other:${character}`);
  }
  if (groups.size <= 1) return false;
  if (groups.size === 2 && groups.has('Latin') && groups.has('CJK')) return false;
  return true;
}

// --- one sheet at a time, a few per minute -------------------------------

export const APP_LINK_SHEETS_PER_MINUTE = 5;
// after a sheet closes, the same app waits this long before the next one
export const APP_LINK_COOLDOWN_MS = 1500;

export function createAppLinkGate({
  perMinute = APP_LINK_SHEETS_PER_MINUTE,
  cooldownMs = APP_LINK_COOLDOWN_MS
}: { perMinute?: number; cooldownMs?: number } = {}) {
  let openKey: string | null = null;
  const shownAt = new Map<string, number[]>();
  const closedAt = new Map<string, number>();
  return {
    begin(
      key: string,
      now: number
    ): { allowed: true } | { allowed: false; code: string; message: string } {
      if (openKey !== null) {
        return {
          allowed: false,
          code: 'LINK_CONFIRM_IN_PROGRESS',
          message: 'Another link is already waiting for the viewer.'
        };
      }
      const recent = (shownAt.get(key) || []).filter((at) => now - at < 60_000);
      const lastClosed = closedAt.get(key);
      if (
        recent.length >= perMinute ||
        (lastClosed !== undefined && now - lastClosed < cooldownMs)
      ) {
        shownAt.set(key, recent);
        return {
          allowed: false,
          code: 'LINK_RATE_LIMITED',
          message: 'Too many links in a row. Wait a moment and try again.'
        };
      }
      recent.push(now);
      shownAt.set(key, recent);
      openKey = key;
      return { allowed: true };
    },
    end(key: string, now: number) {
      if (openKey === key) openKey = null;
      closedAt.set(key, now);
    }
  };
}
