import React from 'react';
import { css } from '@emotion/css';

// Korean for a Korean browser (the parent pages' rule); English otherwise.
const SIGNIN_TEXT = {
  en: {
    titleFor: (app: string) => `Sign in to ${app}`,
    title: 'Sign in with Twinkle',
    by: (owner: string, host: string) => `by ${owner} · ${host}`,
    wrongOrigin: 'This sign-in didn’t come from the app’s own address.',
    sees: 'It will see your username and picture.',
    saves: 'It can save your progress and play with friends in this app.',
    coins: 'It can ask you to spend Coins. You confirm each one.',
    cant: 'It can’t see your messages or change your account.',
    continueAs: (name: string) => `Continue as ${name}`,
    cancel: 'Cancel',
    signInFirst: 'Sign in to Twinkle'
  },
  ko: {
    titleFor: (app: string) => `${app}에 로그인`,
    title: '트윈클로 로그인',
    by: (owner: string, host: string) => `만든 사람: ${owner} · ${host}`,
    wrongOrigin: '이 로그인 요청은 앱의 주소에서 온 것이 아니에요.',
    sees: '내 아이디와 프로필 사진을 볼 수 있어요.',
    saves: '이 앱에서 진행 상황을 저장하고 친구와 함께할 수 있어요.',
    coins: '코인 사용을 요청할 수 있어요. 쓸 때마다 내가 직접 확인해요.',
    cant: '내 메시지를 보거나 계정을 바꿀 수는 없어요.',
    continueAs: (name: string) => `${name}(으)로 계속하기`,
    cancel: '취소',
    signInFirst: '트윈클에 로그인하기'
  }
};

function signInLang(): 'ko' | 'en' {
  try {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    return languages.some((value) => /^ko\b/i.test(String(value || ''))) ? 'ko' : 'en';
  } catch {
    return 'en';
  }
}

// The "Sign in with Twinkle" card for a Lumine app on its own address
// (container: ./index.tsx). Plain view so the preview renders the same card.
export default function SignInCardView({
  app,
  host,
  originAllowed,
  error,
  userId,
  username,
  busy,
  allow,
  handBack,
  onOpenSigninModal
}: {
  app: { title: string; ownerUsername: string; thumbnailUrl: string | null } | null;
  host: string;
  originAllowed: boolean;
  error: string;
  userId: number | null;
  username: string | null;
  busy: boolean;
  allow: () => void;
  handBack: (code: string | null) => void;
  onOpenSigninModal: () => void;
}) {
  const t = SIGNIN_TEXT[signInLang()];
  return (
    <div
      className={css`
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1.5rem 1rem;
        background: #f6f6fb;
        font-size: 1.1rem;
      `}
    >
      <div
        className={css`
          width: 100%;
          max-width: 26rem;
          background: #fff;
          border-radius: 1.4rem;
          padding: 1.6rem 1.4rem;
          box-shadow: 0 10px 40px rgba(20, 20, 40, 0.08);
          text-align: center;
        `}
      >
        {app?.thumbnailUrl ? (
          <img src={app.thumbnailUrl} alt="" style={{ width: '4.5rem', height: '4.5rem', borderRadius: '1.1rem', objectFit: 'cover' }} />
        ) : (
          <div style={{ fontSize: '2.4rem' }} aria-hidden="true">✦</div>
        )}
        <h2 style={{ margin: '0.8rem 0 0.4rem', fontSize: '1.45rem' }}>
          {app ? t.titleFor(app.title) : t.title}
        </h2>
        {app && <p style={{ color: '#5d5d6e', margin: '0 0 1rem' }}>{t.by(app.ownerUsername, host)}</p>}
        {error && <p style={{ color: '#b42318' }}>{error}</p>}
        {app && !originAllowed && <p style={{ color: '#b42318' }}>{t.wrongOrigin}</p>}
        {app && originAllowed && (
          <>
            <ul style={{ textAlign: 'left', color: '#33333f', paddingLeft: '1.2rem', margin: '0 0 1.2rem' }}>
              <li>{t.sees}</li>
              <li>{t.saves}</li>
              <li>{t.coins}</li>
              <li>{t.cant}</li>
            </ul>
            {userId ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={allow}
                  style={{ width: '100%', border: 0, borderRadius: 999, padding: '0.9rem', background: '#16161f', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}
                >
                  {t.continueAs(String(username || ''))}
                </button>
                <button
                  type="button"
                  onClick={() => handBack(null)}
                  style={{ width: '100%', marginTop: '0.5rem', border: 0, borderRadius: 999, padding: '0.9rem', background: '#f0f0f6', color: '#16161f', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}
                >
                  {t.cancel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onOpenSigninModal()}
                style={{ width: '100%', border: 0, borderRadius: 999, padding: '0.9rem', background: '#16161f', color: '#fff', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}
              >
                {t.signInFirst}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
