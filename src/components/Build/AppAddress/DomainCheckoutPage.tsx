import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { useUserAssistant } from '~/helpers/assistantVoice';
import { CheckoutSurface } from './checkout/ui';
import { guessCountry, stateOrCity } from './checkout/countries';
import type { PhoneDraft } from './checkout/phone';
import { ADDRESS_TEXT, type AddressLang } from './text';
import { refreshDomainProgress, useDomainProgress } from './useDomainProgress';
import {
  addressHost,
  ConnectView,
  FindView,
  IntroView,
  MessageView,
  OrderStatusView,
  OwnerDetailsView,
  ParentRequestView,
  LiveView,
  orderStatusTitle,
  createEmailCodeGuard,
  emptyOwnerDetails,
  ownerDetailsProblem,
  shouldRefreshOrderProgress,
  splitRealName,
  type DnsRecordView,
  type DomainIdeaView,
  type DomainOrderView,
  type EmailCheck,
  type OwnerDetails
} from './views';

// /build/<id>/domain: the own-web-address checkout as its own page (Mikey
// 11-26: not layered over the Build page, where the preview's music, CPU
// and the page's scroll lock came along). The address chip's "Get your own
// .com", the wand's ?appAddress=… and Stripe's return ?domainOrder=… all
// land here (helpers/appAddressLinks.ts redirects the old /app/<id> forms).
// "Back to your app" and every close return to /build/<id>.
interface AddressInfo {
  enabled: boolean;
  slug?: string | null;
  url?: string | null;
  lumineUrl?: string | null;
  customDomainsEnabled?: boolean;
  domainSalesEnabled?: boolean;
  domains?: Array<{ id: number; hostname: string; status: string; source: string; statusLine?: string }>;
}

type Step =
  | { kind: 'intro' }
  | { kind: 'find' }
  | { kind: 'parent'; idea: DomainIdeaView }
  | { kind: 'owner'; idea: DomainIdeaView }
  | { kind: 'order'; orderId: number }
  | { kind: 'live'; hostname: string }
  | { kind: 'sent'; idea: DomainIdeaView }
  | { kind: 'connect'; domainId?: number }
  | null;

// Language preference for the parent approval email only (Korean parents
// receive Korean-friendly approval emails). Maker UI on twin-kle.com stays in
// English (audit D7).
function parentEmailLang(): AddressLang {
  try {
    return /^ko\b/i.test(document.documentElement.lang || navigator.language) ? 'ko' : 'en';
  } catch {
    return 'en';
  }
}

export default function DomainCheckoutPage({ buildId }: { buildId: number }) {
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const loadAppAddress = useAppContext((v) => v.requestHelpers.loadAppAddress);
  const loadDomainIdeas = useAppContext((v) => v.requestHelpers.loadDomainIdeas);
  const searchDomains = useAppContext((v) => v.requestHelpers.searchDomains);
  const startDomainOrder = useAppContext((v) => v.requestHelpers.startDomainOrder);
  const loadDomainPurchase = useAppContext((v) => v.requestHelpers.loadDomainPurchase);
  const startSelfDomainOrder = useAppContext((v) => v.requestHelpers.startSelfDomainOrder);
  const loadDomainOrder = useAppContext((v) => v.requestHelpers.loadDomainOrder);
  const loadDomainStatus = useAppContext((v) => v.requestHelpers.loadDomainStatus);
  const addAppDomain = useAppContext((v) => v.requestHelpers.addAppDomain);
  const loadAppDomainConnect = useAppContext((v) => v.requestHelpers.loadAppDomainConnect);
  const checkAppDomain = useAppContext((v) => v.requestHelpers.checkAppDomain);
  const loadPurchaseAccountEmail = useAppContext((v) => v.requestHelpers.loadPurchaseAccountEmail);
  const requestPurchaseEmailCode = useAppContext((v) => v.requestHelpers.requestPurchaseEmailCode);
  const verifyPurchaseEmailCode = useAppContext((v) => v.requestHelpers.verifyPurchaseEmailCode);
  const userId = useKeyContext((v) => v.myState.userId);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const onOpenSigninModal = useAppContext((v) => v.user.actions.onOpenSigninModal);
  const realName = useKeyContext((v) => v.myState.realName);
  const verifiedEmail = useKeyContext((v) => v.myState.verifiedEmail);
  const assistant = useUserAssistant(userId);
  const location = useLocation();
  const navigate = useNavigate();
  // Maker settings on twin-kle.com stay in English (audit D7).
  const t = ADDRESS_TEXT.en;
  const appPath = `/build/${buildId}`;

  const [app, setApp] = useState<{ title: string; isOwner: boolean } | null>(null);
  const [info, setInfo] = useState<AddressInfo | null>(null);
  const [step, setStep] = useState<Step>(null);
  const [query, setQuery] = useState('');
  const [ideas, setIdeas] = useState<DomainIdeaView[]>([]);
  const [loading, setLoading] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [hostname, setHostname] = useState('');
  const [connect, setConnect] = useState<{
    providerName: string | null;
    providerSteps: string[];
    domainConnectUrl: string | null;
    records: DnsRecordView[];
    status: 'waiting' | 'checking' | 'securing' | 'connected';
  } | null>(null);
  const [error, setError] = useState('');
  // Buying here: open for this member? who pays? (server decides)
  const [purchase, setPurchase] = useState<{ open: boolean; buyer?: 'self' | 'parent'; renews?: boolean } | null>(null);
  const [owner, setOwner] = useState<OwnerDetails>(() => emptyOwnerDetails(guessCountry()));
  // the phone as typed; owner.phone is the E.164 number made from it
  const [ownerPhone, setOwnerPhone] = useState<PhoneDraft>(() => ({ country: owner.country, national: '' }));
  const [ownerAgreed, setOwnerAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ownerProblem, setOwnerProblem] = useState('');
  const [order, setOrder] = useState<DomainOrderView | null>(null);
  // The owner's email is confirmed before payment: the verified Twinkle
  // email needs nothing; any other gets a one-time code, whose answer is a
  // short-lived token the order start sends along (the server checks it).
  const [accountEmail, setAccountEmail] = useState<string | null | undefined>(undefined);
  const [emailToken, setEmailToken] = useState<{ email: string; token: string } | null>(null);
  const [codeSentTo, setCodeSentTo] = useState('');
  const [codeSending, setCodeSending] = useState(false);
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [codeProblem, setCodeProblem] = useState('');

  // An adult buying for their own app: their name and verified email from
  // their Twinkle profile start filled in (they can change them). Only
  // empty fields are filled, once the profile is known. Never on the
  // parent's page (a different person).
  useEffect(() => {
    if (!realName && !verifiedEmail) return;
    setOwner((prev) => {
      const names = splitRealName(String(realName || ''));
      const next = {
        ...prev,
        firstName: prev.firstName || prev.lastName ? prev.firstName : names.firstName,
        lastName: prev.firstName || prev.lastName ? prev.lastName : names.lastName,
        email: prev.email || String(verifiedEmail || '').trim()
      };
      return next.firstName === prev.firstName && next.lastName === prev.lastName && next.email === prev.email ? prev : next;
    });
  }, [realName, verifiedEmail]);

  // Each request belongs to the screen that sent it: a reply that comes back
  // after the member left the page or moved on is dropped (no late Stripe
  // redirect, no screen jumping).
  const stepRef = useRef<Step>(null);
  stepRef.current = step;
  const flowGenRef = useRef(0);
  const inFlightRef = useRef<Record<string, boolean>>({});
  useEffect(
    () => () => {
      flowGenRef.current += 1;
    },
    []
  );
  function claimRequest(name: string) {
    if (inFlightRef.current[name]) return null;
    inFlightRef.current[name] = true;
    const gen = flowGenRef.current;
    const from = stepRef.current;
    return {
      current: () => flowGenRef.current === gen && stepRef.current === from,
      release: () => {
        inFlightRef.current[name] = false;
      }
    };
  }

  // Leaving replaces the checkout's history entry, so the browser's Back
  // from the editor doesn't reopen the checkout (or Stripe's return).
  function closeFlow() {
    flowGenRef.current += 1;
    navigate(appPath, { replace: true });
  }

  // Where to start: Stripe's return (?domainOrder=<id>, &cancelled=1 when
  // the member left Stripe), a wand plan (?appAddress=find|buy|connect|status
  // [&domain=…]; only the domain choice comes in, the member does every
  // buying step), else the intro.
  const [cancelledReturn] = useState(() => new URLSearchParams(location.search).get('cancelled') === '1');
  const startedRef = useRef(false);
  // Stripe's return opens its order at once: the order is read by its own
  // request (the server checks it's this member's), so nothing about the
  // app or its address can send the member away from a paid order.
  const [returnOrderId] = useState(() => Number(new URLSearchParams(location.search).get('domainOrder') || 0));
  const hasReturnOrder = Number.isSafeInteger(returnOrderId) && returnOrderId > 0;
  useEffect(() => {
    if (startedRef.current || !userId || !Number.isSafeInteger(returnOrderId) || returnOrderId <= 0) return;
    startedRef.current = true;
    setStep({ kind: 'order', orderId: returnOrderId });
  }, [userId, returnOrderId]);

  // The app and its address; only the owner buys for it. Transient failures
  // are retried, then shown as an error with Try again: a hiccup is never read
  // as "not the owner" or "hosting off" (that would send the member back to
  // the editor and lose Stripe's ?domainOrder return). Deterministic access
  // denials / missing builds redirect instead of trapping on a fake timeout.
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    // wait for the signed-in member (the page can load before them)
    if (!userId) return;
    let cancelled = false;
    const isDeterministicClientError = (err: unknown) => {
      const status = Number((err as any)?.status || (err as any)?.response?.status || 0);
      return status >= 400 && status < 500 && status !== 408 && status !== 429;
    };
    const withRetry = async <R,>(run: () => Promise<R>) => {
      for (let attempt = 0; ; attempt += 1) {
        try {
          return await run();
        } catch (err) {
          if (cancelled || attempt >= 2 || isDeterministicClientError(err)) throw err;
          await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
        }
      }
    };
    setLoadFailed(false);
    Promise.all([withRetry(() => loadBuild(buildId)), withRetry(() => loadAppAddress({ buildId }))]).then(
      ([data, address]: any[]) => {
        if (cancelled) return;
        if (!data || typeof data !== 'object') {
          setLoadFailed(true);
          return;
        }
        const access = data.access as { kind?: string; runtimePath?: string } | undefined;
        if (access?.kind === 'redirect-runtime' && access.runtimePath) {
          if (!startedRef.current && !hasReturnOrder) navigate(access.runtimePath, { replace: true });
          return;
        }
        const build = data.build;
        if (!build) {
          // unpublished, private branch, or missing build: not an owner checkout
          if (!startedRef.current && !hasReturnOrder) navigate(appPath, { replace: true });
          return;
        }
        setApp({ title: String(build.title || ''), isOwner: Number(build.userId) === Number(userId) });
        setInfo(address || { enabled: false });
      },
      (err: any) => {
        if (cancelled) return;
        const status = Number(err?.status || err?.response?.status || 0);
        if (status === 403 || status === 404) {
          if (!startedRef.current && !hasReturnOrder) navigate(appPath, { replace: true });
          return;
        }
        setLoadFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
    // request helpers are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, userId, loadAttempt]);

  useEffect(() => {
    if (startedRef.current || !app || !info) return;
    if (!app.isOwner || !info.enabled || !info.url) {
      navigate(appPath, { replace: true });
      return;
    }
    startedRef.current = true;
    const params = new URLSearchParams(location.search);
    const screen = params.get('appAddress') || '';
    if (['find', 'buy', 'connect', 'status'].includes(screen)) {
      void openFromWand(screen, String(params.get('domain') || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 253));
      return;
    }
    openOwnFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, info]);

  async function openFromWand(screen: string, domain: string) {
    // Like claimRequest: a reply that arrives after the member left (or
    // moved to another screen) changes nothing.
    const gen = flowGenRef.current;
    const startStep = stepRef.current;
    const still = (expected: Step = startStep) => flowGenRef.current === gen && stepRef.current === expected;
    setError('');
    if (screen === 'connect') {
      if (!info?.customDomainsEnabled) {
        openOwnFlow();
        return;
      }
      setHostname(domain);
      setConnect(null);
      setStep({ kind: 'connect' });
      return;
    }
    if (screen === 'status') {
      // the named address (bought or connected), else the newest one
      const status = await loadDomainStatus({ buildId, hostname: domain || undefined }).catch(() => null);
      if (!still()) return;
      const row = status?.domains?.[0];
      if (row && row.source === 'own' && row.status !== 'live' && info?.customDomainsEnabled) {
        setHostname(row.hostname);
        await showConnectSetup(row.id, () => still());
        return;
      }
      if (row && row.status === 'live') {
        setStep({ kind: 'live', hostname: row.hostname });
        return;
      }
      if (status?.order?.orderId) {
        setStep({ kind: 'order', orderId: status.order.orderId });
        return;
      }
      openOwnFlow();
      return;
    }
    const purchaseInfo = purchase || (await loadDomainPurchase({ buildId }).catch(() => ({ open: false })));
    if (!still()) return;
    setPurchase(purchaseInfo);
    if (!purchaseInfo?.open || !info?.domainSalesEnabled) {
      // buying here is closed: connecting your own still works
      setStep({ kind: 'intro' });
      return;
    }
    const label = domain.replace(/\.[a-z.]+$/, '') || app?.title || '';
    setQuery(label);
    const findStep: Step = { kind: 'find' };
    // the ref moves now: the search reply can arrive before the next render
    stepRef.current = findStep;
    setStep(findStep);
    if (screen === 'find' && !domain) {
      void loadIdeas();
      return;
    }
    setLoading(true);
    try {
      const data = await searchDomains({ q: label });
      if (!still(findStep)) return;
      const found = (data?.results || []).filter((row: any) => row.available && row.price).map((row: any) => row.price);
      setIdeas(found);
      const exact = found.find((idea: DomainIdeaView) => idea.domain === domain);
      if (screen === 'buy' && exact) {
        setOwnerProblem('');
        setStep(purchaseInfo.buyer === 'self' ? { kind: 'owner', idea: exact } : { kind: 'parent', idea: exact });
      } else if (screen === 'buy') {
        setError(t.notAvailableHere(domain));
      }
    } finally {
      setLoading(false);
    }
  }

  // While an order is being set up, ask again every 5 s (each ask may move
  // it forward on the server); stop once it is live or refunded. A failed
  // read keeps the order id: it shows (with Check again) and is retried by
  // itself, a little later each time.
  const orderId = step?.kind === 'order' ? step.orderId : 0;
  const progress = useDomainProgress(buildId, Boolean(orderId));
  const [orderLookupError, setOrderLookupError] = useState('');
  const [orderAttempt, setOrderAttempt] = useState(0);
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer = 0;
    let failures = 0;
    let lastStatus = '';
    let lastStage = '';
    async function poll() {
      try {
        const data = await loadDomainOrder({ buildId, orderId });
        if (cancelled) return;
        if (!data?.order) throw new Error(t.orderLookupBody);
        failures = 0;
        setOrderLookupError('');
        const changed = shouldRefreshOrderProgress({
          orderAttempt,
          lastStatus,
          lastStage,
          nextOrder: data.order
        });
        lastStatus = data.order.status;
        lastStage = data.order.stage;
        setOrder(data.order);
        if (changed) refreshDomainProgress(buildId);
        if (data.order.stage === 'live') return;
        // keep asking while payment or setup is still going (a webhook can
        // land after the buyer is back from Stripe)
        if (['paying', 'setting_up', 'refunding'].includes(data.order.stage)) timer = window.setTimeout(poll, 5000);
      } catch (e: any) {
        if (cancelled) return;
        failures += 1;
        setOrderLookupError(e?.message || t.orderLookupBody);
        if (failures < 6) timer = window.setTimeout(poll, 5000 * failures);
      }
    }
    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, buildId, orderAttempt]);

  function openOwnFlow() {
    setError('');
    setStep({ kind: 'intro' });
    if (purchase) return;
    loadDomainPurchase({ buildId })
      .then((data: any) => setPurchase(data || { open: false }))
      .catch(() => setPurchase({ open: false }));
  }

  async function payAsOwner(idea: DomainIdeaView) {
    const problem = ownerDetailsProblem(t, owner);
    if (problem) {
      setOwnerProblem(problem);
      return;
    }
    // one hand-off to Stripe at a time, for exactly the details on screen
    const request = claimRequest('pay');
    if (!request) return;
    const registrant = { ...owner, phone: owner.phone.trim(), state: stateOrCity(owner.country, owner.state, owner.city) };
    const typedEmail = registrant.email.trim().toLowerCase();
    setOwnerProblem('');
    setPaying(true);
    try {
      const result = await startSelfDomainOrder({
        buildId,
        domain: idea.domain,
        registrant,
        agreed: ownerAgreed,
        priceCents: idea.priceCents,
        emailToken: emailToken && emailToken.email === typedEmail ? emailToken.token : undefined
      });
      // Leaving the check screen (Back, leaving the page) cancels the
      // hand-off; the same server order opens again from Continue to payment.
      if (!request.current()) return;
      if (result?.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setOwnerProblem(t.whyOther(idea.domain));
    } catch (e: any) {
      if (!request.current()) return;
      // the code's token expired (or account email is no longer verified): confirm again
      if (e?.code === 'email_unverified') {
        setAccountEmail(null);
        setEmailToken(null);
        setCodeSentTo('');
        setCodeProblem('');
      }
      setOwnerProblem(e?.message || '');
    } finally {
      request.release();
      setPaying(false);
    }
  }

  const ownerEmail = owner.email.trim().toLowerCase();
  const ownerEmailRef = useRef(ownerEmail);
  ownerEmailRef.current = ownerEmail;
  const [emailCodeGuard] = useState(createEmailCodeGuard);
  const prevOwnerEmailRef = useRef(ownerEmail);
  useEffect(() => {
    if (prevOwnerEmailRef.current === ownerEmail) return;
    prevOwnerEmailRef.current = ownerEmail;
    emailCodeGuard.invalidate();
    setCodeSending(false);
    setCodeVerifying(false);
    setCodeProblem('');
  }, [emailCodeGuard, ownerEmail]);
  useEffect(
    () => () => {
      emailCodeGuard.invalidate();
    },
    [emailCodeGuard]
  );

  const emailCheck: EmailCheck = {
    verified: Boolean(ownerEmail) && (ownerEmail === accountEmail || emailToken?.email === ownerEmail),
    sentTo: codeSentTo,
    sending: codeSending,
    verifying: codeVerifying,
    problem: codeProblem,
    async onSend() {
      const gen = emailCodeGuard.beginSend();
      if (gen === null) return;
      const email = ownerEmailRef.current;
      setCodeSending(true);
      setCodeVerifying(false);
      setCodeProblem('');
      try {
        const result = await requestPurchaseEmailCode({ email });
        if (!emailCodeGuard.isCurrent(gen)) return;
        if (result?.status === 'already_verified') setAccountEmail(email);
        else setCodeSentTo(email);
      } catch (e: any) {
        if (!emailCodeGuard.isCurrent(gen)) return;
        setCodeProblem(e?.message || '');
      } finally {
        emailCodeGuard.endSend(gen);
        if (emailCodeGuard.isCurrent(gen)) setCodeSending(false);
      }
    },
    async onVerify(code: string) {
      const gen = emailCodeGuard.beginVerify();
      if (gen === null) return;
      const email = ownerEmailRef.current;
      setCodeVerifying(true);
      setCodeProblem('');
      try {
        const result = await verifyPurchaseEmailCode({ email, code });
        if (!emailCodeGuard.isCurrent(gen)) return;
        if (result?.token) setEmailToken({ email, token: result.token });
      } catch (e: any) {
        if (!emailCodeGuard.isCurrent(gen)) return;
        setCodeProblem(e?.message || '');
        if (e?.code === 'code_expired' || e?.code === 'code_attempts') setCodeSentTo('');
      } finally {
        emailCodeGuard.endVerify(gen);
        if (emailCodeGuard.isCurrent(gen)) setCodeVerifying(false);
      }
    }
  };

  // The verified Twinkle email, once, when the owner's steps open: it
  // prefills an empty email box (never over what was typed). Transient
  // failures leave accountEmail undefined so reopening retries.
  const needsAccountEmail = accountEmail === undefined;
  useEffect(() => {
    if (step?.kind !== 'owner' || !needsAccountEmail) return;
    let cancelled = false;
    loadPurchaseAccountEmail()
      .then((data: any) => {
        if (cancelled) return;
        const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : null;
        setAccountEmail(email);
        if (email) setOwner((prev) => (prev.email.trim() ? prev : { ...prev, email }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.kind, userId, needsAccountEmail]);

  async function loadIdeas({ more = false, hint = '' } = {}) {
    setLoading(true);
    setError('');
    try {
      const data = await loadDomainIdeas({ buildId, more: more ? '1' : undefined, hint: hint || undefined });
      setIdeas(data?.ideas || []);
    } catch (e: any) {
      setError(e?.message || '');
    } finally {
      setLoading(false);
    }
  }

  async function search() {
    setLoading(true);
    try {
      const data = await searchDomains({ q: query });
      setIdeas((data?.results || []).filter((row: any) => row.available && row.price).map((row: any) => row.price));
    } finally {
      setLoading(false);
    }
  }

  async function sendToParent(idea: DomainIdeaView) {
    const request = claimRequest('parent');
    if (!request) return;
    setSending(true);
    try {
      await startDomainOrder({
        buildId,
        domain: idea.domain,
        parentEmail,
        lang: parentEmailLang(),
        // the price on screen, so the API can refuse a quote that has since
        // changed (that check is coming on the API side; today it keeps its
        // own quote, which the parent reviews before paying)
        priceCents: idea.priceCents
      });
      if (request.current()) setStep({ kind: 'sent', idea });
    } catch (e: any) {
      if (request.current()) setError(e?.message || '');
    } finally {
      request.release();
      setSending(false);
    }
  }

  async function showConnectSetup(domainId: number, stillCurrent: () => boolean = () => true) {
    const how = await loadAppDomainConnect({ buildId, domainId });
    if (!stillCurrent()) return;
    setConnect({
      providerName: how?.provider?.name || how?.domainConnect?.providerName || null,
      providerSteps: how?.provider?.steps || how?.instructions?.plainSteps || [],
      domainConnectUrl: how?.domainConnect?.applyUrl || null,
      records: how?.instructions?.records || [],
      status: 'waiting'
    });
    setStep({ kind: 'connect', domainId });
  }

  async function startConnect() {
    const request = claimRequest('connect');
    if (!request) return;
    setError('');
    try {
      const added = await addAppDomain({ buildId, hostname });
      if (!request.current()) return;
      await showConnectSetup(added.domainId, request.current);
    } catch (e: any) {
      if (request.current()) setError(e?.message || '');
    } finally {
      request.release();
    }
  }

  async function checkConnect(domainId?: number) {
    if (!domainId || !connect) return;
    setConnect({ ...connect, status: 'checking' });
    try {
      const result = await checkAppDomain({ buildId, domainId });
      setConnect({
        ...connect,
        status: result?.status === 'live' ? 'connected' : result?.status === 'issuing' ? 'securing' : 'waiting'
      });
    } catch {
      setConnect({ ...connect, status: 'waiting' });
    }
  }

  // Re-check every 20 s while the connect screen is open (turns green by
  // itself once the member's settings reach us).
  useConnectPolling(step, connect?.status, checkConnect);

  const appTitle = app?.title || '';
  const freeUrl = info?.lumineUrl || info?.url || '';
  const freeHost = freeUrl ? addressHost(freeUrl) : '';
  const askContext = (label: string, excerpt: string) => ({
    kind: 'page',
    id: buildId,
    label,
    path: `/build/${buildId}/domain`,
    excerpt: `App web address screen for "${appTitle}". Free address: ${freeHost}. ${excerpt}`.slice(0, 600)
  });
  const pageTitle = !step
    ? t.introTitle
    : step.kind === 'owner'
      ? t.ownerTitle(step.idea.domain)
      : step.kind === 'order' && order
        ? orderStatusTitle(t, order)
        : step.kind === 'live'
          ? t.liveTitle(step.hostname)
          : step.kind === 'connect'
            ? t.connectTitle
            : step.kind === 'parent'
              ? t.parentTitle
              : t.introTitle;
  // the share sheet, or the link copied (true) where there's none
  const shareAddress = async (url: string) => {
    if (navigator.share) {
      await navigator.share({ title: appTitle, url }).catch(() => {});
      return false;
    }
    return Boolean(await navigator.clipboard?.writeText(url).then(() => true, () => false));
  };

  return (
    <CheckoutSurface variant="page" label={pageTitle} onClose={closeFlow} closeLabel={t.backToApp}>
      {!step && !userId && sessionLoaded && (
        <MessageView
          t={t}
          assistant={assistant}
          stepKey="sign-in"
          title={t.signInTitle}
          body={t.signInBody}
          primaryLabel={t.signIn}
          onPrimary={() => onOpenSigninModal()}
          secondaryLabel={t.backToApp}
          onSecondary={closeFlow}
        />
      )}
      {!step && loadFailed && (
        <MessageView
          t={t}
          assistant={assistant}
          stepKey="load-failed"
          title={t.pageLoadTitle}
          tip={t.tipOops}
          body={t.pageLoadBody}
          primaryLabel={t.tryAgain}
          onPrimary={() => setLoadAttempt((value) => value + 1)}
          secondaryLabel={t.backToApp}
          onSecondary={closeFlow}
        />
      )}
      {!step && !loadFailed && (userId || !sessionLoaded) && <MessageView t={t} assistant={assistant} stepKey="loading" title={t.renameChecking} body="" primaryLabel={t.backToApp} onPrimary={closeFlow} />}
      {step?.kind === 'intro' && (
        <IntroView
          t={t}
          assistant={assistant}
          error={error}
          freeHost={freeHost}
          onFind={
            purchase?.open && info?.domainSalesEnabled
              ? () => {
                  setError('');
                  setStep({ kind: 'find' });
                  if (!query) setQuery(appTitle);
                  if (!ideas.length) void loadIdeas();
                }
              : undefined
          }
          onHaveOne={info?.customDomainsEnabled ? () => setStep({ kind: 'connect' }) : undefined}
          onClose={closeFlow}
          ask={<AskAgentButton showLabelOnMobile context={askContext('getting my own web address', 'Step: what a domain is.')} />}
        />
      )}
      {step?.kind === 'find' && (
        <FindView
          t={t}
          assistant={assistant}
          error={error}
          freeHost={freeHost}
          query={query}
          ideas={ideas}
          loading={loading}
          forParent={purchase?.buyer !== 'self'}
          onQuery={setQuery}
          onSearch={search}
          onBuy={(idea) => {
            setError('');
            setOwnerProblem('');
            setStep(purchase?.buyer === 'self' ? { kind: 'owner', idea } : { kind: 'parent', idea });
          }}
          onUseOwn={info?.customDomainsEnabled ? () => setStep({ kind: 'connect' }) : undefined}
          onMoreIdeas={() => loadIdeas({ more: true })}
          onBack={() => {
            setError('');
            setStep({ kind: 'intro' });
          }}
          ask={
            <AskAgentButton
              showLabelOnMobile
              label={t.askIdeas}
              context={askContext(
                'ideas for my app’s web address',
                `Step: choosing a name. Shown: ${ideas
                  .slice(0, 6)
                  .map((idea) => `${idea.domain} $${(idea.priceCents / 100).toFixed(2)}`)
                  .join(', ')}.`
              )}
            />
          }
        />
      )}
      {step?.kind === 'parent' && (
        <ParentRequestView
          t={t}
          assistant={assistant}
          error={error}
          idea={step.idea}
          email={parentEmail}
          sending={sending}
          onEmail={setParentEmail}
          onSend={() => sendToParent(step.idea)}
          onBack={() => setStep({ kind: 'find' })}
        />
      )}
      {step?.kind === 'owner' && (
        <OwnerDetailsView
          t={t}
          assistant={assistant}
          error={error}
          idea={step.idea}
          details={owner}
          agreed={ownerAgreed}
          renews={Boolean(purchase?.renews)}
          busy={paying}
          problem={ownerProblem}
          onDetails={setOwner}
          phoneDraft={ownerPhone}
          onPhoneDraft={setOwnerPhone}
          onAgree={setOwnerAgreed}
          onPay={() => void payAsOwner(step.idea)}
          emailCheck={emailCheck}
          onBack={() => setStep({ kind: 'find' })}
        />
      )}
      {step?.kind === 'order' &&
        (order ? (
          <OrderStatusView
            t={t}
            assistant={assistant}
            order={order}
            cancelledReturn={cancelledReturn}
            refreshError={orderLookupError ? t.refreshFailed : ''}
            progress={progress && progress.orderId === step.orderId ? progress : null}
            buildId={buildId}
            onOpen={() => window.open(`https://${order.domain}`, '_blank', 'noopener,noreferrer')}
            onShare={() => shareAddress(`https://${order.domain}`)}
            onTryAgain={() => {
              setOrder(null);
              navigate(`/build/${buildId}/domain`, { replace: true });
              openOwnFlow();
            }}
            onClose={closeFlow}
          />
        ) : orderLookupError ? (
          <MessageView
            t={t}
            assistant={assistant}
            stepKey="order-lookup-failed"
            title={t.orderLookupTitle}
            tip={t.tipOops}
            body={t.orderLookupBody}
            note={orderLookupError}
            noteTone="error"
            primaryLabel={t.checkAgain}
            onPrimary={() => {
              setOrderLookupError('');
              setOrderAttempt((value) => value + 1);
            }}
            secondaryLabel={t.backToApp}
            onSecondary={closeFlow}
          />
        ) : (
          <MessageView t={t} assistant={assistant} stepKey="order-loading" title={t.renameChecking} body="" primaryLabel={t.backToApp} onPrimary={closeFlow} />
        ))}
      {step?.kind === 'live' && (
        <LiveView
          t={t}
          assistant={assistant}
          domain={step.hostname}
          onOpen={() => window.open(`https://${step.hostname}`, '_blank', 'noopener,noreferrer')}
          onShare={() => shareAddress(`https://${step.hostname}`)}
          onDone={closeFlow}
        />
      )}
      {step?.kind === 'sent' && (
        <MessageView
          t={t}
          assistant={assistant}
          stepKey="sent"
          title={t.sentTitle}
          tip={t.tipSent}
          body={t.sentBody(step.idea.domain)}
          primaryLabel={t.done}
          onPrimary={closeFlow}
        />
      )}
      {step?.kind === 'connect' && (
        <ConnectView
          t={t}
          assistant={assistant}
          error={error}
          hostname={hostname}
          onHostname={setHostname}
          onConnect={startConnect}
          onClose={closeFlow}
          stage={connect ? 'setup' : 'enter'}
          providerName={connect?.providerName || null}
          providerSteps={connect?.providerSteps || []}
          domainConnectUrl={connect?.domainConnectUrl || null}
          records={connect?.records || []}
          status={connect?.status || 'waiting'}
          onCheck={() => checkConnect(step.domainId)}
          ask={
            <AskAgentButton
              showLabelOnMobile
              label={t.askHelp}
              context={askContext(
                'connecting my domain',
                `Step: connecting ${hostname || 'a domain bought elsewhere'}. Provider: ${
                  connect?.providerName || 'unknown'
                }. Status: ${connect?.status || 'not started'}.`
              )}
            />
          }
        />
      )}
    </CheckoutSurface>
  );
}

function useConnectPolling(step: Step, status: string | undefined, check: (domainId?: number) => void) {
  const domainId = step?.kind === 'connect' ? step.domainId : undefined;
  useEffect(() => {
    if (!domainId || status === 'connected') return;
    const timer = window.setInterval(() => check(domainId), 20_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId, status]);
}
