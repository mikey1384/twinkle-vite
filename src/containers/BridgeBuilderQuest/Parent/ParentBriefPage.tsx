import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import CrewCover from '../CrewCover';
import { useAppContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

// /bridge-builder/parent?token=... : a parent or guardian looks at one
// meetup on one screen (who, what, where, when, which grown-up) and answers
// Yes, "I have a question", or No. No account. Opening the page changes
// nothing; only a button does (mail scanners open links). The same link
// changes the answer later. Korean first for a Korean browser; ?lang= wins.
// Children never see this page's contact details (they are only for adults).

type Lang = 'ko' | 'en';
const LANG_KEY = 'twinkle-guardian-lang';

interface Brief {
  status: 'pending' | 'approved' | 'declined' | 'question' | 'expired' | 'replaced';
  expiresAt: number;
  language: Lang;
  addedByChild: boolean;
  canShareContact: boolean;
  shareContact: boolean;
  question: string;
  staffReply: string;
  child: string;
  crew: {
    name: string;
    branches: string[];
    members: { username: string; branch: string; answer: 'yes' | 'no' | 'waiting' }[];
    parentsSaidYes: number;
  };
  cover: string;
  crewAbout: string;
  willingGuardian: boolean;
  offersPlace: boolean;
  activity: string;
  where: { kind: 'academy' | 'home' | 'other' | 'undecided'; branch: string; room: string; area: string };
  when: { date: string; time?: string; slot: { date: string; start: string; end: string } | null };
  adult: { kind: string; name: string };
  planStatus: string;
  meetupDone: boolean;
  otherParents: { childUsername: string; email: string }[];
  suggestions: { childUsername: string; body: string; createdAt: number }[];
}

const TEXT = {
  ko: {
    kicker: '보호자 확인 · Bridge Builder 모임',
    loading: '불러오는 중...',
    title: (child: string) => `${child}의 모임을 확인해 주세요`,
    intro: '자녀분이 Twinkle에서 알게 된 친구들과 직접 만나는 모임을 계획하고 있습니다. 필요한 내용만 한 화면에 모았습니다.',
    childAdded:
      '자녀분이 보호자님의 허락을 구하려고 이 이메일 주소를 직접 입력했습니다. 자녀분의 보호자가 아니시라면 이 페이지를 닫아 주세요. 아무 일도 일어나지 않습니다.',
    heroTitle: (child: string) => `${child}와 친구들이 직접 만나려고 해요`,
    heroSub: '아이들이 직접 세운 계획입니다. 다른 보호자님들의 답과 제안도 함께 보실 수 있어요.',
    planTitle: '아이들의 계획',
    planPending: '계획이 아직 확정되지 않았습니다. 확정되면 이 링크에서 볼 수 있습니다.',
    adultHere: '함께하는 어른',
    adultMissing: '다음 단계에서 아이들이 함께하는 어른을 정합니다.',
    offersTitle: '도와주실 수 있나요? (선택)',
    offerGuardian: '필요하다면 제가 보호자로 함께할 의향이 있습니다',
    offerPlace: '모임 장소로 저희 집을 제공할 의향이 있습니다',
    revising: '아이들이 계획을 고치고 있어요. 바뀐 계획이 나오면 다시 보내 드릴게요.',
    hostNeeded: '이 계획은 한 가정이 집을 내어 주셔야 진행돼요. 가능하시면 체크해 주세요.',
    offersNote: '체크는 의향을 알려 주시는 것일 뿐입니다. 실제로 누가 어떤 역할을 맡을지는 다음 단계에서 정해지고, 필요하면 다시 연락드립니다.',
    placeAcademy: (branch: string) => `Twinkle ${branch} 지점 교실 (선생님이 함께)`,
    placeHome: (area: string) => `멤버의 집 · ${area} (보호자가 함께)`,
    who: '누가 오나요',
    parentsAnswered: (yes: number, all: number) => `보호자 ${all}명 중 ${yes}명이 허락했어요`,
    answerYes: '보호자 허락',
    answerNo: '이번엔 쉬어요',
    answerWaiting: '답을 기다리는 중',
    suggest: '바꿀 점 제안하기',
    suggestLabel: '계획에서 바꾸면 좋을 점을 적어 주세요 (활동, 날짜, 장소 등). 아이들과 다른 보호자님들이 보게 됩니다.',
    suggestionsTitle: '보호자님들의 제안',
    suggestionBy: (child: string) => `${child}의 보호자`,
    yourChild: '자녀분',
    what: '무엇을 하나요',
    where: '어디서 하나요',
    whereAcademy: (branch: string, room: string) => `Twinkle ${branch} 지점${room ? ` ${room}` : ''} (선생님이 함께합니다)`,
    whereNone: '기본은 Twinkle 지점 교실이고 선생님이 함께합니다. 장소와 시간은 운영진이 정하며, 정해지면 이 링크에서 볼 수 있습니다.',
    when: '언제인가요',
    whenNone: '아직 정해지지 않았습니다. 정해지면 이 링크에서 볼 수 있습니다.',
    adult: '함께하는 어른',
    adultNone: '아직 정해지지 않았습니다.',
    parent: '보호자',
    teacher: 'Twinkle 선생님',
    safetyPoints: [
      '모임에는 항상 보호자 또는 Twinkle 선생님이 함께합니다.',
      'Twinkle이 누가 참여하는지 살펴 안전을 지킵니다.',
      '집 주소는 온라인에 올리지 않습니다.',
      '모임 영상은 공개되지 않습니다.'
    ],
    yes: '네, 허락합니다',
    question: '질문이 있어요',
    no: '허락하지 않습니다',
    shareLabel: '이 모임의 다른 보호자와 어른들이 연락할 수 있도록 제 이메일을 공유합니다 (아이들에게는 보이지 않습니다)',
    staffAnswered: 'Twinkle 운영진의 답변',
    questionLabel: '질문을 적어 주세요. Twinkle 운영진이 답변드립니다.',
    send: '보내기',
    cancel: '취소',
    doneYesTitle: '허락해 주셔서 감사합니다',
    doneYesBody: '감사합니다. 시간과 장소가 정해지면 이 링크에서 다시 보실 수 있어요.',
    doneNoTitle: '허락하지 않으셨습니다',
    doneNoBody: '자녀분은 이번 모임에서 쉬어요. 아이들에게 전해 드릴게요. 마음이 바뀌시면 이 링크에서 언제든 바꾸실 수 있어요.',
    doneQuestionTitle: '질문이 전달되었습니다',
    doneQuestionBody: '답변을 드리면 이 링크에서 보실 수 있어요. 편하실 때 다시 답해 주세요.',
    change: '답을 바꾸시려면 아래에서 다시 선택하세요.',
    others: '이 모임의 다른 보호자',
    othersNote: '다른 보호자께서 공유를 허락한 연락처입니다. 모임 조율에만 사용해 주세요.',
    expiredTitle: '만료된 링크입니다',
    expiredBody: '자녀분에게 새 링크를 보내 달라고 해 주세요.',
    replacedTitle: '새 링크가 있습니다',
    replacedBody: '가장 최근 이메일의 링크를 열어 주세요.',
    invalidTitle: '유효하지 않은 링크입니다',
    invalidBody: '링크 일부가 빠졌을 수 있습니다. 이메일의 링크를 다시 열어 주세요.',
    closed: '이 모임은 이미 끝났거나 닫혔습니다.',
    error: '문제가 생겼습니다. 잠시 후 다시 시도해 주세요.'
  },
  en: {
    kicker: 'Parent check · Bridge Builder meetup',
    loading: 'Loading...',
    title: (child: string) => `Please take a look at ${child}'s meetup`,
    intro: 'Your child is planning to meet in real life with friends they know from Twinkle. Everything you need is on this one screen.',
    childAdded:
      "Your child entered this email so we could ask your permission. If you are not this child's parent or guardian, please close this page: nothing will happen.",
    heroTitle: (child: string) => `${child} and friends want to meet up`,
    heroSub: "A plan the kids made themselves. You can see the other parents' answers and suggestions here too.",
    planTitle: "The kids' plan",
    planPending: 'The plan is not final yet. You will see it on this link once it is.',
    adultHere: 'Grown-up there',
    adultMissing: 'The kids name the grown-up in the next step.',
    offersTitle: 'Can you help? (optional)',
    offerGuardian: 'I am willing to be a guardian at this meetup if needed',
    offerPlace: 'I am willing to offer my home as the meeting place',
    revising: 'The kids are changing their plan. We will send you the new version.',
    hostNeeded: 'This plan needs one family to host. Tick if yours can.',
    offersNote: 'Ticking only tells us you are willing. Who actually takes each role is decided in the next step, and we will check with you again if needed.',
    placeAcademy: (branch: string) => `Twinkle ${branch} branch classroom (a teacher is there)`,
    placeHome: (area: string) => `A member's home · ${area} (a parent is there)`,
    who: "Who's coming",
    parentsAnswered: (yes: number, all: number) => `${yes} of ${all} parents said yes`,
    answerYes: 'parent said yes',
    answerNo: 'sitting this one out',
    answerWaiting: 'waiting for a parent',
    suggest: 'Suggest a change',
    suggestLabel: 'What would you change in the plan (activity, date, place...)? The kids and the other parents will see it.',
    suggestionsTitle: "Parents' suggestions",
    suggestionBy: (child: string) => `${child}'s parent`,
    yourChild: 'your child',
    what: 'What they will do',
    where: 'Where',
    whereAcademy: (branch: string, room: string) => `Twinkle ${branch} branch${room ? `, ${room}` : ''} (a teacher is there)`,
    whereNone: 'By default, a Twinkle branch classroom with a teacher. Staff set the place and time, and you will see it here.',
    when: 'When',
    whenNone: 'Not set yet. You will see it on this link once it is.',
    adult: 'Grown-up there',
    adultNone: 'Not named yet.',
    parent: 'Parent',
    teacher: 'Twinkle teacher',
    safetyPoints: [
      'A parent or a Twinkle teacher is always there.',
      'Twinkle keeps an eye on who takes part to keep everyone safe.',
      'Home addresses are never posted online.',
      'The meetup video is never made public.'
    ],
    yes: "Yes, I'm OK with this",
    question: 'I have a question',
    no: "No, I don't allow it",
    shareLabel: "Share my email with this meetup's other parents and grown-ups so we can coordinate (children never see it)",
    staffAnswered: 'Answer from Twinkle staff',
    questionLabel: 'Write your question. Twinkle staff will answer.',
    send: 'Send',
    cancel: 'Cancel',
    doneYesTitle: 'Thank you for saying yes',
    doneYesBody: 'Thank you. You can come back to this link to see the time and place once they are set.',
    doneNoTitle: 'You said no',
    doneNoBody: 'Your child sits this one out. We will let the kids know. You can change your answer on this link any time.',
    doneQuestionTitle: 'Your question was sent',
    doneQuestionBody: 'You will see the answer on this link. Answer again whenever you are ready.',
    change: 'To change your answer, choose again below.',
    others: "This meetup's other parents",
    othersNote: 'These parents chose to share their contact. Please use it only to coordinate the meetup.',
    expiredTitle: 'This link has expired',
    expiredBody: 'Ask your child to send a new one.',
    replacedTitle: 'There is a newer link',
    replacedBody: 'Please open the link in the most recent email.',
    invalidTitle: 'This link is not valid',
    invalidBody: 'Part of the link may be missing. Please open the link in your email again.',
    closed: 'This meetup is already finished or closed.',
    error: 'Something went wrong. Please try again in a moment.'
  }
} as const;

const cardClass = css`
  padding: 1.2rem 1.4rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.2rem;
  background: #fff;
  margin-top: 1rem;
  h3 {
    margin: 0 0 0.4rem;
    font-size: 1.35rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${Color.darkGray()};
  }
  p {
    margin: 0;
  }
`;

export default function ParentBriefPage() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.get('token') || '';
  const loadMeetupParentBrief = useAppContext((v) => v.requestHelpers.loadMeetupParentBrief);
  const decideMeetupParentBrief = useAppContext((v) => v.requestHelpers.decideMeetupParentBrief);
  const suggestMeetupPlanChange = useAppContext((v) => v.requestHelpers.suggestMeetupPlanChange);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<'' | 'question' | 'suggest'>('');
  const [suggestion, setSuggestion] = useState('');
  const [question, setQuestion] = useState('');
  const [share, setShare] = useState(false);
  const [willing, setWilling] = useState(false);
  const [offerHome, setOfferHome] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<Lang>(() => {
    const asked = params.get('lang');
    if (asked === 'ko' || asked === 'en') return asked;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'ko' || saved === 'en') return saved;
    } catch {
      /* the page works without storage */
    }
    return navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  });
  const t = TEXT[lang];

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return;
    }
    loadMeetupParentBrief(token)
      .then((data: { brief: Brief | null }) => {
        if (active) {
          setBrief(data.brief);
          setWilling(!!data.brief?.willingGuardian);
          setOfferHome(!!data.brief?.offersPlace);
        }
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

  const chooseLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* fine */
    }
  };

  const answered = brief && ['approved', 'declined', 'question'].includes(brief.status);
  const canAnswer = brief && ['pending', 'approved', 'declined', 'question'].includes(brief.status) && !brief.meetupDone;
  const slot = brief?.when.slot;
  const planDate = (() => {
    const raw = slot?.date || brief?.when.date || '';
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    const fmt = (opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', { ...opts, timeZone: 'UTC' }).format(d);
    return { month: fmt({ month: 'short' }), day: String(d.getUTCDate()), weekday: fmt({ weekday: 'long' }) };
  })();

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
            margin: 0.6rem 0 0.8rem;
            font-size: 2.6rem;
            line-height: 1.3;
            color: #222;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2.1rem;
            }
          }
        `}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: Color.darkGray() }}>
            {t.kicker}
          </span>
          <div role="group" aria-label="Language" style={{ display: 'flex', border: '1px solid var(--ui-border)', borderRadius: 999, overflow: 'hidden' }}>
            {(['ko', 'en'] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                onClick={() => chooseLang(code)}
                style={{
                  border: 0,
                  padding: '0.7rem 1.4rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  background: lang === code ? Color.logoBlue() : '#fff',
                  color: lang === code ? '#fff' : Color.darkerGray()
                }}
              >
                {code === 'ko' ? '한국어' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {loading && <p style={{ marginTop: '2rem' }}>{t.loading}</p>}
        {!loading && (failed || !brief) && (
          <>
            <h1>{t.invalidTitle}</h1>
            <p>{failed ? t.error : t.invalidBody}</p>
          </>
        )}
        {brief && brief.status === 'expired' && (
          <>
            <h1>{t.expiredTitle}</h1>
            <p>{t.expiredBody}</p>
          </>
        )}
        {brief && brief.status === 'replaced' && (
          <>
            <h1>{t.replacedTitle}</h1>
            <p>{t.replacedBody}</p>
          </>
        )}

        {brief && !['expired', 'replaced'].includes(brief.status) && (
          <>
            <div style={{ margin: '1.2rem -0.4rem 0' }}>
              <CrewCover cover={brief.cover || 'galaxy'} height="10rem" rounded="1.2rem" />
            </div>
            <h1>{t.heroTitle(brief.child)}</h1>
            <p style={{ margin: 0 }}>{t.heroSub}</p>
            {brief.addedByChild && (
              <p style={{ padding: '1rem 1.2rem', borderRadius: 8, background: '#f3f6fa' }}>{t.childAdded}</p>
            )}

            <section
              className={css`
                margin-top: 1.6rem;
                border-radius: 1.4rem;
                overflow: hidden;
                border: 1px solid ${Color.logoBlue(0.35)};
                background: #fff;
                box-shadow: 0 2px 10px rgba(30, 80, 160, 0.08);
              `}
            >
              <div
                style={{
                  background: `linear-gradient(135deg, ${Color.logoBlue()}, ${Color.purple()})`,
                  color: '#fff',
                  padding: '0.8rem 1.4rem',
                  fontWeight: 700,
                  fontSize: '1.4rem',
                  letterSpacing: '0.03em'
                }}
              >
                <Icon icon="clipboard-check" style={{ marginRight: '0.6rem' }} />
                {t.planTitle} · {brief.crew.name}
              </div>
              {brief.activity ? (
                <div style={{ padding: '1.6rem 1.6rem 1.2rem' }}>
                  <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                    {planDate && (
                      <div
                        style={{
                          minWidth: '8.4rem',
                          textAlign: 'center',
                          border: `2px solid ${Color.logoBlue()}`,
                          borderRadius: '1.2rem',
                          overflow: 'hidden',
                          alignSelf: 'flex-start'
                        }}
                      >
                        <div style={{ background: Color.logoBlue(), color: '#fff', fontSize: '1.2rem', fontWeight: 700, padding: '0.2rem 0' }}>
                          {planDate.month}
                        </div>
                        <div style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.1, color: Color.darkerGray() }}>{planDate.day}</div>
                        <div style={{ fontSize: '1.2rem', color: Color.darkGray(), paddingBottom: '0.4rem' }}>{planDate.weekday}</div>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: '16rem' }}>
                      <div style={{ fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.4, color: '#222' }}>
                        &ldquo;{brief.activity}&rdquo;
                      </div>
                      <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.4rem', fontSize: '1.45rem' }}>
                        <span>
                          <Icon icon="location-dot" style={{ marginRight: '0.5rem', color: Color.logoBlue() }} />
                          {(() => {
                            const rest = brief.where.area.replace(/^home · /i, '');
                            if (brief.where.kind === 'academy' && brief.where.branch) {
                              return t.whereAcademy(brief.where.branch, brief.where.room);
                            }
                            if (brief.where.kind === 'academy') return t.placeAcademy(rest.replace(/^twinkle | branch classroom$/gi, ''));
                            if (brief.where.kind === 'home') return t.placeHome(rest);
                            return brief.where.area || t.whereNone;
                          })()}
                        </span>
                        {slot ? (
                          <span>
                            <Icon icon="clock" style={{ marginRight: '0.5rem', color: Color.logoBlue() }} />
                            {slot.start}–{slot.end}
                          </span>
                        ) : brief.when.time ? (
                          <span>
                            <Icon icon="clock" style={{ marginRight: '0.5rem', color: Color.logoBlue() }} />
                            {brief.when.time}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ padding: '1.4rem 1.6rem' }}>{t.planPending}</p>
              )}

              <div style={{ padding: '0 1.6rem 1.4rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: Color.darkGray(), marginBottom: '0.6rem' }}>
                  <Icon icon="users" style={{ marginRight: '0.5rem' }} />
                  {t.who} ·{' '}
                  {t.parentsAnswered(
                    brief.crew.members.filter((m) => m.answer === 'yes').length,
                    brief.crew.members.length
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {brief.crew.members.map((member) => (
                    <span
                      key={member.username}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.3rem 1rem 0.3rem 0.4rem',
                        borderRadius: 999,
                        background: member.username === brief.child ? Color.logoBlue(0.12) : '#f3f6fa',
                        fontSize: '1.35rem'
                      }}
                    >
                      <span
                        style={{
                          width: '2.4rem',
                          height: '2.4rem',
                          borderRadius: '50%',
                          background: Color.logoBlue(0.8),
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.2rem'
                        }}
                      >
                        {member.username.charAt(0).toUpperCase()}
                      </span>
                      <b>{member.username}</b>
                      {member.username === brief.child ? <span>({t.yourChild})</span> : null}
                      <span style={{ color: Color.darkGray() }}>· {member.branch}</span>
                      <span
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: member.answer === 'yes' ? Color.green() : Color.darkGray()
                        }}
                      >
                        · {member.answer === 'yes' ? t.answerYes : member.answer === 'no' ? t.answerNo : t.answerWaiting}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: '1.2rem 1.6rem',
                  background: brief.adult.name ? Color.green(0.07) : Color.orange(0.1),
                  borderTop: '1px solid var(--ui-border)'
                }}
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: Color.darkGray() }}>
                  <Icon icon="user-shield" style={{ marginRight: '0.5rem' }} />
                  {t.adultHere}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.3rem' }}>
                  {brief.adult.name
                    ? `${brief.adult.name} (${brief.adult.kind === 'teacher' ? t.teacher : t.parent})`
                    : t.adultMissing}
                </div>
              </div>
            </section>

            {brief.suggestions.length > 0 && (
              <section className={cardClass}>
                <h3>
                  <Icon icon="comments" style={{ marginRight: '0.6rem' }} />
                  {t.suggestionsTitle}
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.8rem' }}>
                  {brief.suggestions.map((item) => (
                    <li key={`${item.createdAt}-${item.childUsername}`} style={{ marginTop: '0.4rem' }}>
                      &ldquo;{item.body}&rdquo;{' '}
                      <span style={{ color: Color.darkGray(), fontSize: '1.25rem' }}>
                        · {t.suggestionBy(item.childUsername)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.2rem' }}>
              {t.safetyPoints.map((point) => (
                <span
                  key={point}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: 999,
                    background: Color.green(0.08),
                    border: `1px solid ${Color.green(0.3)}`,
                    fontSize: '1.25rem'
                  }}
                >
                  <Icon icon="circle-check" style={{ marginRight: '0.5rem', color: Color.green() }} />
                  {point}
                </span>
              ))}
            </div>

            {answered && (
              <section className={cardClass} style={{ borderColor: Color.logoBlue(0.4) }}>
                <b>
                  {brief.status === 'approved'
                    ? t.doneYesTitle
                    : brief.status === 'declined'
                      ? t.doneNoTitle
                      : t.doneQuestionTitle}
                </b>
                <p>
                  {brief.status === 'approved'
                    ? t.doneYesBody
                    : brief.status === 'declined'
                      ? t.doneNoBody
                      : t.doneQuestionBody}
                </p>
              </section>
            )}

            {brief.status === 'question' && brief.staffReply && (
              <section className={cardClass} style={{ borderColor: Color.green(0.5) }}>
                <b>{t.staffAnswered}</b>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{brief.staffReply}</p>
              </section>
            )}

            {brief.status === 'approved' && brief.otherParents.length > 0 && (
              <section className={cardClass}>
                <h3>
                  <Icon icon="address-book" style={{ marginRight: '0.6rem' }} />
                  {t.others}
                </h3>
                <p style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>{t.othersNote}</p>
                <ul style={{ margin: 0, paddingLeft: '2rem' }}>
                  {brief.otherParents.map((parent) => (
                    <li key={parent.email}>
                      <b>{parent.childUsername}</b>: {parent.email}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {canAnswer && brief.planStatus !== 'approved' && (
              <p style={{ marginTop: '1.4rem', fontWeight: 700 }}>{t.revising}</p>
            )}
            {!canAnswer && <p style={{ marginTop: '1.4rem' }}>{t.closed}</p>}
            {canAnswer && (
              <section style={{ marginTop: '1.6rem' }}>
                {answered && <p style={{ fontSize: '1.4rem' }}>{t.change}</p>}
                {mode === 'suggest' ? (
                  <div>
                    <label htmlFor="parent-suggestion" style={{ fontWeight: 700 }}>
                      {t.suggestLabel}
                    </label>
                    <textarea
                      id="parent-suggestion"
                      value={suggestion}
                      maxLength={500}
                      onChange={(event) => setSuggestion(event.target.value)}
                      style={{ width: '100%', minHeight: '9rem', marginTop: '0.6rem', padding: '1rem', fontFamily: 'inherit', fontSize: '1.5rem', border: '1px solid var(--ui-border)', borderRadius: 8 }}
                    />
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                      <button type="button" disabled={busy || !suggestion.trim()} onClick={sendSuggestion} style={primaryButton(Color.logoBlue())}>
                        {t.send}
                      </button>
                      <button type="button" disabled={busy} onClick={() => setMode('')} style={secondaryButton}>
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                ) : mode === 'question' ? (
                  <div>
                    <label htmlFor="parent-question" style={{ fontWeight: 700 }}>
                      {t.questionLabel}
                    </label>
                    <textarea
                      id="parent-question"
                      value={question}
                      maxLength={500}
                      onChange={(event) => setQuestion(event.target.value)}
                      style={{ width: '100%', minHeight: '9rem', marginTop: '0.6rem', padding: '1rem', fontFamily: 'inherit', fontSize: '1.5rem', border: '1px solid var(--ui-border)', borderRadius: 8 }}
                    />
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                      <button type="button" disabled={busy || !question.trim()} onClick={() => decide('question')} style={primaryButton(Color.logoBlue())}>
                        {t.send}
                      </button>
                      <button type="button" disabled={busy} onClick={() => setMode('')} style={secondaryButton}>
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '1.2rem' }}>
                      <fieldset
                        style={{
                          border: '1px solid var(--ui-border)',
                          borderRadius: '1.2rem',
                          padding: '1.2rem 1.4rem',
                          margin: '0 0 1.2rem'
                        }}
                      >
                        <legend style={{ fontWeight: 800, fontSize: '1.45rem', padding: '0 0.6rem' }}>
                          {t.offersTitle}
                        </legend>
                        <label style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', fontSize: '1.45rem', marginBottom: '0.6rem' }}>
                          <input type="checkbox" checked={willing} onChange={(event) => setWilling(event.target.checked)} style={{ marginTop: '0.3rem', width: '2.2rem', height: '2.2rem', flexShrink: 0 }} />
                          <span>{t.offerGuardian}</span>
                        </label>
                        {brief.where.kind === 'home' && (
                          <p style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.6rem' }}>{t.hostNeeded}</p>
                        )}
                        {brief.where.kind === 'home' && (
                          <label style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', fontSize: '1.45rem', marginBottom: '0.6rem' }}>
                            <input type="checkbox" checked={offerHome} onChange={(event) => setOfferHome(event.target.checked)} style={{ marginTop: '0.3rem', width: '2.2rem', height: '2.2rem', flexShrink: 0 }} />
                            <span>{t.offerPlace}</span>
                          </label>
                        )}
                        <p style={{ fontSize: '1.25rem', color: Color.darkGray(), margin: '0.4rem 0 0' }}>{t.offersNote}</p>
                      </fieldset>
                      {brief.canShareContact && (
                        <label style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', fontSize: '1.4rem' }}>
                          <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} style={{ marginTop: '0.3rem', width: '2.2rem', height: '2.2rem', flexShrink: 0 }} />
                          <span>{t.shareLabel}</span>
                        </label>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={busy || brief.planStatus !== 'approved'}
                        onClick={() => decide('approve')}
                        style={{
                          ...primaryButton(Color.green()),
                          opacity: busy || brief.planStatus !== 'approved' ? 0.4 : 1,
                          cursor: busy ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {t.yes}
                      </button>
                      <button type="button" disabled={busy} onClick={() => setMode('suggest')} style={secondaryButton}>
                        {t.suggest}
                      </button>
                      <button type="button" disabled={busy} onClick={() => setMode('question')} style={secondaryButton}>
                        {t.question}
                      </button>
                      <button type="button" disabled={busy} onClick={() => decide('decline')} style={secondaryButton}>
                        {t.no}
                      </button>
                    </div>
                  </>
                )}
                {error && <p style={{ color: Color.red(), marginTop: '1rem' }}>{error}</p>}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );

  async function sendSuggestion() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await suggestMeetupPlanChange({ token, body: suggestion });
      if (data?.brief) setBrief(data.brief);
      setSuggestion('');
      setMode('');
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: 'approve' | 'decline' | 'question') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await decideMeetupParentBrief({
        token,
        decision,
        question: decision === 'question' ? question : undefined,
        shareContact: decision === 'approve' ? share : undefined,
        willingGuardian: decision === 'approve' ? willing : undefined,
        offersPlace: decision === 'approve' ? offerHome : undefined,
      });
      if (data?.brief) setBrief(data.brief);
      setMode('');
    } catch (err: any) {
      setError(err?.message || t.error);
    } finally {
      setBusy(false);
    }
  }
}

const primaryButton = (background: string): React.CSSProperties => ({
  border: 0,
  borderRadius: 999,
  padding: '1rem 2.2rem',
  fontFamily: 'inherit',
  fontSize: '1.6rem',
  fontWeight: 700,
  color: '#fff',
  background,
  cursor: 'pointer'
});

const secondaryButton: React.CSSProperties = {
  border: '1px solid var(--ui-border)',
  borderRadius: 999,
  padding: '1rem 1.8rem',
  fontFamily: 'inherit',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: Color.darkerGray(),
  background: '#fff',
  cursor: 'pointer'
};
