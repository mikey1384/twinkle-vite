import React, { useEffect, useRef, useState } from 'react';
import { CheckoutSurface, Notice } from '~/components/Build/AppAddress/checkout/ui';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { PARENT_TEXT } from '~/components/Build/AppAddress/text';
import ParentConsentView, {
  ParentLangToggle,
  ParentStateView,
  type ParentLangMode,
  type ParentOrderView,
  type RegistrantInput
} from './ParentConsentView';

// /domain/parent#token=… : a parent approves (or declines) their child's
// domain purchase and pays (Stripe Checkout). No account needed; opening the
// page changes nothing, only a button does (mail scanners open links).
// Korean for a Korean browser, both languages when unknown, the 한국어 /
// English switch remembered on this device (the guardian page's pattern).
// The token lives in the #fragment and goes to the API in request bodies
// only, so it never appears in a URL log or a Referer. The page shows the
// order's real state and keeps it fresh while payment or setup is running.
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
  const hashParams = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
  const token = hashParams.get('token') || '';
  const loadDomainParentOrder = useAppContext((v) => v.requestHelpers.loadDomainParentOrder);
  const decideDomainParentOrder = useAppContext((v) => v.requestHelpers.decideDomainParentOrder);
  const [mode, setMode] = useState<ParentLangMode>(() => initialMode(params.get('lang')));
  const [order, setOrder] = useState<ParentOrderView | null>(null);
  const [done, setDone] = useState<'' | 'approved' | 'declined'>('');
  const [submitting, setSubmitting] = useState<'' | 'approve' | 'decline'>('');
  const [error, setError] = useState('');
  const decidingRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer = 0;
    async function load() {
      try {
        const data = await loadDomainParentOrder({ token });
        if (cancelled) return;
        setOrder(data?.order || null);
        const status = String(data?.order?.status || '');
        if (['approved', 'approving', 'paid', 'registering', 'registered', 'failed'].includes(status)) {
          timer = window.setTimeout(load, 8000);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'error');
      }
    }
    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function decide(approve: boolean, registrant?: RegistrantInput) {
    // one answer at a time (a second tap waits for the first)
    if (decidingRef.current) return;
    decidingRef.current = true;
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
      decidingRef.current = false;
      setSubmitting('');
    }
  }

  const t = PARENT_TEXT[mode === 'both' ? 'ko' : mode];
  const status = String(order?.status || '');
  const stateMessage: { title: string; body: string } | null = !order
    ? null
    : done === 'approved'
      ? { title: t.approvedTitle, body: t.approvedBody(order.domain) }
      : done === 'declined' || status === 'parent_declined'
        ? { title: t.declinedTitle, body: t.declinedBody }
        : ['approved', 'approving'].includes(status)
          ? { title: t.payingTitle, body: t.payingBody }
          : ['paid', 'registering', 'registered', 'needs_support'].includes(status)
            ? { title: t.settingUpTitle, body: t.settingUpBody(order.domain) }
            : status === 'live'
              ? { title: t.liveTitle, body: t.liveBody(order.domain) }
              : ['failed', 'refunded'].includes(status)
                ? { title: t.refundTitle, body: t.refundBody }
                : status === 'awaiting_parent'
                  ? null
                  : { title: t.expiredTitle, body: t.expiredBody };
  const changeMode = (next: ParentLangMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore
    }
  };
  return (
    <CheckoutSurface variant="page" label={t.kicker} topRight={<ParentLangToggle mode={mode} onMode={changeMode} />}>
      {error && (
        <div style={{ maxWidth: 640, margin: '0 auto 12px', padding: '0 20px' }}>
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {stateMessage ? (
        <ParentStateView title={stateMessage.title} body={stateMessage.body} celebrate={status === 'live' || done === 'approved'} />
      ) : order ? (
        <ParentConsentView
          order={order}
          mode={mode}
          submitting={submitting}
          onApprove={(registrant) => decide(true, registrant)}
          onDecline={() => decide(false)}
        />
      ) : null}
    </CheckoutSurface>
  );
}
