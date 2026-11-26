import type { AddressText } from '../text';
import { STATE_OPTIONAL, isKnownCountry } from './countries';

// The app-address flow's data shapes and plain helpers (shared by the
// checkout screens, the address menu and the parent's page).

export interface DomainIdeaView {
  domain: string;
  priceCents: number;
  breakdown: { registryCents: number; cardFeeCents: number; twinkleCents: number };
  approxKrw: number | null;
  best?: boolean;
}

export interface DnsRecordView {
  type: string;
  host: string;
  fullName: string;
  value: string;
  note: string | null;
}

export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export const krw = (won: number) => `₩${won.toLocaleString('en-US')}`;

export interface OwnerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export function emptyOwnerDetails(country = 'KR'): OwnerDetails {
  return { firstName: '', lastName: '', email: '', phone: '', address1: '', city: '', state: '', zip: '', country };
}

export function ownerDetailsProblem(t: AddressText, details: OwnerDetails) {
  const required: Array<keyof OwnerDetails> = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zip', 'country'];
  const needed = STATE_OPTIONAL.has(details.country.toUpperCase()) ? required.filter((key) => key !== 'state') : required;
  if (needed.some((key) => !details[key].trim())) return t.fillAll;
  if (!/^\+[1-9][\d\s.\-()]{7,20}$/.test(details.phone.trim())) return t.phoneNeedsPlus;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) return t.fillAll;
  if (!isKnownCountry(details.country)) return t.fillAll;
  return '';
}

export interface DomainOrderView {
  domain: string;
  priceCents: number;
  status: string;
  stage: 'paying' | 'setting_up' | 'support' | 'live' | 'refunding' | 'refunded' | 'stopped';
  failureReason: string | null;
}

// The member's profile real name as registrant first / last name: Hangul
// names put the family name first ("김민아" -> 김 + 민아, "김 민아" too);
// other names put it last ("Mikey Lee", "Mary Ann Smith" -> Mary Ann +
// Smith). One word is a first name. They can change either.
export function splitRealName(realName: string): { firstName: string; lastName: string } {
  const name = String(realName || '').trim().replace(/\s+/g, ' ');
  if (!name) return { firstName: '', lastName: '' };
  if (/^[\uAC00-\uD7A3 ]+$/.test(name)) {
    const parts = name.split(' ');
    if (parts.length > 1) return { lastName: parts[0], firstName: parts.slice(1).join(' ') };
    if (name.length < 2) return { firstName: name, lastName: '' };
    return { lastName: name.slice(0, 1), firstName: name.slice(1) };
  }
  const parts = name.split(' ');
  if (parts.length === 1) return { firstName: name, lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}
