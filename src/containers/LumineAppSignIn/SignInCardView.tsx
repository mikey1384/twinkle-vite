import React from 'react';
import { css } from '@emotion/css';
import { SIGNIN_TEXT } from './text';

// The "Sign in with Twinkle" card for a Lumine app on its own address
// (container: ./index.tsx). Plain view so the preview renders the same card.
// Signed out, it speaks to someone who has never heard of Twinkle: what a
// free account gets them in this app, one line on what Twinkle is, then
// "Create a free account" or "I already have a Twinkle account". The sign-up
// steps (AppSignUp) render in its place through `signUp`.
// Sizes are px so the window reads the same on twin-kle.com (10px root) and
// in the preview.
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
  onOpenSigninModal,
  onCreateAccount,
  signUp,
  link = false
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
  onCreateAccount?: () => void;
  signUp?: React.ReactNode;
  // opened by an app account's "Link a Twinkle account"
  link?: boolean;
}) {
  const t = SIGNIN_TEXT;
  const signedOutLanding = app && originAllowed && !userId && !signUp;
  return (
    <div className={pageClass}>
      <div className={cardClass}>
        {app?.thumbnailUrl ? (
          <img src={app.thumbnailUrl} alt="" className={thumbClass} />
        ) : (
          <div className={markClass} aria-hidden="true">
            ✦
          </div>
        )}
        <h2 className={titleClass}>
          {app
            ? link
              ? t.linkTitle(app.title)
              : signedOutLanding || signUp
                ? t.saveTitle(app.title)
                : t.titleFor(app.title)
            : t.title}
        </h2>
        {app && <p className={byClass}>{t.by(app.ownerUsername, host)}</p>}
        {error && <p className={errorClass}>{error}</p>}
        {app && !originAllowed && <p className={errorClass}>{t.wrongOrigin}</p>}
        {app && originAllowed && signUp}
        {signedOutLanding && (
          <>
            <p className={introClass}>{link ? t.linkIntro(app.title) : t.newHere(app.title)}</p>
            <button type="button" onClick={onCreateAccount} className={primaryClass}>
              {t.createAccount}
            </button>
            <button type="button" onClick={() => onOpenSigninModal()} className={secondaryClass}>
              {t.haveAccount}
            </button>
            <button type="button" onClick={() => handBack(null)} className={linkClass}>
              {t.backToApp}
            </button>
          </>
        )}
        {app && originAllowed && userId && !signUp && (
          <>
            {link && <p className={introClass}>{t.linkIntro(app.title)}</p>}
            <ul className={listClass}>
              <li>{t.sees}</li>
              <li>{t.saves}</li>
              <li>{t.coins}</li>
              <li>{t.cant}</li>
            </ul>
            <button type="button" disabled={busy} onClick={allow} className={primaryClass}>
              {link ? t.linkContinueAs(String(username || '')) : t.continueAs(String(username || ''))}
            </button>
            <button type="button" onClick={() => handBack(null)} className={secondaryClass}>
              {t.cancel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const pageClass = css`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  box-sizing: border-box;
  background: #f6f6fb;
  font-size: 17px;
  line-height: 1.45;
  color: #16161f;
`;
const cardClass = css`
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 22px;
  padding: 26px 22px;
  box-shadow: 0 10px 40px rgba(20, 20, 40, 0.08);
  text-align: center;
`;
const thumbClass = css`
  width: 72px;
  height: 72px;
  border-radius: 18px;
  object-fit: cover;
`;
const markClass = css`
  font-size: 38px;
`;
const titleClass = css`
  margin: 12px 0 6px;
  font-size: 23px;
  line-height: 1.25;
`;
const byClass = css`
  color: #5d5d6e;
  margin: 0 0 16px;
  font-size: 15px;
`;
const introClass = css`
  margin: 0 0 18px;
  color: #33333f;
`;
const errorClass = css`
  color: #b42318;
`;
const listClass = css`
  text-align: left;
  color: #33333f;
  padding-left: 20px;
  margin: 0 0 20px;
`;
const primaryClass = css`
  width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 14px;
  background: #16161f;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
  }
`;
const secondaryClass = css`
  width: 100%;
  margin-top: 8px;
  border: 0;
  border-radius: 999px;
  padding: 14px;
  background: #f0f0f6;
  color: #16161f;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;
const linkClass = css`
  margin-top: 12px;
  border: 0;
  background: none;
  color: #5d5d6e;
  font: inherit;
  font-size: 15px;
  text-decoration: underline;
  cursor: pointer;
`;
