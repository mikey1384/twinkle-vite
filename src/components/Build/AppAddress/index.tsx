import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { BUILD_OWNERSHIP_CHANGED } from '~/helpers/buildOwnershipEvents';
import { ADDRESS_TEXT } from './text';
import AppPlayers from './AppPlayers';
import {
  refreshDomainProgress,
  setDomainProgressAllowed,
  setDomainProgressFallback,
  useDomainProgress,
  useDomainProgressAllowed,
  useDomainProgressFallback
} from './useDomainProgress';
import { ChipProgressLabel, ProgressNotice, progressMenuItems, progressShowing, useResendVerification } from './checkout/progress';
import {
  AddressMenuView,
  addressHost,
  RenameView,
  readScopedBuildData,
  selectPendingOtherDomainFallback,
  type OtherDomainView,
  type OwnerDomainView,
  type ScopedBuildData
} from './views';

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
  hasOwnedDomainOrder?: boolean;
  // each domain is its buyer's or connector's (ownedByYou), whoever owns the
  // app; canRemove: this viewer may take it off this app
  domains?: OwnerDomainView[];
  // on the viewer's own app: their domains that aren't on it
  yourOtherDomains?: OtherDomainView[];
  accountMode?: 'twinkle' | 'app' | 'both';
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
  const attachAppDomainOrder = useAppContext((v) => v.requestHelpers.attachAppDomainOrder);
  const checkAppAddressSlug = useAppContext((v) => v.requestHelpers.checkAppAddressSlug);
  const renameAppAddress = useAppContext((v) => v.requestHelpers.renameAppAddress);
  const userId = useKeyContext((v) => v.myState.userId);
  const location = useLocation();
  const navigate = useNavigate();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameStatus, setRenameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [renameMessage, setRenameMessage] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [infoState, setInfoState] = useState<ScopedBuildData<AddressInfo> | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const info = readScopedBuildData(infoState, buildId, userId);
  // Maker settings on twin-kle.com stay in English (audit D7).
  const t = ADDRESS_TEXT.en;
  // the purchase tracker (shared with the Build header's notice): shown to
  // the app owner while buying is open, and to the buyer of a bought domain
  // or order on this app even before app_domains exists or after an app
  // transfer (standing ruling 11-26)
  const ownsBoughtDomain = Boolean(
    info?.hasOwnedDomainOrder || (info?.domains || []).some((d) => d.ownedByYou && d.source === 'bought')
  );
  const domainProgressAllowed = Boolean(
    info?.enabled && ((info?.url && isOwner && info?.domainSalesEnabled) || ownsBoughtDomain)
  );
  useEffect(() => {
    setDomainProgressAllowed(buildId, domainProgressAllowed);
    return () => setDomainProgressAllowed(buildId, false);
  }, [buildId, domainProgressAllowed]);
  const pendingOtherDomain = selectPendingOtherDomainFallback(info?.yourOtherDomains);
  const fallbackBuildId = pendingOtherDomain?.buildId || 0;
  const fallbackOrderId = pendingOtherDomain?.orderId || 0;
  useEffect(() => {
    setDomainProgressFallback(
      buildId,
      fallbackBuildId > 0 && fallbackOrderId > 0
        ? { buildId: fallbackBuildId, orderId: fallbackOrderId }
        : null
    );
    return () => setDomainProgressFallback(buildId, null);
  }, [buildId, fallbackBuildId, fallbackOrderId]);
  const ownProgress = useDomainProgress(buildId, domainProgressAllowed);
  const hasOwnTracking = domainProgressAllowed && progressShowing(ownProgress);
  const fallbackEnabled = Boolean(
    info?.enabled && fallbackBuildId > 0 && fallbackOrderId > 0 && !hasOwnTracking
  );
  const fallbackProgress = useDomainProgress(fallbackBuildId, fallbackEnabled, fallbackOrderId);
  const tracking = hasOwnTracking
    ? ownProgress
    : fallbackEnabled && progressShowing(fallbackProgress)
      ? fallbackProgress
      : null;
  const trackingBuildId = hasOwnTracking ? buildId : fallbackBuildId || buildId;
  const resend = useResendVerification(t, trackingBuildId, tracking);

  // A wand plan (?appAddress=…) for the owner or Stripe's return / receipt
  // link (?domainOrder=…) for the buyer goes to the checkout page with its query.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if ((userId && params.has('domainOrder')) || (isOwner && params.has('appAddress'))) {
      navigate(domainCheckoutPath(buildId, location.search), { replace: true });
    }
    // when the page (or owner) arrives, and for a new query on this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner, userId, location.search]);

  // Where the viewer is now: a save or domain action that finishes after they
  // opened another app (or left this page) must not pull them into this app's
  // checkout or leak toast/leaving state onto the next build.
  const hereRef = useRef({ buildId, userId, pathname: location.pathname, mounted: true });
  const leaveAttemptRef = useRef(0);
  const actionInFlightRef = useRef<Record<string, number>>({});
  const actionSeqRef = useRef(0);
  hereRef.current.buildId = buildId;
  hereRef.current.userId = userId;
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
    actionInFlightRef.current = {};
    setRenameOpen(false);
    setRenaming(false);
    setLeaving(false);
    setLeaveError('');
  }, [buildId]);

  function claimAction(name: string) {
    if (actionInFlightRef.current[name]) return null;
    const seq = ++actionSeqRef.current;
    actionInFlightRef.current[name] = seq;
    const targetBuildId = buildId;
    const targetUserId = userId;
    return {
      targetBuildId,
      targetUserId,
      sameScope: () =>
        hereRef.current.mounted &&
        hereRef.current.buildId === targetBuildId &&
        hereRef.current.userId === targetUserId,
      release: () => {
        if (actionInFlightRef.current[name] === seq) delete actionInFlightRef.current[name];
      }
    };
  }

  async function openCheckout(search = '', targetBuildId = buildId) {
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
    if (!search && targetBuildId === buildId) navigate(domainCheckoutPath(buildId));
    else navigate(domainCheckoutPath(targetBuildId, search));
  }

  // the header notice's "See progress" opens the order screen on the checkout page
  const openCheckoutRef = useRef(openCheckout);
  openCheckoutRef.current = openCheckout;
  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ buildId: number; targetBuildId?: number; orderId: number }>).detail;
      if (detail?.buildId !== buildId || !detail.orderId) return;
      void openCheckoutRef.current(`?domainOrder=${detail.orderId}`, detail.targetBuildId || buildId);
    }
    window.addEventListener(OPEN_PROGRESS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PROGRESS_EVENT, onOpen);
  }, [buildId]);

  useEffect(() => {
    let cancelled = false;
    let requestSeq = 0;
    if (hostingKnownOff) {
      setInfoState({ buildId, userId, data: { enabled: false } });
      return;
    }
    setInfoState(null);
    function fetchInfo() {
      const seq = ++requestSeq;
      loadAppAddress({ buildId })
        .then((data: AddressInfo) => {
          if (data && data.enabled === false) hostingKnownOff = true;
          if (!cancelled && seq === requestSeq) {
            setInfoState({ buildId, userId, data });
          }
        })
        .catch(() => {
          if (!cancelled && seq === requestSeq) {
            setInfoState({ buildId, userId, data: { enabled: false } });
          }
        });
    }
    function onOwnershipChanged(event: Event) {
      const changedBuildId = Number(
        (event as CustomEvent<{ buildId?: number }>).detail?.buildId || 0
      );
      if (!changedBuildId || hostingKnownOff) return;
      fetchInfo();
    }
    fetchInfo();
    window.addEventListener(BUILD_OWNERSHIP_CHANGED, onOwnershipChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(BUILD_OWNERSHIP_CHANGED, onOwnershipChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, userId]);

  async function removeDomain(domainId: number) {
    const action = claimAction('removeDomain');
    if (!action) return;
    setLeaveError('');
    try {
      await removeAppDomain({ buildId: action.targetBuildId, domainId });
      refreshDomainProgress(action.targetBuildId);
      if (!action.sameScope()) return;
      const fresh = await loadAppAddress({ buildId: action.targetBuildId }).catch(() => null);
      if (fresh && action.sameScope()) {
        setInfoState((prev) =>
          prev && prev.buildId === action.targetBuildId && prev.userId === action.targetUserId
            ? { buildId: action.targetBuildId, userId: action.targetUserId, data: fresh }
            : prev
        );
      }
    } catch (e: any) {
      if (action.sameScope()) setLeaveError(e?.message || t.actionFailed);
    } finally {
      action.release();
    }
  }

  // a domain of yours on another app (one you gave away, say): take it off
  async function removeElsewhere(domain: OtherDomainView) {
    const action = claimAction('removeElsewhere');
    if (!action) return;
    setLeaveError('');
    try {
      await removeAppDomain({ buildId: domain.buildId, domainId: domain.domainId });
      refreshDomainProgress(domain.buildId);
      if (!action.sameScope()) return;
      const fresh = await loadAppAddress({ buildId: action.targetBuildId }).catch(() => null);
      if (fresh && action.sameScope()) {
        setInfoState((prev) =>
          prev && prev.buildId === action.targetBuildId && prev.userId === action.targetUserId
            ? { buildId: action.targetBuildId, userId: action.targetUserId, data: fresh }
            : prev
        );
      }
    } catch (e: any) {
      if (action.sameScope()) setLeaveError(e?.message || t.actionFailed);
    } finally {
      action.release();
    }
  }

  // a bought domain of yours that's on no app: put it on this one, then
  // follow it like a purchase being set up on the checkout page
  async function useHere(domain: OtherDomainView) {
    const action = claimAction('useHere');
    if (!action) return;
    setLeaveError('');
    try {
      const result = await attachAppDomainOrder({ buildId: action.targetBuildId, orderId: domain.orderId });
      refreshDomainProgress(action.targetBuildId);
      if (!action.sameScope()) return;
      const fresh = await loadAppAddress({ buildId: action.targetBuildId }).catch(() => null);
      if (fresh && action.sameScope()) {
        setInfoState((prev) =>
          prev && prev.buildId === action.targetBuildId && prev.userId === action.targetUserId
            ? { buildId: action.targetBuildId, userId: action.targetUserId, data: fresh }
            : prev
        );
      }
      if (result?.orderId && action.sameScope()) {
        void openCheckoutRef.current(`?domainOrder=${Number(result.orderId)}`);
      }
    } catch (e: any) {
      if (action.sameScope()) setLeaveError(e?.message || t.actionFailed);
    } finally {
      action.release();
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
  }, [renameValue, renameOpen, buildId]);

  async function saveRename() {
    const targetBuildId = buildId;
    const targetUserId = userId;
    setRenaming(true);
    try {
      const result = await renameAppAddress({ buildId: targetBuildId, slug: renameValue.trim() });
      if (!hereRef.current.mounted || hereRef.current.buildId !== targetBuildId || hereRef.current.userId !== targetUserId) return;
      // the answer is the new free address; a live bought domain stays the
      // shared address, so ask the server for the whole record again
      setInfoState((prev) =>
        prev && prev.buildId === targetBuildId && prev.userId === targetUserId
          ? {
              ...prev,
              data: {
                ...prev.data,
                slug: result.slug,
                lumineUrl: result.url,
                url: prev.data.url === (prev.data.lumineUrl || prev.data.url) ? result.url : prev.data.url
              }
            }
          : prev
      );
      setRenameOpen(false);
      const fresh = await loadAppAddress({ buildId: targetBuildId }).catch(() => null);
      if (fresh && hereRef.current.mounted && hereRef.current.buildId === targetBuildId && hereRef.current.userId === targetUserId) {
        setInfoState((prev) =>
          prev && prev.buildId === targetBuildId && prev.userId === targetUserId
            ? { buildId: targetBuildId, userId: targetUserId, data: fresh }
            : prev
        );
      }
    } catch (e: any) {
      if (!hereRef.current.mounted || hereRef.current.buildId !== targetBuildId || hereRef.current.userId !== targetUserId) return;
      setRenameStatus('taken');
      setRenameMessage(e?.message || '');
    } finally {
      if (hereRef.current.mounted && hereRef.current.buildId === targetBuildId && hereRef.current.userId === targetUserId) {
        setRenaming(false);
      }
    }
  }

  if (!info?.enabled || !info.url) return <>{children}</>;
  const freeUrl = info.lumineUrl || info.url;
  const freeHost = addressHost(freeUrl);
  const liveDomains = (info.domains || []).filter((d) => d.status === 'live').map((d) => d.hostname);
  // the chip shows (and Copy / Share hand out) the server's shared address
  const shownUrl = info.url;

  const progressItems = tracking
    ? progressMenuItems(t, tracking, resend, () =>
        void openCheckout(`?domainOrder=${tracking.orderId}`, trackingBuildId)
      )
    : [];

  return (
    <>
      <AddressMenuView
        chipLabel={tracking ? <ChipProgressLabel t={t} progress={tracking} /> : undefined}
        leadItems={progressItems}
        t={t}
        primaryUrl={info.url}
        freeUrl={freeUrl}
        domains={liveDomains}
        ownerDomains={isOwner || (info.domains || []).some((d) => d.ownedByYou) ? info.domains : undefined}
        onRemoveDomain={(domainId) => void removeDomain(domainId)}
        otherDomains={isOwner || ownsBoughtDomain ? info.yourOtherDomains : undefined}
        onRemoveElsewhere={(domain) => void removeElsewhere(domain)}
        onUseHere={isOwner ? (domain) => void useHere(domain) : undefined}
        onOpenOrder={(targetBuildId, targetOrderId) =>
          void openCheckout(`?domainOrder=${targetOrderId}`, targetBuildId)
        }
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
      {isOwner && <AppPlayers buildId={buildId} lang="en" initialMode={info.accountMode || 'twinkle'} />}
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

// The Build header's notice while the domain buyer's purchase is under way
// (Setting up → 1 step left: confirm your email → gone once every step is
// done). Same shared record as the address chip; "See progress" opens the
// order screen through the chip's AppAddress (saving any unsaved work first).
const OPEN_PROGRESS_EVENT = 'app-address:open-progress';
export function AppAddressProgressNotice({ buildId }: { buildId: number; isOwner?: boolean }) {
  const allowed = useDomainProgressAllowed(buildId);
  const fallback = useDomainProgressFallback(buildId);
  const ownProgress = useDomainProgress(buildId, allowed);
  const hasOwn = allowed && progressShowing(ownProgress);
  const fallbackEnabled = Boolean(fallback && !hasOwn);
  const fallbackProgress = useDomainProgress(
    fallback?.buildId || 0,
    fallbackEnabled,
    fallback?.orderId || 0
  );
  const progress = hasOwn
    ? ownProgress
    : fallbackEnabled && progressShowing(fallbackProgress)
      ? fallbackProgress
      : null;
  const targetBuildId = hasOwn ? buildId : fallback?.buildId || buildId;
  // Maker settings on twin-kle.com stay in English (audit D7).
  const t = ADDRESS_TEXT.en;
  if (!progress) return null;
  return (
    <ProgressNotice
      t={t}
      buildId={targetBuildId}
      progress={progress}
      onOpen={() =>
        window.dispatchEvent(
          new CustomEvent(OPEN_PROGRESS_EVENT, {
            detail: { buildId, targetBuildId, orderId: progress.orderId }
          })
        )
      }
    />
  );
}

// Self-contained progress/verification notice for surfaces where AppAddress
// is not mounted (BuildRuntime /app/:id, unpublished/deleted fallback pages,
// and unpublished editor headers), so a post-transfer domain buyer can always
// see Name.com's 15-day confirmation reminder and Resend.
export function DomainOwnerProgressBanner({
  buildId,
  isOwner = false
}: {
  buildId: number;
  isOwner?: boolean;
}) {
  const loadAppAddress = useAppContext((v) => v.requestHelpers.loadAppAddress);
  const userId = useKeyContext((v) => v.myState.userId);
  const navigate = useNavigate();
  const [infoState, setInfoState] = useState<ScopedBuildData<AddressInfo> | null>(null);
  const info = readScopedBuildData(infoState, buildId, userId);
  // Maker settings on twin-kle.com stay in English (audit D7).
  const t = ADDRESS_TEXT.en;

  useEffect(() => {
    let cancelled = false;
    let requestSeq = 0;
    if (!userId || !buildId || hostingKnownOff) {
      setInfoState({ buildId, userId, data: { enabled: false } });
      return;
    }
    setInfoState(null);
    function fetchInfo() {
      const seq = ++requestSeq;
      loadAppAddress({ buildId })
        .then((data: AddressInfo) => {
          if (data && data.enabled === false) hostingKnownOff = true;
          if (!cancelled && seq === requestSeq) {
            setInfoState({ buildId, userId, data });
          }
        })
        .catch(() => {
          if (!cancelled && seq === requestSeq) {
            setInfoState({ buildId, userId, data: { enabled: false } });
          }
        });
    }
    function onOwnershipChanged(event: Event) {
      const changedBuildId = Number(
        (event as CustomEvent<{ buildId?: number }>).detail?.buildId || 0
      );
      if (!changedBuildId || hostingKnownOff) return;
      fetchInfo();
    }
    fetchInfo();
    window.addEventListener(BUILD_OWNERSHIP_CHANGED, onOwnershipChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(BUILD_OWNERSHIP_CHANGED, onOwnershipChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, userId]);

  const ownsBoughtDomain = Boolean(
    info?.hasOwnedDomainOrder || (info?.domains || []).some((d) => d.ownedByYou && d.source === 'bought')
  );
  const allowed = Boolean(
    userId && info?.enabled && ((info?.url && isOwner && info?.domainSalesEnabled) || ownsBoughtDomain)
  );
  const pendingOtherDomain = selectPendingOtherDomainFallback(info?.yourOtherDomains);
  const fallbackBuildId = pendingOtherDomain?.buildId || 0;
  const fallbackOrderId = pendingOtherDomain?.orderId || 0;
  const ownProgress = useDomainProgress(buildId, allowed);
  const hasOwn = allowed && progressShowing(ownProgress);
  const fallbackEnabled = Boolean(
    userId && info?.enabled && fallbackBuildId > 0 && fallbackOrderId > 0 && !hasOwn
  );
  const fallbackProgress = useDomainProgress(fallbackBuildId, fallbackEnabled, fallbackOrderId);
  const progress = hasOwn
    ? ownProgress
    : fallbackEnabled && progressShowing(fallbackProgress)
      ? fallbackProgress
      : null;
  const targetBuildId = hasOwn ? buildId : fallbackBuildId || buildId;
  if (!progress) return null;
  return (
    <ProgressNotice
      t={t}
      buildId={targetBuildId}
      progress={progress}
      onOpen={() => navigate(domainCheckoutPath(targetBuildId, `?domainOrder=${progress.orderId}`))}
    />
  );
}

const leaveNoticeClass = css`
  position: fixed;
  z-index: 10002000;
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
