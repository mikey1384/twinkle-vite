import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '~/components/Modal';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { useUserAssistant } from '~/helpers/assistantVoice';
import { CheckoutSurface } from './checkout/ui';
import { guessCountry } from './checkout/countries';
import { draftFromPhone, type PhoneDraft } from './checkout/phone';
import { ADDRESS_TEXT, type AddressLang } from './text';
import AppPlayers from './AppPlayers';
import {
  AddressMenuView,
  addressHost,
  ConnectView,
  FindView,
  IntroView,
  MessageView,
  OrderStatusView,
  OwnerDetailsView,
  ParentRequestView,
  LiveView,
  RenameView,
  orderStatusTitle,
  emptyOwnerDetails,
  ownerDetailsProblem,
  type DnsRecordView,
  type DomainIdeaView,
  type DomainOrderView,
  type OwnerDetails
} from './views';

// The app's address chip in the Build header's strip, with Open / Copy /
// Share and, for the owner, Change address and "Get your own .com" (Mikey
// 11-25 north star), then the owner's Players chip. "Get your own" opens a
// full-screen, step-by-step checkout over the page (./checkout): the
// workspace underneath stays as it was, the wand's deep links and Stripe's
// return (?appAddress=…, ?domainOrder=…) open it straight at their step, and
// the browser's Back closes it. `children` (other strip
// chips) sit between the two and still show while the hosting switch is off
// (the API answers { enabled: false }), so it is safe to mount everywhere.
interface AddressInfo {
  enabled: boolean;
  eligible?: boolean;
  slug?: string | null;
  // the address to share: a live bought domain, else the free address
  url?: string | null;
  // the free lumine.app address
  lumineUrl?: string | null;
  customDomainsEnabled?: boolean;
  domainSalesEnabled?: boolean;
  domains?: Array<{ id: number; hostname: string; status: string; source: string; statusLine?: string }>;
  accountMode?: 'twinkle' | 'app' | 'both';
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
  | { kind: 'rename' }
  | null;

function pageLang(): AddressLang {
  try {
    return /^ko\b/i.test(document.documentElement.lang || navigator.language) ? 'ko' : 'en';
  } catch {
    return 'en';
  }
}

// Once the API says hosting is off, later editor opens in this page load
// skip the request (the switch flips with a deploy/reload anyway).
let hostingKnownOff = false;

export default function AppAddress({
  buildId,
  isOwner,
  appTitle,
  children
}: {
  buildId: number;
  isOwner: boolean;
  appTitle: string;
  children?: React.ReactNode;
}) {
  const loadAppAddress = useAppContext((v) => v.requestHelpers.loadAppAddress);
  const loadDomainIdeas = useAppContext((v) => v.requestHelpers.loadDomainIdeas);
  const searchDomains = useAppContext((v) => v.requestHelpers.searchDomains);
  const startDomainOrder = useAppContext((v) => v.requestHelpers.startDomainOrder);
  const loadDomainPurchase = useAppContext((v) => v.requestHelpers.loadDomainPurchase);
  const startSelfDomainOrder = useAppContext((v) => v.requestHelpers.startSelfDomainOrder);
  const loadSavedRegistrant = useAppContext((v) => v.requestHelpers.loadSavedRegistrant);
  const forgetSavedRegistrant = useAppContext((v) => v.requestHelpers.forgetSavedRegistrant);
  const loadDomainOrder = useAppContext((v) => v.requestHelpers.loadDomainOrder);
  const loadDomainStatus = useAppContext((v) => v.requestHelpers.loadDomainStatus);
  const removeAppDomain = useAppContext((v) => v.requestHelpers.removeAppDomain);
  const addAppDomain = useAppContext((v) => v.requestHelpers.addAppDomain);
  const loadAppDomainConnect = useAppContext((v) => v.requestHelpers.loadAppDomainConnect);
  const checkAppDomain = useAppContext((v) => v.requestHelpers.checkAppDomain);
  const checkAppAddressSlug = useAppContext((v) => v.requestHelpers.checkAppAddressSlug);
  const renameAppAddress = useAppContext((v) => v.requestHelpers.renameAppAddress);
  const [renameValue, setRenameValue] = useState('');
  const [renameStatus, setRenameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [renameMessage, setRenameMessage] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [info, setInfo] = useState<AddressInfo | null>(null);
  const [copied, setCopied] = useState(false);
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
  // the member's saved details (their own, from their last purchase)
  const [savedDetails, setSavedDetails] = useState<'saved' | 'none' | 'forgotten'>('none');
  const savedAskedRef = useRef(false);
  const [paying, setPaying] = useState(false);
  const [ownerProblem, setOwnerProblem] = useState('');
  const [order, setOrder] = useState<DomainOrderView | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  // The history entry this checkout pushed (its id is in the entry's
  // router state), and whether a close is already going back over it.
  const ownedEntryRef = useRef<string | null>(null);
  const closingRef = useRef(false);
  const markedEntry = (location.state as Record<string, unknown> | null)?.appAddressCheckout;
  const routePath = `${location.pathname}${location.search}${location.hash}`;
  // Replace the current entry's URL through the router (deep-link and
  // Stripe parameters are used once), keeping its state.
  function replaceQuery(remove: string[]) {
    const params = new URLSearchParams(location.search);
    if (!remove.some((key) => params.has(key))) return;
    remove.forEach((key) => params.delete(key));
    const search = params.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ''}${location.hash}`, { replace: true, state: location.state });
  }
  // Each request the checkout sends belongs to the screen that sent it: a
  // reply that comes back after the member closed the checkout or moved on
  // is dropped (no late Stripe redirect, no screen reopening).
  const stepRef = useRef<Step>(null);
  stepRef.current = step;
  const flowGenRef = useRef(0);
  const inFlightRef = useRef<Record<string, boolean>>({});
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
  const userId = useKeyContext((v) => v.myState.userId);
  const assistant = useUserAssistant(userId);
  const t = ADDRESS_TEXT[pageLang()];

  // Back from Stripe Checkout: ?domainOrder=<id> opens the order's status
  // (&cancelled=1: the member left Stripe without paying).
  const [cancelledReturn] = useState(() => new URLSearchParams(location.search).get('cancelled') === '1');
  useEffect(() => {
    if (!isOwner) return;
    let orderId = 0;
    try {
      orderId = Number(new URLSearchParams(location.search).get('domainOrder') || 0);
    } catch {
      orderId = 0;
    }
    if (orderId > 0) setStep({ kind: 'order', orderId });
    // read once when the page (or owner) arrives; the parameter is cleared on close
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner]);

  // A wand plan (Zero/Ciel, twinkle-api sponsoredHelp open_app_address)
  // opens ?appAddress=find|buy|connect|status[&domain=…] on the owner's app
  // page. Only the domain choice comes in; the member does every buying step.
  const [deepLink, setDeepLink] = useState<{ screen: string; domain: string } | null>(null);
  useEffect(() => {
    if (!isOwner) return;
    try {
      const params = new URLSearchParams(location.search);
      const screen = params.get('appAddress') || '';
      if (!['find', 'buy', 'connect', 'status'].includes(screen)) return;
      setDeepLink({ screen, domain: String(params.get('domain') || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 253) });
      replaceQuery(['appAddress', 'domain']);
    } catch {
      // no deep link
    }
    // read once when the page (or owner) arrives, then removed from the URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner]);
  useEffect(() => {
    if (!deepLink || !info?.enabled) return;
    const { screen, domain } = deepLink;
    setDeepLink(null);
    void openFromWand(screen, domain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink, info?.enabled]);

  async function openFromWand(screen: string, domain: string) {
    // Like claimRequest: a reply that arrives after the checkout was closed
    // (or the member moved to another screen) changes nothing.
    const gen = flowGenRef.current;
    const startStep = stepRef.current;
    const still = (expected: Step = startStep) => flowGenRef.current === gen && stepRef.current === expected;
    setError('');
    if (screen === 'connect') {
      if (!info?.customDomainsEnabled) {
        setStep({ kind: 'intro' });
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
      setStep({ kind: 'intro' });
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
    const label = domain.replace(/\.[a-z.]+$/, '') || appTitle;
    setQuery(label);
    const findStep: Step = { kind: 'find' };
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
  // it forward on the server); stop once it is live or refunded.
  // A failed read keeps the order id: it shows (with Check again) and is
  // retried by itself, a little later each time.
  const orderId = step?.kind === 'order' ? step.orderId : 0;
  const [orderLookupError, setOrderLookupError] = useState('');
  const [orderAttempt, setOrderAttempt] = useState(0);
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer = 0;
    let failures = 0;
    async function poll() {
      try {
        const data = await loadDomainOrder({ buildId, orderId });
        if (cancelled) return;
        if (!data?.order) throw new Error(t.orderLookupBody);
        failures = 0;
        setOrderLookupError('');
        setOrder(data.order);
        if (data.order.stage === 'live') {
          const fresh = await loadAppAddress({ buildId }).catch(() => null);
          if (!cancelled && fresh) setInfo(fresh);
          return;
        }
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

  // An adult buyer's saved details prefill every step once (never over what
  // they already typed in this checkout).
  useEffect(() => {
    if (purchase?.buyer !== 'self' || savedAskedRef.current) return;
    savedAskedRef.current = true;
    loadSavedRegistrant()
      .then((data: any) => {
        const saved = data?.saved?.registrant;
        if (!saved) return;
        const typed = ['firstName', 'lastName', 'address1', 'city', 'zip'].some((key) => String((owner as any)[key] || '').trim());
        if (typed) return;
        const filled: OwnerDetails = { ...emptyOwnerDetails(saved.country || owner.country), ...saved };
        setOwner(filled);
        setOwnerPhone(draftFromPhone(filled.phone, filled.country));
        setSavedDetails('saved');
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchase?.buyer]);

  async function forgetOrSkipSaved() {
    if (savedDetails === 'saved') {
      try {
        await forgetSavedRegistrant();
      } catch {
        setOwnerProblem(t.forgetFailed);
        return;
      }
    }
    setSavedDetails('forgotten');
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
    const registrant = { ...owner, phone: owner.phone.trim() };
    setOwnerProblem('');
    setPaying(true);
    try {
      const result = await startSelfDomainOrder({
        buildId,
        domain: idea.domain,
        registrant,
        agreed: ownerAgreed,
        priceCents: idea.priceCents,
        saveDetails: savedDetails !== 'forgotten'
      });
      // Leaving the check screen (Back, closing) cancels the hand-off; the
      // same server order opens again from Continue to payment.
      if (!request.current()) return;
      if (result?.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setOwnerProblem(t.whyOther(idea.domain));
    } catch (e: any) {
      if (request.current()) setOwnerProblem(e?.message || '');
    } finally {
      request.release();
      setPaying(false);
    }
  }

  // Close once, however many times it's asked: on the checkout's own entry
  // that's one step back (the reconcile effect below then closes it).
  function closeFlow() {
    if (closingRef.current) return;
    if (ownedEntryRef.current && markedEntry === ownedEntryRef.current) {
      closingRef.current = true;
      navigate(-1);
      return;
    }
    ownedEntryRef.current = null;
    finishClose();
  }

  function finishClose() {
    flowGenRef.current += 1;
    setStep(null);
    setOrder(null);
    clearOrderParam();
  }

  // Stripe's ?domainOrder= has done its job once the order screen closes
  function clearOrderParam() {
    replaceQuery(['domainOrder', 'cancelled']);
  }

  // The checkout adds one history entry while it is open, so the browser's
  // (or a phone's) Back closes it instead of leaving the page.
  const checkoutOpen = Boolean(step && step.kind !== 'rename');
  useEffect(() => {
    if (!checkoutOpen || ownedEntryRef.current) return;
    const id = `${buildId}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    ownedEntryRef.current = id;
    navigate(routePath, { state: { ...((location.state as Record<string, unknown>) || {}), appAddressCheckout: id } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen]);
  // Reconcile with the router on every move: the checkout stays open only on
  // the entry it pushed. Back, a Forward onto an older checkout entry, or
  // closeFlow's step back closes it; entries from earlier checkouts (after
  // Forward or a reload) never reopen it.
  useEffect(() => {
    const owned = ownedEntryRef.current;
    if (!owned) return;
    if (markedEntry === owned) return;
    ownedEntryRef.current = null;
    closingRef.current = false;
    finishClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    let cancelled = false;
    if (hostingKnownOff) {
      setInfo({ enabled: false });
      return;
    }
    loadAppAddress({ buildId })
      .then((data: AddressInfo) => {
        if (data && data.enabled === false) hostingKnownOff = true;
        if (!cancelled) setInfo(data);
      })
      .catch(() => !cancelled && setInfo({ enabled: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId]);

  async function loadIdeas({ more = false, hint = '' } = {}) {
    setLoading(true);
    setError('');
    try {
      const data = await loadDomainIdeas({
        buildId,
        more: more ? '1' : undefined,
        hint: hint || undefined
      });
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
      setIdeas(
        (data?.results || [])
          .filter((row: any) => row.available && row.price)
          .map((row: any) => row.price)
      );
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
        lang: pageLang(),
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

  async function removeDomain(domainId: number) {
    setError('');
    try {
      await removeAppDomain({ buildId, domainId });
      const fresh = await loadAppAddress({ buildId }).catch(() => null);
      if (fresh) setInfo(fresh);
    } catch (e: any) {
      setError(e?.message || '');
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

  // Live "is this name free?" while the rename screen is open (debounced).
  useEffect(() => {
    if (step?.kind !== 'rename') return;
    const slug = renameValue.trim();
    if (!slug || slug === info?.slug || slug.length < 3) {
      setRenameStatus('idle');
      return;
    }
    setRenameStatus('checking');
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkAppAddressSlug({ buildId, slug });
        if (cancelled) return;
        setRenameStatus(result?.available ? 'available' : 'taken');
        setRenameMessage(result?.message || '');
      } catch (e: any) {
        if (cancelled) return;
        setRenameStatus('taken');
        setRenameMessage(e?.message || '');
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renameValue, step?.kind]);

  async function saveRename() {
    setRenaming(true);
    try {
      const result = await renameAppAddress({ buildId, slug: renameValue.trim() });
      // the answer is the new free address; a live bought domain stays the
      // shared address, so ask the server for the whole record again
      setInfo((prev) =>
        prev
          ? {
              ...prev,
              slug: result.slug,
              lumineUrl: result.url,
              url: prev.url === (prev.lumineUrl || prev.url) ? result.url : prev.url
            }
          : prev
      );
      setStep(null);
      const fresh = await loadAppAddress({ buildId }).catch(() => null);
      if (fresh) setInfo(fresh);
    } catch (e: any) {
      setRenameStatus('taken');
      setRenameMessage(e?.message || '');
    } finally {
      setRenaming(false);
    }
  }

  // Re-check every 20 s while the connect screen is open (turns green by
  // itself once the member's settings reach us).
  useConnectPolling(step, connect?.status, checkConnect);

  if (!info?.enabled || !info.url) return <>{children}</>;
  const freeUrl = info.lumineUrl || info.url;
  const freeHost = addressHost(freeUrl);
  const liveDomains = (info.domains || []).filter((d) => d.status === 'live').map((d) => d.hostname);
  // the chip shows (and Copy / Share hand out) the server's shared address
  const shownUrl = info.url;
  const askContext = (label: string, excerpt: string) => ({
    kind: 'page',
    id: buildId,
    label,
    path: `/app/${buildId}`,
    excerpt: `App web address screen for "${appTitle}". Free address: ${freeHost}. ${excerpt}`.slice(0, 600)
  });

  // the checkout's name for screen readers (each screen shows its own title)
  const flowTitle = !step
    ? ''
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
    <>
      <AddressMenuView
        t={t}
        primaryUrl={info.url}
        freeUrl={freeUrl}
        domains={liveDomains}
        ownerDomains={isOwner ? info.domains : undefined}
        removableSources={['own']}
        onRemoveDomain={isOwner && info.customDomainsEnabled ? (domainId) => void removeDomain(domainId) : undefined}
        canGetOwn={isOwner && Boolean(info.customDomainsEnabled || info.domainSalesEnabled)}
        copied={copied}
        onCopy={() => {
          void navigator.clipboard?.writeText(shownUrl).catch(() => {});
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
        onShare={() => {
          if (navigator.share) void navigator.share({ title: appTitle, url: shownUrl }).catch(() => {});
          else void navigator.clipboard?.writeText(shownUrl).catch(() => {});
        }}
        onGetOwn={openOwnFlow}
        onRename={
          isOwner
            ? () => {
                setRenameValue(info.slug || '');
                setRenameStatus('idle');
                setRenameMessage('');
                setError('');
                setStep({ kind: 'rename' });
              }
            : undefined
        }
      />
      {children}
      {isOwner && (
        <AppPlayers buildId={buildId} lang={pageLang()} initialMode={info.accountMode || 'twinkle'} />
      )}
      {step?.kind === 'rename' && (
        <Modal modalKey="AppAddressRename" isOpen onClose={() => setStep(null)} size="md" title={t.renameTitle} closeOnBackdropClick>
          <RenameView
            t={t}
            root={freeHost.replace(/^[^.]+\./, '')}
            value={renameValue}
            status={renameStatus}
            message={renameMessage}
            saving={renaming}
            onChange={setRenameValue}
            onSave={() => void saveRename()}
            onCancel={() => setStep(null)}
          />
        </Modal>
      )}
      {step && step.kind !== 'rename' && (
        <CheckoutSurface variant="overlay" label={flowTitle} onClose={closeFlow} closeLabel={t.backToApp}>
          {step.kind === 'intro' && (
            <IntroView
              t={t}
              assistant={assistant}
              error={error}
              freeHost={freeHost}
              onFind={
                purchase?.open && info.domainSalesEnabled
                  ? () => {
                      setError('');
                      setStep({ kind: 'find' });
                      if (!query) setQuery(appTitle);
                      if (!ideas.length) void loadIdeas();
                    }
                  : undefined
              }
              onHaveOne={info.customDomainsEnabled ? () => setStep({ kind: 'connect' }) : undefined}
              onClose={closeFlow}
              ask={<AskAgentButton showLabelOnMobile context={askContext('getting my own web address', 'Step: what a domain is.')} />}
            />
          )}
          {step.kind === 'find' && (
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
              onUseOwn={info.customDomainsEnabled ? () => setStep({ kind: 'connect' }) : undefined}
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
          {step.kind === 'parent' && (
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
          {step.kind === 'owner' && (
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
              onBack={() => setStep({ kind: 'find' })}
              // saved details: straight to the check screen, Edit links
              startPage={savedDetails === 'saved' && !ownerDetailsProblem(t, owner) ? 3 : 0}
              saved={savedDetails}
              onSavedChoice={() => void forgetOrSkipSaved()}
            />
          )}
          {step.kind === 'order' &&
            (order ? (
              <OrderStatusView
                t={t}
                assistant={assistant}
                order={order}
                cancelledReturn={cancelledReturn}
                refreshError={orderLookupError ? t.refreshFailed : ''}
                onOpen={() => window.open(`https://${order.domain}`, '_blank', 'noopener,noreferrer')}
                onShare={() => shareAddress(`https://${order.domain}`)}
                onTryAgain={() => {
                  setOrder(null);
                  clearOrderParam();
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
          {step.kind === 'live' && (
            <LiveView
              t={t}
              assistant={assistant}
              domain={step.hostname}
              onOpen={() => window.open(`https://${step.hostname}`, '_blank', 'noopener,noreferrer')}
              onShare={() => shareAddress(`https://${step.hostname}`)}
              onDone={closeFlow}
            />
          )}
          {step.kind === 'sent' && (
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
          {step.kind === 'connect' && (
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
      )}
    </>
  );
}

function useConnectPolling(
  step: Step,
  status: string | undefined,
  check: (domainId?: number) => void
) {
  const domainId = step?.kind === 'connect' ? step.domainId : undefined;
  useEffect(() => {
    if (!domainId || status === 'connected') return;
    const timer = window.setInterval(() => check(domainId), 20_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId, status]);
}
