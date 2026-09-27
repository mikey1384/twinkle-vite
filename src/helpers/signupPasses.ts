// Sign-up passes (Mikey, 2026-09-27): what lets someone join without the
// sign-up question, and the proof that their email was verified.
//
// - An invite pass: a guest who played a private room with a Twinkle user for
//   10 minutes gets one over the socket ('build_app_world_invite_pass'); a
//   Minecraft player a moderator vouched for gets a link with ?mcpass=. It's
//   kept in this browser until used (14 days at most).
// - An email ticket: a correct emailed code returns a short-lived ticket
//   that /user/signup needs; kept in memory for this page only.

export interface SignupInvite {
  token: string;
  inviterName?: string;
  source?: 'guest' | 'minecraft';
  minecraftName?: string;
  expiresAt?: number;
}

const INVITE_KEY = 'twinkle-signup-invite';
// the invite was just earned or followed: open straight to sign-up
let openToSignup = false;

export function storeSignupInvite(invite: SignupInvite) {
  if (!invite?.token) return;
  openToSignup = true;
  try {
    localStorage.setItem(INVITE_KEY, JSON.stringify(invite));
  } catch {
    // private windows: the invite still works for this visit
    memoryInvite = invite;
  }
}
let memoryInvite: SignupInvite | null = null;

export function getSignupInvite(): SignupInvite | null {
  try {
    const raw = localStorage.getItem(INVITE_KEY);
    const invite = raw ? JSON.parse(raw) : memoryInvite;
    if (!invite?.token) return null;
    if (invite.expiresAt && invite.expiresAt * 1000 < Date.now()) {
      clearSignupInvite();
      return null;
    }
    return invite;
  } catch {
    return memoryInvite;
  }
}

export function clearSignupInvite() {
  memoryInvite = null;
  try {
    localStorage.removeItem(INVITE_KEY);
  } catch {
    // nothing stored
  }
  clearGuardianConsent();
}

// A parent's or guardian's consent (invited children under 14): the request
// the child sent, kept beside the invite so closing the page and coming back
// resumes the waiting screen. The secret only reads this request's status and
// lets the sign-up use it once approved; it can't approve anything.
export interface StoredGuardianConsent {
  inviteToken: string;
  consentId: number;
  secret: string;
  guardianEmail: string;
  childFirstName: string;
  birthYear: number;
  birthMonth: number;
}

const CONSENT_KEY = 'twinkle-signup-guardian-consent';
let memoryConsent: StoredGuardianConsent | null = null;

export function storeGuardianConsent(consent: StoredGuardianConsent) {
  memoryConsent = consent;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // private windows: it still works for this visit
  }
}

/** The stored request for this invite, if any. */
export function getGuardianConsent(
  inviteToken: string
): StoredGuardianConsent | null {
  let consent: StoredGuardianConsent | null = memoryConsent;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) consent = JSON.parse(raw);
  } catch {
    // fall back to this visit's copy
  }
  if (!consent?.consentId || !consent.secret) return null;
  return consent.inviteToken === inviteToken ? consent : null;
}

export function clearGuardianConsent() {
  memoryConsent = null;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // nothing stored
  }
}

/**
 * Whether an invited child needs a guardian's consent: under 14, counted in
 * UTC months like the server, with the 14th-birthday month still counting as
 * under 14 (only the month is known).
 */
export function needsGuardianConsent(
  birthYear: number,
  birthMonth: number,
  now = Date.now()
) {
  const today = new Date(now);
  const months =
    (today.getUTCFullYear() - birthYear) * 12 +
    (today.getUTCMonth() + 1 - birthMonth);
  return months <= 14 * 12;
}

/**
 * A vouched Minecraft player's link (?mcpass=): kept like any invite and
 * taken out of the address bar and history (it's personal). Returns true when
 * the page was opened with one.
 */
export function takeMinecraftPassFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('mcpass');
  if (!token) return false;
  url.searchParams.delete('mcpass');
  window.history.replaceState(window.history.state, '', url.toString());
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) return false;
  storeSignupInvite({ token: `m_${token}`, source: 'minecraft' });
  return true;
}

/** True once after an invite arrives, so the sign-in window opens on sign-up. */
export function takeOpenToSignup() {
  const open = openToSignup;
  openToSignup = false;
  return open;
}

const emailTickets = new Map<string, string>();
const emailKey = (email: string) => String(email || '').trim().toLowerCase();

export function rememberEmailTicket(email: string, ticket?: string) {
  if (ticket) emailTickets.set(emailKey(email), ticket);
}

export function getEmailTicket(email: string) {
  return emailTickets.get(emailKey(email)) || '';
}
