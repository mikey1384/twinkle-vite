// The lite host entry: the page at <slug>.lumine.app (and the app's own
// domain). The app's frame is already in the HTML (twinkle-api
// helpers/build/appHosting/hostShell.ts), so the app loads in parallel with
// this script; no loading screen of ours. This script answers the app's
// Twinkle SDK requests with the website's own bridge (LiteHost.tsx), draws
// Twinkle's trusted UI on the top page above the app (badge, sign-in and
// report sheets, confirmation boxes) and handles "Sign in with Twinkle".
//
// The API address is baked in at build time (vite.lite-host.config.ts sets
// VITE_URL), like the website's.
import '../host.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import requestHelpersFactory from '~/contexts/requestHelpers';
import {
  getStoredItem,
  removeStoredItem,
  setStoredItem
} from '~/helpers/userDataHelpers';
import {
  createSessionStore,
  type AppSession,
  type LiteHostConfig
} from '../session';
import { askSignIn, mountBadge, showReport } from '../ui';
import { LITE_HOST_TEXT, liteHostLang } from '../text';
import { cloudFrontURL } from '~/constants/defaultValues';
import {
  createLiteFrameMetaRef,
  installLiteFrameReloadWatch,
  LiteHostBridge,
  LiteHostProviders,
  type LiteHostViewer
} from './LiteHost';
import { createLiteSocketBinder } from './liteSocket';
import type { PreviewFrameRetiredHandler } from '~/containers/Build/PreviewPanel/types';

declare global {
  interface Window {
    __lumineEarly?: MessageEvent[];
  }
}

function readConfig(): LiteHostConfig | null {
  const node = document.getElementById('lumine-app');
  if (!node?.textContent) return null;
  try {
    return JSON.parse(node.textContent) as LiteHostConfig;
  } catch {
    return null;
  }
}

// The app pass under this origin's own `token` key (lumine.app storage is
// separate from twin-kle.com's): the website's request helpers and socket
// client read it unchanged.
function storeSessionCredentials(session: AppSession | null) {
  if (session) {
    setStoredItem('token', session.accessToken);
    setStoredItem('userId', String(session.user.id));
    setStoredItem('username', session.user.username);
  } else if (getStoredItem('token')) {
    removeStoredItem('token');
    removeStoredItem('userId');
    removeStoredItem('username');
  }
}

// The member's picture for the badge menu: an https address, or a path on
// Twinkle's picture CDN (older answers). Anything else gets the initial.
function safePictureUrl(value: string | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  try {
    if (/^https:\/\//i.test(text)) {
      const url = new URL(text);
      return url.protocol === 'https:' ? url.href : null;
    }
    if (!text.startsWith('/') || text.startsWith('//')) return null;
    const cdn = new URL(cloudFrontURL);
    if (!/^[\w-]+\.cloudfront\.net$/.test(cdn.hostname) || cdn.hostname.startsWith('undefined.')) {
      return null;
    }
    const url = new URL(text, cdn);
    return url.origin === cdn.origin ? url.href : null;
  } catch {
    return null;
  }
}

function basicViewer(id: number, username: string): LiteHostViewer {
  return {
    id,
    username,
    profilePicUrl: null,
    ageTier: 'kid',
    rewardRuntimeGrant: null,
    cardCraftRuntimeGrant: null,
    capabilitySnapshot: null
  };
}

function replayEarlyMessages() {
  const early = window.__lumineEarly || [];
  window.__lumineEarly = undefined;
  for (const event of early) {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: event.data,
        origin: event.origin,
        source: event.source,
        ports: [...(event.ports || [])]
      })
    );
  }
}

async function start() {
  const config = readConfig();
  const frame = document.getElementById(
    'lumine-app-frame'
  ) as HTMLIFrameElement | null;
  if (!config || !frame) return;
  const t = LITE_HOST_TEXT[liteHostLang()];
  document.documentElement.lang = liteHostLang();
  const session = createSessionStore(config);
  // A sign-in that came back by redirect, and an expired pass, are settled
  // before the bridge answers anything (the app's early messages wait in
  // window.__lumineEarly meanwhile).
  await session.completeRedirect();
  if (session.get()) await session.accessToken();
  storeSessionCredentials(session.get());

  const requestHelpers = requestHelpersFactory((error) =>
    Promise.reject(error)
  );
  const socketBinder = createLiteSocketBinder();
  const metaRef = createLiteFrameMetaRef(config.buildId);
  const retiredRef: { current: PreviewFrameRetiredHandler | null } = {
    current: null
  };
  installLiteFrameReloadWatch({
    frame,
    buildId: config.buildId,
    metaRef,
    retiredRef
  });

  const openSignIn = () => {
    void askSignIn({ config, t, session });
  };
  // The signed-in member's picture for the badge menu (from app-session/me).
  const viewerPictureRef: { current: string | null } = { current: null };

  function Root() {
    const [current, setCurrent] = useState<AppSession | null>(session.get());
    // Signed in from the first render, so the app's first viewer answer is
    // the member (the details and grants follow from app-session/me).
    const [viewer, setViewer] = useState<LiteHostViewer | null>(() => {
      const signedIn = session.get();
      return signedIn
        ? basicViewer(signedIn.user.id, signedIn.user.username)
        : null;
    });
    useEffect(() => {
      const unsubscribe = session.subscribe((next) => {
        storeSessionCredentials(next);
        setCurrent(next);
      });
      return () => {
        unsubscribe();
      };
    }, []);
    // Keep the pass fresh: it lasts an hour; refresh a minute before.
    useEffect(() => {
      if (!current) return;
      const timer = window.setInterval(
        () => void session.accessToken(),
        30_000
      );
      const onVisible = () => {
        if (document.visibilityState === 'visible') void session.accessToken();
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        window.clearInterval(timer);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }, [current]);
    const userId = current?.user.id || 0;
    useEffect(() => {
      if (!current) {
        setViewer(null);
        socketBinder.setIdentity(null);
        return;
      }
      socketBinder.setIdentity({
        userId: current.user.id,
        username: current.user.username,
        profilePicUrl: viewer?.profilePicUrl || null,
        token: current.accessToken
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);
    // Whose details (grants, age, picture) have arrived; on twin-kle.com the
    // app's payload carries them before the app is answered, so the first
    // answer here waits for them too (the app's messages queue meanwhile).
    const [detailsFor, setDetailsFor] = useState(0);
    const [bridgeStarted, setBridgeStarted] = useState(false);
    useEffect(() => {
      if (!bridgeStarted && (!userId || detailsFor === userId))
        setBridgeStarted(true);
    }, [bridgeStarted, detailsFor, userId]);
    useEffect(() => {
      if (!userId) return;
      let cancelled = false;
      // The member at once (so requests carry their id), then the details.
      setViewer((previous) =>
        previous && previous.id === userId
          ? previous
          : basicViewer(userId, session.get()?.user.username || '')
      );
      requestHelpers
        .loadLumineAppViewer({ buildId: config!.buildId })
        .then((data: any) => {
          if (cancelled || !data?.viewer) return;
          // Grants are for one published version: only the one this page runs.
          const sameVersion =
            Number(data.runtime?.publishedArtifactVersionId) ===
            Number(config!.versionId);
          setViewer({
            id: Number(data.viewer.id),
            username: String(data.viewer.username || ''),
            profilePicUrl: data.viewer.profilePicUrl || null,
            ageTier: ['adult', 'teen'].includes(data.viewer.ageTier)
              ? data.viewer.ageTier
              : 'kid',
            rewardRuntimeGrant: sameVersion
              ? data.runtime?.rewardRuntimeGrant || null
              : null,
            cardCraftRuntimeGrant: sameVersion
              ? data.runtime?.cardCraftRuntimeGrant || null
              : null,
            capabilitySnapshot: data.runtime?.capabilitySnapshot || null
          });
        })
        .catch(() => {
          // The basic identity stays; grants come with the next sign-in.
        })
        .finally(() => {
          if (!cancelled) setDetailsFor(userId);
        });
      return () => {
        cancelled = true;
      };
    }, [userId]);
    const viewerPicture = viewer?.profilePicUrl || null;
    useEffect(() => {
      viewerPictureRef.current = safePictureUrl(viewerPicture);
    }, [viewerPicture]);
    const info = useMemo(
      () => ({
        buildId: config!.buildId,
        versionId: config!.versionId,
        title: config!.title,
        owner: config!.owner,
        siteOrigin: config!.siteOrigin
      }),
      []
    );
    const onGuestRestricted = useCallback(openSignIn, []);
    return (
      <LiteHostProviders
        requestHelpers={requestHelpers}
        viewer={viewer}
        onOpenSignin={openSignIn}
      >
        {bridgeStarted ? (
          <LiteHostBridge
            info={info}
            frame={frame!}
            viewer={viewer}
            metaRef={metaRef}
            retiredRef={retiredRef}
            onGuestRestricted={onGuestRestricted}
            onReady={replayEarlyMessages}
          />
        ) : null}
      </LiteHostProviders>
    );
  }

  // Twinkle's website boxes render into #modal (components/Modal).
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal';
  const reactRoot = document.createElement('div');
  reactRoot.id = 'lumine-host-root';
  document.body.append(reactRoot, modalRoot);
  createRoot(reactRoot).render(<Root />);

  mountBadge({
    config,
    t,
    session,
    viewerPicture: () => viewerPictureRef.current,
    onReport: () =>
      showReport({
        config,
        t,
        send: async (reason, details) => {
          await fetch(
            `${config.apiOrigin}/build/${config.buildId}/app-report`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                reason,
                details,
                host: window.location.host
              })
            }
          );
        }
      })
  });
  frame.focus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void start(), {
    once: true
  });
} else {
  void start();
}
