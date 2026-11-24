import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  authorizeAppLinkRequest,
  createAppLinkGate,
  type AppLinkSite
} from '~/containers/Build/PreviewPanel/helpers/appLinkPolicy';
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
// Open turns on a moment after the sheet appears, so a quick second tap
// meant for the app cannot land on it.
export const APP_LINK_OPEN_ARM_MS = 450;

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

interface Session {
  id: number;
  url: string;
  site: AppLinkSite;
  resolve: (opened: boolean) => void;
}

export interface AppLinkRequest {
  target: unknown;
  userActivation: { isActive?: boolean } | null | undefined;
  isAppPreviewUrl?: (url: URL) => boolean;
}

export type AppLinkResult =
  | { navigateUrl: string; response: { opened: true; target: 'twinkle' } }
  | { navigateUrl: null; response: { opened: boolean; target: 'external' } };

let nextSessionId = 0;

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
  frameRootRef
}: {
  buildId: number;
  // the element holding the app's iframe; inert while the sheet is open
  frameRootRef?: React.RefObject<HTMLElement | null>;
}) {
  const recordBuildAppLinkEvent = useAppContext(
    (v) => v.requestHelpers.recordBuildAppLinkEvent
  );
  const recordRef = useRef(recordBuildAppLinkEvent);
  recordRef.current = recordBuildAppLinkEvent;
  const gateRef = useRef(createAppLinkGate());
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [armed, setArmed] = useState(false);
  const armedAtRef = useRef(0);
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
    armedAtRef.current = performance.now() + APP_LINK_OPEN_ARM_MS;
    const armTimer = window.setTimeout(() => setArmed(true), APP_LINK_OPEN_ARM_MS);
    cancelRef.current?.focus({ preventScroll: true });
    const onFullscreenChange = () => {
      if (isFullscreen(doc)) finish(false);
    };
    doc.addEventListener('fullscreenchange', onFullscreenChange);
    doc.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      window.clearTimeout(armTimer);
      doc.removeEventListener('fullscreenchange', onFullscreenChange);
      doc.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      releaseFrame();
    };
  }, [session, frameRootRef]);

  useEffect(
    () => () => {
      sessionRef.current?.resolve(false);
      sessionRef.current = null;
    },
    []
  );

  function record(kind: 'shown' | 'opened' | 'cancelled' | 'rejected') {
    if (!buildId) return;
    void recordRef.current?.({ buildId, kind });
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
    if (!current || !event) return;
    // a script's click, or a tap before Open turned on, does nothing
    if (event.nativeEvent?.isTrusted === false) return;
    if (performance.now() < armedAtRef.current) return;
    openAppLinkInNewTab(current.url);
    finish(true);
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
      record('rejected');
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
    const gate = gateRef.current.begin(key, Date.now());
    if (!gate.allowed) {
      record('rejected');
      throw appLinkError(gate.message, gate.code);
    }
    record('shown');
    let opened = false;
    try {
      opened = await new Promise<boolean>((resolve) => {
        const next: Session = {
          id: ++nextSessionId,
          url: decision.url,
          site: decision.site,
          resolve
        };
        sessionRef.current = next;
        setSession(next);
      });
    } finally {
      gateRef.current.end(key, Date.now());
    }
    record(opened ? 'opened' : 'cancelled');
    return { navigateUrl: null, response: { opened, target: 'external' } };
  }

  const appLinkModal = session ? (
    <AppLinkSheet
      key={session.id}
      site={session.site}
      armed={armed}
      confirmColor={confirmColor}
      cancelRef={cancelRef}
      onCancel={() => finish(false)}
      onOpen={handleOpen}
    />
  ) : null;

  return { appLinkModal, handleAppLinkRequest };
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
  return (
    <Modal
      modalKey="AppLinkConfirmModal"
      isOpen
      onClose={onCancel}
      hasHeader
      header={
        <span className={headerClass}>
          Open <strong>{site.displayHost}</strong>?
        </span>
      }
      aria-label={`Open ${site.displayHost}?`}
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
        {site.asciiHost ? (
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
