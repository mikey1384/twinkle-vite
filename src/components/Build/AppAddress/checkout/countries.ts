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

// Phone country codes for the list above (the phone field's prefix).
export const DIAL_CODES: Record<string, string> = {
  KR: '82',
  US: '1',
  CA: '1',
  GB: '44',
  AU: '61',
  NZ: '64',
  JP: '81',
  CN: '86',
  TW: '886',
  HK: '852',
  SG: '65',
  PH: '63',
  VN: '84',
  TH: '66',
  MY: '60',
  ID: '62',
  IN: '91',
  DE: '49',
  FR: '33',
  ES: '34',
  IT: '39',
  NL: '31',
  SE: '46',
  BR: '55',
  MX: '52'
};

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
