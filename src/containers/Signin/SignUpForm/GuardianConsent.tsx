import React, { useEffect, useRef, useState } from 'react';
import { css, cx, keyframes } from '@emotion/css';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import {
  getGuardianConsent,
  storeGuardianConsent,
  type StoredGuardianConsent
} from '~/helpers/signupPasses';
import {
  bodyClass,
  errorClass,
  fieldClass,
  linkButtonClass,
  noteClass,
  primaryButtonClass,
  stepClass,
  titleClass
} from './stepStyles';

type Phase =
  | 'email'
  | 'checking'
  | 'pending'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'used';

const POLL_MS = 5000;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(-8deg); }
  50% { transform: translateY(-6px) rotate(4deg); }
`;

// An invited child under 14 asks a parent or guardian (Mikey, 2026-09-27).
// The request is kept beside the invite (signupPasses.ts), so closing the
// page and coming back lands on the waiting screen again.
export default function GuardianConsent({
  inviteToken,
  birthYear,
  birthMonth,
  initialFirstName,
  onChangeBirth,
  onApproved
}: {
  inviteToken: string;
  birthYear: number;
  birthMonth: number;
  initialFirstName?: string;
  onChangeBirth: () => void;
  onApproved: (consent: {
    consentId: number;
    secret: string;
    childFirstName: string;
  }) => void;
}) {
  const requestGuardianConsent = useAppContext(
    (v) => v.requestHelpers.requestGuardianConsent
  );
  const getGuardianConsentStatus = useAppContext(
    (v) => v.requestHelpers.getGuardianConsentStatus
  );
  const [stored, setStored] = useState<StoredGuardianConsent | null>(() =>
    getGuardianConsent(inviteToken)
  );
  const [phase, setPhase] = useState<Phase>(stored ? 'checking' : 'email');
  const [firstName, setFirstName] = useState(
    stored?.childFirstName || initialFirstName || ''
  );
  const [guardianEmail, setGuardianEmail] = useState(
    stored?.guardianEmail || ''
  );
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const checkingRef = useRef(false);

  const waiting = phase === 'checking' || phase === 'pending';

  useEffect(() => {
    if (!stored || !waiting) return;
    const consent = stored;
    let cancelled = false;
    async function check() {
      if (checkingRef.current || document.hidden) return;
      checkingRef.current = true;
      try {
        const { status } = await getGuardianConsentStatus({
          consentId: consent.consentId,
          secret: consent.secret
        });
        if (!cancelled && status) setPhase(status);
      } catch (error: any) {
        // a blip: keep waiting (the next check tries again)
        if (!cancelled) {
          setPhase((current) => (current === 'checking' ? 'pending' : current));
        }
        if (!cancelled && error?.status === 503) {
          setErrorMessage(error.message);
        }
      } finally {
        checkingRef.current = false;
      }
    }
    check();
    const timer = setInterval(check, POLL_MS);
    const handleVisible = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, waiting]);

  if (phase === 'email') {
    const canSend = !!firstName.trim() && !!guardianEmail.trim() && !sending;
    return (
      <div className={stepClass}>
        <div className={titleClass}>Ask a parent or guardian</div>
        <p className={bodyClass}>
          Because you're under 14, a parent or guardian needs to say yes before
          we make your account. We'll email them what Twinkle is and who
          invited you.
        </p>
        <div className={fieldClass}>
          <label htmlFor="guardian-child-name">Your first name</label>
          <Input
            id="guardian-child-name"
            autoFocus={!firstName}
            value={firstName}
            maxLength={40}
            autoComplete="given-name"
            onChange={(text) => {
              setErrorMessage('');
              setFirstName(text);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className={fieldClass}>
          <label htmlFor="guardian-email">
            Your parent's or guardian's email
          </label>
          <Input
            id="guardian-email"
            type="email"
            autoFocus={!!firstName}
            value={guardianEmail}
            placeholder="parent@example.com"
            onChange={(text) => {
              setErrorMessage('');
              setGuardianEmail(text.trim());
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        {errorMessage && (
          <p role="alert" className={errorClass}>
            {errorMessage}
          </p>
        )}
        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          className={primaryButtonClass}
        >
          {sending ? (
            <>
              <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />
              Sending...
            </>
          ) : (
            'Email my parent or guardian'
          )}
        </button>
        <button
          type="button"
          onClick={onChangeBirth}
          className={linkButtonClass}
        >
          I entered the wrong birth date
        </button>
      </div>
    );
  }

  if (phase === 'checking' || phase === 'pending') {
    return (
      <div className={stepClass} aria-live="polite">
        <Icon
          icon="paper-plane"
          className={css`
            font-size: 3.4rem;
            color: #0088ee;
            animation: ${float} 2.4s ease-in-out infinite;
            @media (prefers-reduced-motion: reduce) {
              animation: none;
            }
          `}
        />
        <div className={titleClass}>Waiting for your parent or guardian</div>
        <p className={bodyClass}>
          We emailed <b>{stored?.guardianEmail}</b>. Ask them to open the email
          from Twinkle and choose <b>Review and approve</b>.
        </p>
        <p
          className={cx(
            noteClass,
            css`
              display: flex;
              align-items: center;
              gap: 0.7rem;
            `
          )}
        >
          <Icon icon="spinner" pulse />
          This page updates by itself.
        </p>
        <p className={noteClass}>
          You can close this page. When you come back on this device, you'll
          pick up right here.
        </p>
        {errorMessage && (
          <p role="alert" className={errorClass}>
            {errorMessage}
          </p>
        )}
        <button type="button" onClick={handleAskAgain} className={linkButtonClass}>
          Send it again or use a different email
        </button>
      </div>
    );
  }

  if (phase === 'approved') {
    return (
      <div className={stepClass} aria-live="polite">
        <Icon
          icon="check"
          className={css`
            font-size: 3.4rem;
            color: ${Color.green()};
          `}
        />
        <div className={titleClass}>Your parent or guardian said yes!</div>
        <p className={bodyClass}>
          Next, pick a username and password and verify your email.
        </p>
        <button
          type="button"
          autoFocus
          onClick={handleContinue}
          className={primaryButtonClass}
        >
          Continue
        </button>
      </div>
    );
  }

  const ended: Record<'declined' | 'expired' | 'used', [string, string]> = {
    declined: [
      "Your parent or guardian didn't approve",
      "We can't make your account without their approval. If you think that was a mistake, talk with them and ask again."
    ],
    expired: [
      'This request has expired',
      "Your parent or guardian didn't answer within 7 days, or a newer request replaced this one. You can send a new one."
    ],
    used: [
      'This approval was already used',
      'An account was already made with it. Try logging in instead.'
    ]
  };
  const [title, body] = ended[phase];
  return (
    <div className={stepClass} aria-live="polite">
      <div className={titleClass}>{title}</div>
      <p className={bodyClass}>{body}</p>
      {phase !== 'used' && (
        <button
          type="button"
          autoFocus
          onClick={handleAskAgain}
          className={primaryButtonClass}
        >
          Ask again
        </button>
      )}
    </div>
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') handleSend();
  }

  async function handleSend() {
    const name = firstName.trim();
    const email = guardianEmail.trim();
    if (!name || !email || sending) return;
    setSending(true);
    setErrorMessage('');
    try {
      const { consentId, secret, guardianEmail: sentTo } =
        await requestGuardianConsent({
          guardianEmail: email,
          childFirstName: name,
          invite: inviteToken,
          birthYear,
          birthMonth
        });
      const next: StoredGuardianConsent = {
        inviteToken,
        consentId,
        secret,
        guardianEmail: sentTo || email,
        childFirstName: name,
        birthYear,
        birthMonth
      };
      storeGuardianConsent(next);
      setStored(next);
      setPhase('pending');
    } catch (error: any) {
      setErrorMessage(
        error?.message || "We couldn't send the email. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  function handleAskAgain() {
    setErrorMessage('');
    setPhase('email');
  }

  function handleContinue() {
    if (!stored) return;
    onApproved({
      consentId: stored.consentId,
      secret: stored.secret,
      childFirstName: stored.childFirstName
    });
  }
}
