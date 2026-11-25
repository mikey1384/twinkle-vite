import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import GuardianConsent from '~/containers/Signin/SignUpForm/GuardianConsent';
import { useAppContext } from '~/contexts';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import { isValidUsername } from '~/helpers/stringHelpers';
import {
  getGuardianConsent,
  clearGuardianConsent,
  needsGuardianConsent
} from '~/helpers/signupPasses';
import type { SignInLang, SignInText } from './text';

// "Create a free account" in an app's sign-in window (Mikey, 2026-11-25):
// a free Twinkle account in three short steps, with the app's maker as the
// inviter (the app's sign-up pass, twinkle-api POST /user/signup/app):
//   1. birth month and year;
//   2. under 14: a parent's or guardian's approval (the invite sign-up's own
//      step, GuardianConsent, bound to this app's pass);
//   3. username and password.
// No email, no passphrase, no student/teacher or branch questions. The pass
// and a guardian request are kept in this browser, so closing the window and
// coming back from the app resumes where it stopped.

const PASS_KEY = (buildId: number) => `twinkle-app-signup-pass:${buildId}`;

interface StoredPass {
  token: string;
  expiresAt: number;
}

function readPass(buildId: number): StoredPass | null {
  try {
    const pass = JSON.parse(localStorage.getItem(PASS_KEY(buildId)) || 'null');
    if (!pass?.token || Number(pass.expiresAt) * 1000 < Date.now() + 60_000) return null;
    return pass;
  } catch {
    return null;
  }
}

function writePass(buildId: number, pass: StoredPass | null) {
  try {
    if (pass) localStorage.setItem(PASS_KEY(buildId), JSON.stringify(pass));
    else localStorage.removeItem(PASS_KEY(buildId));
  } catch {
    // private windows: this visit only
  }
}

type Step = 'birth' | 'guardian' | 'account';

export default function AppSignUp({
  buildId,
  origin,
  appTitle,
  lang,
  t,
  onBack,
  onCreated
}: {
  buildId: number;
  origin: string;
  appTitle: string;
  lang: SignInLang;
  t: SignInText;
  onBack: () => void;
  onCreated: (account: any) => void;
}) {
  const loadAppSignupPass = useAppContext((v) => v.requestHelpers.loadAppSignupPass);
  const signupFromApp = useAppContext((v) => v.requestHelpers.signupFromApp);
  const [pass, setPass] = useState<StoredPass | null>(() => readPass(buildId));
  const resumed = pass ? getGuardianConsent(pass.token) : null;
  const [birth, setBirth] = useState<{ birthYear: number; birthMonth: number } | null>(
    resumed ? { birthYear: resumed.birthYear, birthMonth: resumed.birthMonth } : null
  );
  const [step, setStep] = useState<Step>(resumed ? 'guardian' : 'birth');
  const [consent, setConsent] = useState<{ consentId: number; secret: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (pass) return;
    let cancelled = false;
    loadAppSignupPass({ buildId, origin })
      .then((data: any) => {
        if (cancelled || !data?.token) return;
        const next = { token: String(data.token), expiresAt: Number(data.expiresAt) };
        writePass(buildId, next);
        setPass(next);
      })
      .catch(() => {
        if (!cancelled) setError(t.passFailed);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, origin]);

  if (step === 'guardian' && pass && birth) {
    return (
      <div className={stepWrapClass}>
        <GuardianConsent
          lang={lang}
          inviteToken={pass.token}
          birthYear={birth.birthYear}
          birthMonth={birth.birthMonth}
          approvedBody={t.guardianApproved}
          onChangeBirth={() => {
            setBirth(null);
            setStep('birth');
          }}
          onApproved={({ consentId, secret }) => {
            setConsent({ consentId, secret });
            setStep('account');
          }}
        />
      </div>
    );
  }

  if (step === 'account' && pass && birth) {
    return (
      <AccountStep
        t={t}
        appTitle={appTitle}
        onBack={() => setStep(consent ? 'guardian' : 'birth')}
        onSubmit={async ({ username, password }) => {
          const account = await signupFromApp({
            invite: pass.token,
            username,
            password,
            birthYear: birth.birthYear,
            birthMonth: birth.birthMonth,
            guardianConsent: consent || undefined
          });
          writePass(buildId, null);
          clearGuardianConsent();
          onCreated(account);
        }}
      />
    );
  }

  return (
    <BirthStep
      t={t}
      initial={birth}
      error={error}
      ready={!!pass}
      onBack={onBack}
      onContinue={(value) => {
        setBirth(value);
        setStep(needsGuardianConsent(value.birthYear, value.birthMonth) ? 'guardian' : 'account');
      }}
    />
  );
}

function BirthStep({
  t,
  initial,
  error,
  ready,
  onBack,
  onContinue
}: {
  t: SignInText;
  initial: { birthYear: number; birthMonth: number } | null;
  error: string;
  ready: boolean;
  onBack: () => void;
  onContinue: (birth: { birthYear: number; birthMonth: number }) => void;
}) {
  const [year, setYear] = useState(initial ? String(initial.birthYear) : '');
  const [month, setMonth] = useState(initial ? String(initial.birthMonth) : '');
  const years = useMemo(() => {
    const thisYear = new Date().getUTCFullYear();
    return Array.from({ length: 100 }, (_, index) => thisYear - index);
  }, []);
  const isFuture = useMemo(() => {
    if (!year || !month) return false;
    const now = new Date();
    return Number(year) * 12 + Number(month) > now.getUTCFullYear() * 12 + now.getUTCMonth() + 1;
  }, [year, month]);
  const canGo = ready && !!year && !!month && !isFuture;
  return (
    <form
      className={formClass}
      onSubmit={(event) => {
        event.preventDefault();
        if (canGo) onContinue({ birthYear: Number(year), birthMonth: Number(month) });
      }}
    >
      <h3 className={stepTitleClass}>{t.birthTitle}</h3>
      <p className={mutedClass}>{t.birthBody}</p>
      <div className={rowClass}>
        <label className={fieldClass}>
          <span>{t.month}</span>
          <select autoFocus value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="">{t.chooseMonth}</option>
            {t.months.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span>{t.year}</span>
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="">{t.chooseYear}</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isFuture && <p className={errorClass}>{t.futureBirth}</p>}
      {error && <p className={errorClass}>{error}</p>}
      <button type="submit" disabled={!canGo} className={primaryClass}>
        {t.next}
      </button>
      <button type="button" onClick={onBack} className={secondaryClass}>
        {t.back}
      </button>
      <p className={fineClass}>{t.birthNote}</p>
    </form>
  );
}

function AccountStep({
  t,
  appTitle,
  onBack,
  onSubmit
}: {
  t: SignInText;
  appTitle: string;
  onBack: () => void;
  onSubmit: (values: { username: string; password: string }) => Promise<void>;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className={formClass}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const name = username.trim();
        if (!isValidUsername(name)) return setError(t.badUsername);
        if (password.trim().length < 5) return setError(t.shortPassword);
        setBusy(true);
        setError('');
        try {
          await onSubmit({ username: name, password });
        } catch (err) {
          setError(getErrorMessage(err, t.failed));
          setBusy(false);
        }
      }}
    >
      <h3 className={stepTitleClass}>{t.accountTitle}</h3>
      <p className={mutedClass}>{t.accountBody(appTitle)}</p>
      <label className={fieldClass}>
        <span>{t.username}</span>
        <input
          autoFocus
          value={username}
          maxLength={19}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          onChange={(event) => {
            setError('');
            setUsername(event.target.value.replace(/\s/g, ''));
          }}
        />
        <small>{t.usernameHint}</small>
      </label>
      <label className={fieldClass}>
        <span>{t.password}</span>
        <span className={passwordRowClass}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            autoComplete="new-password"
            onChange={(event) => {
              setError('');
              setPassword(event.target.value);
            }}
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? t.hidePassword : t.showPassword}
          </button>
        </span>
        <small>{t.passwordHint}</small>
      </label>
      {error && <p className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy || !username || !password} className={primaryClass}>
        {busy ? t.creating : t.create}
      </button>
      <button type="button" onClick={onBack} disabled={busy} className={secondaryClass}>
        {t.back}
      </button>
      <p className={fineClass}>
        {t.terms.split(t.privacy)[0]}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">
          {t.privacy}
        </a>
        {t.terms.split(t.privacy)[1] || ''}
      </p>
    </form>
  );
}

// The window's own look (SignInCardView): px sizes, so it reads the same on
// twin-kle.com (10px root) and in the preview.
const stepWrapClass = css`
  font-size: 10px;
  text-align: center;
`;
const formClass = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
`;
const stepTitleClass = css`
  margin: 4px 0 0;
  font-size: 20px;
  text-align: center;
`;
const mutedClass = css`
  margin: 0 0 6px;
  color: #5d5d6e;
  text-align: center;
  line-height: 1.45;
`;
const rowClass = css`
  display: flex;
  gap: 10px;
  > * {
    flex: 1;
  }
`;
const fieldClass = css`
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-weight: 650;
  font-size: 15px;
  select,
  input {
    width: 100%;
    box-sizing: border-box;
    min-height: 46px;
    padding: 10px 12px;
    border: 1px solid #d6d6e0;
    border-radius: 12px;
    background: #fff;
    color: #16161f;
    font: inherit;
    font-weight: 400;
    font-size: 16px;
  }
  small {
    font-weight: 400;
    font-size: 13px;
    color: #6b6b7b;
  }
`;
const passwordRowClass = css`
  display: flex;
  gap: 8px;
  button {
    flex: none;
    border: 0;
    border-radius: 12px;
    padding: 0 14px;
    background: #f0f0f6;
    color: #16161f;
    font: inherit;
    font-weight: 650;
    cursor: pointer;
  }
`;
const errorClass = css`
  margin: 0;
  color: #b42318;
  font-size: 14px;
  text-align: center;
`;
const primaryClass = css`
  width: 100%;
  margin-top: 6px;
  border: 0;
  border-radius: 999px;
  padding: 14px;
  background: #16161f;
  color: #fff;
  font: inherit;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;
const secondaryClass = css`
  width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 14px;
  background: #f0f0f6;
  color: #16161f;
  font: inherit;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
`;
const fineClass = css`
  margin: 2px 0 0;
  font-size: 13px;
  color: #6b6b7b;
  text-align: center;
  a {
    color: inherit;
  }
`;
