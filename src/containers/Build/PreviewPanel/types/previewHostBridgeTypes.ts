import type {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction
} from 'react';
import type { BuildCapabilitySnapshot } from '../../types/capabilityTypes';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../../types/runtimeObservationTypes';
import type {
  PreviewFrameMeta,
  PreviewFrameRetiredHandler,
  PreviewLaunchTarget,
  PreviewMountContext,
  PreviewRuntimeUploadsSyncPayload
} from './index';
import type { PreviewHostBridgeAuth } from '../helpers/previewBridgeAuth';
import type {
  AppHelperBridge,
  AppHelperEvents,
  AppHelperRelayState
} from './appHelperTypes';
import type { PreviewHostBridgeRequestRefs } from '../helpers/previewBridgeRequestRefs';
import type {
  BuildRuntimeImageGenerationConfirmationRequest,
  BuildRuntimeMusicGenerationConfirmationRequest
} from '../helpers/buildRuntimeImageGeneration';

export interface PreviewOpenContentConfirmationRequest {
  url: string;
}

export interface BuildMediaActionConfirmationRequest {
  kind:
    | 'photo'
    | 'clip'
    | 'clip-upload'
    | 'live'
    | 'live-watch'
    | 'replay-watch'
    | 'replay-delete';
  audio: boolean;
  saveReplay?: boolean;
}

// Twinkle.cardCraft.craft: the host asks the player to pick/confirm a card.
// Resolves with the confirmed card id, or null when the player cancels.
export interface BuildCardCraftSelectionRequest {
  mode: 'live' | 'preview';
  appTitle: string;
  cardId: number | null;
  acceptedLevels: number[];
}

export interface BuildLiveSafetyHostSession {
  sessionId: string;
  status: string;
  statusConfirmed: boolean;
  hardEndsAt: number | null;
  updatedAt: number;
}

export interface BuildLiveSafetyStopRequest {
  sessionId: string;
}

export interface UsePreviewHostBridgeArgs {
  runtimeOnly: boolean;
  appMcpSessionId: string | null;
  buildId: number;
  buildIsPublic: boolean | number | null | undefined;
  isOwner: boolean;
  userId: number | null;
  username: string | null;
  ageTier: 'kid' | 'teen' | 'adult';
  profilePicUrl: string | null;
  resolvedCapabilitySnapshot: BuildCapabilitySnapshot | null;
  resolvedRuntimeExplorationPlan: BuildRuntimeExplorationPlan | null;
  audioMuted: boolean;
  mountContext: PreviewMountContext | null;
  launchTarget: PreviewLaunchTarget | null;
  capabilitySnapshotRef: RefObject<BuildCapabilitySnapshot | null>;
  runtimeExplorationPlanRef: RefObject<BuildRuntimeExplorationPlan | null>;
  messageTargetFrameRef: RefObject<'primary' | 'secondary'>;
  navigateHostContentRef: RefObject<(url: string) => void>;
  navigatePreviewFrameRef: RefObject<((src: string) => string | null) | null>;
  previewCodeSignatureRef: RefObject<string | null>;
  previewFrameMetaRef: RefObject<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>;
  previewFrameSourcesRef: RefObject<{
    primary: string | null;
    secondary: string | null;
  }>;
  previewFrameSources: {
    primary: string | null;
    secondary: string | null;
  };
  previewFrameReady: {
    primary: boolean;
    secondary: boolean;
  };
  previewTransitioningRef: RefObject<boolean>;
  onPreviewFrameRetiredRef: RefObject<PreviewFrameRetiredHandler | null>;
  primaryIframeRef: RefObject<HTMLIFrameElement | null>;
  secondaryIframeRef: RefObject<HTMLIFrameElement | null>;
  setRuntimeObservationState: Dispatch<
    SetStateAction<BuildRuntimeObservationState>
  >;
  previewAuth: PreviewHostBridgeAuth;
  requestRefs: PreviewHostBridgeRequestRefs;
  runtimeUploadsSyncRef: RefObject<
    ((payload: PreviewRuntimeUploadsSyncPayload | null) => void) | null
  >;
  onAiUsagePolicyUpdateRef: RefObject<
    ((aiUsagePolicy: Record<string, any>) => void) | null
  >;
  requestOpenContentConfirmationRef: RefObject<
    | ((request: PreviewOpenContentConfirmationRequest) => Promise<boolean>)
    | null
  >;
  requestBuildImageGenerationConfirmationRef: RefObject<
    | ((
        request: BuildRuntimeImageGenerationConfirmationRequest
      ) => Promise<boolean>)
    | null
  >;
  requestBuildMusicGenerationConfirmationRef: RefObject<
    | ((
        request: BuildRuntimeMusicGenerationConfirmationRequest
      ) => Promise<boolean>)
    | null
  >;
  requestBuildMediaActionConfirmationRef: RefObject<
    ((request: BuildMediaActionConfirmationRequest) => Promise<boolean>) | null
  >;
  requestCardCraftSelectionRef: RefObject<
    | ((request: BuildCardCraftSelectionRequest) => Promise<number | null>)
    | null
  >;
  onBuildLiveSafetyHostSessionsChange: (
    sessions: BuildLiveSafetyHostSession[]
  ) => void;
  requestBuildLiveSafetyStopRef: RefObject<
    ((request: BuildLiveSafetyStopRequest) => Promise<void>) | null
  >;
  appHelperRelayStateRef: MutableRefObject<AppHelperRelayState>;
  appHelperBridgeRef: MutableRefObject<AppHelperBridge | null>;
  appHelperEventsRef: RefObject<AppHelperEvents | null>;
}
