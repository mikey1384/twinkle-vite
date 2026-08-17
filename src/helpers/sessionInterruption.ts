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
    title: 'Twinkle can’t read your saved sign-in',
    message:
      'Your account is still there. Try again. If this keeps happening, sign in again on this browser.'
  },
  session_token_missing: {
    title: 'This browser no longer has your saved sign-in',
    message:
      'Your account is still there. Sign in again to keep using Twinkle on this browser.'
  },
  session_token_invalid: {
    title: 'Please sign in again',
    message:
      'Twinkle can’t use the sign-in saved in this browser anymore. This often happens after a password change. We signed you out here to keep your account safe. Sign in below with your current password.'
  }
};

export function getVisibleCachedIdentity<T extends Record<string, any>>(
  cachedIdentity: T,
  hideCachedIdentity: boolean
): Partial<T> {
  return hideCachedIdentity ? {} : cachedIdentity;
}

export function createSessionInterruption(
  code: SessionInterruptionCode
): SessionInterruption {
  return {
    code,
    ...SESSION_INTERRUPTION_COPY[code]
  };
}
