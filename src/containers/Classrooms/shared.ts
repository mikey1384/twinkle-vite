// Classroom sign-up (class codes): shared types, styles and small helpers for
// My classes, the join page, the help page and the discovery pieces.
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

export const MY_CLASSES_PATH = '/my-classes';
export const CLASS_HELP_PATH = '/teachers/classes';

export interface ClassCode {
  state: 'live' | 'expired' | 'off' | 'full' | 'none';
  token?: string | null;
  shortCode?: string | null;
  url?: string;
  qrUrl?: string;
  expiresAt?: number;
  seatCap?: number;
  seatsUsed?: number;
}

export interface RosterStudent {
  userId: number;
  username: string;
  firstName: string;
  profilePicUrl: string | null;
  joinedAt: number;
  canReset: boolean;
}

export interface Classroom {
  id: number;
  className: string;
  branchName: string;
  createdAt: number;
  members: number;
  code: ClassCode;
  roster?: RosterStudent[];
}

export interface ClassJoinView {
  classroomId: number;
  teacherName: string;
  teacherPicUrl: string | null;
  branchName: string;
  className: string;
  state: 'open' | 'full' | 'closed';
}

export interface ClassAsk {
  id: number;
  firstName: string;
  note: string;
  createdAt: number;
}

// "Ask my teacher for an account": the request this browser sent, kept so
// closing sign-up and coming back resumes the waiting screen. The secret only
// reads this request's answer and, after the teacher's yes, makes one account.
export interface StoredClassAsk {
  askId: number;
  secret: string;
  teacherName: string;
  expiresAt: number;
}
const CLASS_ASK_KEY = 'twinkle-class-ask';
let memoryAsk: StoredClassAsk | null = null;
export function storeClassAsk(ask: StoredClassAsk) {
  memoryAsk = ask;
  try {
    localStorage.setItem(CLASS_ASK_KEY, JSON.stringify(ask));
  } catch {
    // private windows: it still works for this visit
  }
}
export function getClassAsk(): StoredClassAsk | null {
  let ask = memoryAsk;
  try {
    const raw = localStorage.getItem(CLASS_ASK_KEY);
    if (raw) ask = JSON.parse(raw);
  } catch {
    // this visit's copy
  }
  if (!ask?.askId || !ask.secret) return null;
  if (ask.expiresAt * 1000 < Date.now()) {
    clearClassAsk();
    return null;
  }
  return ask;
}
export function clearClassAsk() {
  memoryAsk = null;
  try {
    localStorage.removeItem(CLASS_ASK_KEY);
  } catch {
    // nothing stored
  }
}

/** The join key of a teacher's one-account pass (never a class code). */
export function isAskPass(value: string) {
  return /^ask-\d+-[A-Za-z0-9_-]{22}$/.test(value);
}

/** A board code as typed: "tw-4k7qxy" or "4K7QXY". */
export function looksLikeBoardCode(value: string) {
  const text = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^(TW)?[A-Z0-9]{6}$/.test(text);
}

/** "Daechi · Lions 3", or just the class when the branch isn't on record. */
export function classLine(branchName: string, className: string) {
  return [branchName, className].filter(Boolean).join(' · ');
}

// The offer card and the hints never share a visit (PLAN.md 5a): whichever
// shows first marks this tab.
const DISCOVERY_SESSION_KEY = 'twinkle-class-discovery';
export function discoveryShownThisVisit() {
  try {
    return sessionStorage.getItem(DISCOVERY_SESSION_KEY);
  } catch {
    return null;
  }
}
export function markDiscoveryShown(piece: 'card' | 'hint') {
  try {
    sessionStorage.setItem(DISCOVERY_SESSION_KEY, piece);
  } catch {
    // private windows: the server still shows each piece once
  }
}

export const pageClass = css`
  width: 100%;
  max-width: 76rem;
  margin: 2rem auto 0;
  padding: 0 1.6rem 12rem;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 0;
    padding: 0 0 12rem;
    gap: 1rem;
  }
`;

export const panelClass = css`
  box-sizing: border-box;
  width: 100%;
  padding: 1.8rem 2rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem 1.2rem;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

export const pageTitleClass = css`
  margin: 0;
  font-size: 2.4rem;
  font-weight: 700;
  color: ${Color.black()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

export const leadClass = css`
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;

export const quietLinkClass = css`
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  font-weight: 700;
  color: ${Color.logoBlue()};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export const textInputClass = css`
  box-sizing: border-box;
  width: 100%;
  font-family: inherit;
  padding: 1rem 1.2rem;
  font-size: 1.6rem;
  border-radius: 0.8rem;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: ${Color.black()};
  &:focus {
    outline: none;
    border-color: ${Color.logoBlue()};
  }
`;
