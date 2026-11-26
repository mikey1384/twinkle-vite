import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';
import { ADDRESS_TEXT, type AddressLang } from './text';
import AppPlayers from './AppPlayers';
import { AddressMenuView, addressHost, RenameView } from './views';

// The app's address chip in the Build header's strip, with Open / Copy /
// Share and, for the owner, Change address and "Get your own .com" (Mikey
// 11-25 north star), then the owner's Players chip. "Get your own" goes to
// the checkout's own page, /build/<id>/domain (DomainCheckoutPage), after
// saving any unsaved editor work; the wand's ?appAddress=… and Stripe's
// ?domainOrder=… on this page go there too. `children` (other strip chips)
// sit between the two and still show while the hosting switch is off (the
// API answers { enabled: false }), so it is safe to mount everywhere.
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

function pageLang(): AddressLang {
  try {
    return /^ko\b/i.test(document.documentElement.lang || navigator.language) ? 'ko' : 'en';
  } catch {
    return 'en';
  }
}

// The checkout's own page for this app, with the query that says where to
// start (?appAddress=…, ?domainOrder=…) when there is one.
export function domainCheckoutPath(buildId: number, search = '') {
  return `/build/${buildId}/domain${search}`;
}

// Once the API says hosting is off, later editor opens in this page load
// skip the request (the switch flips with a deploy/reload anyway).
let hostingKnownOff = false;

export default function AppAddress({
  buildId,
  isOwner,
  appTitle,
  hasUnsavedChanges = false,
  onSaveChanges,
  children
}: {
  buildId: number;
  isOwner: boolean;
  appTitle: string;
  // unsaved editor work, saved before leaving for the checkout page
  hasUnsavedChanges?: boolean;
  onSaveChanges?: () => Promise<boolean>;
  children?: React.ReactNode;
}) {
  const loadAppAddress = useAppContext((v) => v.requestHelpers.loadAppAddress);
  const removeAppDomain = useAppContext((v) => v.requestHelpers.removeAppDomain);
  const checkAppAddressSlug = useAppContext((v) => v.requestHelpers.checkAppAddressSlug);
  const renameAppAddress = useAppContext((v) => v.requestHelpers.renameAppAddress);
  const location = useLocation();
  const navigate = useNavigate();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameStatus, setRenameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [renameMessage, setRenameMessage] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [info, setInfo] = useState<AddressInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const t = ADDRESS_TEXT[pageLang()];

  // A wand plan or Stripe's return that reached the Build page goes to the
  // checkout page with its query.
  useEffect(() => {
    if (!isOwner) return;
    const params = new URLSearchParams(location.search);
    if (params.has('domainOrder') || params.has('appAddress')) {
      navigate(domainCheckoutPath(buildId, location.search), { replace: true });
    }
    // read once when the page (or owner) arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner]);

  async function openCheckout() {
    if (leaving) return;
    setLeaveError('');
    // the checkout is its own page: unsaved editor work is saved first
    if (hasUnsavedChanges && onSaveChanges) {
      setLeaving(true);
      const saved = await onSaveChanges().catch(() => false);
      setLeaving(false);
      if (!saved) {
        setLeaveError(t.saveBeforeLeaving);
        return;
      }
    }
    navigate(domainCheckoutPath(buildId));
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

  async function removeDomain(domainId: number) {
    try {
      await removeAppDomain({ buildId, domainId });
      const fresh = await loadAppAddress({ buildId }).catch(() => null);
      if (fresh) setInfo(fresh);
    } catch (e: any) {
      setLeaveError(e?.message || '');
    }
  }

  // Live "is this name free?" while the rename dialog is open (debounced).
  useEffect(() => {
    if (!renameOpen) return;
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
  }, [renameValue, renameOpen]);

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
      setRenameOpen(false);
      const fresh = await loadAppAddress({ buildId }).catch(() => null);
      if (fresh) setInfo(fresh);
    } catch (e: any) {
      setRenameStatus('taken');
      setRenameMessage(e?.message || '');
    } finally {
      setRenaming(false);
    }
  }

  if (!info?.enabled || !info.url) return <>{children}</>;
  const freeUrl = info.lumineUrl || info.url;
  const freeHost = addressHost(freeUrl);
  const liveDomains = (info.domains || []).filter((d) => d.status === 'live').map((d) => d.hostname);
  // the chip shows (and Copy / Share hand out) the server's shared address
  const shownUrl = info.url;

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
        onGetOwn={() => void openCheckout()}
        onRename={
          isOwner
            ? () => {
                setRenameValue(info.slug || '');
                setRenameStatus('idle');
                setRenameMessage('');
                setRenameOpen(true);
              }
            : undefined
        }
      />
      {children}
      {isOwner && <AppPlayers buildId={buildId} lang={pageLang()} initialMode={info.accountMode || 'twinkle'} />}
      {leaveError && (
        <span role="alert" style={{ color: '#c4314b', fontWeight: 700, fontSize: '1.3rem' }}>
          {leaveError}
        </span>
      )}
      {renameOpen && (
        <Modal modalKey="AppAddressRename" isOpen onClose={() => setRenameOpen(false)} size="md" title={t.renameTitle} closeOnBackdropClick>
          <RenameView
            t={t}
            root={freeHost.replace(/^[^.]+\./, '')}
            value={renameValue}
            status={renameStatus}
            message={renameMessage}
            saving={renaming}
            onChange={setRenameValue}
            onSave={() => void saveRename()}
            onCancel={() => setRenameOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
