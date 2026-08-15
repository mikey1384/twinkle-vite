export type SessionInterruptionCode =
  | 'session_storage_unavailable'
  | 'session_token_missing'
  | 'session_token_invalid';

export interface SessionInterruption {
  code: SessionInterruptionCode;
  message: string;
  title: string;
}

const SESSION_INTERRUPTION_COPY: Record<
  SessionInterruptionCode,
  Omit<SessionInterruption, 'code'>
> = {
  session_storage_unavailable: {
    title: 'Safari could not read your saved sign-in',
    message:
      'Twinkle did not erase your account data. Please try again; if Safari cleared its website storage, sign in again.'
  },
  session_token_missing: {
    title: 'This browser lost access to your saved sign-in',
    message:
      'Twinkle did not log you out or erase your account data. Safari may have cleared website storage, or this tab may be using a different Twinkle website origin.'
  },
  session_token_invalid: {
    title: 'Twinkle could not verify this saved sign-in',
    message:
      'Automatic reconnects have been stopped and the saved sign-in was not erased. Please sign in again to continue.'
  }
};

export function createSessionInterruption(
  code: SessionInterruptionCode
): SessionInterruption {
  return {
    code,
    ...SESSION_INTERRUPTION_COPY[code]
  };
}
