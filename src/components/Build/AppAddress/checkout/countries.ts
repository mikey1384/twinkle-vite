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
