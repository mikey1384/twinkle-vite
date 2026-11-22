import React, { Suspense, useEffect, useSyncExternalStore } from 'react';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';
import { isMobile } from '~/helpers';
import { useQuickAskAvailable } from './QuickAskButton';
import {
  getQuickAskOpen,
  isQuickAskShortcut,
  openQuickAsk,
  subscribeQuickAsk
} from './state';

const loadWindow = () => import('./QuickAskWindow');
const QuickAskWindow = lazyWithRetry(loadWindow);

// Always mounted for a signed-in member: the Ctrl+K / ⌘K shortcut on a
// computer, and the window itself (its code is fetched while the page is
// idle, so the first open is instant too).
export default function QuickAskHost() {
  const open = useSyncExternalStore(subscribeQuickAsk, getQuickAskOpen);
  const available = useQuickAskAvailable();

  useEffect(() => {
    if (!available || isMobile(navigator)) return;
    const idle =
      (window as any).requestIdleCallback ||
      ((fn: () => void) => window.setTimeout(fn, 3000));
    idle(() => {
      void loadWindow().catch(() => {});
    });
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || !isQuickAskShortcut(event))
        return;
      // Leave Ctrl+K to rich editors and to whatever dialog is open.
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      openQuickAsk();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [available]);

  if (!open || !available) return null;
  return (
    <Suspense fallback={null}>
      <QuickAskWindow />
    </Suspense>
  );
}
