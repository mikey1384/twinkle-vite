// The device family THIS browser is running on, in the taxonomy the server uses
// for saved push subscriptions.
//
// MIRRORED from twinkle-api/helpers/pushDevicePlatform.ts, which classifies the
// user agent a subscription was saved with. Keep the two in step: comparing the
// value from here against `pushDevicePlatforms` in the chat notification
// settings snapshot is how a context with no subscription of its own (an iOS
// Safari tab) discovers that the device it is running on receives push through
// a sibling context (the installed Home Screen app).
export type PushDevicePlatform =
  | 'iphone'
  | 'ipad'
  | 'android'
  | 'mac'
  | 'windows'
  | 'other';

export function getThisDevicePushPlatform(): PushDevicePlatform {
  if (typeof navigator === 'undefined') return 'other';
  const userAgent = navigator.userAgent || '';
  if (/iPhone|iPod/i.test(userAgent)) return 'iphone';
  if (/iPad/i.test(userAgent)) return 'ipad';
  // iPadOS reports a Macintosh user agent; touch support is what separates it
  // from a real Mac. Classifying it as 'ipad' rather than 'mac' keeps an iPad
  // from matching a Mac's subscription — the cost is that a subscription this
  // iPad saved in desktop-site mode was stored as 'mac' and will not match
  // back, so it reads as "another device". Under-claiming is the safe
  // direction here; over-claiming would promise notifications that never come.
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'ontouchend' in document ? 'ipad' : 'mac';
  }
  if (/Android/i.test(userAgent)) return 'android';
  if (/Windows/i.test(userAgent)) return 'windows';
  return 'other';
}
