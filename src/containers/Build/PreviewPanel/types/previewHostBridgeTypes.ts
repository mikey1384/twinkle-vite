import type { Dispatch, RefObject, SetStateAction } from 'react';
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
import type { PreviewHostBridgeRequestRefs } from '../helpers/previewBridgeRequestRefs';
import type { BuildRuntimeImageGenerationConfirmationRequest } from '../helpers/buildRuntimeImageGeneration';

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
    | 'live-report';
  audio: boolean;
  reason?: string;
}

export type BuildLiveSafetyReportReason =
  | 'privacy'
  | 'harassment'
  | 'explicit-content'
  | 'violence'
  | 'dangerous-activity'
  | 'other';

export interface BuildLiveSafetyViewerGrant {
  sessionId: string;
  viewerGrantId: string;
}

export interface BuildLiveSafetyReportRequest
  extends BuildLiveSafetyViewerGrant {
  reason: BuildLiveSafetyReportReason;
}

export interface UsePreviewHostBridgeArgs {
  runtimeOnly: boolean;
  appMcpSessionId: string | null;
  buildId: number;
  buildIsPublic: boolean | number | null | undefined;
  isOwner: boolean;
  userId: number | null;
  username: string | null;
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
  requestBuildMediaActionConfirmationRef: RefObject<
    | ((request: BuildMediaActionConfirmationRequest) => Promise<boolean>)
    | null
  >;
  onBuildLiveSafetyViewerGrantsChange: (
    grants: BuildLiveSafetyViewerGrant[]
  ) => void;
  requestBuildLiveSafetyReportRef: RefObject<
    | ((request: BuildLiveSafetyReportRequest) => Promise<void>)
    | null
  >;
}
