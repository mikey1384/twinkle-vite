import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { PARENT_TEXT } from '~/components/Build/AppAddress/text';
import ParentConsentView, {
  type ParentLangMode,
  type ParentOrderView,
  type RegistrantInput
} from './ParentConsentView';

// /domain/parent?token=… : a parent approves (or declines) their child's
// domain purchase and pays (Stripe Checkout). No account needed; opening the
// page changes nothing, only a button does (mail scanners open links).
// Korean for a Korean browser, both languages when unknown, the 한국어 /
// English switch remembered on this device (the guardian page's pattern).
const LANG_KEY = 'twinkle-guardian-lang';

function initialMode(param: string | null): ParentLangMode {
  if (param === 'ko' || param === 'en') return param;
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    // fall through
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  if (languages.some((value) => /^ko\b/i.test(String(value || '')))) return 'ko';
  if (languages.some((value) => /^en\b/i.test(String(value || '')))) return 'en';
  return 'both';
}

export default function DomainParentConsent() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';
  const loadDomainParentOrder = useAppContext((v) => v.requestHelpers.loadDomainParentOrder);
  const decideDomainParentOrder = useAppContext((v) => v.requestHelpers.decideDomainParentOrder);
  const [mode, setMode] = useState<ParentLangMode>(() => initialMode(params.get('lang')));
  const [order, setOrder] = useState<ParentOrderView | null>(null);
  const [done, setDone] = useState<'' | 'approved' | 'declined'>('');
  const [submitting, setSubmitting] = useState<'' | 'approve' | 'decline'>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    loadDomainParentOrder({ token })
      .then((data: any) => setOrder(data?.order || null))
      .catch((e: any) => setError(e?.message || 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function decide(approve: boolean, registrant?: RegistrantInput) {
    setSubmitting(approve ? 'approve' : 'decline');
    setError('');
    try {
      const result = await decideDomainParentOrder({
        token,
        approve,
        registrant: registrant as unknown as Record<string, string>,
        adultConfirmed: approve
      });
      if (approve && result?.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setDone(approve ? 'approved' : 'declined');
    } catch (e: any) {
      setError(e?.message || 'error');
    } finally {
      setSubmitting('');
    }
  }

  const t = PARENT_TEXT[mode === 'both' ? 'ko' : mode];
  return (
    <div
      className={css`
        min-height: 100vh;
        padding: 2rem 1rem 4rem;
        background: #f6f6fb;
      `}
    >
      {error && <p style={{ textAlign: 'center', color: '#b42318' }}>{error}</p>}
      {done && order ? (
        <div style={{ maxWidth: '34rem', margin: '0 auto', background: '#fff', borderRadius: '1.4rem', padding: '1.6rem' }}>
          <h2>{done === 'approved' ? t.approvedTitle : t.declinedTitle}</h2>
          <p>{done === 'approved' ? t.approvedBody(order.domain) : t.declinedBody}</p>
        </div>
      ) : order ? (
        <ParentConsentView
          order={order}
          mode={mode}
          onMode={(next) => {
            setMode(next);
            try {
              window.localStorage.setItem(LANG_KEY, next);
            } catch {
              // ignore
            }
          }}
          submitting={submitting}
          onApprove={(registrant) => decide(true, registrant)}
          onDecline={() => decide(false)}
        />
      ) : null}
    </div>
  );
}
