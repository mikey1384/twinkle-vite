import React from 'react';
import { css } from '@emotion/css';
import TwinkleLogo from '~/containers/App/Header/TwinkleLogo';
import { SIGNIN_TEXT, signInLang } from './text';
import trio1200 from './assets/trio-1200.webp';
import trio720 from './assets/trio-720.webp';

// The "Sign in with Twinkle" window for a Lumine app on its own address
// (container: ./index.tsx). Plain view so the preview renders the same card.
// Mikey 11-25: it should feel at least as legit as signing in with Google:
// Twinkle's own logo top-left (the website header's component), Zero, Ciel
// and Lumine beside the form on wide screens and peeking above it on phones
// (always behind a solid panel; the form stays the focus), the app it signs
// into with its address, "Twinkle never shows your password to the app", and
// the privacy link. Signed out it speaks to someone new to Twinkle; the
// sign-up steps (AppSignUp) render in the card through `signUp`.
// Sizes are px so the window reads the same on twin-kle.com (10px root) and
// in the preview. No gradients.

const BLUE = '#2f7be0';
const INK = '#14151c';
const MUTED = '#5f6270';
const LINE = '#e3e5ec';

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
  const t = SIGNIN_TEXT[signInLang()];
  const signedOutLanding = app && originAllowed && !userId && !signUp;
  const heading = app
    ? link
      ? t.linkTitle(app.title)
      : signedOutLanding || signUp
        ? t.saveTitle(app.title)
        : t.titleFor(app.title)
    : t.title;
  return (
    <div className={pageClass}>
      <div className={frameClass}>
        <figure className={artClass} aria-hidden="true">
          <img
            src={trio720}
            srcSet={`${trio720} 720w, ${trio1200} 1200w`}
            sizes="(min-width: 760px) 460px, 100vw"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <figcaption>{t.artCaption}</figcaption>
        </figure>
        <main className={cardClass}>
          <div className={logoRowClass}>
            <TwinkleLogo alwaysVisible linkHome={false} />
          </div>
          <h1 className={titleClass}>{heading}</h1>
          {app && (
            <div className={appChipClass}>
              <span className={chipLabelClass}>{t.toContinue}</span>
              <div className={chipBodyClass}>
                {app.thumbnailUrl ? (
                  <img src={app.thumbnailUrl} alt="" className={thumbClass} />
                ) : (
                  <span className={thumbClass} aria-hidden="true">
                    ✦
                  </span>
                )}
                <span className={chipTextClass}>
                  <b>{app.title}</b>
                  <small>
                    <LockIcon /> {host} · {t.byOwner(app.ownerUsername)}
                  </small>
                </span>
              </div>
            </div>
          )}
          {error && <p className={errorClass}>{error}</p>}
          {app && !originAllowed && <p className={errorClass}>{t.wrongOrigin}</p>}
          {app && originAllowed && signUp && <div className={signUpClass}>{signUp}</div>}
          {signedOutLanding && (
            <>
              <p className={introClass}>{link ? t.linkIntro(app.title) : t.newHere(app.title)}</p>
              <div className={actionsClass}>
                <button type="button" onClick={onCreateAccount} className={primaryClass}>
                  {t.createAccount}
                </button>
                <button type="button" onClick={() => onOpenSigninModal()} className={secondaryClass}>
                  {t.haveAccount}
                </button>
              </div>
            </>
          )}
          {app && originAllowed && userId && !signUp && (
            <>
              {link && <p className={introClass}>{t.linkIntro(app.title)}</p>}
              <ul className={listClass}>
                {[t.sees, t.saves, t.coins, t.cant].map((line, index) => (
                  <li key={line}>
                    <span aria-hidden="true">{index === 3 ? <ShieldIcon /> : <CheckIcon />}</span>
                    {line}
                  </li>
                ))}
              </ul>
              <div className={actionsClass}>
                <button type="button" disabled={busy} onClick={allow} className={primaryClass}>
                  {link ? t.linkContinueAs(String(username || '')) : t.continueAs(String(username || ''))}
                </button>
                <button type="button" onClick={() => handBack(null)} className={secondaryClass}>
                  {t.cancel}
                </button>
              </div>
            </>
          )}
          {app && originAllowed && (
            <p className={trustClass}>
              <ShieldIcon /> {t.passwordSafe(app.title)}
            </p>
          )}
          <footer className={footerClass}>
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              {t.privacyLink}
            </a>
            {signedOutLanding && (
              <button type="button" onClick={() => handBack(null)}>
                {t.backToApp}
              </button>
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-1px' }}>
      <path d="M17 9V7A5 5 0 0 0 7 7v2H5v13h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-2px', flex: 'none' }}>
      <path d="M12 2 4 5v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z" />
    </svg>
  );
}

const pageClass = css`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0;
  background: #eef0f6;
  font-size: 16px;
  line-height: 1.5;
  color: ${INK};
  @media (min-width: 760px) {
    padding: 32px 20px;
  }
`;
const frameClass = css`
  width: 100%;
  min-width: 0;
  max-width: 920px;
  align-self: stretch;
  @media (min-width: 760px) {
    align-self: center;
  }
  display: flex;
  flex-direction: column;
  @media (min-width: 760px) {
    flex-direction: row;
    border-radius: 28px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 2px rgba(20, 20, 40, 0.06), 0 24px 60px rgba(20, 20, 40, 0.12);
  }
`;
const artClass = css`
  position: relative;
  margin: 0;
  height: 176px;
  background: #241650;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 42%;
    display: block;
    animation: lumineArtIn 0.5s ease both;
  }
  figcaption {
    display: none;
  }
  @keyframes lumineArtIn {
    from {
      opacity: 0;
      transform: scale(1.03);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    img {
      animation: none;
    }
  }
  @media (min-width: 760px) {
    flex: 0 0 46%;
    height: auto;
    min-height: 600px;
    img {
      position: absolute;
      inset: 0;
      object-position: 50% 50%;
    }
    figcaption {
      display: block;
      position: absolute;
      left: 20px;
      right: 20px;
      bottom: 20px;
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(16, 12, 40, 0.78);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }
  }
`;
const cardClass = css`
  position: relative;
  min-width: 0;
  margin-top: -28px;
  padding: 24px 22px 18px;
  border-radius: 24px 24px 0 0;
  background: #fff;
  box-sizing: border-box;
  min-height: calc(100vh - 148px);
  display: flex;
  flex-direction: column;
  @media (min-width: 760px) {
    flex: 1;
    margin-top: 0;
    border-radius: 0;
    min-height: 0;
    padding: 36px 40px 24px;
  }
`;
const logoRowClass = css`
  margin-bottom: 20px;
  font-size: 10px;
`;
const titleClass = css`
  margin: 0 0 14px;
  font-size: 25px;
  line-height: 1.22;
  font-weight: 750;
  letter-spacing: -0.01em;
  @media (min-width: 760px) {
    font-size: 28px;
  }
`;
const appChipClass = css`
  margin: 0 0 18px;
`;
const chipLabelClass = css`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: ${MUTED};
`;
const chipBodyClass = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid ${LINE};
  border-radius: 16px;
`;
const thumbClass = css`
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  display: grid;
  place-items: center;
  background: #f1f2f7;
  color: #6b4cf0;
  font-size: 20px;
`;
const chipTextClass = css`
  display: flex;
  flex-direction: column;
  min-width: 0;
  b {
    font-size: 16px;
    line-height: 1.3;
  }
  small {
    font-size: 13px;
    color: ${MUTED};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
const introClass = css`
  margin: 0 0 20px;
  color: #3a3d4a;
  font-size: 15.5px;
`;
const actionsClass = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const buttonBase = `
  width: 100%;
  min-height: 50px;
  border-radius: 999px;
  padding: 12px 18px;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
  &:active:not(:disabled) {
    transform: scale(0.985);
  }
  &:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
`;
const primaryClass = css`
  ${buttonBase}
  border: 0;
  background: ${BLUE};
  color: #fff;
  box-shadow: 0 1px 2px rgba(20, 60, 140, 0.25);
  &:hover:not(:disabled) {
    background: #2468c4;
    box-shadow: 0 4px 14px rgba(36, 104, 196, 0.3);
  }
`;
const secondaryClass = css`
  ${buttonBase}
  border: 1px solid #cfd3de;
  background: #fff;
  color: ${INK};
  &:hover:not(:disabled) {
    background: #f6f7fb;
  }
`;
const listClass = css`
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 15px;
  color: #3a3d4a;
  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  li > span {
    flex: none;
    margin-top: 3px;
    color: ${MUTED};
  }
`;
const signUpClass = css`
  margin-top: 4px;
`;
const errorClass = css`
  color: #b42318;
  font-size: 15px;
`;
const trustClass = css`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 18px 0 0;
  font-size: 13px;
  color: ${MUTED};
`;
const footerClass = css`
  margin-top: auto;
  padding-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  a,
  button {
    color: ${MUTED};
    background: none;
    border: 0;
    padding: 6px 0;
    font: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  a:hover,
  button:hover {
    color: ${INK};
    text-decoration: underline;
  }
`;
