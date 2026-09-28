import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { formatDuration } from './storyHelpers';
import type { ParentConsentView } from './types';

// /bridge-builder/consent?token=... : a parent or guardian decides whether
// the photos and clips their child is tagged in may go on the crew's Bridge
// Builder story page. No account needed. Opening the page changes nothing;
// only a button press does (mail scanners open links). The same link lets a
// parent withdraw later. Korean first for a Korean browser; ?lang= overrides.

type Lang = 'ko' | 'en';
const LANG_KEY = 'twinkle-guardian-lang';

const TEXT: Record<
  Lang,
  {
    kicker: string;
    loading: string;
    title: (child: string) => string;
    intro: (crew: string) => string;
    yourChild: string;
    childAdded: string;
    photosTitle: (n: number) => string;
    withOthers: (names: string) => string;
    storyTitle: string;
    whoSees: string;
    whoSeesBody: string;
    ifNot: string;
    allow: string;
    dontAllow: string;
    declineHint: string;
    onlyGuardian: string;
    openUntil: (date: string) => string;
    approvedTitle: string;
    approvedBody: string;
    withdraw: string;
    withdrawConfirm: string;
    declinedTitle: string;
    declinedBody: string;
    withdrawnTitle: string;
    withdrawnBody: string;
    expiredTitle: string;
    expiredBody: string;
    replacedTitle: string;
    replacedBody: string;
    invalidTitle: string;
    invalidBody: string;
    error: string;
  }
> = {
  ko: {
    kicker: '보호자 동의 · Bridge Builder 이야기',
    loading: '불러오는 중...',
    title: (child) => `${child}의 모임 사진을 공개해도 될까요?`,
    intro: (crew) =>
      `자녀분이 다른 지점 친구들과 오프라인 모임을 마쳤고, 모임 팀 "${crew}"이 그날의 이야기 페이지를 만들고 있습니다. 아래는 자녀분이 나온다고 표시된 사진과 영상입니다.`,
    yourChild: '자녀분',
    childAdded:
      '자녀분이 보호자님의 허락을 구하려고 이 이메일 주소를 직접 입력했습니다. 자녀분의 보호자가 아니시라면 이 페이지를 닫아 주세요. 아무것도 공개되지 않습니다.',
    photosTitle: (n) => `자녀분이 나오는 사진·영상 ${n}개`,
    withOthers: (names) => `함께 나온 친구: ${names}`,
    storyTitle: '이야기 미리보기',
    whoSees: '누가 볼 수 있나요?',
    whoSeesBody:
      '이야기 페이지는 로그인한 Twinkle 회원이 볼 수 있습니다. 표지 사진은 사이트 피드의 짧은 소개 글에도 쓰이며, 피드는 누구나 볼 수 있습니다. 자녀분은 실명이 아닌 아이디로만 표시되고, 주소나 연락처는 올리지 않습니다. 공개 전에 Twinkle 운영자가 한 번 더 검토합니다.',
    ifNot:
      '허락하지 않으시면 이 사진과 영상은 공개되지 않고, 자녀분은 아이디와 프로필 사진으로만 이야기에 나옵니다. 모임 확인용 영상은 어떤 경우에도 공개되지 않습니다.',
    allow: '부모님 또는 법정대리인으로서 공개를 허락합니다',
    dontAllow: '허락하지 않습니다',
    declineHint: "이메일에서 '허락하지 않기'를 누르셨습니다. 아래 버튼을 눌러 한 번 더 확인해 주세요.",
    onlyGuardian: '부모님 또는 법정대리인만 답해 주세요.',
    openUntil: (date) => `${date}까지 답하실 수 있습니다.`,
    approvedTitle: '허락해 주셔서 감사합니다',
    approvedBody:
      '운영자 검토 후 이야기가 공개되면 이 사진과 영상이 페이지에 실립니다. 마음이 바뀌시면 언제든 이 페이지에서 철회하실 수 있고, 그러면 자녀분이 나오는 사진과 영상이 페이지에서 내려갑니다.',
    withdraw: '동의 철회하기',
    withdrawConfirm: '동의를 철회할까요? 자녀분이 나오는 사진과 영상이 페이지에서 내려갑니다.',
    declinedTitle: '허락하지 않으셨습니다',
    declinedBody: '이 사진과 영상은 공개되지 않습니다. 자녀분은 아이디와 프로필 사진으로만 이야기에 나옵니다.',
    withdrawnTitle: '동의를 철회하셨습니다',
    withdrawnBody: '자녀분이 나오는 사진과 영상은 공개되지 않으며, 이미 공개된 것은 페이지에서 내려갔습니다.',
    expiredTitle: '만료된 요청입니다',
    expiredBody: '자녀분의 팀이 새 요청을 보낼 수 있습니다. 그동안 이 사진과 영상은 공개되지 않습니다.',
    replacedTitle: '새 요청이 있습니다',
    replacedBody: '사진이 추가되어 새 이메일을 보냈습니다. 가장 최근 이메일의 링크를 열어 주세요.',
    invalidTitle: '유효하지 않은 링크입니다',
    invalidBody: '링크 일부가 빠졌을 수 있습니다. 이메일에 있는 링크를 다시 열어 주세요.',
    error: '문제가 생겼습니다. 잠시 후 다시 시도해 주세요.'
  },
  en: {
    kicker: 'Parent consent · Bridge Builder story',
    loading: 'Loading...',
    title: (child) => `May ${child}'s meetup photos be shared?`,
    intro: (crew) =>
      `Your child met up in real life with students from other Twinkle branches, and their crew "${crew}" is making a story page about the day. These are the photos and clips your child is tagged in.`,
    yourChild: 'Your child',
    childAdded:
      "Your child entered this email so we could ask your permission. If you are not this child's parent or guardian, please close this page: nothing will be shared.",
    photosTitle: (n) => `${n} photo${n === 1 ? '' : 's'} and clip${n === 1 ? '' : 's'} with your child`,
    withOthers: (names) => `Also in it: ${names}`,
    storyTitle: 'The story so far',
    whoSees: 'Who can see it?',
    whoSeesBody:
      "The story page can be seen by Twinkle members who are signed in. Its cover photo is also used in a short announcement in the site's feed, which anyone can see. Your child is shown by username only, never by real name, and no addresses or contact details are posted. A Twinkle admin reviews every story before it goes live.",
    ifNot:
      "If you don't allow it, these photos and clips stay private and your child appears in the story by username and profile picture only. The meetup's review video is never shown.",
    allow: 'I am the parent or legal guardian and I allow it',
    dontAllow: "Don't allow",
    declineHint: "You chose Don't allow in the email. Press it below to confirm.",
    onlyGuardian: 'Only a parent or legal guardian should answer.',
    openUntil: (date) => `You can answer until ${date}.`,
    approvedTitle: 'Thank you for allowing it',
    approvedBody:
      'Once an admin approves the story, these photos and clips go on the page. If you change your mind, withdraw here at any time and the photos and clips your child is in come off the page.',
    withdraw: 'Withdraw my consent',
    withdrawConfirm: 'Withdraw your consent? The photos and clips your child is in come off the page.',
    declinedTitle: "You didn't allow it",
    declinedBody: 'These photos and clips stay private. Your child appears in the story by username and profile picture only.',
    withdrawnTitle: 'You withdrew your consent',
    withdrawnBody: 'The photos and clips your child is in stay private, and any that were live came off the page.',
    expiredTitle: 'This request has expired',
    expiredBody: "Your child's crew can send a new one. Until then these photos and clips stay private.",
    replacedTitle: 'There is a newer request',
    replacedBody: 'The crew added photos and sent a new email. Please open the link in the newest email.',
    invalidTitle: "This link isn't valid",
    invalidBody: 'Part of the link may be missing. Please open the link in the email again.',
    error: 'Something went wrong. Please try again.'
  }
};

export default function ParentConsentPage() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get('token') || '';
  const choseDecline = params.get('choice') === 'decline';
  const loadMeetupStoryConsent = useAppContext((v) => v.requestHelpers.loadMeetupStoryConsent);
  const decideMeetupStoryConsent = useAppContext(
    (v) => v.requestHelpers.decideMeetupStoryConsent
  );
  const [lang, setLang] = useState<Lang>(() => initialLanguage(params.get('lang')));
  const [consent, setConsent] = useState<ParentConsentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const [failed, setFailed] = useState(false);
  const t = TEXT[lang];

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return;
    }
    loadMeetupStoryConsent(token)
      .then((data: { consent: ParentConsentView | null }) => {
        if (active) setConsent(data.consent);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
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

  const child = consent?.child.username || '';

  return (
    <div
      className={css`
        min-height: 100%;
        padding: 3rem 16px 12rem;
        background: #f3f6fa;
        @media (max-width: ${mobileMaxWidth}) {
          padding-top: 1.6rem;
        }
      `}
    >
      <main
        lang={lang}
        className={css`
          max-width: 720px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          padding: 2.8rem 3rem 3rem;
          color: ${Color.darkerGray()};
          font-size: 1.6rem;
          line-height: 1.6;
          word-break: ${lang === 'ko' ? 'keep-all' : 'normal'};
          overflow-wrap: anywhere;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 2rem 1.6rem 2.4rem;
          }
          h1 {
            margin: 0.6rem 0 1.2rem;
            font-size: 2.6rem;
            line-height: 1.3;
            color: #222;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2.1rem;
            }
          }
          h2 {
            margin: 2.2rem 0 0.6rem;
            font-size: 1.8rem;
            color: #222;
          }
          p {
            margin: 0 0 1rem;
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
        <p style={{ marginTop: '2rem', color: Color.darkGray() }}>
          <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />
          {t.loading}
        </p>
      );
    }
    if (!consent) {
      return (
        <>
          <h1>{failed ? t.error : t.invalidTitle}</h1>
          {!failed && <p>{t.invalidBody}</p>}
        </>
      );
    }
    const header = (
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin-top: 1.6rem;
          padding: 1.2rem 1.4rem;
          border-radius: ${borderRadius};
          background: #f3f6fa;
        `}
      >
        {consent.child.profilePicUrl ? (
          <img
            src={consent.child.profilePicUrl}
            alt=""
            className={css`width: 5.2rem; height: 5.2rem; border-radius: 50%; object-fit: cover;`}
          />
        ) : (
          <span
            className={css`
              width: 5.2rem;
              height: 5.2rem;
              border-radius: 50%;
              background: #418ceb;
              color: #fff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 2.2rem;
              font-weight: 900;
            `}
          >
            {child.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div>
          <div style={{ fontSize: '1.3rem', color: Color.darkGray() }}>{t.yourChild}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#222' }}>
            {consent.child.realName ? `${consent.child.realName} · ` : ''}
            {child}
          </div>
        </div>
      </div>
    );
    if (consent.status !== 'pending') {
      const done = {
        approved: { title: t.approvedTitle, body: t.approvedBody, icon: 'check', color: Color.green() },
        declined: { title: t.declinedTitle, body: t.declinedBody, icon: 'times', color: Color.darkGray() },
        withdrawn: { title: t.withdrawnTitle, body: t.withdrawnBody, icon: 'times', color: Color.darkGray() },
        expired: { title: t.expiredTitle, body: t.expiredBody, icon: 'clock', color: Color.darkGray() },
        replaced: { title: t.replacedTitle, body: t.replacedBody, icon: 'paper-plane', color: Color.darkGray() }
      }[consent.status];
      return (
        <div aria-live="polite">
          <Icon icon={done.icon} style={{ fontSize: '3.2rem', marginTop: '2rem', color: done.color }} />
          <h1>{done.title}</h1>
          <p>{done.body}</p>
          {header}
          {consent.status === 'approved' && (
            <>
              {renderItems()}
              <button
                type="button"
                disabled={!!submitting}
                onClick={() => {
                  if (window.confirm(t.withdrawConfirm)) decide('withdraw');
                }}
                className={css`
                  margin-top: 2rem;
                  width: 100%;
                  padding: 1.2rem 1.6rem;
                  font-size: 1.6rem;
                  font-weight: 700;
                  border-radius: ${borderRadius};
                  border: 1px solid var(--ui-border-strong, #bbb);
                  background: #fff;
                  color: ${Color.darkerGray()};
                  cursor: pointer;
                `}
              >
                {submitting === 'withdraw' && <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />}
                {t.withdraw}
              </button>
            </>
          )}
          {failed && <p role="alert" style={{ marginTop: '1rem', color: '#c0392b' }}>{t.error}</p>}
        </div>
      );
    }
    return (
      <>
        <h1>{t.title(child)}</h1>
        {consent.addedByChild && (
          <p
            className={css`
              padding: 1rem 1.2rem;
              border-radius: ${borderRadius};
              background: #fff7e6;
              border: 1px solid #f5d38a;
            `}
          >
            {t.childAdded}
          </p>
        )}
        <p>{t.intro(consent.story.crewName)}</p>
        {header}
        {renderItems()}
        <h2>{t.storyTitle}</h2>
        <div
          className={css`
            padding: 1.4rem 1.6rem;
            border-radius: ${borderRadius};
            border: 1px solid var(--ui-border);
            font-size: 1.5rem;
          `}
        >
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#222' }}>
            {consent.story.title || '—'}
          </div>
          {consent.story.subtitle && <div style={{ color: Color.darkGray() }}>{consent.story.subtitle}</div>}
          <div style={{ marginTop: '0.8rem', fontSize: '1.35rem', color: Color.darkGray() }}>
            {[consent.story.dateLabel, consent.story.branches.join(' · '), consent.story.people.join(', ')]
              .filter(Boolean)
              .join('  ·  ')}
          </div>
          {consent.story.body && (
            <p
              lang="en"
              className={css`
                margin-top: 1rem !important;
                white-space: pre-wrap;
                max-height: 24rem;
                overflow-y: auto;
              `}
            >
              {consent.story.body}
            </p>
          )}
        </div>
        <h2>{t.whoSees}</h2>
        <p>{t.whoSeesBody}</p>
        <p>{t.ifNot}</p>
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
            onClick={() => decide('approve')}
            className={css`
              border: none;
              background: #0077cc;
              color: #fff;
              &:hover:not(:disabled) {
                background: #005fa3;
              }
            `}
          >
            {submitting === 'approve' && <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />}
            {t.allow}
          </button>
          <button
            type="button"
            autoFocus={choseDecline}
            disabled={!!submitting}
            onClick={() => decide('decline')}
            className={css`
              border: 1px solid var(--ui-border-strong, #bbb);
              background: #fff;
              color: ${Color.darkerGray()};
            `}
          >
            {submitting === 'decline' && <Icon icon="spinner" pulse style={{ marginRight: '0.7rem' }} />}
            {t.dontAllow}
          </button>
        </div>
        {failed && <p role="alert" style={{ marginTop: '1rem', color: '#c0392b' }}>{t.error}</p>}
        <p style={{ marginTop: '1.4rem', fontSize: '1.4rem', color: Color.darkGray() }}>
          {t.onlyGuardian}{' '}
          {t.openUntil(
            new Date(consent.expiresAt * 1000).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          )}
        </p>
      </>
    );
  }

  function renderItems() {
    if (!consent?.items.length) return null;
    return (
      <>
        <h2>{t.photosTitle(consent.items.length)}</h2>
        <div
          className={css`
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1.2rem;
            @media (max-width: ${mobileMaxWidth}) {
              grid-template-columns: minmax(0, 1fr);
            }
          `}
        >
          {consent.items.map((item) => (
            <figure
              key={item.id}
              className={css`
                margin: 0;
                border-radius: ${borderRadius};
                overflow: hidden;
                border: 1px solid var(--ui-border);
                background: #fff;
              `}
            >
              {item.kind === 'photo' ? (
                <img
                  src={item.url}
                  alt={item.caption}
                  className={css`display: block; width: 100%; height: auto;`}
                />
              ) : (
                <div style={{ position: 'relative', background: '#000' }}>
                  <video
                    src={item.url}
                    poster={item.posterUrl || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className={css`display: block; width: 100%;`}
                  />
                  <span
                    className={css`
                      position: absolute;
                      top: 0.6rem;
                      right: 0.6rem;
                      padding: 0.2rem 0.7rem;
                      border-radius: 999px;
                      background: rgba(0, 0, 0, 0.6);
                      color: #fff;
                      font-size: 1.2rem;
                    `}
                  >
                    {formatDuration(item.durationSec)}
                  </span>
                </div>
              )}
              {(item.caption || item.withOthers.length > 0) && (
                <figcaption className={css`padding: 0.8rem 1rem; font-size: 1.35rem;`}>
                  {item.caption && <div lang="en">{item.caption}</div>}
                  {item.withOthers.length > 0 && (
                    <div style={{ color: Color.darkGray() }}>{t.withOthers(item.withOthers.join(', '))}</div>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
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

  async function decide(decision: 'approve' | 'decline' | 'withdraw') {
    if (submitting) return;
    setSubmitting(decision);
    setFailed(false);
    try {
      const data = await decideMeetupStoryConsent({ token, decision });
      setConsent(data.consent);
    } catch {
      setFailed(true);
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
    // no storage
  }
  const languages =
    typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : [navigator.language]
      : [];
  return languages.some((value) => /^ko\b/i.test(String(value || ''))) ? 'ko' : 'en';
}
