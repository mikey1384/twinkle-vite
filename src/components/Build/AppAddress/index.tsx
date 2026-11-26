import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { useAppContext } from '~/contexts';
import { ADDRESS_TEXT, type AddressLang } from './text';
import AppPlayers from './AppPlayers';
import {
  AddressMenuView,
  ConnectView,
  FindView,
  IntroView,
  MessageView,
  OrderStatusView,
  OwnerDetailsView,
  ParentRequestView,
  RenameView,
  emptyOwnerDetails,
  ownerDetailsProblem,
  type DnsRecordView,
  type DomainIdeaView,
  type DomainOrderView,
  type OwnerDetails
} from './views';

// The app's address chip in the Build header's strip, with Open / Copy /
// Share and, for the owner, Change address and "Get your own .com" (Mikey
// 11-25 north star), then the owner's Players chip. `children` (other strip
// chips) sit between the two and still show while the hosting switch is off
// (the API answers { enabled: false }), so it is safe to mount everywhere.
interface AddressInfo {
  enabled: boolean;
  eligible?: boolean;
  slug?: string | null;
  url?: string | null;
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

// The buyer's country guess for the form (they can change it).
function guessCountry() {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region || '';
    return /^[A-Z]{2}$/.test(region) ? region : 'KR';
  } catch {
    return 'KR';
  }
}

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
  const [ownerAgreed, setOwnerAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ownerProblem, setOwnerProblem] = useState('');
  const [order, setOrder] = useState<DomainOrderView | null>(null);
  const t = ADDRESS_TEXT[pageLang()];

  // Back from Stripe Checkout: ?domainOrder=<id> opens the order's status.
  useEffect(() => {
    if (!isOwner) return;
    let orderId = 0;
    try {
      orderId = Number(new URLSearchParams(window.location.search).get('domainOrder') || 0);
    } catch {
      orderId = 0;
    }
    if (orderId > 0) setStep({ kind: 'order', orderId });
  }, [buildId, isOwner]);

  // A wand plan (Zero/Ciel, twinkle-api sponsoredHelp open_app_address)
  // opens ?appAddress=find|buy|connect|status[&domain=…] on the owner's app
  // page. Only the domain choice comes in; the member does every buying step.
  const [deepLink, setDeepLink] = useState<{ screen: string; domain: string } | null>(null);
  useEffect(() => {
    if (!isOwner) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const screen = params.get('appAddress') || '';
      if (!['find', 'buy', 'connect', 'status'].includes(screen)) return;
      setDeepLink({ screen, domain: String(params.get('domain') || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 253) });
      const url = new URL(window.location.href);
      url.searchParams.delete('appAddress');
      url.searchParams.delete('domain');
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // no deep link
    }
  }, [buildId, isOwner]);
  useEffect(() => {
    if (!deepLink || !info?.enabled) return;
    const { screen, domain } = deepLink;
    setDeepLink(null);
    void openFromWand(screen, domain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink, info?.enabled]);

  async function openFromWand(screen: string, domain: string) {
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
      const row = status?.domains?.[0];
      if (row && row.source === 'own' && row.status !== 'live' && info?.customDomainsEnabled) {
        setHostname(row.hostname);
        await showConnectSetup(row.id);
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
    setPurchase(purchaseInfo);
    if (!purchaseInfo?.open || !info?.domainSalesEnabled) {
      // buying here is closed: connecting your own still works
      setStep({ kind: 'intro' });
      return;
    }
    const label = domain.replace(/\.[a-z.]+$/, '') || appTitle;
    setQuery(label);
    setStep({ kind: 'find' });
    if (screen === 'find' && !domain) {
      void loadIdeas();
      return;
    }
    setLoading(true);
    try {
      const data = await searchDomains({ q: label });
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
  const orderId = step?.kind === 'order' ? step.orderId : 0;
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer = 0;
    async function poll() {
      try {
        const data = await loadDomainOrder({ buildId, orderId });
        if (cancelled || !data?.order) return;
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
        if (!cancelled) setError(e?.message || '');
      }
    }
    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, buildId]);

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
    setOwnerProblem('');
    setPaying(true);
    try {
      const result = await startSelfDomainOrder({
        buildId,
        domain: idea.domain,
        registrant: { ...owner, phone: owner.phone.trim() },
        agreed: ownerAgreed,
        priceCents: idea.priceCents
      });
      if (result?.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setOwnerProblem(t.whyOther(idea.domain));
    } catch (e: any) {
      setOwnerProblem(e?.message || '');
    }
    setPaying(false);
  }

  function closeFlow() {
    setStep(null);
    setOrder(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('domainOrder')) {
        url.searchParams.delete('domainOrder');
        url.searchParams.delete('cancelled');
        window.history.replaceState(window.history.state, '', url.toString());
      }
    } catch {
      // nothing to tidy
    }
  }

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
    setSending(true);
    try {
      await startDomainOrder({
        buildId,
        domain: idea.domain,
        parentEmail,
        lang: pageLang()
      });
      setStep({ kind: 'sent', idea });
    } catch (e: any) {
      setError(e?.message || '');
    } finally {
      setSending(false);
    }
  }

  async function showConnectSetup(domainId: number) {
    const how = await loadAppDomainConnect({ buildId, domainId });
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
    setError('');
    try {
      const added = await addAppDomain({ buildId, hostname });
      await showConnectSetup(added.domainId);
    } catch (e: any) {
      setError(e?.message || '');
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
      setInfo((prev) => (prev ? { ...prev, slug: result.slug, url: result.url } : prev));
      setStep(null);
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
  const freeHost = info.url.replace(/^https:\/\//, '');
  const liveDomains = (info.domains || []).filter((d) => d.status === 'live').map((d) => d.hostname);
  // the chip shows (and Copy / Share hand out) a live own domain first
  const shownUrl = liveDomains[0] ? `https://${liveDomains[0]}` : info.url;
  const askContext = (label: string, excerpt: string) => ({
    kind: 'page',
    id: buildId,
    label,
    path: `/app/${buildId}`,
    excerpt: `App web address screen for "${appTitle}". Free address: ${freeHost}. ${excerpt}`.slice(0, 600)
  });

  return (
    <>
      <AddressMenuView
        t={t}
        url={info.url}
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
      {step && (
        <Modal modalKey="AppAddressFlow" isOpen onClose={closeFlow} size="md" hasHeader={false} closeOnBackdropClick>
          {error && <div style={{ color: '#b42318', marginBottom: '0.6rem' }}>{error}</div>}
          {step.kind === 'rename' && (
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
          )}
          {step.kind === 'intro' && (
            <IntroView
              t={t}
              freeHost={freeHost}
              onFind={
                purchase?.open && info.domainSalesEnabled
                  ? () => {
                      setStep({ kind: 'find' });
                      setQuery(appTitle);
                      void loadIdeas();
                    }
                  : undefined
              }
              onHaveOne={info.customDomainsEnabled ? () => setStep({ kind: 'connect' }) : undefined}
              ask={<AskAgentButton context={askContext('getting my own web address', 'Step: what a domain is.')} />}
            />
          )}
          {step.kind === 'find' && (
            <FindView
              t={t}
              query={query}
              ideas={ideas}
              loading={loading}
              onQuery={setQuery}
              onSearch={search}
              onBuy={(idea) => {
                setOwnerProblem('');
                setStep(purchase?.buyer === 'self' ? { kind: 'owner', idea } : { kind: 'parent', idea });
              }}
              onUseOwn={info.customDomainsEnabled ? () => setStep({ kind: 'connect' }) : undefined}
              onMoreIdeas={() => loadIdeas({ more: true })}
              ask={
                <AskAgentButton
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
              idea={step.idea}
              details={owner}
              agreed={ownerAgreed}
              renews={Boolean(purchase?.renews)}
              busy={paying}
              problem={ownerProblem}
              onDetails={setOwner}
              onAgree={setOwnerAgreed}
              onPay={() => void payAsOwner(step.idea)}
              onBack={() => setStep({ kind: 'find' })}
            />
          )}
          {step.kind === 'order' && order && (
            <OrderStatusView
              t={t}
              order={order}
              onOpen={() => window.open(`https://${order.domain}`, '_blank', 'noopener,noreferrer')}
              onTryAgain={() => {
                closeFlow();
                openOwnFlow();
              }}
              onClose={closeFlow}
            />
          )}
          {step.kind === 'live' && (
            <MessageView
              title={t.liveTitle(step.hostname)}
              body={t.liveBody}
              primaryLabel={t.openIt}
              onPrimary={() => window.open(`https://${step.hostname}`, '_blank', 'noopener,noreferrer')}
              secondaryLabel={t.done}
              onSecondary={closeFlow}
              celebrate
            />
          )}
          {step.kind === 'sent' && (
            <MessageView title={t.sentTitle} body={t.sentBody(step.idea.domain)} primaryLabel={t.done} onPrimary={() => setStep(null)} />
          )}
          {step.kind === 'connect' && (
            <ConnectView
              t={t}
              hostname={hostname}
              onHostname={setHostname}
              onConnect={startConnect}
              stage={connect ? 'setup' : 'enter'}
              providerName={connect?.providerName || null}
              providerSteps={connect?.providerSteps || []}
              domainConnectUrl={connect?.domainConnectUrl || null}
              records={connect?.records || []}
              status={connect?.status || 'waiting'}
              onCheck={() => checkConnect(step.domainId)}
              ask={
                <AskAgentButton
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
        </Modal>
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
