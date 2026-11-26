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
