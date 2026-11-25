// The lite host on a Lumine app's own address (<slug>.lumine.app or the
// app's own domain), built on the very hooks the twin-kle.com app frame uses
// (PreviewPanel): useAppRequests for the request helpers, useHostConfirmations
// for Twinkle's own boxes (image, music, media, Coins, outside links, card
// crafting, live safety) and the unmodified useHostBridge for every SDK
// message. So an app answers the same on both hosts.
//
// What differs from twin-kle.com is only the frame bookkeeping and the
// sign-in:
// - the app frame is already in the page's HTML (twinkle-api
//   helpers/build/appHosting/hostShell.ts), at b<id>.run.lumine.app, with the
//   bridge load id `lumine-host`; this host gives it a fresh nonce per load
//   (the shape useFrameManager gives the website's frames);
// - the member's app pass sits under this origin's `token` storage key, so
//   the request helpers and the socket sign in with it unchanged;
// - Coins spends carry the server's record of the member's tap in the box
//   (liteCoins.ts).
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from 'react';
import { useAppContext } from '~/contexts';
import { AppContext } from '~/contexts/AppContext';
import { KeyContext } from '~/contexts/KeyContext';
import { getThemeRoles } from '~/theme';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';
import useAppRequests from '~/containers/Build/PreviewPanel/hooks/useAppRequests';
import useHostConfirmations from '~/containers/Build/PreviewPanel/hooks/useHostConfirmations';
import {
  buildEmptyRuntimeObservationState,
  useHostBridge
} from '~/containers/Build/PreviewPanel/hooks/useHostBridge';
import type {
  PreviewFrameMeta,
  PreviewFrameRetiredHandler,
  PreviewRuntimeUploadsSyncPayload
} from '~/containers/Build/PreviewPanel/types';
import type {
  AppHelperBridge,
  AppHelperEvents,
  AppHelperRelayState
} from '~/containers/Build/PreviewPanel/types/appHelperTypes';
import type { BuildRuntimeObservationState } from '~/containers/Build/types/runtimeObservationTypes';
import type { GuestPrivateDb } from '~/containers/Build/PreviewPanel/types/previewHostBridgeTypes';
import { createLiteCoinGate } from './liteCoins';

export const LITE_HOST_BRIDGE_LOAD_ID = 'lumine-host';
// useFrameManager's PREVIEW_BRIDGE_NONCE_REQUEST_TTL_MS
const NONCE_REQUEST_TTL_MS = 35 * 1000;

export interface LiteHostBuildInfo {
  buildId: number;
  versionId: number;
  title: string;
  owner: { id: number; username: string };
  siteOrigin: string;
}

// The signed-in member as this app sees them (GET app-session/me), or null
// for a signed-out visitor (guest, as today).
export interface LiteHostViewer {
  id: number;
  username: string;
  profilePicUrl: string | null;
  ageTier: 'kid' | 'teen' | 'adult';
  rewardRuntimeGrant: string | null;
  cardCraftRuntimeGrant: string | null;
  capabilitySnapshot: any;
}

export interface LiteFrameMetaRef {
  current: { primary: PreviewFrameMeta; secondary: PreviewFrameMeta };
}

function randomNonce() {
  const values = new Uint32Array(4);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(36)).join('');
}

function emptyMeta(): PreviewFrameMeta {
  return {
    buildId: null,
    codeSignature: null,
    messageNonce: null,
    viewerKey: null,
    bridgeLoadId: null,
    bridgeConfirmed: false,
    bridgeNonceRequestOpen: false,
    bridgeNonceRequestExpiresAt: null,
    hasLoaded: false
  };
}

// One app load: a fresh nonce, the nonce request open for the frame's
// `lumine-host` load id (useFrameManager's createPreviewFrameMeta shape).
export function createLiteFrameMeta(
  buildId: number,
  viewerKey: string
): PreviewFrameMeta {
  return {
    buildId,
    codeSignature: null,
    messageNonce: randomNonce(),
    viewerKey,
    bridgeLoadId: LITE_HOST_BRIDGE_LOAD_ID,
    bridgeConfirmed: false,
    bridgeNonceRequestOpen: true,
    bridgeNonceRequestExpiresAt: Date.now() + NONCE_REQUEST_TTL_MS,
    hasLoaded: false
  };
}

export function createLiteFrameMetaRef(buildId: number): LiteFrameMetaRef {
  return {
    current: {
      primary: createLiteFrameMeta(buildId, 'guest'),
      secondary: emptyMeta()
    }
  };
}

// The app reloaded itself inside its frame (same window, new document): it
// asks for a nonce again. Installed before the shared bridge's listener, so
// the bridge sees a fresh, open request for the new load, and the old load's
// sessions (worlds, live grants) are retired first, as on twin-kle.com.
export function installLiteFrameReloadWatch({
  frame,
  buildId,
  metaRef,
  retiredRef
}: {
  frame: HTMLIFrameElement;
  buildId: number;
  metaRef: LiteFrameMetaRef;
  retiredRef: { current: PreviewFrameRetiredHandler | null };
}) {
  const onMessage = (event: MessageEvent) => {
    if (event.source !== frame.contentWindow) return;
    const data = event.data;
    if (
      !data ||
      data.source !== 'twinkle-build' ||
      data.type !== 'bridge:request-nonce'
    )
      return;
    const meta = metaRef.current.primary;
    const stillOpen =
      meta.bridgeNonceRequestOpen &&
      (!meta.bridgeNonceRequestExpiresAt ||
        meta.bridgeNonceRequestExpiresAt > Date.now());
    if (stillOpen) return;
    retiredRef.current?.({
      frame: 'primary',
      sourceWindow: frame.contentWindow,
      reason: 'navigated'
    });
    metaRef.current = {
      ...metaRef.current,
      primary: createLiteFrameMeta(buildId, meta.viewerKey || 'guest')
    };
  };
  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

const defaultAppContextValue = (AppContext as any)._defaultStore.snapshot.value;

export function LiteHostProviders({
  requestHelpers,
  viewer,
  onOpenSignin,
  children
}: {
  requestHelpers: any;
  viewer: LiteHostViewer | null;
  onOpenSignin: () => void;
  children: React.ReactNode;
}) {
  const appValue = useMemo(
    () => ({
      ...defaultAppContextValue,
      user: {
        ...defaultAppContextValue.user,
        actions: {
          ...defaultAppContextValue.user.actions,
          onOpenSigninModal: onOpenSignin
        }
      },
      requestHelpers
    }),
    [onOpenSignin, requestHelpers]
  );
  const theme = useMemo(() => getThemeRoles(DEFAULT_PROFILE_THEME as any), []);
  const keyValue = useMemo(
    () => ({
      myState: viewer
        ? {
            userId: viewer.id,
            username: viewer.username,
            profilePicUrl: viewer.profilePicUrl,
            profileTheme: DEFAULT_PROFILE_THEME,
            settings: {}
          }
        : { profileTheme: DEFAULT_PROFILE_THEME, settings: {} },
      theme,
      helpers: {}
    }),
    [theme, viewer]
  );
  return (
    <AppContext.Provider value={appValue}>
      <KeyContext.Provider value={keyValue as any}>
        {children}
      </KeyContext.Provider>
    </AppContext.Provider>
  );
}

export function LiteHostBridge({
  info,
  frame,
  viewer,
  metaRef,
  retiredRef,
  onGuestRestricted,
  guestStore,
  onReady
}: {
  info: LiteHostBuildInfo;
  frame: HTMLIFrameElement;
  viewer: LiteHostViewer | null;
  metaRef: LiteFrameMetaRef;
  retiredRef: MutableRefObject<PreviewFrameRetiredHandler | null>;
  onGuestRestricted: () => void;
  // A signed-out visitor's private storage on this device (guestStore.ts).
  guestStore: GuestPrivateDb | null;
  // Runs after the shared bridge listens (to replay messages that arrived
  // before this script).
  onReady?: () => void;
}) {
  const { getBuildApiTokenRef, previewRequestRefs } = useAppRequests();
  const frameRootRef = useRef<HTMLDivElement | null>(
    frame as unknown as HTMLDivElement
  );
  const build = useMemo(
    () => ({
      id: info.buildId,
      title: info.title,
      userId: info.owner.id,
      username: info.owner.username,
      isPublic: 1,
      publishedArtifactVersionId: info.versionId,
      currentArtifactVersionId: info.versionId,
      rewardRuntimeGrant: viewer?.rewardRuntimeGrant || null,
      cardCraftRuntimeGrant: viewer?.cardCraftRuntimeGrant || null
    }),
    [info, viewer]
  );
  const {
    setActiveBuildLiveSafetyHostSessions,
    requestBuildLiveSafetyStopRef,
    requestBuildImageGenerationConfirmationRef,
    requestBuildMusicGenerationConfirmationRef,
    requestBuildCoinConfirmationRef,
    requestBuildAppLinkRef,
    requestBuildMediaActionConfirmationRef,
    requestCardCraftSelectionRef,
    hostConfirmationModals
  } = useHostConfirmations({
    build,
    keyUserId: viewer?.id || null,
    previewRootRef: frameRootRef
  });

  // Coins: the shared box, then the server's one-time confirmation, then the
  // spend (liteCoins.ts).
  const coinGate = useRef<ReturnType<typeof createLiteCoinGate> | null>(null);
  const createCoinConfirmation = useAppContext(
    (v) => v.requestHelpers.createLumineAppCoinConfirmation
  );
  const createCoinConfirmationRef = useRef(createCoinConfirmation);
  createCoinConfirmationRef.current = createCoinConfirmation;
  coinGate.current ||= createLiteCoinGate({
    createConfirmation: (input) => createCoinConfirmationRef.current(input)
  });
  const coinConfirmRef = useRef(
    coinGate.current.wrapConfirm(() => requestBuildCoinConfirmationRef.current)
  );
  const requestRefs = useMemo(
    () => ({
      ...previewRequestRefs,
      requestBuildCoinsRef: {
        current: coinGate.current!.wrapRequest(
          () => previewRequestRefs.requestBuildCoinsRef.current
        )
      }
    }),
    [previewRequestRefs]
  );

  const buildRef = useRef<any>(build);
  buildRef.current = build;
  const isOwnerRef = useRef(false);
  const userIdRef = useRef<number | null>(viewer?.id || null);
  userIdRef.current = viewer?.id || null;
  const usernameRef = useRef<string | null>(viewer?.username || null);
  usernameRef.current = viewer?.username || null;
  const profilePicUrlRef = useRef<string | null>(viewer?.profilePicUrl || null);
  profilePicUrlRef.current = viewer?.profilePicUrl || null;
  const ageTierRef = useRef<'kid' | 'teen' | 'adult'>(viewer?.ageTier || 'kid');
  ageTierRef.current = viewer?.ageTier || 'kid';
  const guestSessionIdRef = useRef<string | null>(null);
  const buildApiTokenRef = useRef<any>(null);
  const onGuestRestrictedRef = useRef(onGuestRestricted);
  onGuestRestrictedRef.current = onGuestRestricted;
  const previewAuth = useRef({
    buildRef,
    isOwnerRef,
    userIdRef,
    usernameRef,
    profilePicUrlRef,
    ageTierRef,
    guestSessionIdRef,
    buildApiTokenRef,
    getBuildApiTokenRef,
    // twin-kle.com shows its guest banner; here Twinkle's sign-in sheet.
    setGuestRestrictionBannerVisible: ((visible: any) => {
      if (visible) onGuestRestrictedRef.current();
    }) as any
  }).current;

  const frameSrc = frame.getAttribute('src') || frame.src;
  const previewFrameSources = useMemo(
    () => ({ primary: frameSrc, secondary: null }),
    [frameSrc]
  );
  const previewFrameSourcesRef = useRef(previewFrameSources);
  const previewFrameReady = useMemo(
    () => ({ primary: true, secondary: false }),
    []
  );
  const primaryIframeRef = useRef<HTMLIFrameElement | null>(frame);
  const secondaryIframeRef = useRef<HTMLIFrameElement | null>(null);
  const messageTargetFrameRef = useRef<'primary' | 'secondary'>('primary');
  const navigateHostContentRef = useRef((url: string) => {
    // Twinkle content opens on twin-kle.com, in a new tab.
    const target = new URL(url, info.siteOrigin);
    window.open(target.toString(), '_blank', 'noopener');
  });
  const navigatePreviewFrameRef = useRef<
    ((src: string) => string | null) | null
  >(null);
  const previewCodeSignatureRef = useRef<string | null>(null);
  const previewTransitioningRef = useRef(false);
  const capabilitySnapshotRef = useRef<any>(viewer?.capabilitySnapshot || null);
  capabilitySnapshotRef.current = viewer?.capabilitySnapshot || null;
  const runtimeExplorationPlanRef = useRef(null);
  // Runtime health reports from the frame (as PreviewPanel keeps them).
  const [, setRuntimeObservationState] = useState<BuildRuntimeObservationState>(
    () =>
      buildEmptyRuntimeObservationState({
        buildId: info.buildId,
        codeSignature: null
      })
  );
  const runtimeUploadsSyncRef = useRef<
    ((payload: PreviewRuntimeUploadsSyncPayload | null) => void) | null
  >(null);
  const onAiUsagePolicyUpdateRef = useRef<
    ((policy: Record<string, any>) => void) | null
  >(null);
  const appHelperRelayStateRef = useRef<AppHelperRelayState>({
    announcement: null,
    paired: null
  });
  const appHelperBridgeRef = useRef<AppHelperBridge | null>(null);
  const appHelperEventsRef = useRef<AppHelperEvents | null>(null);
  const onAppTextEntryRef = useRef<
    ((editing: boolean, sourceWindow: Window) => void) | null
  >(null);

  const guestPrivateDbRef = useRef<GuestPrivateDb | null>(guestStore);
  guestPrivateDbRef.current = guestStore;

  // The frame's viewer key follows the signed-in member (useFrameManager).
  metaRef.current.primary.viewerKey = viewer ? `user:${viewer.id}` : 'guest';

  useHostBridge({
    runtimeOnly: true,
    appLifecycleSource: 'published',
    captureScratch: null,
    previewSrcOverride: null,
    appMcpSessionId: null,
    appHelperRelayStateRef,
    appHelperBridgeRef,
    appHelperEventsRef,
    buildId: info.buildId,
    buildIsPublic: 1,
    isOwner: false,
    userId: viewer?.id || null,
    username: viewer?.username || null,
    ageTier: viewer?.ageTier || 'kid',
    profilePicUrl: viewer?.profilePicUrl || null,
    resolvedCapabilitySnapshot: viewer?.capabilitySnapshot || null,
    resolvedRuntimeExplorationPlan: null,
    audioMuted: false,
    mountContext: null,
    launchTarget: null,
    capabilitySnapshotRef,
    runtimeExplorationPlanRef,
    messageTargetFrameRef,
    navigateHostContentRef,
    navigatePreviewFrameRef,
    previewCodeSignatureRef,
    previewFrameMetaRef: metaRef as any,
    previewFrameReady,
    previewFrameSources,
    previewFrameSourcesRef,
    previewTransitioningRef,
    onPreviewFrameRetiredRef: retiredRef,
    primaryIframeRef,
    secondaryIframeRef,
    setRuntimeObservationState: setRuntimeObservationState as any,
    previewAuth,
    requestRefs: requestRefs as any,
    runtimeUploadsSyncRef,
    onAiUsagePolicyUpdateRef,
    requestBuildImageGenerationConfirmationRef,
    requestBuildMusicGenerationConfirmationRef,
    requestBuildMediaActionConfirmationRef,
    requestBuildCoinConfirmationRef: coinConfirmRef,
    requestBuildAppLinkRef,
    requestCardCraftSelectionRef,
    onBuildLiveSafetyHostSessionsChange: setActiveBuildLiveSafetyHostSessions,
    requestBuildLiveSafetyStopRef,
    onAppTextEntryRef,
    guestPrivateDbRef,
    guestLeaderboardsReadOnly: true
  });

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    // After useHostBridge's own effects: its listener is in place.
    const ready = onReadyRef.current;
    onReadyRef.current = undefined;
    ready?.();
  }, []);

  return <>{hostConfirmationModals}</>;
}
