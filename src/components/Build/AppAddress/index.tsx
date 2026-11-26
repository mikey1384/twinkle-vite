import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import { mobileMaxWidth } from '~/constants/css';
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
    // when the page (or owner) arrives, and for a new query on this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner, location.search]);

  // Where the owner is now: a save that finishes after they opened another
  // app (or left this page) must not pull them into this app's checkout or
  // leak toast/leaving state onto the next build.
  const hereRef = useRef({ buildId, pathname: location.pathname, mounted: true });
  const leaveAttemptRef = useRef(0);
  hereRef.current.buildId = buildId;
  hereRef.current.pathname = location.pathname;
  useEffect(() => {
    const here = hereRef.current;
    here.mounted = true;
    return () => {
      here.mounted = false;
    };
  }, []);
  useEffect(() => {
    leaveAttemptRef.current += 1;
    setLeaving(false);
    setLeaveError('');
  }, [buildId]);

  async function openCheckout() {
    if (leaving) return;
    setLeaveError('');
    // the checkout is its own page: unsaved editor work is saved first
    if (hasUnsavedChanges && onSaveChanges) {
      const attempt = (leaveAttemptRef.current += 1);
      const from = { buildId, pathname: location.pathname };
      const stillHere = () =>
        hereRef.current.mounted &&
        hereRef.current.buildId === from.buildId &&
        hereRef.current.pathname === from.pathname &&
        window.location.pathname === from.pathname &&
        leaveAttemptRef.current === attempt;
      setLeaving(true);
      const saved = await onSaveChanges().catch(() => false);
      if (hereRef.current.mounted && leaveAttemptRef.current === attempt) setLeaving(false);
      if (!stillHere()) return;
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
    const targetBuildId = buildId;
    try {
      await removeAppDomain({ buildId: targetBuildId, domainId });
      if (!hereRef.current.mounted || hereRef.current.buildId !== targetBuildId) return;
      const fresh = await loadAppAddress({ buildId: targetBuildId }).catch(() => null);
      if (fresh && hereRef.current.mounted && hereRef.current.buildId === targetBuildId) setInfo(fresh);
    } catch (e: any) {
      if (hereRef.current.mounted && hereRef.current.buildId === targetBuildId) {
        setLeaveError(e?.message || '');
      }
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
      {(leaving || leaveError) && (
        // over the page, not at the end of the scrolling chip strip, so it
        // shows on a phone too
        <div className={leaveNoticeClass} role={leaveError ? 'alert' : 'status'} data-tone={leaveError ? 'error' : undefined}>
          <span>{leaveError || t.savingBeforeLeaving}</span>
          {leaveError && (
            <button type="button" onClick={() => setLeaveError('')} aria-label={t.close}>
              ×
            </button>
          )}
        </div>
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

const leaveNoticeClass = css`
  position: fixed;
  z-index: 100000;
  left: 50%;
  top: calc(var(--app-shell-top-offset, 0px) + 12px);
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  background: #1f2433;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(20, 20, 40, 0.18);
  &[data-tone='error'] {
    background: #c4314b;
  }
  button {
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.8rem;
    line-height: 1;
    cursor: pointer;
    padding: 4px 6px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    top: auto;
    bottom: calc(var(--app-shell-bottom-offset, 0px) + 12px);
    border-radius: 16px;
  }
`;
