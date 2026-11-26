// The registrant's phone: a calling code (chosen by country) plus the
// number as the person typed it, turned into exactly one E.164 number
// (+821012345678), the format the API's registrant check takes
// (twinkle-api registrar.ts E164 = /^\+[1-9]\d{7,14}$/). Pure functions, so
// both checkout forms share them and tests pin them.

// Every ISO 3166-1 country or territory with its calling code.
export const CALLING_CODES: Record<string, string> = {
  AD: '376', AE: '971', AF: '93', AG: '1', AI: '1', AL: '355', AM: '374', AO: '244', AR: '54', AS: '1',
  AT: '43', AU: '61', AW: '297', AX: '358', AZ: '994', BA: '387', BB: '1', BD: '880', BE: '32', BF: '226',
  BG: '359', BH: '973', BI: '257', BJ: '229', BL: '590', BM: '1', BN: '673', BO: '591', BQ: '599', BR: '55',
  BS: '1', BT: '975', BW: '267', BY: '375', BZ: '501', CA: '1', CC: '61', CD: '243', CF: '236', CG: '242',
  CH: '41', CI: '225', CK: '682', CL: '56', CM: '237', CN: '86', CO: '57', CR: '506', CU: '53', CV: '238',
  CW: '599', CX: '61', CY: '357', CZ: '420', DE: '49', DJ: '253', DK: '45', DM: '1', DO: '1', DZ: '213',
  EC: '593', EE: '372', EG: '20', EH: '212', ER: '291', ES: '34', ET: '251', FI: '358', FJ: '679', FK: '500',
  FM: '691', FO: '298', FR: '33', GA: '241', GB: '44', GD: '1', GE: '995', GF: '594', GG: '44', GH: '233',
  GI: '350', GL: '299', GM: '220', GN: '224', GP: '590', GQ: '240', GR: '30', GT: '502', GU: '1', GW: '245',
  GY: '592', HK: '852', HN: '504', HR: '385', HT: '509', HU: '36', ID: '62', IE: '353', IL: '972', IM: '44',
  IN: '91', IO: '246', IQ: '964', IR: '98', IS: '354', IT: '39', JE: '44', JM: '1', JO: '962', JP: '81',
  KE: '254', KG: '996', KH: '855', KI: '686', KM: '269', KN: '1', KP: '850', KR: '82', KW: '965', KY: '1',
  KZ: '7', LA: '856', LB: '961', LC: '1', LI: '423', LK: '94', LR: '231', LS: '266', LT: '370', LU: '352',
  LV: '371', LY: '218', MA: '212', MC: '377', MD: '373', ME: '382', MF: '590', MG: '261', MH: '692', MK: '389',
  ML: '223', MM: '95', MN: '976', MO: '853', MP: '1', MQ: '596', MR: '222', MS: '1', MT: '356', MU: '230',
  MV: '960', MW: '265', MX: '52', MY: '60', MZ: '258', NA: '264', NC: '687', NE: '227', NF: '672', NG: '234',
  NI: '505', NL: '31', NO: '47', NP: '977', NR: '674', NU: '683', NZ: '64', OM: '968', PA: '507', PE: '51',
  PF: '689', PG: '675', PH: '63', PK: '92', PL: '48', PM: '508', PN: '64', PR: '1', PS: '970', PT: '351',
  PW: '680', PY: '595', QA: '974', RE: '262', RO: '40', RS: '381', RU: '7', RW: '250', SA: '966', SB: '677',
  SC: '248', SD: '249', SE: '46', SG: '65', SH: '290', SI: '386', SJ: '47', SK: '421', SL: '232', SM: '378',
  SN: '221', SO: '252', SR: '597', SS: '211', ST: '239', SV: '503', SX: '1', SY: '963', SZ: '268', TC: '1',
  TD: '235', TG: '228', TH: '66', TJ: '992', TK: '690', TL: '670', TM: '993', TN: '216', TO: '676', TR: '90',
  TT: '1', TV: '688', TW: '886', TZ: '255', UA: '380', UG: '256', US: '1', UY: '598', UZ: '998', VA: '39',
  VC: '1', VE: '58', VG: '1', VI: '1', VN: '84', VU: '678', WF: '681', WS: '685', YE: '967', YT: '262',
  ZA: '27', ZM: '260', ZW: '263'
};

// For a pasted "+1 …" or "+44 …": the country a shared code means first.
const MAIN_COUNTRY: Record<string, string> = {
  '1': 'US', '7': 'RU', '39': 'IT', '44': 'GB', '47': 'NO', '61': 'AU', '64': 'NZ', '212': 'MA',
  '262': 'RE', '358': 'FI', '590': 'GP', '599': 'CW'
};

// Countries whose numbers keep their leading 0 after the calling code.
const KEEPS_LEADING_ZERO = new Set(['IT', 'SM', 'VA']);

const E164 = /^\+[1-9]\d{7,14}$/;

export interface PhoneDraft {
  // the country whose calling code is chosen (US and CA both mean +1)
  country: string;
  // the number as typed, without the calling code
  national: string;
}

export function callingCode(country: string) {
  return CALLING_CODES[String(country || '').toUpperCase()] || '';
}

// "+1 415 555 0100" or "0044 20 7946 0958" typed or pasted into the number
// field: the calling code it starts with (the longest one that exists, the
// chosen country first when the code is shared) and the rest.
export function splitInternational(raw: string, current: string): PhoneDraft | null {
  const text = String(raw || '').trim();
  const match = /^(?:\+|00)\s*([\d\s().-]+)$/.exec(text);
  if (!match) return null;
  const digits = match[1].replace(/\D/g, '');
  for (const length of [3, 2, 1]) {
    const code = digits.slice(0, length);
    if (digits.length <= length) continue;
    if (callingCode(current) === code) return { country: current, national: digits.slice(length) };
    const country = MAIN_COUNTRY[code] || Object.keys(CALLING_CODES).find((key) => CALLING_CODES[key] === code);
    if (country) return { country, national: digits.slice(length) };
  }
  return null;
}

// The national significant number: the digits, without the trunk prefix a
// local number starts with (0 in most places, 1 for an 11-digit number in
// +1, 8 for an 11-digit number in +7). Italy, San Marino and the Vatican
// keep their 0.
export function nationalDigits(country: string, national: string) {
  const code = callingCode(country);
  let digits = String(national || '').replace(/\D/g, '');
  if (code === '1' && digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  if (code === '7' && digits.length === 11 && digits.startsWith('8')) return digits.slice(1);
  if (!KEEPS_LEADING_ZERO.has(String(country || '').toUpperCase()) && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

// The one number the API receives, or '' while it isn't a full number yet.
export function toE164(draft: PhoneDraft) {
  const code = callingCode(draft.country);
  const digits = nationalDigits(draft.country, draft.national);
  if (!code || digits.length < 4) return '';
  const number = `+${code}${digits}`;
  return E164.test(number) ? number : '';
}

// A stored number (e.g. "+82 10 1234 5678" from an earlier answer) as a
// draft for the field.
export function draftFromPhone(phone: string, fallbackCountry: string): PhoneDraft {
  return splitInternational(phone, fallbackCountry) || { country: fallbackCountry, national: String(phone || '') };
}
