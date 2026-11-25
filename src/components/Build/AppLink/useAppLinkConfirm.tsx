import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  appLinkGate,
  authorizeAppLinkRequest,
  type AppLinkSite
} from '~/containers/Build/PreviewPanel/helpers/appLinkPolicy';
import type {
  AppLinkBridgeHandlerRequest,
  AppLinkBridgeResult
} from '~/containers/Build/PreviewPanel/helpers/appLinkBridge';
import {
  isFullscreen,
  leaveFullscreenAndPointerLock,
  makeInert
} from '~/components/Build/Coins/useCoinConfirm';

// Twinkle.app.openLink: the website's "Open example.com?" sheet (Mikey
// 11-25). It lives outside the app frame, so app code can neither draw, skip
// nor press it. While it is open the frame is inert and any fullscreen or
// pointer lock the app took is ended, so the sheet is seen; if the app takes
// fullscreen back, the sheet counts as Cancel.
//
// The new tab opens inside the viewer's own tap on Open: a tap on this page
// is what browsers (iPhone Safari included, and the Home Screen app) accept
// for opening a tab, which a message from the frame is not. That is also why
// every link gets the sheet, even one opened before: the sheet's tap is the
// one that reliably opens the tab, it shows the exact site each time (the
// same site can link to a different page), and it costs one tap.
//
// Open turns on APP_LINK_OPEN_ARM_MS after the sheet appears, and the wait
// starts again whenever the viewer presses anywhere before then; a click
// counts only when its press also came after Open turned on (review S3).
// So the steady tapping of a game, or a tap meant for the app, can never
// land on Open.
//
// A site on Twinkle's blocked list (`lumine admin link-block`) gets a short
// "This site can't be opened from Twinkle apps" note with one OK button,
// and the app's call is refused with LINK_BLOCKED. If the check cannot be
// answered (offline, slow), the sheet shows as usual.
//
// Counts (shown / opened / cancelled / rejected / blocked) are tallied on
// the page and sent together at most every APP_LINK_FLUSH_MS and when the
// page hides (review B1), signed-in viewers only; an app calling openLink a
// thousand times in one tap still makes at most one request.
export const APP_LINK_OPEN_ARM_MS = 800;
export const APP_LINK_FLUSH_MS = 45_000;
export const APP_LINK_FLUSH_CAP = 50;
// the SDK gives up after 5 minutes; the sheet closes as Cancel before that
export const APP_LINK_SHEET_MAX_MS = 4.5 * 60_000;
const HOST_CHECK_REMEMBER_MS = 10 * 60_000;

const bodyClass = css`
  display: grid;
  gap: 1rem;
  width: 100%;
  font-size: 1.5rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
  p {
    margin: 0;
  }
`;
const headerClass = css`
  overflow-wrap: anywhere;
  word-break: break-word;
  strong {
    font-weight: 700;
  }
`;
const asciiClass = css`
  font-size: 1.3rem;
  color: ${Color.gray()};
  overflow-wrap: anywhere;
`;
const warningClass = css`
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 1.35rem;
  color: ${Color.darkerGray()};
  background: ${Color.orange(0.12)};
  border: 1px solid ${Color.orange(0.45)};
`;
const paleClass = css`
  opacity: 0.5;
  cursor: default;
`;

type CountKind = 'shown' | 'opened' | 'cancelled' | 'rejected' | 'blocked';
type Tally = Partial<Record<CountKind, number>>;

interface Session {
  id: number;
  mode: 'confirm' | 'blocked';
  url: string;
  site: AppLinkSite;
  resolve: (opened: boolean) => void;
}

export type AppLinkRequest = AppLinkBridgeHandlerRequest;
export type AppLinkResult = AppLinkBridgeResult;

let nextSessionId = 0;
// host -> blocked answer, shared by every panel on the page
const hostChecks = new Map<string, { blocked: boolean; at: number }>();

function appLinkError(message: string, code: string) {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
}

// A link with target _blank and rel noopener noreferrer: no referrer, no
// window.opener, and the form iPhone Safari and Home Screen apps open in a
// new tab (window.open with a features string can open in place there).
export function openAppLinkInNewTab(url: string, doc: Document = document) {
  const link = doc.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.referrerPolicy = 'no-referrer';
  link.style.display = 'none';
  doc.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
}

export default function useAppLinkConfirm({
  buildId,
  signedIn,
  frameRootRef
}: {
  buildId: number;
  // counts are sent for signed-in viewers only (the API needs an account)
  signedIn: boolean;
  // the element holding the app's iframe; inert while the sheet is open
  frameRootRef?: React.RefObject<HTMLElement | null>;
}) {
  const recordBuildAppLinkEvents = useAppContext(
    (v) => v.requestHelpers.recordBuildAppLinkEvents
  );
  const checkLinkHost = useAppContext((v) => v.requestHelpers.checkLinkHost);
  const recordRef = useRef(recordBuildAppLinkEvents);
  recordRef.current = recordBuildAppLinkEvents;
  const checkRef = useRef(checkLinkHost);
  checkRef.current = checkLinkHost;
  const flushTargetRef = useRef({ buildId, signedIn });
  flushTargetRef.current = { buildId, signedIn };
  const tallyRef = useRef<Tally>({});
  const flushTimerRef = useRef(0);
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [armed, setArmed] = useState(false);
  // when Open turned on (0 while it waits)
  const armedAtRef = useRef(0);
  const lastPressAtRef = useRef(0);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const { colorKey: doneColorKey } = useRoleColor('done', { fallback: 'blue' });
  const confirmColor =
    doneColorKey && doneColorKey in Color ? doneColorKey : 'blue';

  useLayoutEffect(() => {
    if (!session) return;
    const doc = document;
    leaveFullscreenAndPointerLock(doc);
    const releaseFrame = makeInert(frameRootRef?.current || null);
    setArmed(false);
    armedAtRef.current = 0;
    let armTimer = 0;
    const startArming = () => {
      window.clearTimeout(armTimer);
      armTimer = window.setTimeout(() => {
        armedAtRef.current = performance.now();
        setArmed(true);
      }, APP_LINK_OPEN_ARM_MS);
    };
    startArming();
    const onPointerDown = () => {
      lastPressAtRef.current = performance.now();
      // a press before Open turned on starts the wait again
      if (!armedAtRef.current) startArming();
    };
    const giveUp = window.setTimeout(() => finish(false), APP_LINK_SHEET_MAX_MS);
    cancelRef.current?.focus({ preventScroll: true });
    const onFullscreenChange = () => {
      if (isFullscreen(doc)) finish(false);
    };
    doc.addEventListener('pointerdown', onPointerDown, true);
    doc.addEventListener('fullscreenchange', onFullscreenChange);
    doc.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      window.clearTimeout(armTimer);
      window.clearTimeout(giveUp);
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('fullscreenchange', onFullscreenChange);
      doc.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      releaseFrame();
    };
  }, [session, frameRootRef]);

  useEffect(() => {
    const onHide = () => flush(true);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush(true);
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      sessionRef.current?.resolve(false);
      sessionRef.current = null;
      flush(true);
    };
  }, []);

  function flush(keepalive = false) {
    window.clearTimeout(flushTimerRef.current);
    flushTimerRef.current = 0;
    const tally = tallyRef.current;
    tallyRef.current = {};
    const { buildId: targetBuildId, signedIn: targetSignedIn } = flushTargetRef.current;
    const counts: Tally = {};
    let total = 0;
    for (const [kind, value] of Object.entries(tally) as Array<[CountKind, number]>) {
      const amount = Math.min(APP_LINK_FLUSH_CAP, Math.floor(value || 0));
      if (amount > 0) {
        counts[kind] = amount;
        total += amount;
      }
    }
    if (!total || !targetSignedIn || !targetBuildId) return;
    void recordRef.current?.({ buildId: targetBuildId, counts, keepalive });
  }

  function count(kind: CountKind) {
    tallyRef.current[kind] = (tallyRef.current[kind] || 0) + 1;
    if (!flushTimerRef.current) {
      flushTimerRef.current = window.setTimeout(() => flush(false), APP_LINK_FLUSH_MS);
    }
  }

  function finish(opened: boolean) {
    const current = sessionRef.current;
    if (!current) return;
    sessionRef.current = null;
    setSession(null);
    setArmed(false);
    current.resolve(opened);
  }

  function handleOpen(event?: React.MouseEvent) {
    const current = sessionRef.current;
    if (!current || current.mode !== 'confirm' || !event) return;
    // a script's click, or a press that began before Open turned on, does
    // nothing (a keyboard press has no pointer: detail 0)
    if (event.nativeEvent?.isTrusted === false) return;
    const armedAt = armedAtRef.current;
    if (!armedAt) return;
    if (event.detail !== 0 && lastPressAtRef.current < armedAt) return;
    openAppLinkInNewTab(current.url);
    finish(true);
  }

  async function isBlocked(host: string) {
    const known = hostChecks.get(host);
    if (known && Date.now() - known.at < HOST_CHECK_REMEMBER_MS) return known.blocked;
    try {
      const answer = await checkRef.current?.(host);
      const blocked = answer?.blocked === true;
      hostChecks.set(host, { blocked, at: Date.now() });
      while (hostChecks.size > 500) hostChecks.delete(hostChecks.keys().next().value!);
      return blocked;
    } catch {
      return false; // unknown: the sheet is still the viewer's choice
    }
  }

  function showSession(mode: Session['mode'], url: string, site: AppLinkSite) {
    return new Promise<boolean>((resolve) => {
      const next: Session = { id: ++nextSessionId, mode, url, site, resolve };
      sessionRef.current = next;
      setSession(next);
    });
  }

  async function handleAppLinkRequest({
    target,
    userActivation,
    isAppPreviewUrl
  }: AppLinkRequest): Promise<AppLinkResult> {
    const decision = authorizeAppLinkRequest({
      currentOrigin: window.location.origin,
      target,
      userActivation,
      isAppPreviewUrl
    });
    if (!decision.allowed) {
      count('rejected');
      throw appLinkError(decision.message, decision.code);
    }
    if (decision.kind === 'twinkle') {
      // the viewer's own tap on a Twinkle page is the consent, as for
      // openContent (Mikey 10-10)
      return {
        navigateUrl: decision.url,
        response: { opened: true, target: 'twinkle' }
      };
    }
    const key = String(buildId || 0);
    const gate = appLinkGate.begin(key, Date.now());
    if (!gate.allowed) {
      count('rejected');
      throw appLinkError(gate.message, gate.code);
    }
    let opened = false;
    try {
      const host = new URL(decision.url).hostname;
      if (await isBlocked(host)) {
        count('rejected');
        count('blocked');
        await showSession('blocked', decision.url, decision.site);
        throw appLinkError(
          "This site can't be opened from Twinkle apps.",
          'LINK_BLOCKED'
        );
      }
      count('shown');
      opened = await showSession('confirm', decision.url, decision.site);
    } finally {
      appLinkGate.end(key, Date.now());
    }
    count(opened ? 'opened' : 'cancelled');
    return { navigateUrl: null, response: { opened, target: 'external' } };
  }

  const appLinkModal = session ? (
    session.mode === 'blocked' ? (
      <AppLinkBlockedNote
        key={session.id}
        site={session.site}
        confirmColor={confirmColor}
        onClose={() => finish(false)}
      />
    ) : (
      <AppLinkSheet
        key={session.id}
        site={session.site}
        armed={armed}
        confirmColor={confirmColor}
        cancelRef={cancelRef}
        onCancel={() => finish(false)}
        onOpen={handleOpen}
      />
    )
  ) : null;

  return { appLinkModal, handleAppLinkRequest };
}

// A look-alike name (mixed alphabets, or one that does not decode) leads
// with the address-bar form, as browsers do, with the decoded name below
// (review S4).
function siteHeadline(site: AppLinkSite) {
  return site.mixedScripts && site.asciiHost ? site.asciiHost : site.displayHost;
}

export function AppLinkSheet({
  site,
  armed,
  confirmColor,
  cancelRef,
  onCancel,
  onOpen
}: {
  site: AppLinkSite;
  armed: boolean;
  confirmColor: string;
  cancelRef?: React.Ref<HTMLButtonElement>;
  onCancel: () => void;
  onOpen: (event?: React.MouseEvent) => void;
}) {
  const headline = siteHeadline(site);
  return (
    <Modal
      modalKey="AppLinkConfirmModal"
      isOpen
      onClose={onCancel}
      hasHeader
      header={
        <span className={headerClass}>
          Open <strong>{headline}</strong>?
        </span>
      }
      aria-label={`Open ${headline}?`}
      size="sm"
      modalLevel={2}
      priority
      closeOnBackdropClick
      footer={
        <>
          <Button
            buttonRef={cancelRef}
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            aria-disabled={!armed}
            className={armed ? undefined : paleClass}
            color={confirmColor}
            onClick={onOpen}
          >
            Open
          </Button>
        </>
      }
    >
      <div className={bodyClass}>
        <p>This link leaves {SITE_NAME}.</p>
        {site.asciiHost && site.mixedScripts ? (
          <p className={asciiClass}>Shown in its own letters: {site.displayHost}</p>
        ) : site.asciiHost ? (
          <p className={asciiClass}>Address bar: {site.asciiHost}</p>
        ) : null}
        {site.mixedScripts ? (
          <p className={warningClass} role="alert">
            Careful: this site name mixes letters from different alphabets, a
            trick some sites use to look like another site.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

export function AppLinkBlockedNote({
  site,
  confirmColor,
  onClose
}: {
  site: AppLinkSite;
  confirmColor: string;
  onClose: () => void;
}) {
  return (
    <Modal
      modalKey="AppLinkBlockedModal"
      isOpen
      onClose={onClose}
      hasHeader
      header={
        <span className={headerClass}>
          This site can&apos;t be opened from {SITE_NAME} apps
        </span>
      }
      aria-label={`This site can't be opened from ${SITE_NAME} apps`}
      size="sm"
      modalLevel={2}
      priority
      closeOnBackdropClick
      footer={
        <Button color={confirmColor} onClick={onClose}>
          OK
        </Button>
      }
    >
      <div className={bodyClass}>
        <p className={asciiClass}>{siteHeadline(site)}</p>
      </div>
    </Modal>
  );
}
