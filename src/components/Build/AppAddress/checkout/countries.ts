// Countries most Twinkle members live in first; "Other" takes any ISO code.
export const COUNTRIES: Array<[string, string]> = [
  ['KR', 'South Korea'],
  ['US', 'United States'],
  ['CA', 'Canada'],
  ['GB', 'United Kingdom'],
  ['AU', 'Australia'],
  ['NZ', 'New Zealand'],
  ['JP', 'Japan'],
  ['CN', 'China'],
  ['TW', 'Taiwan'],
  ['HK', 'Hong Kong'],
  ['SG', 'Singapore'],
  ['PH', 'Philippines'],
  ['VN', 'Vietnam'],
  ['TH', 'Thailand'],
  ['MY', 'Malaysia'],
  ['ID', 'Indonesia'],
  ['IN', 'India'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['NL', 'Netherlands'],
  ['SE', 'Sweden'],
  ['BR', 'Brazil'],
  ['MX', 'Mexico']
];


// Time zones that pin a country better than the browser language (an
// English browser in Seoul is still in Korea).
const ZONE_COUNTRIES: Record<string, string> = {
  'Asia/Seoul': 'KR',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Taipei': 'TW',
  'Asia/Hong_Kong': 'HK',
  'Asia/Singapore': 'SG',
  'Asia/Manila': 'PH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Bangkok': 'TH',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jakarta': 'ID',
  'Asia/Kolkata': 'IN',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Stockholm': 'SE',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA'
};

// The buyer's country guess for the form (they can change it): the time
// zone first, then the browser language's region, then Korea.
export function guessCountry() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (ZONE_COUNTRIES[zone]) return ZONE_COUNTRIES[zone];
    if (zone.startsWith('America/')) return 'US';
  } catch {
    // fall through
  }
  try {
    const region = new Intl.Locale(navigator.language).maximize().region || '';
    if (/^[A-Z]{2}$/.test(region)) return region;
  } catch {
    // fall through
  }
  return 'KR';
}
