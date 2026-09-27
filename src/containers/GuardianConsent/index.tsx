import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useLocation } from 'react-router-dom';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

// /signup/guardian?token=... : a parent or guardian approves (or declines)
// an invited child's sign-up (Mikey, 2026-09-27; Korea's PIPA needs a legal
// guardian's consent under 14). No account needed. Opening the page changes
// nothing; only a button press does (mail scanners open links).
//
// Most parents are Korean: Korean shows for a Korean browser, ?lang=ko|en
// overrides, and the 한국어 / English switch is remembered on this device.

type Lang = 'ko' | 'en';
type Status = 'pending' | 'approved' | 'declined' | 'expired' | 'used';

interface ConsentView {
  status: Status;
  childFirstName: string;
  inviteSource: 'guest' | 'minecraft';
  inviterName: string;
  minecraftName?: string;
  expiresAt: number;
}

const LANG_KEY = 'twinkle-guardian-lang';

// Every word on the page, one dictionary per language (for Mikey's review).
const TEXT: Record<
  Lang,
  {
    kicker: string;
    loading: string;
    title: (child: string) => string;
    intro: string;
    invitedByGuest: (inviter: string) => string;
    invitedByMinecraft: (inviter: string, minecraftName?: string) => string;
    whatTitle: string;
    whatBody: string;
    collectTitle: string;
    collectBody: string;
    privacyLink: string;
    parentTools: string;
    learnMore: string;
    approve: string;
    decline: string;
    onlyGuardian: string;
    expiresOn: (date: string) => string;
    declineHint: string;
    approvedTitle: string;
    approvedBody: (child: string) => string;
    declinedTitle: string;
    declinedBody: (child: string) => string;
    expiredTitle: string;
    expiredBody: (child: string) => string;
    usedTitle: string;
    usedBody: (child: string) => string;
    invalidTitle: string;
    invalidBody: string;
    error: string;
  }
> = {
  en: {
    kicker: 'Parent or guardian consent',
    loading: 'Loading...',
    title: (child) => `${child} would like to join Twinkle`,
    intro:
      'They said they are under 14 and gave your email as their parent or guardian. We need your approval before we make their account.',
    invitedByGuest: (inviter) =>
      `${inviter}, a Twinkle member, invited them after they played together in a private room of one of our apps.`,
    invitedByMinecraft: (inviter, minecraftName) =>
      `${inviter || 'A moderator'}, a moderator of our Minecraft server, vouched for them${
        minecraftName ? ` (Minecraft name: ${minecraftName})` : ''
      }.`,
    whatTitle: 'What Twinkle is',
    whatBody:
      'A community website that began at Twinkle English Academy in Korea. Members chat, play and make games and apps, and practise English together. Anyone can report or block another member in chat, and our team reviews every report.',
    collectTitle: 'What we collect',
    collectBody:
      "Your child's name, email address and activity on the site.",
    privacyLink: 'Read our privacy policy',
    parentTools:
      "We're also building parent tools, so you'll be able to see your child's activity and set time limits.",
    learnMore: 'What your child can learn on Twinkle →',
    approve: 'I am the parent or legal guardian and I agree',
    decline: 'Decline',
    onlyGuardian: 'Only a parent or legal guardian should approve.',
    expiresOn: (date) => `This request is open until ${date}.`,
    declineHint:
      'You chose Decline in the email. Press Decline below to confirm.',
    approvedTitle: 'Thank you for approving',
    approvedBody: (child) =>
      `${child} can now finish creating their account.`,
    declinedTitle: 'You declined',
    declinedBody: (child) =>
      `No account will be made for ${child}. If you change your mind, ${child} can send you a new request.`,
    expiredTitle: 'This request has expired',
    expiredBody: (child) =>
      `${child} can send you a new request from the sign-up page.`,
    usedTitle: 'The account has been created',
    usedBody: (child) =>
      `${child}'s account was created with your approval. Thank you.`,
    invalidTitle: "This link isn't valid",
    invalidBody:
      'Part of the link may be missing. Please open the link in the email again.',
    error: 'Something went wrong. Please try again.'
  },
  ko: {
    kicker: '보호자 동의',
    loading: '불러오는 중...',
    title: (child) => `자녀분(${child})이 Twinkle 가입을 요청했습니다`,
    intro:
      '자녀분이 만 14세 미만이라고 답하고, 부모님 또는 법정대리인의 이메일로 이 주소를 입력했습니다. 계정을 만들기 전에 보호자님의 동의가 필요합니다.',
    invitedByGuest: (inviter) =>
      `Twinkle 회원 ${inviter} 님이 저희 앱의 비공개 방에서 자녀분과 함께 논 뒤 초대했습니다.`,
    invitedByMinecraft: (inviter, minecraftName) =>
      `저희 마인크래프트 서버의 관리자 ${inviter || '관리자'} 님이 자녀분을 추천했습니다${
        minecraftName ? ` (마인크래프트 이름: ${minecraftName})` : ''
      }.`,
    whatTitle: 'Twinkle은 어떤 곳인가요?',
    whatBody:
      '한국의 트윈클 어학원에서 시작된 커뮤니티 웹사이트입니다. 회원들은 함께 대화하고, 게임과 앱을 즐기거나 직접 만들며, 영어를 연습합니다. 채팅에서 누구든 다른 회원을 신고하거나 차단할 수 있으며, 모든 신고는 저희 팀이 확인합니다.',
    collectTitle: '수집하는 정보',
    collectBody: '자녀분의 이름, 이메일 주소, 사이트 이용 기록입니다.',
    privacyLink: '개인정보 처리방침 보기(영문)',
    parentTools:
      '자녀분의 활동을 확인하고 이용 시간을 정할 수 있는 보호자 기능도 준비하고 있습니다.',
    learnMore: '자녀분이 Twinkle에서 배울 수 있는 것 →',
    approve: '부모님 또는 법정대리인으로서 동의합니다',
    decline: '동의하지 않습니다',
    onlyGuardian: '부모님 또는 법정대리인만 동의해 주세요.',
    expiresOn: (date) => `이 요청은 ${date}까지 유효합니다.`,
    declineHint:
      "이메일에서 '동의하지 않기'를 누르셨습니다. 아래 버튼을 눌러 한 번 더 확인해 주세요.",
    approvedTitle: '동의해 주셔서 감사합니다',
    approvedBody: () => '이제 자녀분이 계정 만들기를 마칠 수 있습니다.',
    declinedTitle: '동의하지 않으셨습니다',
    declinedBody: () =>
      '자녀분의 계정은 만들어지지 않습니다. 마음이 바뀌시면 자녀분이 새 요청을 보낼 수 있습니다.',
    expiredTitle: '만료된 요청입니다',
    expiredBody: () => '자녀분이 가입 페이지에서 새 요청을 보낼 수 있습니다.',
    usedTitle: '계정이 만들어졌습니다',
    usedBody: () =>
      '보호자님의 동의로 자녀분의 계정이 만들어졌습니다. 감사합니다.',
    invalidTitle: '유효하지 않은 링크입니다',
    invalidBody:
      '링크 일부가 빠졌을 수 있습니다. 이메일에 있는 링크를 다시 열어 주세요.',
    error: '문제가 생겼습니다. 잠시 후 다시 시도해 주세요.'
  }
};

export default function GuardianConsentPage() {
  const location = useLocation();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const token = params.get('token') || '';
  const choseDecline = params.get('choice') === 'decline';
  const loadReview = useAppContext(
    (v) => v.requestHelpers.loadGuardianConsentReview
  );
  const decide = useAppContext((v) => v.requestHelpers.decideGuardianConsent);
  const [lang, setLang] = useState<Lang>(() =>
    initialLanguage(params.get('lang'))
  );
  const [consent, setConsent] = useState<ConsentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'' | 'approve' | 'decline'>(
    ''
  );
  const [errorMessage, setErrorMessage] = useState('');
  const t = TEXT[lang];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { consent: view } = await loadReview(token);
        if (!cancelled) setConsent(view);
      } catch {
        if (!cancelled) setErrorMessage('error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [lang]);

  const child = consent?.childFirstName || '';

  return (
    <div
      className={css`
        min-height: 100%;
        padding: 3rem 16px 12rem;
        background: #f6f7fb;
        @media (max-width: ${mobileMaxWidth}) {
          padding-top: 1.6rem;
        }
      `}
    >
      <main
        lang={lang}
        className={css`
          max-width: 640px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          padding: 2.8rem 3rem 3rem;
          color: ${Color.darkerGray()};
          font-size: 1.6rem;
          line-height: 1.6;
          /* Korean wraps between words, not inside them */
          word-break: ${lang === 'ko' ? 'keep-all' : 'normal'};
          overflow-wrap: anywhere;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 2rem 1.6rem 2.4rem;
          }
          h1 {
            margin: 0.6rem 0 1.4rem;
            font-size: 2.6rem;
            line-height: 1.3;
            color: #222;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2.1rem;
            }
          }
          h2 {
            margin: 2rem 0 0.4rem;
            font-size: 1.7rem;
            color: #222;
          }
          p {
            margin: 0 0 1rem;
          }
          a {
            color: #0066bb;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          `}
        >
          <span
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              color: ${Color.darkGray()};
            `}
          >
            {t.kicker}
          </span>
          <div
            role="group"
            aria-label="Language"
            className={css`
              display: flex;
              border: 1px solid var(--ui-border);
              border-radius: 999px;
              overflow: hidden;
            `}
          >
            {(['ko', 'en'] as Lang[]).map((value) => (
              <button
                key={value}
                type="button"
                lang={value}
                aria-pressed={lang === value}
                onClick={() => handleSetLang(value)}
                className={css`
                  border: none;
                  padding: 0.5rem 1.2rem;
                  font-size: 1.3rem;
                  cursor: pointer;
                  background: ${lang === value ? '#0077cc' : '#fff'};
                  color: ${lang === value ? '#fff' : Color.darkerGray()};
                  font-weight: ${lang === value ? 700 : 400};
                  &:focus-visible {
                    outline: 3px solid #99ccff;
                    outline-offset: -3px;
                  }
                `}
              >
                {value === 'ko' ? '한국어' : 'English'}
              </button>
            ))}
          </div>
        </div>
        {renderBody()}
      </main>
    </div>
  );

  function renderBody() {
    if (loading) {
      return (
        <p
          className={css`
            margin-top: 2rem !important;
            color: ${Color.darkGray()};
          `}
        >
          <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />
          {t.loading}
        </p>
      );
    }
    if (!consent) {
      return (
        <>
          <h1>{errorMessage ? t.error : t.invalidTitle}</h1>
          {!errorMessage && <p>{t.invalidBody}</p>}
        </>
      );
    }
    if (consent.status !== 'pending') {
      const done: Record<
        Exclude<Status, 'pending'>,
        { title: string; body: string; icon: string; color: string }
      > = {
        approved: {
          title: t.approvedTitle,
          body: t.approvedBody(child),
          icon: 'check',
          color: Color.green()
        },
        used: {
          title: t.usedTitle,
          body: t.usedBody(child),
          icon: 'check',
          color: Color.green()
        },
        declined: {
          title: t.declinedTitle,
          body: t.declinedBody(child),
          icon: 'times',
          color: Color.darkGray()
        },
        expired: {
          title: t.expiredTitle,
          body: t.expiredBody(child),
          icon: 'clock',
          color: Color.darkGray()
        }
      };
      const { title, body, icon, color } = done[consent.status];
      return (
        <div aria-live="polite">
          <Icon
            icon={icon}
            className={css`
              font-size: 3.2rem;
              margin-top: 2rem;
              color: ${color};
            `}
          />
          <h1>{title}</h1>
          <p>{body}</p>
          {(consent.status === 'approved' || consent.status === 'used') && (
            <>
              <p>{t.parentTools}</p>
            </>
          )}
        </div>
      );
    }
    return (
      <>
        <h1>{t.title(child)}</h1>
        <p>{t.intro}</p>
        <p>
          {consent.inviteSource === 'minecraft'
            ? t.invitedByMinecraft(consent.inviterName, consent.minecraftName)
            : t.invitedByGuest(consent.inviterName)}
        </p>
        <h2>{t.whatTitle}</h2>
        <p>{t.whatBody}</p>
        <h2>{t.collectTitle}</h2>
        <p>
          {t.collectBody}{' '}
          <a href="/privacy" target="_blank" rel="noopener">
            {t.privacyLink}
          </a>
        </p>
        <p>{t.parentTools}</p>
        {choseDecline && (
          <p
            className={css`
              margin-top: 1.6rem !important;
              padding: 1rem 1.2rem;
              border-radius: ${borderRadius};
              background: #f3f4f6;
            `}
          >
            {t.declineHint}
          </p>
        )}
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 2rem;
            button {
              width: 100%;
              padding: 1.3rem 1.6rem;
              font-size: 1.7rem;
              font-weight: 700;
              border-radius: ${borderRadius};
              cursor: pointer;
              line-height: 1.35;
              &:focus-visible {
                outline: 3px solid #99ccff;
                outline-offset: 2px;
              }
              &:disabled {
                opacity: 0.6;
                cursor: default;
              }
            }
          `}
        >
          <button
            type="button"
            autoFocus={!choseDecline}
            disabled={!!submitting}
            onClick={() => handleDecide('approve')}
            className={css`
              border: none;
              background: #0077cc;
              color: #fff;
              &:hover:not(:disabled) {
                background: #005fa3;
              }
            `}
          >
            {submitting === 'approve' && (
              <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />
            )}
            {t.approve}
          </button>
          <button
            type="button"
            autoFocus={choseDecline}
            disabled={!!submitting}
            onClick={() => handleDecide('decline')}
            className={css`
              border: 1px solid var(--ui-border-strong, #bbb);
              background: #fff;
              color: ${Color.darkerGray()};
              &:hover:not(:disabled) {
                background: #f3f4f6;
              }
            `}
          >
            {submitting === 'decline' && (
              <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />
            )}
            {t.decline}
          </button>
        </div>
        {errorMessage && (
          <p
            role="alert"
            className={css`
              margin-top: 1rem !important;
              color: #c0392b;
            `}
          >
            {t.error}
          </p>
        )}
        <p
          className={css`
            margin-top: 1.4rem !important;
            font-size: 1.4rem;
            color: ${Color.darkGray()};
          `}
        >
          {t.onlyGuardian}{' '}
          {t.expiresOn(
            new Date(consent.expiresAt * 1000).toLocaleDateString(
              lang === 'ko' ? 'ko-KR' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )
          )}
        </p>
      </>
    );
  }

  function handleSetLang(value: Lang) {
    setLang(value);
    try {
      localStorage.setItem(LANG_KEY, value);
    } catch {
      // not remembered in private windows
    }
  }

  async function handleDecide(decision: 'approve' | 'decline') {
    if (submitting) return;
    setSubmitting(decision);
    setErrorMessage('');
    try {
      const { consent: view } = await decide({ token, decision });
      setConsent(view);
    } catch {
      setErrorMessage('error');
    } finally {
      setSubmitting('');
    }
  }
}

function initialLanguage(param: string | null): Lang {
  if (param === 'ko' || param === 'en') return param;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    // no storage: fall through to the browser language
  }
  const languages =
    typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : [navigator.language]
      : [];
  return languages.some((value) => /^ko\b/i.test(String(value || '')))
    ? 'ko'
    : 'en';
}
