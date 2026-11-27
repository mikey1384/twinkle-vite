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

export function normalizeOwnerDetails(raw: unknown, fallbackCountry = 'KR'): OwnerDetails {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    firstName: String(source.firstName ?? ''),
    lastName: String(source.lastName ?? ''),
    email: String(source.email ?? ''),
    phone: String(source.phone ?? ''),
    address1: String(source.address1 ?? ''),
    city: String(source.city ?? ''),
    state: String(source.state ?? ''),
    zip: String(source.zip ?? ''),
    country: String(source.country || '').trim() || fallbackCountry
  };
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

// The purchase progress tracker (GET /build/:id/domain-progress):
// Paid → Registered → Secure connection → Live → Email confirmed.
export type ProgressStepKey = 'paid' | 'registered' | 'secure' | 'live' | 'email';
export interface DomainProgressView {
  orderId: number;
  domain: string;
  stage: 'setting_up' | 'one_step_left' | 'done' | 'support' | 'refunding' | 'refunded';
  steps: Array<{ key: ProgressStepKey; state: 'done' | 'current' | 'todo' | 'problem' }>;
  verification:
    | { state: 'verified'; verifiedAt: number }
    | { state: 'pending'; verifyBy: number; daysLeft: number; canResend: boolean; resendEligibleAt: number }
    | null;
}

// how far along (0..1) for the chip's bar: done steps, plus half the current
export function progressFraction(progress: DomainProgressView) {
  if (!progress.steps.length) return 0;
  const done = progress.steps.filter((step) => step.state === 'done').length;
  const current = progress.steps.some((step) => step.state === 'current') ? 0.5 : 0;
  return Math.min(1, (done + current) / progress.steps.length);
}

const PROGRESS_TRACKED_ORDER_STAGES = new Set<DomainOrderView['stage']>([
  'setting_up',
  'live',
  'support',
  'refunding'
]);

// Whether a loadDomainOrder response should trigger refreshDomainProgress:
// on the first response, refresh whenever the order is already past payment
// (so an initial concurrent domain-progress poll that raced ahead and cached
// null while still paying cannot strand the screen) or on a manual retry;
// on later polls, refresh whenever status or stage changes.
export function shouldRefreshOrderProgress({
  orderAttempt,
  lastStatus,
  lastStage,
  nextOrder
}: {
  orderAttempt: number;
  lastStatus: string;
  lastStage: string;
  nextOrder: Pick<DomainOrderView, 'status' | 'stage'>;
}): boolean {
  if (!lastStatus && !lastStage) {
    return orderAttempt > 0 || PROGRESS_TRACKED_ORDER_STAGES.has(nextOrder.stage);
  }
  return lastStatus !== nextOrder.status || lastStage !== nextOrder.stage;
}

// Auto-submit a 6-digit email confirmation code only when the user actually
// changed the code to a new 6-digit value that hasn't already been submitted.
export function shouldAutoVerifyCode(
  nextDigits: string,
  prevCode: string,
  lastSubmittedCode: string,
  verifying: boolean
) {
  return (
    !verifying &&
    nextDigits.length === 6 &&
    nextDigits !== prevCode &&
    nextDigits !== lastSubmittedCode
  );
}

export interface ScopedBuildData<T> {
  buildId: number;
  userId: number | null | undefined;
  data: T;
}

// Returns cached build-scoped data only when it belongs to the active build
// and account, so switching between cached builds never reads stale info on
// the first render.
export function readScopedBuildData<T>(
  scoped: ScopedBuildData<T> | null,
  buildId: number,
  userId: number | null | undefined
): T | null {
  if (!scoped || scoped.buildId !== buildId || scoped.userId !== userId) return null;
  return scoped.data;
}

// Generation & in-flight lock for the owner email verification code flow.
// Starting a new code send bumps the generation so any in-flight verify
// attempt is invalidated and cannot overwrite state or collapse the code box.
export function createEmailCodeGuard() {
  let gen = 0;
  let sendInFlightGen: number | null = null;
  let verifyInFlightGen: number | null = null;

  return {
    invalidate() {
      gen += 1;
      sendInFlightGen = null;
      verifyInFlightGen = null;
      return gen;
    },
    beginSend(): number | null {
      if (sendInFlightGen === gen) return null;
      gen += 1;
      sendInFlightGen = gen;
      verifyInFlightGen = null;
      return gen;
    },
    endSend(token: number) {
      if (sendInFlightGen === token) sendInFlightGen = null;
    },
    beginVerify(): number | null {
      if (sendInFlightGen === gen || verifyInFlightGen === gen) return null;
      verifyInFlightGen = gen;
      return gen;
    },
    endVerify(token: number) {
      if (verifyInFlightGen === token) verifyInFlightGen = null;
    },
    isCurrent(token: number) {
      return gen === token;
    }
  };
}

// Two-syllable Korean family names. Only a four-syllable name is read this
// way ("남궁민수" -> 남궁 + 민수); three syllables stay one + two, since
// "황보람" or "선우진" are as often 황 + 보람, 선 + 우진.
const KOREAN_COMPOUND_SURNAMES = new Set(['남궁', '황보', '제갈', '선우', '독고', '사공', '서문', '동방', '어금', '망절', '소봉', '장곡']);

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
    if (name.length === 4 && KOREAN_COMPOUND_SURNAMES.has(name.slice(0, 2))) {
      return { lastName: name.slice(0, 2), firstName: name.slice(2) };
    }
    return { lastName: name.slice(0, 1), firstName: name.slice(1) };
  }
  const parts = name.split(' ');
  if (parts.length === 1) return { firstName: name, lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}
