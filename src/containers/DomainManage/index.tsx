import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import {
  CheckoutLayout,
  CheckoutSurface,
  Notice,
  PrimaryButton,
  StepTitle,
  T,
  TextField,
  textButtonClass
} from '~/components/Build/AppAddress/checkout/ui';
import { ParentLangToggle, type ParentLangMode } from '~/containers/DomainParentConsent/ParentConsentView';
import DomainCard, { type ManagedDomain } from './DomainCard';
import { MANAGE_TEXT, type ManageLang } from './text';

// /domains/manage: whoever PAYS for a domain (a parent without a Twinkle
// account, or an adult for their own app) signs in with an emailed one-time
// link and manages auto-renew, their card and receipts. The link's token sits
// in the #fragment (never in a URL log or Referer) and is traded once for a
// short session kept in this tab only. That session is never a Twinkle login
// and goes to /domain-manage routes only. Korean for a Korean browser (the
// guardian pages' switch, remembered on this device).
const LANG_KEY = 'twinkle-guardian-lang';
const SESSION_KEY = 'twinkle-domain-manage';

interface Session {
  token: string;
  expiresAt: number;
  emailMasked: string;
}

function initialLang(param: string | null): ManageLang {
  if (param === 'ko' || param === 'en') return param;
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    // fall through
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((value) => /^ko\b/i.test(String(value || ''))) ? 'ko' : 'en';
}

function readSession(): Session | null {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null');
    if (value && typeof value.token === 'string' && Number(value.expiresAt) * 1000 > Date.now() + 30000) return value;
  } catch {
    // no storage
  }
  return null;
}

function saveSession(session: Session | null) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // memory only
  }
}

export default function DomainManage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const requestLink = useAppContext((v) => v.requestHelpers.requestDomainManageLink);
  const startSession = useAppContext((v) => v.requestHelpers.startDomainManageSession);
  const loadDomains = useAppContext((v) => v.requestHelpers.loadManagedDomains);
  const setAutoRenew = useAppContext((v) => v.requestHelpers.setManagedDomainAutoRenew);
  const openBilling = useAppContext((v) => v.requestHelpers.openManagedDomainBilling);
  const [lang, setLang] = useState<ManageLang>(() => initialLang(params.get('lang')));
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [sending, setSending] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [domains, setDomains] = useState<ManagedDomain[] | null>(null);
  const [savingId, setSavingId] = useState(0);
  const [openingId, setOpeningId] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const actionRef = useRef(false);
  const t = MANAGE_TEXT[lang];

  function failMessage(e: any) {
    const code = e?.code || e?.response?.data?.code;
    if (code === 'manage_session_invalid') {
      endSession(t.sessionEnded);
      return '';
    }
    if (code === 'feature_off') return t.notAvailable;
    return e?.message || t.failed;
  }

  function endSession(message = '') {
    saveSession(null);
    setSession(null);
    setDomains(null);
    setNotice(message);
  }

  // the emailed link: trade the one-time token, then drop it from the URL
  useEffect(() => {
    const hash = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
    const token = hash.get('token') || '';
    if (!token) return;
    navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true });
    let cancelled = false;
    setExchanging(true);
    startSession({ token })
      .then((data: any) => {
        if (cancelled || !data?.sessionToken) return;
        const next = { token: data.sessionToken, expiresAt: Number(data.expiresAt), emailMasked: String(data.emailMasked || '') };
        saveSession(next);
        setSession(next);
        setNotice('');
      })
      .catch((e: any) => {
        if (cancelled) return;
        const code = e?.code || e?.response?.data?.code;
        setNotice(code === 'link_expired' ? t.linkExpired : failMessage(e));
      })
      .finally(() => {
        if (!cancelled) setExchanging(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // signed in: the domains this email pays for (fresh card after Stripe)
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const billingReturn = params.get('billingReturn') === '1';
    if (billingReturn) navigate({ pathname: location.pathname, search: '' }, { replace: true });
    loadDomains({ sessionToken: session.token, billingReturn })
      .then((data: any) => {
        if (!cancelled) setDomains(Array.isArray(data?.domains) ? data.domains : []);
      })
      .catch((e: any) => {
        if (!cancelled) setError(failMessage(e));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  async function sendLink(target = email) {
    const value = target.trim();
    if (!value || sending) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      await requestLink({ email: value, lang });
      setSentTo(value);
    } catch (e: any) {
      setError(failMessage(e));
    } finally {
      setSending(false);
    }
  }

  async function changeAutoRenew(item: ManagedDomain, autoRenew: boolean) {
    if (!session || actionRef.current) return;
    actionRef.current = true;
    setSavingId(item.orderId);
    setError('');
    try {
      const data = await setAutoRenew({ sessionToken: session.token, orderId: item.orderId, autoRenew });
      if (data?.renewal) {
        setDomains((prev) =>
          (prev || []).map((d) => (d.orderId === item.orderId ? { ...d, renewal: { ...d.renewal, ...data.renewal } } : d))
        );
      }
    } catch (e: any) {
      setError(failMessage(e));
    } finally {
      actionRef.current = false;
      setSavingId(0);
    }
  }

  async function billing(item: ManagedDomain) {
    if (!session || actionRef.current) return;
    actionRef.current = true;
    setOpeningId(item.orderId);
    setError('');
    try {
      const data = await openBilling({ sessionToken: session.token, orderId: item.orderId });
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      setError(t.failed);
    } catch (e: any) {
      setError(failMessage(e));
    } finally {
      actionRef.current = false;
      setOpeningId(0);
    }
  }

  const changeLang = (next: ParentLangMode) => {
    const value: ManageLang = next === 'en' ? 'en' : 'ko';
    setLang(value);
    try {
      window.localStorage.setItem(LANG_KEY, value);
    } catch {
      // ignore
    }
  };

  let body: React.ReactNode;
  if (exchanging) {
    body = (
      <CheckoutLayout stepKey="manage-exchanging" wide>
        <StepTitle>{t.signingIn}</StepTitle>
      </CheckoutLayout>
    );
  } else if (session) {
    body = (
      <CheckoutLayout stepKey="manage-list" wide error={error || undefined}>
        <StepTitle
          lead={
            <span className={signedInClass}>
              {t.signedInAs(session.emailMasked)}
              <span aria-hidden="true">·</span>
              <button type="button" className={textButtonClass} onClick={() => endSession()}>
                {t.signOut}
              </button>
            </span>
          }
        >
          {t.listTitle}
        </StepTitle>
        {domains === null ? null : domains.length === 0 ? (
          <Notice>{t.none}</Notice>
        ) : (
          <div className={listClass}>
            {domains.map((item) => (
              <DomainCard
                key={item.orderId}
                t={t}
                lang={lang}
                item={item}
                saving={savingId === item.orderId}
                opening={openingId === item.orderId}
                busy={savingId !== 0 || openingId !== 0}
                onAutoRenew={(on) => void changeAutoRenew(item, on)}
                onBilling={() => void billing(item)}
              />
            ))}
          </div>
        )}
      </CheckoutLayout>
    );
  } else if (sentTo) {
    body = (
      <CheckoutLayout stepKey="manage-sent" wide error={error || undefined}>
        <StepTitle lead={t.sentBody(sentTo)}>{t.sentTitle}</StepTitle>
        <div className={rowClass}>
          <PrimaryButton busy={sending} onClick={() => void sendLink(sentTo)}>
            {t.resend}
          </PrimaryButton>
          <button type="button" className={textButtonClass} onClick={() => setSentTo('')}>
            {t.useOtherEmail}
          </button>
        </div>
      </CheckoutLayout>
    );
  } else {
    body = (
      <CheckoutLayout stepKey="manage-sign-in" wide error={error || undefined}>
        <StepTitle lead={t.signInLead}>{t.signInTitle}</StepTitle>
        {notice && <Notice tone="warm">{notice}</Notice>}
        <form
          className={formClass}
          onSubmit={(event) => {
            event.preventDefault();
            void sendLink();
          }}
        >
          <TextField label={t.email} type="email" name="email" autoComplete="email" value={email} onChange={setEmail} autoFocus />
          <PrimaryButton type="submit" busy={sending} disabled={!email.trim()}>
            {t.sendLink}
          </PrimaryButton>
        </form>
        <p className={fineClass}>{t.noAccount}</p>
      </CheckoutLayout>
    );
  }

  return (
    <CheckoutSurface variant="page" label={t.kicker} topRight={<ParentLangToggle mode={lang} onMode={changeLang} />}>
      {body}
    </CheckoutSurface>
  );
}

const listClass = css`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 8px;
`;
const formClass = css`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 440px;
`;
const rowClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
`;
const fineClass = css`
  margin: 14px 0 0;
  font-size: 14px;
  color: ${T.muted};
`;
const signedInClass = css`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  overflow-wrap: anywhere;
`;
