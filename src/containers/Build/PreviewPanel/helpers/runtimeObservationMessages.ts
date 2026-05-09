import type {
  Dispatch,
  RefObject,
  SetStateAction
} from 'react';
import type {
  BuildRuntimeObservationState
} from '../../types/runtimeObservationTypes';
import type { PreviewFrameMeta } from '../types';
import {
  buildEmptyRuntimeObservationState,
  filterResolvedRuntimeObservationIssues,
  isStaleRuntimePreviewSignature,
  normalizeRuntimeHealthSnapshot,
  normalizeRuntimeObservationIssue
} from './runtimeObservationBridge';

type PreviewBridgeFrameName = 'primary' | 'secondary';

export function handleRuntimeObservationPreviewMessage({
  activeBuildId,
  frameMeta,
  payload,
  previewCodeSignatureRef,
  runtimeOnly,
  setRuntimeObservationState,
  sourceFrame,
  sourceFrameMeta
}: {
  activeBuildId: number;
  frameMeta: Record<PreviewBridgeFrameName, PreviewFrameMeta>;
  payload: any;
  previewCodeSignatureRef: RefObject<string | null>;
  runtimeOnly: boolean;
  setRuntimeObservationState: Dispatch<
    SetStateAction<BuildRuntimeObservationState>
  >;
  sourceFrame: PreviewBridgeFrameName;
  sourceFrameMeta: PreviewFrameMeta;
}) {
  const normalizedIssue = normalizeRuntimeObservationIssue({
    payload,
    previewNonce: sourceFrameMeta.messageNonce || null
  });
  if (!normalizedIssue) return;
  const observationCodeSignature = runtimeOnly
    ? previewCodeSignatureRef.current
    : frameMeta[sourceFrame]?.codeSignature ||
      previewCodeSignatureRef.current;
  if (
    isStaleRuntimePreviewSignature({
      messageCodeSignature: observationCodeSignature,
      currentCodeSignature: previewCodeSignatureRef.current
    })
  ) {
    return;
  }

  setRuntimeObservationState((prev) => {
    const baseState =
      prev.buildId === activeBuildId &&
      prev.codeSignature === observationCodeSignature
        ? prev
        : buildEmptyRuntimeObservationState({
            buildId: activeBuildId,
            codeSignature: observationCodeSignature
          });
    const isDuplicate = baseState.issues.some(
      (issue) =>
        issue.kind === normalizedIssue.kind &&
        issue.message === normalizedIssue.message &&
        issue.filename === normalizedIssue.filename &&
        issue.lineNumber === normalizedIssue.lineNumber &&
        issue.columnNumber === normalizedIssue.columnNumber &&
        issue.previewNonce === normalizedIssue.previewNonce
    );
    const nextUpdatedAt = Math.max(
      baseState.updatedAt,
      normalizedIssue.createdAt
    );
    if (isDuplicate) {
      if (nextUpdatedAt === baseState.updatedAt) {
        return prev;
      }
      return {
        ...baseState,
        updatedAt: nextUpdatedAt
      };
    }
    return {
      ...baseState,
      issues: [...baseState.issues, normalizedIssue].slice(-8),
      updatedAt: nextUpdatedAt
    };
  });
}

export function handlePreviewHealthMessage({
  activeBuildId,
  frameMeta,
  payload,
  previewCodeSignatureRef,
  runtimeOnly,
  setRuntimeObservationState,
  sourceFrame,
  sourceFrameMeta
}: {
  activeBuildId: number;
  frameMeta: Record<PreviewBridgeFrameName, PreviewFrameMeta>;
  payload: any;
  previewCodeSignatureRef: RefObject<string | null>;
  runtimeOnly: boolean;
  setRuntimeObservationState: Dispatch<
    SetStateAction<BuildRuntimeObservationState>
  >;
  sourceFrame: PreviewBridgeFrameName;
  sourceFrameMeta: PreviewFrameMeta;
}) {
  const normalizedHealth = normalizeRuntimeHealthSnapshot(payload);
  if (!normalizedHealth) return;
  const healthCodeSignature = runtimeOnly
    ? previewCodeSignatureRef.current
    : frameMeta[sourceFrame]?.codeSignature ||
      previewCodeSignatureRef.current;
  if (
    isStaleRuntimePreviewSignature({
      messageCodeSignature: healthCodeSignature,
      currentCodeSignature: previewCodeSignatureRef.current
    })
  ) {
    return;
  }

  setRuntimeObservationState((prev) => {
    const baseState =
      prev.buildId === activeBuildId &&
      prev.codeSignature === healthCodeSignature
        ? prev
        : buildEmptyRuntimeObservationState({
            buildId: activeBuildId,
            codeSignature: healthCodeSignature
          });
    const previousHealth = baseState.health;
    const retainedPreviewNonces = [
      frameMeta.primary.messageNonce || '',
      frameMeta.secondary.messageNonce || ''
    ].filter(Boolean);
    const nextIssues = filterResolvedRuntimeObservationIssues({
      issues: baseState.issues,
      health: normalizedHealth,
      sourcePreviewNonce: sourceFrameMeta.messageNonce || null,
      retainedPreviewNonces
    });
    const didResolveIssues = nextIssues !== baseState.issues;
    const isUnchanged =
      previousHealth &&
      previousHealth.booted === normalizedHealth.booted &&
      previousHealth.meaningfulRender ===
        normalizedHealth.meaningfulRender &&
      previousHealth.headingCount === normalizedHealth.headingCount &&
      previousHealth.buttonCount === normalizedHealth.buttonCount &&
      previousHealth.formCount === normalizedHealth.formCount &&
      previousHealth.interactionStatus ===
        normalizedHealth.interactionStatus &&
      previousHealth.interactionTargetLabel ===
        normalizedHealth.interactionTargetLabel &&
      JSON.stringify(previousHealth.interactionSteps || []) ===
        JSON.stringify(normalizedHealth.interactionSteps || []) &&
      previousHealth.visibleTextSample ===
        normalizedHealth.visibleTextSample;
    const nextUpdatedAt = Math.max(
      baseState.updatedAt,
      normalizedHealth.observedAt
    );
    if (isUnchanged) {
      if (!didResolveIssues && nextUpdatedAt === baseState.updatedAt) {
        return prev;
      }
      return {
        ...baseState,
        issues: nextIssues,
        updatedAt: nextUpdatedAt
      };
    }
    return {
      ...baseState,
      issues: nextIssues,
      health: normalizedHealth,
      updatedAt: nextUpdatedAt
    };
  });
}
