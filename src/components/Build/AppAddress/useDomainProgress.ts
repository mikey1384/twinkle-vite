import { useEffect, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { BUILD_OWNERSHIP_CHANGED } from '~/helpers/buildOwnershipEvents';
import type { DomainProgressView } from './checkout/model';
import {
  domainProgressStore,
  type DomainProgressFallbackTarget
} from './domainProgressStore';

// One shared poller per (user, build) for the purchase progress tracker: the
// address chip, the Build header notice and the order screen read the same
// record (no duplicate requests). It polls while something is moving and backs
// off: every 10 s while setting up (×1.5 each time, up to a minute), every 5
// minutes while only the email confirmation is left, pauses while the tab is
// hidden, clears on account switch, resets and re-polls active subscribers on
// ownership change, and drops entries once unmounted so SPA revisits fetch fresh.

let globalListenerCount = 0;

function onVisibilityChange() {
  domainProgressStore.handleVisibilityChange();
}

function onOwnershipChanged(event: Event) {
  const buildId = Number((event as CustomEvent<{ buildId?: number }>).detail?.buildId || 0);
  if (buildId) domainProgressStore.clearBuild(buildId);
}

function attachGlobalListeners() {
  globalListenerCount += 1;
  if (globalListenerCount !== 1) return;
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener(BUILD_OWNERSHIP_CHANGED, onOwnershipChanged);
  }
}

function detachGlobalListeners() {
  globalListenerCount = Math.max(0, globalListenerCount - 1);
  if (globalListenerCount !== 0) return;
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener(BUILD_OWNERSHIP_CHANGED, onOwnershipChanged);
  }
}

// Read again now (after Resend, detach/reattach, or when the order screen sees a change).
export function refreshDomainProgress(buildId: number, orderId?: number) {
  domainProgressStore.refresh(buildId, orderId);
}

// Shared hosting + domain-sales gate published by AppAddress so
// AppAddressProgressNotice never polls when hosting/domain sales are off.
export function setDomainProgressAllowed(buildId: number, allowed: boolean) {
  domainProgressStore.setAllowed(buildId, allowed);
}

export function useDomainProgressAllowed(buildId: number): boolean {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!buildId) return;
    return domainProgressStore.subscribeAllowed(buildId, () => setTick((value) => value + 1));
  }, [buildId]);
  return domainProgressStore.isAllowed(buildId);
}

export function setDomainProgressFallback(
  buildId: number,
  target: DomainProgressFallbackTarget | null
) {
  domainProgressStore.setFallbackTarget(buildId, target);
}

export function useDomainProgressFallback(
  buildId: number
): DomainProgressFallbackTarget | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!buildId) return;
    return domainProgressStore.subscribeFallbackTarget(buildId, () =>
      setTick((value) => value + 1)
    );
  }, [buildId]);
  return domainProgressStore.getFallbackTarget(buildId);
}

export function useDomainProgress(
  buildId: number,
  enabled: boolean,
  orderId = 0
): DomainProgressView | null {
  const loadDomainProgress = useAppContext((v) => v.requestHelpers.loadDomainProgress);
  const rawUserId = useKeyContext((v) => v.myState.userId);
  const userId = Number(rawUserId || 0);
  const normalizedOrderId = Number(orderId || 0) > 0 ? Number(orderId) : 0;
  const [, setTick] = useState(0);

  useEffect(() => {
    domainProgressStore.syncUser(userId || null);
  }, [userId]);

  useEffect(() => {
    if (!enabled || !buildId || !userId) return;
    attachGlobalListeners();
    const unsubscribe = domainProgressStore.subscribe(
      userId,
      buildId,
      loadDomainProgress,
      () => setTick((value) => value + 1),
      normalizedOrderId
    );
    return () => {
      unsubscribe();
      detachGlobalListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, buildId, enabled, normalizedOrderId]);

  if (!enabled || !buildId || !userId) return null;
  return domainProgressStore.getProgress(userId, buildId, normalizedOrderId);
}
