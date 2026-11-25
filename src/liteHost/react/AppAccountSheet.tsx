// The sign-in sheet of an app on its own accounts (Mikey, 2026-11-25, phase
// B): sign in, or create an account for this app only, on Twinkle's trusted
// host page above the app (the app's frame can't read or draw over it). The
// app's own name only, no Twinkle branding, except where Twinkle is part of
// it: a parent's or guardian's approval for under-14s (Twinkle holds the
// data, so the guardian step and its email are Twinkle's), and, for an app on
// both kinds of accounts, "Continue with Twinkle".
// API: twinkle-api helpers/build/appHosting/appAccounts.ts.
import React, { useMemo, useState } from 'react';
import GuardianConsent from '~/containers/Signin/SignUpForm/GuardianConsent';
import { needsGuardianConsent, clearGuardianConsent, getGuardianConsent } from '~/helpers/signupPasses';
import type { LiteHostConfig, SessionStore } from '../session';
import type { LiteHostText } from '../text';

type View = 'signin' | 'birth' | 'guardian' | 'account';
const PASS_KEY = (buildId: number) => `lumine-app-account-pass:${buildId}`;

function readPass(buildId: number): string | null {
  try {
    const pass = JSON.parse(localStorage.getItem(PASS_KEY(buildId)) || 'null');
    return pass?.token && Number(pass.expiresAt) * 1000 > Date.now() + 60_000 ? String(pass.token) : null;
  } catch {
    return null;
  }
}

export default function AppAccountSheet({
  config,
  t,
  session,
  twinkleToo,
  onClose
}: {
  config: LiteHostConfig;
  t: LiteHostText;
  session: SessionStore;
  // an app on both kinds of accounts: Twinkle members may continue with Twinkle
  twinkleToo: boolean;
  onClose: () => void;
}) {
  const resumedPass = readPass(config.buildId);
  const resumedConsent = resumedPass ? getGuardianConsent(resumedPass) : null;
  const [view, setView] = useState<View>(resumedConsent ? 'guardian' : 'signin');
  const [pass, setPass] = useState<string | null>(resumedPass);
  const [birth, setBirth] = useState<{ birthYear: number; birthMonth: number } | null>(
    resumedConsent ? { birthYear: resumedConsent.birthYear, birthMonth: resumedConsent.birthMonth } : null
  );
  const [consent, setConsent] = useState<{ consentId: number; secret: string } | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const years = useMemo(() => {
    const thisYear = new Date().getUTCFullYear();
    return Array.from({ length: 100 }, (_, index) => thisYear - index);
  }, []);

  async function run(task: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err: any) {
      setError(err?.message || t.accountFailed);
    } finally {
      setBusy(false);
    }
  }

  async function afterBirth(value: { birthYear: number; birthMonth: number }) {
    setBirth(value);
    if (!needsGuardianConsent(value.birthYear, value.birthMonth)) return setView('account');
    // the approval is bound to an app-account pass from the API
    let token = pass;
    if (!token) {
      const data = await session.post(`/build/${config.buildId}/app-session/signup-pass`, {
        origin: window.location.origin,
        purpose: 'app-account'
      });
      token = String(data.token);
      try {
        localStorage.setItem(PASS_KEY(config.buildId), JSON.stringify({ token, expiresAt: data.expiresAt }));
      } catch {
        // this visit only
      }
      setPass(token);
    }
    setView('guardian');
  }

  const title =
    view === 'signin' ? t.accountSignInTitle(config.title) : t.accountSignUpTitle(config.title);
  return (
    <div
      className="lh-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="lh-sheet lh-account" role="dialog" aria-modal="true" aria-label={title}>
        {config.thumbnailUrl ? (
          <img className="lh-account-thumb" src={config.thumbnailUrl} alt="" />
        ) : null}
        <h2>{title}</h2>
        {view === 'signin' && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await session.signInAppAccount({ username: username.trim(), password });
                onClose();
              });
            }}
          >
            <p>{t.accountSignInBody}</p>
            <label className="lh-field">
              <span>{t.accountUsername}</span>
              <input autoFocus value={username} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={(event) => setUsername(event.target.value.replace(/\s/g, ''))} />
            </label>
            <label className="lh-field">
              <span>{t.accountPassword}</span>
              <input type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p className="lh-error">{error}</p>}
            <div className="lh-actions">
              <button className="lh-primary" type="submit" disabled={busy || !username || !password}>
                {busy ? t.accountSigningIn : t.accountSignIn}
              </button>
              <button className="lh-secondary" type="button" onClick={() => { setError(''); setView('birth'); }}>
                {t.accountNew}
              </button>
            </div>
            {twinkleToo && (
              <>
                <div className="lh-or">{t.accountOr}</div>
                <button
                  className="lh-secondary lh-wide"
                  type="button"
                  onClick={() => {
                    onClose();
                    void session.signIn();
                  }}
                >
                  {t.accountTwinkle}
                </button>
              </>
            )}
          </form>
        )}
        {view === 'birth' && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!month || !year) return;
              void run(() => afterBirth({ birthYear: Number(year), birthMonth: Number(month) }));
            }}
          >
            <p>{t.accountBirth}</p>
            <div className="lh-row">
              <label className="lh-field">
                <span>{t.accountMonth}</span>
                <select autoFocus value={month} onChange={(event) => setMonth(event.target.value)}>
                  <option value="" />
                  {t.accountMonths.map((name, index) => (
                    <option key={name} value={index + 1}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="lh-field">
                <span>{t.accountYear}</span>
                <select value={year} onChange={(event) => setYear(event.target.value)}>
                  <option value="" />
                  {years.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="lh-fine">{t.accountBirthNote}</p>
            {error && <p className="lh-error">{error}</p>}
            <div className="lh-actions">
              <button className="lh-primary" type="submit" disabled={busy || !month || !year}>{t.accountNext}</button>
              <button className="lh-secondary" type="button" onClick={() => setView('signin')}>{t.accountHave}</button>
            </div>
          </form>
        )}
        {view === 'guardian' && pass && birth && (
          <div className="lh-guardian">
            <GuardianConsent
              inviteToken={pass}
              birthYear={birth.birthYear}
              birthMonth={birth.birthMonth}
              approvedBody={t.accountApprovedNext}
              onChangeBirth={() => setView('birth')}
              onApproved={({ consentId, secret }) => {
                setConsent({ consentId, secret });
                setView('account');
              }}
            />
          </div>
        )}
        {view === 'account' && birth && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await session.signUpAppAccount({
                  username: username.trim(),
                  password,
                  birthYear: birth.birthYear,
                  birthMonth: birth.birthMonth,
                  ...(pass ? { invite: pass } : {}),
                  ...(consent ? { guardianConsentId: consent.consentId, guardianConsentSecret: consent.secret } : {})
                });
                try {
                  localStorage.removeItem(PASS_KEY(config.buildId));
                } catch {
                  // nothing stored
                }
                clearGuardianConsent();
                onClose();
              });
            }}
          >
            <label className="lh-field">
              <span>{t.accountUsername}</span>
              <input autoFocus value={username} maxLength={19} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={(event) => setUsername(event.target.value.replace(/\s/g, ''))} />
              <small>{t.accountUsernameHint}</small>
            </label>
            <label className="lh-field">
              <span>{t.accountPassword}</span>
              <input type="password" value={password} autoComplete="new-password" onChange={(event) => setPassword(event.target.value)} />
              <small>{t.accountPasswordHint}</small>
            </label>
            {error && <p className="lh-error">{error}</p>}
            <div className="lh-actions">
              <button className="lh-primary" type="submit" disabled={busy || username.trim().length < 3 || password.length < 5}>
                {busy ? t.accountCreating : t.accountCreate}
              </button>
              <button className="lh-secondary" type="button" onClick={() => setView(consent ? 'guardian' : 'birth')}>{t.accountBack}</button>
            </div>
            <p className="lh-fine">
              <a href={`${config.siteOrigin}/privacy`} target="_blank" rel="noopener noreferrer">{t.accountPrivacy}</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
