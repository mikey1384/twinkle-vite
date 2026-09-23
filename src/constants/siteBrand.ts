// lumine.network serves this same site, but visitors arriving through it
// should see Lumine everywhere: tab title, icon, and any copy that names the
// site. index.html applies the same host check for the pre-render title,
// favicon, and manifest. SDK identifiers (window.Twinkle), the reward unit
// "Twinkle", and Twinkle English Academy (the real-world school) keep their
// names on both hosts.
export const isLumineHost =
  typeof window !== 'undefined' &&
  /(^|\.)lumine\.network$/.test(window.location.hostname);

export const SITE_NAME = isLumineHost ? 'Lumine' : 'Twinkle';
export const SITE_FULL_NAME = isLumineHost
  ? 'Lumine Network'
  : 'Twinkle Network';
export const SITE_URL_LABEL = isLumineHost
  ? 'www.lumine.network'
  : 'www.twin-kle.com';
