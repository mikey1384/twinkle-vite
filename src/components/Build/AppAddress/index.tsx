import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { useAppContext } from '~/contexts';
import { ADDRESS_TEXT, type AddressLang } from './text';
import {
  AddressCardView,
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

// The app's lumine.app address on its page, with Copy / Share and, for the
// owner, "Get your own .com" (Mikey 11-25 north star). Shows nothing while the
// hosting switch is off (the API answers { enabled: false }), so it is safe to
// mount everywhere.
interface AddressInfo {
  enabled: boolean;
  eligible?: boolean;
  slug?: string | null;
  url?: string | null;
  customDomainsEnabled?: boolean;
  domainSalesEnabled?: boolean;
  domains?: Array<{ id: number; hostname: string; status: string; source: string }>;
}

type Step =
  | { kind: 'intro' }
  | { kind: 'find' }
  | { kind: 'parent'; idea: DomainIdeaView }
  | { kind: 'owner'; idea: DomainIdeaView }
  | { kind: 'order'; orderId: number }
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
  wrapperStyle
}: {
  buildId: number;
  isOwner: boolean;
  appTitle: string;
  wrapperStyle?: React.CSSProperties;
}) {
  const loadAppAddress = useAppContext((v) => v.requestHelpers.loadAppAddress);
  const loadDomainIdeas = useAppContext((v) => v.requestHelpers.loadDomainIdeas);
  const searchDomains = useAppContext((v) => v.requestHelpers.searchDomains);
  const startDomainOrder = useAppContext((v) => v.requestHelpers.startDomainOrder);
  const loadDomainPurchase = useAppContext((v) => v.requestHelpers.loadDomainPurchase);
  const startSelfDomainOrder = useAppContext((v) => v.requestHelpers.startSelfDomainOrder);
  const loadDomainOrder = useAppContext((v) => v.requestHelpers.loadDomainOrder);
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
        if (data.order.stage === 'setting_up') timer = window.setTimeout(poll, 5000);
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

  async function startConnect() {
    setError('');
    try {
      const added = await addAppDomain({ buildId, hostname });
      const how = await loadAppDomainConnect({ buildId, domainId: added.domainId });
      setConnect({
        providerName: how?.provider?.name || how?.domainConnect?.providerName || null,
        providerSteps: how?.provider?.steps || how?.instructions?.plainSteps || [],
        domainConnectUrl: how?.domainConnect?.applyUrl || null,
        records: how?.instructions?.records || [],
        status: 'waiting'
      });
      setStep({ kind: 'connect', domainId: added.domainId });
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

  if (!info?.enabled || !info.url) return null;
  const freeHost = info.url.replace(/^https:\/\//, '');
  const liveDomains = (info.domains || []).filter((d) => d.status === 'live').map((d) => d.hostname);
  const askContext = (label: string, excerpt: string) => ({
    kind: 'page',
    id: buildId,
    label,
    path: `/app/${buildId}`,
    excerpt: `App web address screen for "${appTitle}". Free address: ${freeHost}. ${excerpt}`.slice(0, 600)
  });

  return (
    <div style={wrapperStyle}>
      <AddressCardView
        t={t}
        url={info.url}
        domains={liveDomains}
        isOwner={isOwner && Boolean(info.customDomainsEnabled || info.domainSalesEnabled)}
        copied={copied}
        onCopy={() => {
          void navigator.clipboard?.writeText(info.url || '').catch(() => {});
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
        onShare={() => {
          if (navigator.share) void navigator.share({ title: appTitle, url: info.url || '' }).catch(() => {});
          else void navigator.clipboard?.writeText(info.url || '').catch(() => {});
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
              onHaveOne={() => setStep({ kind: 'connect' })}
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
              onUseOwn={() => setStep({ kind: 'connect' })}
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
    </div>
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
