import { CALLING_CODES } from './phone';

// The countries a registrant can live in: every ISO 3166-1 code (the same
// list as the phone codes), names in the page's language. The registrant
// form only offers these, and the registrar takes these.
export const COUNTRY_CODES: string[] = Object.keys(CALLING_CODES);

// Shown first in the list (where most Twinkle families live).
export const POPULAR_COUNTRIES = ['KR', 'US', 'CA', 'GB', 'AU', 'NZ', 'JP', 'CN', 'TW', 'HK', 'SG', 'PH', 'VN'];

export function isKnownCountry(code: string) {
  return Boolean(CALLING_CODES[String(code || '').toUpperCase()]);
}

export function countryName(code: string, lang?: string) {
  try {
    const page = lang || (typeof document !== 'undefined' ? document.documentElement.lang : '') || 'en';
    return new Intl.DisplayNames([page, 'en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

// Names people (and browsers' autofill) use for a country besides its
// English and Korean names.
const COUNTRY_ALIASES: Record<string, string[]> = {
  KR: ['south korea', 'korea', 'korea, republic of', 'republic of korea', 'korea (south)', 'rok', '한국', '대한민국', '남한'],
  KP: ['north korea', "korea, democratic people's republic of", '북한'],
  US: ['us', 'usa', 'u.s.', 'u.s.a.', 'united states of america', 'america', '미국'],
  GB: ['uk', 'u.k.', 'britain', 'great britain', 'england', 'scotland', 'wales', 'northern ireland', '영국'],
  JP: ['japan', '일본'],
  CN: ['china', "people's republic of china", 'prc', '중국'],
  TW: ['taiwan', 'republic of china', '대만', '타이완'],
  HK: ['hong kong', 'hong kong sar', '홍콩'],
  CA: ['canada', '캐나다'],
  AU: ['australia', '호주'],
  NZ: ['new zealand', '뉴질랜드'],
  VN: ['vietnam', 'viet nam', '베트남'],
  PH: ['philippines', '필리핀'],
  SG: ['singapore', '싱가포르'],
  DE: ['germany', 'deutschland', '독일'],
  FR: ['france', '프랑스'],
  RU: ['russia', 'russian federation', '러시아'],
  CZ: ['czechia', 'czech republic'],
  TR: ['turkey', 'türkiye', 'turkiye', '튀르키예', '터키'],
  CI: ["cote d'ivoire", "côte d'ivoire", 'ivory coast'],
  AE: ['uae', 'united arab emirates'],
  NL: ['holland', 'netherlands', 'the netherlands']
};

function normalizeCountryText(value: string) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

let countryIndex: Array<{ code: string; names: string[] }> | null = null;
function index() {
  if (countryIndex) return countryIndex;
  countryIndex = COUNTRY_CODES.map((code) => {
    const names = new Set<string>([code.toLowerCase()]);
    for (const lang of ['en', 'ko']) {
      try {
        const name = new Intl.DisplayNames([lang], { type: 'region' }).of(code);
        if (name && name !== code) names.add(normalizeCountryText(name));
      } catch {
        // no names for this language
      }
    }
    for (const alias of COUNTRY_ALIASES[code] || []) names.add(normalizeCountryText(alias));
    return { code, names: [...names] };
  });
  return countryIndex;
}

// "South Korea", "Korea, Republic of", "대한민국", "kr" -> KR (exactly one
// country's name or code, as autofill or a person would write it), or ''.
export function matchCountry(value: string) {
  const text = normalizeCountryText(value);
  if (!text) return '';
  if (/^[a-z]{2}$/.test(text) && isKnownCountry(text)) return text.toUpperCase();
  const found = index().find((entry) => entry.names.includes(text));
  return found ? found.code : '';
}

// Countries for a search box: exact names first, then names that start
// with the text, then names that contain it.
export function searchCountries(query: string) {
  const text = normalizeCountryText(query);
  if (!text) return COUNTRY_CODES.slice();
  const ranked: Array<{ code: string; rank: number }> = [];
  for (const entry of index()) {
    let rank = 99;
    for (const name of entry.names) {
      if (name === text) rank = Math.min(rank, 0);
      else if (name.startsWith(text)) rank = Math.min(rank, 1);
      else if (name.split(/[\s,()'-]+/).some((word) => word.startsWith(text))) rank = Math.min(rank, 2);
      else if (text.length > 2 && name.includes(text)) rank = Math.min(rank, 3);
    }
    if (rank < 99) ranked.push({ code: entry.code, rank });
  }
  return ranked
    .sort((left, right) => left.rank - right.rank || countryName(left.code, 'en').localeCompare(countryName(right.code, 'en')))
    .map((item) => item.code);
}

// Autofill sometimes drops the country's name into "State or province"
// (a saved Korean address: State = "South Korea"). That value names a
// country, not a state: it moves to Country. Only a browser's autofill is
// repaired (`autofilled`: the value arrived whole, not typed or pasted), and
// only a country's own name: what a person types stays, and region names
// that are also the UK's nations (Scotland, Wales...) or states (Georgia,
// Jersey, two-letter codes) are never moved.
const STATE_NAMES_THAT_ARE_COUNTRIES = new Set([
  'GE', // Georgia (US state)
  'JE', // Jersey
  'PR', // Puerto Rico (US territory)
  'GU', // Guam (US territory)
  'VI', // U.S. Virgin Islands (US territory)
  'AS', // American Samoa (US territory)
  'MP', // Northern Mariana Islands (US territory)
  'MX', // Mexico (Estado de México)
  'LU', // Luxembourg (Luxembourg province, Belgium)
  'PA', // Panama (Panamá province)
  'GT', // Guatemala (Guatemala department)
  'GF', // French Guiana (France)
  'GP', // Guadeloupe (France)
  'MQ', // Martinique (France)
  'RE', // Réunion (France)
  'YT'  // Mayotte (France)
]);
const REGION_ALIASES = new Set(['england', 'scotland', 'wales', 'northern ireland']);
export function countryInStateField(state: string, { autofilled = false }: { autofilled?: boolean } = {}) {
  if (!autofilled) return '';
  if (REGION_ALIASES.has(normalizeCountryText(state))) return '';
  const code = matchCountry(state);
  if (!code || STATE_NAMES_THAT_ARE_COUNTRIES.has(code)) return '';
  // a two-letter state code (CA, WA, IN...) is a state, not a country
  if (/^[a-z]{2}$/i.test(String(state || '').trim())) return '';
  return code;
}

function isElementAutofilled(target: EventTarget | null) {
  const el = target as Element | null;
  if (!el || typeof el.matches !== 'function') return false;
  try {
    return el.matches(':autofill') || el.matches(':-webkit-autofill');
  } catch {
    try {
      return el.matches(':-webkit-autofill');
    } catch {
      return false;
    }
  }
}

// A change the browser made via autofill, not typing, deleting, pasting, or
// mobile keyboard autocorrect. Chrome/Firefox autofill sends no inputType;
// Safari sends insertReplacementText (which mobile predictive keyboards and
// spellcheck also send on the focused input, so require :autofill or an
// unfocused form-wide fill).
export function isAutofillChange(event?: Event | null) {
  if (!event) return false;
  const inputType = (event as InputEvent).inputType;
  if (!inputType) return true;
  if (inputType !== 'insertReplacementText') return false;
  const target = event.target;
  if (isElementAutofilled(target)) return true;
  if (typeof document !== 'undefined' && target && document.activeElement !== target) {
    return true;
  }
  return false;
}

// Countries where the address doesn't need a state or province (the city
// is enough, e.g. Seoul). The registrar still wants one, so the city is
// sent in its place when it's left empty.
export const STATE_OPTIONAL = new Set(['KR', 'SG', 'HK', 'MO', 'GB', 'IE', 'NZ']);
export function stateOrCity(country: string, state: string, city: string) {
  const value = String(state || '').trim();
  if (value) return value;
  return STATE_OPTIONAL.has(String(country || '').toUpperCase()) ? String(city || '').trim() : '';
}

// Time zones and the country they mean. A zone pins the country better
// than the browser language (an English browser in Seoul is still in
// Korea). A zone that isn't listed, or that several countries share, falls
// back to the browser language's region.
const ZONE_COUNTRIES: Record<string, string> = {
  // Asia
  'Asia/Seoul': 'KR', 'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Urumqi': 'CN',
  'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'MO', 'Asia/Taipei': 'TW', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY',
  'Asia/Kuching': 'MY', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Manila': 'PH',
  'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Kathmandu': 'NP', 'Asia/Colombo': 'LK', 'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM',
  'Asia/Tehran': 'IR', 'Asia/Baghdad': 'IQ', 'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL', 'Asia/Amman': 'JO',
  'Asia/Beirut': 'LB', 'Asia/Damascus': 'SY', 'Asia/Tashkent': 'UZ', 'Asia/Almaty': 'KZ', 'Asia/Bishkek': 'KG',
  'Asia/Ulaanbaatar': 'MN', 'Asia/Yangon': 'MM', 'Asia/Phnom_Penh': 'KH', 'Asia/Vientiane': 'LA', 'Asia/Pyongyang': 'KP',
  'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM', 'Asia/Baku': 'AZ', 'Asia/Kabul': 'AF', 'Asia/Brunei': 'BN',
  'Asia/Thimphu': 'BT', 'Asia/Dili': 'TL', 'Asia/Vladivostok': 'RU', 'Asia/Novosibirsk': 'RU', 'Asia/Yekaterinburg': 'RU',
  // Europe
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Lisbon': 'PT', 'Europe/Madrid': 'ES', 'Europe/Paris': 'FR',
  'Europe/Brussels': 'BE', 'Europe/Amsterdam': 'NL', 'Europe/Luxembourg': 'LU', 'Europe/Berlin': 'DE', 'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT', 'Europe/Rome': 'IT', 'Europe/Prague': 'CZ', 'Europe/Warsaw': 'PL', 'Europe/Budapest': 'HU',
  'Europe/Bratislava': 'SK', 'Europe/Ljubljana': 'SI', 'Europe/Zagreb': 'HR', 'Europe/Belgrade': 'RS', 'Europe/Sofia': 'BG',
  'Europe/Bucharest': 'RO', 'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA',
  'Europe/Moscow': 'RU', 'Europe/Minsk': 'BY', 'Europe/Vilnius': 'LT', 'Europe/Riga': 'LV', 'Europe/Tallinn': 'EE',
  'Europe/Helsinki': 'FI', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Malta': 'MT',
  'Europe/Chisinau': 'MD', 'Europe/Monaco': 'MC', 'Europe/Andorra': 'AD', 'Europe/Sarajevo': 'BA', 'Europe/Skopje': 'MK',
  'Europe/Tirane': 'AL', 'Europe/Podgorica': 'ME', 'Atlantic/Reykjavik': 'IS', 'Atlantic/Canary': 'ES', 'Atlantic/Azores': 'PT',
  // The Americas
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Phoenix': 'US', 'America/Anchorage': 'US', 'America/Detroit': 'US', 'America/Boise': 'US',
  'America/Indiana/Indianapolis': 'US', 'America/Kentucky/Louisville': 'US', 'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA',
  'America/Halifax': 'CA', 'America/St_Johns': 'CA', 'America/Regina': 'CA', 'America/Montreal': 'CA',
  'America/Mexico_City': 'MX', 'America/Tijuana': 'MX', 'America/Monterrey': 'MX', 'America/Cancun': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Manaus': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR', 'America/Santiago': 'CL', 'America/Bogota': 'CO',
  'America/Lima': 'PE', 'America/Caracas': 'VE', 'America/Montevideo': 'UY', 'America/Asuncion': 'PY', 'America/La_Paz': 'BO',
  'America/Guayaquil': 'EC', 'America/Panama': 'PA', 'America/Costa_Rica': 'CR', 'America/Guatemala': 'GT',
  'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN', 'America/Managua': 'NI', 'America/Havana': 'CU',
  'America/Santo_Domingo': 'DO', 'America/Puerto_Rico': 'PR', 'America/Jamaica': 'JM', 'America/Port-au-Prince': 'HT',
  // Africa
  'Africa/Cairo': 'EG', 'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Casablanca': 'MA',
  'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Africa/Accra': 'GH', 'Africa/Addis_Ababa': 'ET', 'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kampala': 'UG', 'Africa/Kinshasa': 'CD', 'Africa/Khartoum': 'SD', 'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI',
  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU', 'Australia/Hobart': 'AU', 'Australia/Darwin': 'AU', 'Pacific/Auckland': 'NZ',
  'Pacific/Fiji': 'FJ', 'Pacific/Guam': 'GU', 'Pacific/Port_Moresby': 'PG', 'Pacific/Tongatapu': 'TO', 'Pacific/Apia': 'WS'
};

// The registrant's country guess (they can change it): the time zone,
// then the browser language's region, then Korea.
export function guessCountry(zone?: string, language?: string) {
  let resolvedZone = zone;
  if (resolvedZone === undefined) {
    try {
      resolvedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      resolvedZone = '';
    }
  }
  if (resolvedZone && ZONE_COUNTRIES[resolvedZone]) return ZONE_COUNTRIES[resolvedZone];
  try {
    const tag = language ?? (typeof navigator !== 'undefined' ? navigator.language : '');
    const region = tag ? new Intl.Locale(tag).maximize().region || '' : '';
    if (isKnownCountry(region)) return region;
  } catch {
    // fall through
  }
  return 'KR';
}
