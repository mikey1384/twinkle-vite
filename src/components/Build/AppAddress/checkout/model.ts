import type { AddressText } from '../text';
import { isKnownCountry } from './countries';

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

const OWNER_TEXT_KEYS: Array<keyof OwnerDetails> = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'address1',
  'city',
  'state',
  'zip'
];

export function hasTypedOwnerDetails(details: OwnerDetails, phoneNational = '') {
  return (
    OWNER_TEXT_KEYS.some((key) => String(details[key] || '').trim().length > 0) ||
    String(phoneNational || '').trim().length > 0
  );
}

export function ownerDetailsProblem(t: AddressText, details: OwnerDetails) {
  const required: Array<keyof OwnerDetails> = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zip', 'country'];
  if (required.some((key) => !details[key].trim())) return t.fillAll;
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
