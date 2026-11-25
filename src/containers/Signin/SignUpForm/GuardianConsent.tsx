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

// English on the website's sign-up modal; an app's sign-in window and the
// lite host (Lumine app sign-up) pass lang 'ko' for a Korean browser.
const TEXT = {
  en: {
    askTitle: 'Ask a parent or guardian',
    askBody:
      "Because you're under 14, a parent or guardian needs to say yes before we make your account. We'll email them what Twinkle is and who invited you.",
    firstName: 'Your first name',
    guardianEmail: "Your parent's or guardian's email",
    sending: 'Sending...',
    send: 'Email my parent or guardian',
    wrongBirth: 'I entered the wrong birth date',
    waitingTitle: 'Waiting for your parent or guardian',
    waitingBody: (email: React.ReactNode) => (
      <>
        We emailed <b>{email}</b>. Ask them to open the email from Twinkle and
        choose <b>Review and approve</b>.
      </>
    ),
    updates: 'This page updates by itself.',
    canClose:
      "You can close this page. When you come back on this device, you'll pick up right here.",
    sendAgain: 'Send it again or use a different email',
    approvedTitle: 'Your parent or guardian said yes!',
    approvedBody: 'Next, pick a username and password and verify your email.',
    continue: 'Continue',
    declinedTitle: "Your parent or guardian didn't approve",
    declinedBody:
      "We can't make your account without their approval. If you think that was a mistake, talk with them and ask again.",
    expiredTitle: 'This request has expired',
    expiredBody:
      "Your parent or guardian didn't answer within 7 days, or a newer request replaced this one. You can send a new one.",
    usedTitle: 'This approval was already used',
    usedBody: 'An account was already made with it. Try logging in instead.',
    askAgain: 'Ask again',
    sendFailed: "We couldn't send the email. Please try again."
  },
  ko: {
    askTitle: '부모님께 허락받기',
    askBody:
      '만 14세 미만은 계정을 만들기 전에 부모님이나 보호자의 동의가 필요해요. 부모님께 트윈클이 어떤 곳인지 이메일로 알려 드릴게요.',
    firstName: '내 이름',
    guardianEmail: '부모님 또는 보호자의 이메일',
    sending: '보내는 중...',
    send: '부모님께 이메일 보내기',
    wrongBirth: '생년월을 잘못 골랐어요',
    waitingTitle: '부모님 답장을 기다리고 있어요',
    waitingBody: (email: React.ReactNode) => (
      <>
        <b>{email}</b>(으)로 이메일을 보냈어요. 트윈클에서 온 메일을 열어{' '}
        <b>확인하고 동의하기</b>를 눌러 달라고 부탁드려 보세요.
      </>
    ),
    updates: '이 화면은 저절로 바뀌어요.',
    canClose:
      '이 창을 닫아도 괜찮아요. 이 기기에서 다시 오면 여기서 이어서 할 수 있어요.',
    sendAgain: '다시 보내거나 다른 이메일 쓰기',
    approvedTitle: '부모님이 허락해 주셨어요!',
    approvedBody: '이제 아이디와 비밀번호를 정해 주세요.',
    continue: '계속',
    declinedTitle: '부모님이 동의하지 않으셨어요',
    declinedBody:
      '동의 없이는 계정을 만들 수 없어요. 실수라고 생각되면 부모님과 이야기한 뒤 다시 요청해 주세요.',
    expiredTitle: '요청이 만료되었어요',
    expiredBody:
      '7일 안에 답이 없었거나 새 요청으로 바뀌었어요. 다시 보낼 수 있어요.',
    usedTitle: '이미 사용된 동의예요',
    usedBody: '이 동의로 이미 계정을 만들었어요. 로그인해 보세요.',
    askAgain: '다시 요청하기',
    sendFailed: '이메일을 보내지 못했어요. 다시 시도해 주세요.'
  }
};

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
  lang = 'en',
  variant = 'step',
  approvedBody,
  onChangeBirth,
  onApproved
}: {
  lang?: 'en' | 'ko';
  // 'card': the app sign-in window's look (left-aligned, a full-width pill)
  variant?: 'step' | 'card';
  // what comes after the approval (the website's form asks for an email too)
  approvedBody?: string;
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
  const t = TEXT[lang];
  const sc = variant === 'card' ? CARD_STYLES : STEP_STYLES;
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
      <div className={sc.step}>
        <div className={sc.title}>{t.askTitle}</div>
        <p className={sc.body}>{t.askBody}</p>
        <div className={sc.field}>
          <label htmlFor="guardian-child-name">{t.firstName}</label>
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
        <div className={sc.field}>
          <label htmlFor="guardian-email">{t.guardianEmail}</label>
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
          <p role="alert" className={sc.error}>
            {errorMessage}
          </p>
        )}
        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          className={sc.primary}
        >
          {sending ? (
            <>
              <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />
              {t.sending}
            </>
          ) : (
            t.send
          )}
        </button>
        <button
          type="button"
          onClick={onChangeBirth}
          className={sc.link}
        >
          {t.wrongBirth}
        </button>
      </div>
    );
  }

  if (phase === 'checking' || phase === 'pending') {
    return (
      <div className={sc.step} aria-live="polite">
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
        <div className={sc.title}>{t.waitingTitle}</div>
        <p className={sc.body}>{t.waitingBody(stored?.guardianEmail)}</p>
        <p
          className={cx(
            sc.note,
            css`
              display: flex;
              align-items: center;
              gap: 0.7rem;
            `
          )}
        >
          <Icon icon="spinner" pulse />
          {t.updates}
        </p>
        <p className={sc.note}>{t.canClose}</p>
        {errorMessage && (
          <p role="alert" className={sc.error}>
            {errorMessage}
          </p>
        )}
        <button type="button" onClick={handleAskAgain} className={sc.link}>
          {t.sendAgain}
        </button>
      </div>
    );
  }

  if (phase === 'approved') {
    return (
      <div className={sc.step} aria-live="polite">
        <Icon
          icon="check"
          className={css`
            font-size: 3.4rem;
            color: ${Color.green()};
          `}
        />
        <div className={sc.title}>{t.approvedTitle}</div>
        <p className={sc.body}>{approvedBody || t.approvedBody}</p>
        <button
          type="button"
          autoFocus
          onClick={handleContinue}
          className={sc.primary}
        >
          {t.continue}
        </button>
      </div>
    );
  }

  const ended: Record<'declined' | 'expired' | 'used', [string, string]> = {
    declined: [t.declinedTitle, t.declinedBody],
    expired: [t.expiredTitle, t.expiredBody],
    used: [t.usedTitle, t.usedBody]
  };
  const [title, body] = ended[phase];
  return (
    <div className={sc.step} aria-live="polite">
      <div className={sc.title}>{title}</div>
      <p className={sc.body}>{body}</p>
      {phase !== 'used' && (
        <button
          type="button"
          autoFocus
          onClick={handleAskAgain}
          className={sc.primary}
        >
          {t.askAgain}
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
        error?.message || t.sendFailed
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

const STEP_STYLES = {
  step: stepClass,
  title: titleClass,
  body: bodyClass,
  primary: primaryButtonClass,
  link: linkButtonClass,
  note: noteClass,
  field: fieldClass,
  error: errorClass
};

// The app sign-in window (containers/LumineAppSignIn): its card's type and
// buttons, px-sized like the rest of that window.
const CARD_STYLES = {
  step: css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    text-align: left;
  `,
  title: css`
    font-size: 20px;
    font-weight: 750;
    color: #14151c;
  `,
  body: css`
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: #3a3d4a;
  `,
  primary: css`
    width: 100%;
    min-height: 50px;
    margin-top: 4px;
    border: 0;
    border-radius: 999px;
    padding: 12px 18px;
    background: #2f7be0;
    color: #fff;
    font: inherit;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    &:hover:not(:disabled) {
      background: #2468c4;
    }
    &:focus-visible {
      outline: 3px solid rgba(47, 123, 224, 0.35);
      outline-offset: 2px;
    }
    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  `,
  link: css`
    align-self: center;
    border: 0;
    background: none;
    padding: 6px;
    color: #5f6270;
    font: inherit;
    font-size: 14px;
    text-decoration: underline;
    cursor: pointer;
  `,
  note: css`
    margin: 0;
    font-size: 14px;
    color: #5f6270;
  `,
  field: css`
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 15px;
    label {
      font-weight: 650;
    }
    input {
      font-size: 16px;
      border-radius: 12px;
    }
  `,
  error: css`
    margin: 0;
    font-size: 14px;
    color: #b42318;
  `
};
