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
import {
  askSignIn,
  hideAiBanner,
  mountBadge,
  showAiBanner,
  showGuestHint,
  showReport,
  showToast,
  type MenuExtra
} from '../ui';
import AppAccountSheet from './AppAccountSheet';
import { createGuestStore } from '../guestStore';
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
  // A guest's private storage lives on this device until they sign in; then
  // it is carried into their account before the app hears they signed in.
  const guestStore = createGuestStore(
    config.buildId,
    () =>
      `guest_${
        window.crypto?.randomUUID?.() ||
        `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      }`
  );
  const session = createSessionStore(config, {
    beforeSignedIn: async (accessToken) => {
      const pending = guestStore.takeForCarryover();
      if (!pending) return;
      const response = await fetch(
        `${config.apiOrigin}/build/${config.buildId}/app-session/carryover`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: accessToken
          },
          body: JSON.stringify(pending)
        }
      );
      if (!response.ok) return;
      const data = await response.json().catch(() => ({}));
      guestStore.clear();
      if (Number(data?.carried) > 0) showToast(t.carriedOver);
    }
  });
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

  // Which accounts the app's players use (the owner's setting; twinkle-api
  // appAccounts.ts): Twinkle accounts (default), the app's own, or both.
  let accountMode: 'twinkle' | 'app' | 'both' = 'twinkle';
  const accountModeReady = fetch(
    `${config.apiOrigin}/build/${config.buildId}/app-session/info?origin=${encodeURIComponent(window.location.origin)}`
  )
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data?.accountMode === 'app' || data?.accountMode === 'both') accountMode = data.accountMode;
    })
    .catch(() => {});
  type SheetView = 'signin' | 'birth' | 'reset' | 'email';
  const accountSheetListeners = new Set<(view: SheetView | null) => void>();
  // a password-reset email opens the app with #lumine_reset=<token>
  const resetToken = (() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get('lumine_reset') || '';
    if (token) {
      try {
        history.replaceState(null, '', window.location.href.split('#')[0]);
      } catch {
        /* the page still works */
      }
    }
    return token;
  })();
  let sheetClosed: Array<() => void> = [];
  const onAccountSheetClosed = () => {
    const waiting = sheetClosed;
    sheetClosed = [];
    waiting.forEach((resolve) => resolve());
  };
  // The app's sign-in: Twinkle's sheet (popup to twin-kle.com) or the app's
  // own accounts. Resolves when it closes.
  const openSignIn = (view: SheetView = 'signin') =>
    accountModeReady.then(async () => {
      if (accountMode === 'twinkle') {
        await askSignIn({ config, t, session });
        return;
      }
      await new Promise<void>((resolve) => {
        sheetClosed.push(resolve);
        accountSheetListeners.forEach((listener) => listener(view));
      });
    });
  // An app that subscribed to Twinkle.auth.onChange follows sign-in and
  // sign-out itself; any other (older apps) is reloaded when the player
  // changes after the page loaded, so it shows the new state (F8). The
  // guest's carry-over runs before a new session is published
  // (beforeSignedIn), so the reloaded app already finds it.
  let appWatchesAuth = false;
  const identityOf = (signedIn: AppSession | null) => (signedIn ? `u${signedIn.user.id}` : 'guest');
  let frameIdentity = identityOf(session.get());
  const reloadFrameForIdentity = (signedIn: AppSession | null) => {
    const next = identityOf(signedIn);
    if (next === frameIdentity) return;
    frameIdentity = next;
    if (appWatchesAuth) return;
    // after the bridge has the new viewer (this render and app-session/me)
    window.setTimeout(() => {
      frame.setAttribute('src', frame.getAttribute('src') || config.frameSrc);
    }, 400);
  };
  // Twinkle.auth on this page (useHostBridge authHostRef)
  const authHost = {
    surface: (/\.lumine\.app$|\.localhost$/.test(window.location.hostname) ? 'address' : 'domain') as
      | 'address'
      | 'domain',
    signIn: () => openSignIn('signin'),
    signUp: () => openSignIn('birth'),
    signOut: () => session.signOut(),
    markWatched: () => {
      appWatchesAuth = true;
    },
    async aiCoverage() {
      await accountModeReady;
      // an app on its own accounts only: no Twinkle account can help (G4)
      if (accountMode === 'app') return { payer: 'none', reason: 'app_accounts_only', message: 'AI isn’t available in this app.' };
      const token = await session.accessToken();
      if (!token) return { payer: 'none', reason: 'twinkle_account_required', message: 'This app’s AI needs a Twinkle account.' };
      const response = await fetch(`${config.apiOrigin}/build/${config.buildId}/app-session/ai-coverage`, {
        headers: { authorization: token }
      });
      return response.ok ? response.json() : { payer: 'none', message: null };
    }
  };
  // "Link a Twinkle account": an app account, in an app on both kinds
  const linkTwinkle = async () => {
    try {
      const linked = await session.linkTwinkle();
      if (linked?.appPlayer?.linked) showToast(t.linkedTwinkle, 5000);
    } catch (error: any) {
      showToast(error?.message || t.linkFailed, 6000);
    }
  };
  // the app needed an account for something in the background
  const hintSignIn = () => showGuestHint({ t, onSignIn: () => void openSignIn() });
  // Twinkle AI is for Twinkle members (Mikey 2026-11-26). A guest, or an
  // app account not linked to Twinkle, sees the AI banner: up front when the
  // app's code calls Twinkle.ai (config.usesAi), and again whenever the app
  // tries an AI action. Only where a Twinkle account can be used here (not
  // in an app on its own accounts only).
  const isExternal = (signedIn: AppSession | null) =>
    !signedIn || (signedIn.appPlayer?.kind === 'app' && !signedIn.appPlayer.linked);
  // force: the server just refused an AI action (twinkle_account_required,
  // or a guest's): always say why, whatever the account looks like here. A
  // linked app account whose session its member didn't sign continues with
  // Twinkle (the member flow); in an app on its own accounts only, a short
  // note with no button.
  const refreshAiBanner = ({ force = false }: { force?: boolean } = {}) =>
    accountModeReady.then(() => {
      const signedIn = session.get();
      if (accountMode === 'app') {
        if (force) {
          showAiBanner({ t, buildId: config.buildId, cta: null, text: t.aiUnavailableHere, force, onAction: () => {} });
        } else {
          hideAiBanner();
        }
        return;
      }
      if (!force && (!isExternal(signedIn) || !config.usesAi)) {
        hideAiBanner();
        return;
      }
      const player = signedIn?.appPlayer;
      const kind = !signedIn ? 'guest' : player?.kind === 'app' ? (player.linked ? 'linked' : 'app') : 'member';
      showAiBanner({
        t,
        buildId: config.buildId,
        cta: kind === 'app' ? t.aiBannerLinkCta : kind === 'linked' ? t.signInCta : t.aiBannerCta,
        force,
        onAction: () => {
          if (kind === 'app') void linkTwinkle();
          else void session.signIn();
        }
      });
    });
  const onAiNeedsAccount = () => void refreshAiBanner({ force: true });
  // Coins/XP refused: a linked player on a session its member didn't sign
  // (the app's password) can continue with Twinkle to earn them (audit G7)
  const onRewardsNeedMember = () =>
    void accountModeReady.then(() => {
      const player = session.get()?.appPlayer;
      if (!player || player.kind !== 'app' || !player.linked) return;
      showAiBanner({
        t,
        buildId: config.buildId,
        cta: t.signInCta,
        text: t.rewardsContinue,
        force: true,
        onAction: () => void session.signIn()
      });
    });
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
        void refreshAiBanner();
        reloadFrameForIdentity(next);
      });
      void refreshAiBanner();
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
    const onGuestRestricted = useCallback(hintSignIn, []);
    const [accountSheetView, setAccountSheetView] = useState<SheetView | null>(
      resetToken ? 'reset' : null
    );
    useEffect(() => {
      accountSheetListeners.add(setAccountSheetView);
      return () => {
        accountSheetListeners.delete(setAccountSheetView);
      };
    }, []);
    const accountKind = !current
      ? null
      : current.appPlayer?.kind === 'app'
        ? current.appPlayer.linked
          ? 'linked'
          : 'app'
        : 'member';
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
            onAiNeedsAccount={onAiNeedsAccount}
            onRewardsNeedMember={onRewardsNeedMember}
            guestCoinsMessage={t.coinsSignIn}
            guestStore={current ? null : guestStore}
            accountKind={accountKind}
            authHost={authHost}
            onReady={replayEarlyMessages}
          />
        ) : null}
        {accountSheetView && (!current || accountSheetView === 'email') ? (
          <AppAccountSheet
            initialView={accountSheetView}
            resetToken={resetToken}
            config={config!}
            t={t}
            lang={liteHostLang()}
            session={session}
            twinkleToo={accountMode === 'both'}
            onClose={() => {
              setAccountSheetView(null);
              onAccountSheetClosed();
            }}
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
    onSignIn: () => void openSignIn(),
    playerKindLabel: () => {
      const player = session.get()?.appPlayer;
      if (!session.get()) return null;
      return player?.kind === 'app' ? (player.linked ? t.kindLinked : t.kindApp) : t.kindMember;
    },
    extraItems: (): MenuExtra[] => {
      const player = session.get()?.appPlayer;
      if (!session.get() || player?.kind !== 'app') return [];
      const emailItem: MenuExtra = {
        iconName: 'mail',
        label: t.menuResetEmail,
        sub: t.menuResetEmailSub,
        onClick: () => accountSheetListeners.forEach((listener) => listener('email'))
      };
      if (player.linked) {
        return [
          emailItem,
          {
            iconName: 'unlink',
            label: t.unlinkTwinkle,
            sub: t.unlinkTwinkleSub,
            onClick: async () => {
              try {
                await session.unlinkTwinkle();
                showToast(t.unlinkedTwinkle, 4000);
              } catch (error: any) {
                showToast(error?.message || t.accountFailed, 5000);
              }
            }
          }
        ];
      }
      return accountMode === 'both'
        ? [emailItem, { iconName: 'link', label: t.linkTwinkle, sub: t.linkTwinkleSub, onClick: () => void linkTwinkle() }]
        : [emailItem];
    },
    viewerPicture: () => viewerPictureRef.current,
    onReport: () =>
      showReport({
        config,
        t,
        // with the player's pass when signed in (not anonymous); throws
        // unless the report was stored, so the sheet says so (audit G1)
        send: async (reason, details) => {
          const token = await session.accessToken().catch(() => null);
          const response = await fetch(
            `${config.apiOrigin}/build/${config.buildId}/app-report`,
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                ...(token ? { authorization: token } : {})
              },
              body: JSON.stringify({
                reason,
                details,
                host: window.location.host
              })
            }
          );
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            const error: any = new Error(String(data?.error || ''));
            error.status = response.status;
            throw error;
          }
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
