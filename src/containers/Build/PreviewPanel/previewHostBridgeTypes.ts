import type {
  Dispatch,
  RefObject,
  SetStateAction
} from 'react';
import type { BuildCapabilitySnapshot } from '../capabilityTypes';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../runtimeObservationTypes';
import type {
  PreviewFrameMeta,
  PreviewMountContext,
  PreviewRuntimeUploadsSyncPayload
} from './types';
import type { PreviewHostBridgeAuth } from './previewBridgeAuth';
import type {
  PreviewHostBridgeRequestRefs
} from './previewBridgeRequestRefs';

export interface UsePreviewHostBridgeArgs {
  runtimeOnly: boolean;
  buildId: number;
  buildIsPublic: boolean | number | null | undefined;
  isOwner: boolean;
  userId: number | null;
  username: string | null;
  profilePicUrl: string | null;
  resolvedCapabilitySnapshot: BuildCapabilitySnapshot | null;
  resolvedRuntimeExplorationPlan: BuildRuntimeExplorationPlan | null;
  mountContext: PreviewMountContext | null;
  capabilitySnapshotRef: RefObject<BuildCapabilitySnapshot | null>;
  runtimeExplorationPlanRef: RefObject<BuildRuntimeExplorationPlan | null>;
  messageTargetFrameRef: RefObject<'primary' | 'secondary'>;
  previewCodeSignatureRef: RefObject<string | null>;
  previewFrameMetaRef: RefObject<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>;
  previewFrameSourcesRef: RefObject<{
    primary: string | null;
    secondary: string | null;
  }>;
  previewTransitioningRef: RefObject<boolean>;
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
}
