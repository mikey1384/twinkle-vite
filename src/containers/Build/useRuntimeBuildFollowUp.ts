import { useEffect, useRef, useState } from 'react';
import { socket } from '~/constants/sockets/api';
import type { BuildRuntimeVerifyResult } from '~/contexts/Build/reducer';
import type {
  BuildRuntimeObservationIssue,
  BuildRuntimeObservationState
} from './runtimeObservationTypes';

type BuildRunMode = 'user' | 'greeting' | 'runtime-autofix';

interface RuntimeObservationChatNote {
  id: number;
  role: 'assistant';
  content: string;
  codeGenerated: null;
  streamCodePreview: null;
  billingState: null;
  artifactVersionId?: null;
  createdAt: number;
  persisted: false;
  source: 'runtime_observation';
}

interface PendingRuntimeVerification {
  armedAt: number;
  beforeObservation: BuildRuntimeObservationState;
  remainingRepairs: number;
  allowSameCodeSignature: boolean;
  requestId: string | null;
  sourceRunRequestId: string | null;
  afterObservation: BuildRuntimeObservationState | null;
}

interface PendingRuntimeAutoFix {
  armedAt: number;
  sourceRequestId: string | null;
  sourceArtifactVersionId: number | null;
  sourceRunMode: BuildRunMode;
}

interface RuntimeAutoFixContext {
  beforeObservation: BuildRuntimeObservationState;
  remainingRepairsAfterVerification: number;
}

interface RuntimeAutoFixStartOptions {
  remainingRepairsAfterVerification?: number;
  trigger?: 'initial' | 'verification';
  sourceRequestId?: string | null;
  sourceArtifactVersionId?: number | null;
}

interface AppendLocalRunEventOptions {
  kind: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
  phase: string | null;
  message: string;
  targetRequestId?: string | null;
}

interface UseRuntimeBuildFollowUpOptions {
  buildId: number;
  isOwner: boolean;
  runtimeAutoFixEnabled?: boolean;
  runtimeAutoFixWindowMs?: number;
  runtimePostFixVerificationWindowMs?: number;
  sharedRuntimeVerifyResults: Record<
    string,
    BuildRuntimeVerifyResult | null | undefined
  >;
  claimRuntimeVerifyResult: (result: BuildRuntimeVerifyResult) => boolean;
  onClearBuildRuntimeVerifyResult: (args: {
    buildId: number;
    requestId: string;
  }) => void;
  onAppendLocalRunEvent: (event: AppendLocalRunEventOptions) => void;
  onScrollChatToBottom: (behavior?: ScrollBehavior) => void;
  onMaybeStartNextQueuedRequest: () => void | Promise<void>;
  onStartRuntimeAutoFix: (
    observationState: BuildRuntimeObservationState,
    options?: RuntimeAutoFixStartOptions
  ) => void | Promise<boolean>;
  isRunActivityInFlight: (options?: { includeBootstrap?: boolean }) => boolean;
}

function getBuildRuntimeVerifyResultLookupKeys(
  buildId: number,
  requestId: string
) {
  const normalizedRequestId = String(requestId || '').trim();
  if (!normalizedRequestId) return [];
  const normalizedBuildId = Number(buildId || 0);
  const keys: string[] = [];
  if (normalizedBuildId > 0) {
    keys.push(`${normalizedBuildId}:${normalizedRequestId}`);
  }
  keys.push(`0:${normalizedRequestId}`);
  return keys;
}

function formatRuntimeObservationIssueKindLabel(
  kind: BuildRuntimeObservationIssue['kind']
) {
  switch (kind) {
    case 'consoleerror':
      return 'Console message';
    case 'unhandledrejection':
      return 'Unhandled rejection';
    case 'blankrender':
      return 'Blank render';
    case 'formsubmitblocked':
      return 'Sandbox-blocked form submit';
    case 'sdkblocked':
      return 'Blocked capability call';
    case 'interactionnoop':
      return 'No-op interaction';
    case 'keyboardscroll':
      return 'Keyboard scroll leak';
    case 'playfieldmismatch':
      return 'Gameplay escaped playfield';
    case 'error':
    default:
      return 'Runtime error';
  }
}

function shouldSurfaceRuntimeObservationIssueInChat(
  issue: BuildRuntimeObservationIssue
) {
  switch (issue.kind) {
    case 'consoleerror':
    case 'error':
    case 'unhandledrejection':
    case 'formsubmitblocked':
    case 'sdkblocked':
      return true;
    case 'blankrender':
    case 'interactionnoop':
    case 'keyboardscroll':
    case 'playfieldmismatch':
    default:
      return false;
  }
}

function formatRuntimeObservationIssueLocationText(
  issue: BuildRuntimeObservationIssue
) {
  const locationParts = [
    issue.filename || null,
    issue.lineNumber != null ? `line ${issue.lineNumber}` : null,
    issue.columnNumber != null ? `col ${issue.columnNumber}` : null
  ].filter(Boolean);
  return locationParts.length > 0 ? ` (${locationParts.join(', ')})` : '';
}

function formatRuntimeObservationChatNote(issue: BuildRuntimeObservationIssue) {
  const kindLabel = formatRuntimeObservationIssueKindLabel(issue.kind);
  const locationText = formatRuntimeObservationIssueLocationText(issue);
  const stackLine = String(issue.stack || '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  return [
    'Preview issue detected.',
    `${kindLabel}: ${issue.message}${locationText}`,
    stackLine ? `Stack: ${stackLine.slice(0, 260)}` : null
  ]
    .filter(Boolean)
    .join('\n');
}

function buildRuntimeObservationIssueChatKey({
  buildId,
  codeSignature,
  issue
}: {
  buildId: number;
  codeSignature: string | null;
  issue: BuildRuntimeObservationIssue;
}) {
  return [
    buildId,
    codeSignature || '',
    issue.kind,
    issue.message,
    issue.filename || '',
    issue.lineNumber || 0,
    issue.columnNumber || 0
  ].join('|');
}

function formatRuntimeObservationSummary(
  observationState: BuildRuntimeObservationState | null
) {
  if (
    !observationState ||
    (observationState.issues.length === 0 && !observationState.health)
  ) {
    return '';
  }
  const issuesText = observationState.issues
    .slice(-5)
    .map((issue, index) => {
      const locationText = formatRuntimeObservationIssueLocationText(issue);
      const stackLine = String(issue.stack || '')
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean);
      return [
        `${index + 1}. ${formatRuntimeObservationIssueKindLabel(issue.kind)}: ${issue.message}${locationText}`,
        stackLine ? `   stack: ${stackLine.slice(0, 260)}` : null
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  const health = observationState.health;
  const interactionText =
    health?.interactionStatus === 'changed'
      ? `changed the UI after clicking ${
          health.interactionTargetLabel
            ? `"${health.interactionTargetLabel}"`
            : 'a control'
        }`
      : health?.interactionStatus === 'unchanged'
        ? `clicked ${
            health.interactionTargetLabel
              ? `"${health.interactionTargetLabel}"`
              : 'a control'
          }, but nothing visibly changed`
        : health?.interactionStatus === 'skipped'
          ? 'skipped because no safe startup control was found'
          : null;
  const interactionStepLines = (health?.interactionSteps || [])
    .slice(-2)
    .map((step, index) => {
      const prefix =
        step.source === 'planned'
          ? `${index + 1}. planned ${step.actionKind || 'step'}`
          : `${index + 1}. clicked`;
      const parts = [
        prefix +
          ' ' +
          (step.targetLabel ? `"${step.targetLabel}"` : 'a control'),
        step.goal ? `goal: ${step.goal}` : null,
        step.expectedSignals?.routeChange === true
          ? 'expected: route should change'
          : step.expectedSignals?.routeChange === false
            ? 'expected: stay on same route'
            : null,
        step.expectedSignals && step.expectedSignals.textIncludes.length > 0
          ? `expected text: ${step.expectedSignals.textIncludes
              .map((text) => `"${text}"`)
              .join(', ')}`
          : null,
        step.expectedSignals && step.expectedSignals.revealsLabels.length > 0
          ? `expected controls: ${step.expectedSignals.revealsLabels
              .map((label) => `"${label}"`)
              .join(', ')}`
          : null,
        step.routeChanged && step.routeAfter
          ? `route -> ${step.routeAfter}`
          : null,
        step.hashChanged && step.hashAfter ? `hash -> ${step.hashAfter}` : null,
        step.headingDelta !== 0 ||
        step.buttonDelta !== 0 ||
        step.formDelta !== 0
          ? `headings/buttons/forms delta: ${step.headingDelta >= 0 ? '+' : ''}${step.headingDelta}/${step.buttonDelta >= 0 ? '+' : ''}${step.buttonDelta}/${step.formDelta >= 0 ? '+' : ''}${step.formDelta}`
          : null,
        step.revealedTargetLabels.length > 0
          ? `revealed: ${step.revealedTargetLabels
              .map((label) => `"${label}"`)
              .join(', ')}`
          : null
      ].filter(Boolean);
      const textDelta =
        step.visibleTextBefore !== step.visibleTextAfter &&
        (step.visibleTextBefore || step.visibleTextAfter)
          ? `   text: ${
              step.visibleTextBefore ? `"${step.visibleTextBefore}"` : '[none]'
            } -> ${
              step.visibleTextAfter ? `"${step.visibleTextAfter}"` : '[none]'
            }`
          : null;
      return [parts.join('; '), textDelta].filter(Boolean).join('\n');
    });
  const healthLines = health
    ? [
        'Preview health:',
        `- booted: ${health.booted ? 'yes' : 'no'}`,
        `- meaningful UI: ${health.meaningfulRender ? 'yes' : 'no'}`,
        health.gameLike ? '- game-like preview: yes' : null,
        `- headings/buttons/forms: ${health.headingCount}/${health.buttonCount}/${health.formCount}`,
        health.viewportOverflowY > 0 || health.viewportOverflowX > 0
          ? `- viewport overflow (y/x): ${health.viewportOverflowY}px / ${health.viewportOverflowX}px`
          : null,
        health.gameplayTelemetry
          ? `- gameplay telemetry: ${health.gameplayTelemetry.status}`
          : null,
        health.gameplayTelemetry &&
        (health.gameplayTelemetry.overflowTop > 0 ||
          health.gameplayTelemetry.overflowRight > 0 ||
          health.gameplayTelemetry.overflowBottom > 0 ||
          health.gameplayTelemetry.overflowLeft > 0)
          ? `- gameplay overflow (top/right/bottom/left): ${health.gameplayTelemetry.overflowTop}px / ${health.gameplayTelemetry.overflowRight}px / ${health.gameplayTelemetry.overflowBottom}px / ${health.gameplayTelemetry.overflowLeft}px`
          : null,
        interactionText ? `- interaction probe: ${interactionText}` : null,
        interactionStepLines.length > 0
          ? `- interaction steps:\n${interactionStepLines
              .map((line) => `  ${line.replace(/\n/g, '\n  ')}`)
              .join('\n')}`
          : null,
        health.visibleTextSample
          ? `- visible text: ${health.visibleTextSample}`
          : null
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  if (!issuesText) {
    return healthLines;
  }
  return [healthLines, issuesText].filter(Boolean).join('\n\n');
}

function cloneRuntimeObservationState(
  observationState: BuildRuntimeObservationState
): BuildRuntimeObservationState {
  return {
    ...observationState,
    issues: observationState.issues.map((issue) => ({ ...issue })),
    health: observationState.health
      ? {
          ...observationState.health,
          gameplayTelemetry: observationState.health.gameplayTelemetry
            ? {
                ...observationState.health.gameplayTelemetry,
                playfieldBounds: observationState.health.gameplayTelemetry
                  .playfieldBounds
                  ? {
                      ...observationState.health.gameplayTelemetry
                        .playfieldBounds
                    }
                  : null,
                playerBounds: observationState.health.gameplayTelemetry
                  .playerBounds
                  ? {
                      ...observationState.health.gameplayTelemetry.playerBounds
                    }
                  : null
              }
            : null,
          interactionSteps: observationState.health.interactionSteps.map(
            (step) => ({
              ...step,
              revealedTargetLabels: [...step.revealedTargetLabels]
            })
          )
        }
      : null
  };
}

export default function useRuntimeBuildFollowUp({
  buildId,
  isOwner,
  runtimeAutoFixEnabled = false,
  runtimeAutoFixWindowMs = 12000,
  runtimePostFixVerificationWindowMs = 18000,
  sharedRuntimeVerifyResults,
  claimRuntimeVerifyResult,
  onClearBuildRuntimeVerifyResult,
  onAppendLocalRunEvent,
  onScrollChatToBottom,
  onMaybeStartNextQueuedRequest,
  onStartRuntimeAutoFix,
  isRunActivityInFlight
}: UseRuntimeBuildFollowUpOptions) {
  const [runtimeObservationState, setRuntimeObservationState] =
    useState<BuildRuntimeObservationState | null>(null);
  const [runtimeObservationChatNotes, setRuntimeObservationChatNotes] =
    useState<RuntimeObservationChatNote[]>([]);
  const [runtimeFollowUpRevision, setRuntimeFollowUpRevision] = useState(0);
  const runtimeObservationStateRef =
    useRef<BuildRuntimeObservationState | null>(null);
  const runtimeObservationChatNoteKeysRef = useRef<Set<string>>(new Set());
  const lastRuntimeHealthEventKeyRef = useRef('');
  const pendingRuntimeAutoFixRef = useRef<PendingRuntimeAutoFix | null>(null);
  const pendingRuntimeVerificationRef =
    useRef<PendingRuntimeVerification | null>(null);
  const activeRuntimeAutoFixContextRef = useRef<RuntimeAutoFixContext | null>(
    null
  );
  const runtimeAutoFixAttemptedSignaturesRef = useRef<Set<string>>(new Set());
  const externalRef = useRef({
    buildId,
    isOwner,
    runtimeAutoFixEnabled,
    runtimeAutoFixWindowMs,
    runtimePostFixVerificationWindowMs,
    claimRuntimeVerifyResult,
    onClearBuildRuntimeVerifyResult,
    onAppendLocalRunEvent,
    onScrollChatToBottom,
    onMaybeStartNextQueuedRequest,
    onStartRuntimeAutoFix,
    isRunActivityInFlight
  });

  externalRef.current = {
    buildId,
    isOwner,
    runtimeAutoFixEnabled,
    runtimeAutoFixWindowMs,
    runtimePostFixVerificationWindowMs,
    claimRuntimeVerifyResult,
    onClearBuildRuntimeVerifyResult,
    onAppendLocalRunEvent,
    onScrollChatToBottom,
    onMaybeStartNextQueuedRequest,
    onStartRuntimeAutoFix,
    isRunActivityInFlight
  };

  function bumpRuntimeFollowUpRevision() {
    setRuntimeFollowUpRevision((current) => current + 1);
  }

  function setRuntimeObservationStateValue(
    nextState: BuildRuntimeObservationState | null
  ) {
    runtimeObservationStateRef.current = nextState;
    setRuntimeObservationState(nextState);
  }

  function queueNextRequest() {
    void Promise.resolve().then(() =>
      externalRef.current.onMaybeStartNextQueuedRequest()
    );
  }

  function reset() {
    setRuntimeObservationStateValue(null);
    setRuntimeObservationChatNotes([]);
    runtimeObservationChatNoteKeysRef.current = new Set();
    lastRuntimeHealthEventKeyRef.current = '';
    pendingRuntimeAutoFixRef.current = null;
    pendingRuntimeVerificationRef.current = null;
    activeRuntimeAutoFixContextRef.current = null;
    runtimeAutoFixAttemptedSignaturesRef.current = new Set();
  }

  function getCurrentRuntimeObservationSummary(
    observationState?: BuildRuntimeObservationState | null
  ) {
    return formatRuntimeObservationSummary(
      observationState ?? runtimeObservationStateRef.current
    );
  }

  function hasPendingRuntimeFollowUp() {
    return Boolean(
      pendingRuntimeAutoFixRef.current || pendingRuntimeVerificationRef.current
    );
  }

  function shouldHoldTerminalSharedBuildRun(
    requestId: string | null | undefined
  ) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return false;
    return (
      normalizedRequestId ===
        String(pendingRuntimeAutoFixRef.current?.sourceRequestId || '').trim() ||
      normalizedRequestId ===
        String(
          pendingRuntimeVerificationRef.current?.sourceRunRequestId || ''
        ).trim()
    );
  }

  function armRuntimeAutoFix({
    sourceRequestId = null,
    sourceArtifactVersionId = null,
    sourceRunMode = 'user'
  }: {
    sourceRequestId?: string | null;
    sourceArtifactVersionId?: number | null;
    sourceRunMode?: BuildRunMode;
  } = {}) {
    pendingRuntimeAutoFixRef.current = {
      armedAt: Date.now(),
      sourceRequestId,
      sourceArtifactVersionId,
      sourceRunMode
    };
    bumpRuntimeFollowUpRevision();
  }

  function disarmRuntimeAutoFix() {
    pendingRuntimeAutoFixRef.current = null;
    bumpRuntimeFollowUpRevision();
  }

  function armRuntimeVerification({
    beforeObservation,
    remainingRepairs,
    allowSameCodeSignature = false,
    sourceRunRequestId = null
  }: {
    beforeObservation: BuildRuntimeObservationState;
    remainingRepairs: number;
    allowSameCodeSignature?: boolean;
    sourceRunRequestId?: string | null;
  }) {
    pendingRuntimeVerificationRef.current = {
      armedAt: Date.now(),
      beforeObservation: cloneRuntimeObservationState(beforeObservation),
      remainingRepairs: Math.max(0, remainingRepairs),
      allowSameCodeSignature,
      requestId: null,
      sourceRunRequestId,
      afterObservation: null
    };
    bumpRuntimeFollowUpRevision();
  }

  function clearRuntimeVerification() {
    pendingRuntimeVerificationRef.current = null;
    activeRuntimeAutoFixContextRef.current = null;
    bumpRuntimeFollowUpRevision();
  }

  function resetRuntimeHealthFollowUpState() {
    disarmRuntimeAutoFix();
    clearRuntimeVerification();
  }

  function prepareRuntimeAutoFixRun(
    observationState: BuildRuntimeObservationState,
    options?: {
      remainingRepairsAfterVerification?: number;
    }
  ) {
    pendingRuntimeAutoFixRef.current = null;
    pendingRuntimeVerificationRef.current = null;
    activeRuntimeAutoFixContextRef.current = {
      beforeObservation: cloneRuntimeObservationState(observationState),
      remainingRepairsAfterVerification: Math.max(
        0,
        options?.remainingRepairsAfterVerification ?? 1
      )
    };
    bumpRuntimeFollowUpRevision();
  }

  function removeRuntimeObservationChatNote(messageId: number) {
    setRuntimeObservationChatNotes((prev) =>
      prev.filter((entry) => entry.id !== messageId)
    );
  }

  function handleCompletedRunFollowUp({
    completedRunMode,
    requestId,
    artifactVersionId,
    generatedCodeSuccessfully,
    pausedForToolLimit,
    planWasRefined
  }: {
    completedRunMode: BuildRunMode;
    requestId?: string | null;
    artifactVersionId?: number | null;
    generatedCodeSuccessfully: boolean;
    pausedForToolLimit: boolean;
    planWasRefined: boolean;
  }) {
    let shouldDelayQueuedRequestsForRuntimeFollowUp = false;
    if (
      generatedCodeSuccessfully &&
      completedRunMode === 'user' &&
      !pausedForToolLimit
    ) {
      armRuntimeAutoFix({
        sourceRequestId: requestId || null,
        sourceArtifactVersionId: artifactVersionId || null,
        sourceRunMode: completedRunMode
      });
      clearRuntimeVerification();
      externalRef.current.onAppendLocalRunEvent({
        kind: 'status',
        phase: 'completed',
        message: 'Checking the updated preview for runtime issues...'
      });
      shouldDelayQueuedRequestsForRuntimeFollowUp = true;
    } else if (completedRunMode === 'runtime-autofix') {
      const runtimeAutoFixContext = activeRuntimeAutoFixContextRef.current;
      if (runtimeAutoFixContext) {
        if (generatedCodeSuccessfully) {
          armRuntimeVerification({
            beforeObservation: runtimeAutoFixContext.beforeObservation,
            remainingRepairs:
              runtimeAutoFixContext.remainingRepairsAfterVerification,
            sourceRunRequestId: requestId || null
          });
          externalRef.current.onAppendLocalRunEvent({
            kind: 'status',
            phase: 'completed',
            message: 'Re-checking the repaired preview...'
          });
          shouldDelayQueuedRequestsForRuntimeFollowUp = true;
        } else if (planWasRefined) {
          armRuntimeVerification({
            beforeObservation: runtimeAutoFixContext.beforeObservation,
            remainingRepairs:
              runtimeAutoFixContext.remainingRepairsAfterVerification,
            allowSameCodeSignature: true,
            sourceRunRequestId: requestId || null
          });
          externalRef.current.onAppendLocalRunEvent({
            kind: 'action',
            phase: 'preview',
            message:
              'Lumine updated the plan and is checking the preview again before changing code.'
          });
          shouldDelayQueuedRequestsForRuntimeFollowUp = true;
        } else {
          clearRuntimeVerification();
        }
      } else {
        clearRuntimeVerification();
      }
      disarmRuntimeAutoFix();
    } else {
      resetRuntimeHealthFollowUpState();
    }

    return shouldDelayQueuedRequestsForRuntimeFollowUp;
  }

  function handleRuntimeObservationChange(
    nextState: BuildRuntimeObservationState
  ) {
    if (runtimeObservationStateRef.current === nextState) {
      return;
    }
    const previousState = runtimeObservationStateRef.current;
    const previousIssueKeys = new Set(
      (previousState?.issues || []).map((issue) =>
        buildRuntimeObservationIssueChatKey({
          buildId: previousState?.buildId || nextState.buildId,
          codeSignature: previousState?.codeSignature || null,
          issue
        })
      )
    );
    const nextChatNotes: RuntimeObservationChatNote[] = [];
    for (const issue of nextState.issues) {
      if (!shouldSurfaceRuntimeObservationIssueInChat(issue)) {
        continue;
      }
      const issueKey = buildRuntimeObservationIssueChatKey({
        buildId: nextState.buildId,
        codeSignature: nextState.codeSignature || null,
        issue
      });
      if (
        previousIssueKeys.has(issueKey) ||
        runtimeObservationChatNoteKeysRef.current.has(issueKey)
      ) {
        continue;
      }
      runtimeObservationChatNoteKeysRef.current.add(issueKey);
      nextChatNotes.push({
        id: -(Date.now() + Math.floor(Math.random() * 1000)),
        role: 'assistant',
        content: formatRuntimeObservationChatNote(issue),
        codeGenerated: null,
        billingState: null,
        streamCodePreview: null,
        createdAt: Math.max(
          1,
          Math.floor(Number(issue.createdAt || Date.now()) / 1000)
        ),
        persisted: false,
        source: 'runtime_observation'
      });
    }
    if (externalRef.current.isOwner && nextChatNotes.length > 0) {
      setRuntimeObservationChatNotes((prev) =>
        [...prev, ...nextChatNotes].slice(-12)
      );
      externalRef.current.onScrollChatToBottom('smooth');
    }
    const health = nextState.health;
    if (health) {
      const healthEventKey = [
        nextState.buildId,
        nextState.codeSignature || '',
        health.booted ? '1' : '0',
        health.meaningfulRender ? '1' : '0',
        health.gameLike ? '1' : '0',
        health.headingCount,
        health.buttonCount,
        health.formCount,
        health.viewportOverflowY,
        health.viewportOverflowX,
        health.gameplayTelemetry?.status || '',
        health.gameplayTelemetry?.overflowTop || 0,
        health.gameplayTelemetry?.overflowRight || 0,
        health.gameplayTelemetry?.overflowBottom || 0,
        health.gameplayTelemetry?.overflowLeft || 0,
        health.interactionStatus,
        health.interactionTargetLabel || '',
        JSON.stringify(health.interactionSteps || []),
        health.visibleTextSample || ''
      ].join('|');
      if (lastRuntimeHealthEventKeyRef.current !== healthEventKey) {
        lastRuntimeHealthEventKeyRef.current = healthEventKey;
        const interactionTargetText = health.interactionTargetLabel
          ? `"${health.interactionTargetLabel}"`
          : 'a control';
        const interactionStepCount = (health.interactionSteps || []).length;
        const latestInteractionStep =
          interactionStepCount > 0
            ? health.interactionSteps[interactionStepCount - 1]
            : null;
        const previewHealthMessage =
          health.gameLike &&
          (health.viewportOverflowY > 48 || health.viewportOverflowX > 24)
            ? 'The preview opened, but the game is spilling outside the screen.'
            : health.gameplayTelemetry?.status === 'out-of-bounds'
              ? 'The preview opened, but the game is letting the player move outside the play area.'
              : interactionStepCount >= 2 &&
                  health.interactionStatus === 'changed' &&
                  latestInteractionStep?.source === 'planned'
                ? `Lumine tried ${interactionStepCount} steps in the preview and the app changed.`
                : interactionStepCount >= 2 &&
                    health.interactionStatus === 'changed'
                  ? `Lumine tried ${interactionStepCount} startup steps in the preview and the app changed.`
                  : health.interactionStatus === 'changed'
                    ? latestInteractionStep?.source === 'planned'
                      ? latestInteractionStep?.routeChanged &&
                        latestInteractionStep.routeAfter
                        ? `Lumine clicked ${interactionTargetText} and the app moved to ${latestInteractionStep.routeAfter}.`
                        : `Lumine clicked ${interactionTargetText} and the app moved forward.`
                      : latestInteractionStep?.routeChanged &&
                          latestInteractionStep.routeAfter
                        ? `Lumine clicked ${interactionTargetText} and the app moved to ${latestInteractionStep.routeAfter}.`
                        : `Lumine clicked ${interactionTargetText} and the screen changed.`
                    : health.interactionStatus === 'unchanged'
                      ? latestInteractionStep?.source === 'planned'
                        ? `Lumine clicked ${interactionTargetText}, but the app did not move forward.`
                        : `Lumine clicked ${interactionTargetText}, but the screen did not change.`
                      : health.meaningfulRender
                        ? 'The preview opened and looks ready.'
                        : 'The preview opened, but it still looks empty.';
        if (
          previewHealthMessage !==
            'The preview opened and looks ready.' &&
          previewHealthMessage !==
            'The preview opened, but it still looks empty.'
        ) {
          externalRef.current.onAppendLocalRunEvent({
            kind:
              health.interactionStatus === 'changed' || health.meaningfulRender
                ? 'action'
                : 'status',
            phase: 'preview',
            message: previewHealthMessage
          });
        }
      }
    }
    setRuntimeObservationStateValue(nextState);
  }

  function handleRuntimeVerifyCompleteResult({
    improved,
    reason,
    shouldRepairAgain,
    nextRemainingRepairs
  }: Pick<
    BuildRuntimeVerifyResult,
    'improved' | 'reason' | 'shouldRepairAgain' | 'nextRemainingRepairs'
  >) {
    const pendingVerification = pendingRuntimeVerificationRef.current;
    if (!pendingVerification) {
      return;
    }
    const afterObservation = pendingVerification.afterObservation;
    const sourceRunRequestId = pendingVerification.sourceRunRequestId;
    clearRuntimeVerification();
    if (improved && reason) {
      externalRef.current.onAppendLocalRunEvent({
        kind: 'action',
        phase: 'preview',
        message: `Lumine checked the preview again and it looks better: ${reason}.`,
        targetRequestId: sourceRunRequestId
      });
    }
    if (shouldRepairAgain && afterObservation) {
      externalRef.current.onAppendLocalRunEvent({
        kind: 'status',
        phase: 'preview',
        message: `Lumine checked the preview again, but it still needs work: ${reason || 'the preview did not get better'}. Trying one more fix.`,
        targetRequestId: sourceRunRequestId
      });
      void externalRef.current.onStartRuntimeAutoFix(afterObservation, {
        remainingRepairsAfterVerification: Math.max(
          0,
          Number(nextRemainingRepairs || 0)
        ),
        trigger: 'verification'
      });
      return;
    }
    if (!improved && reason) {
      externalRef.current.onAppendLocalRunEvent({
        kind: 'status',
        phase: 'preview',
        message: `Lumine checked the preview again, but it still does not look better: ${reason}.`,
        targetRequestId: sourceRunRequestId
      });
    }
    queueNextRequest();
  }

  function handleRuntimeVerifyErrorResult({
    error
  }: Pick<BuildRuntimeVerifyResult, 'error'>) {
    const sourceRunRequestId =
      pendingRuntimeVerificationRef.current?.sourceRunRequestId || null;
    if (!pendingRuntimeVerificationRef.current) {
      return;
    }
    clearRuntimeVerification();
    externalRef.current.onAppendLocalRunEvent({
      kind: 'status',
      phase: 'preview',
      message: error || 'Runtime verification failed.',
      targetRequestId: sourceRunRequestId
    });
    queueNextRequest();
  }

  function maybeProcessPendingRuntimeAutoFix(
    observationState = runtimeObservationStateRef.current
  ) {
    const {
      buildId: currentBuildId,
      isOwner: currentIsOwner,
      runtimeAutoFixEnabled: currentRuntimeAutoFixEnabled,
      runtimeAutoFixWindowMs: currentRuntimeAutoFixWindowMs,
      isRunActivityInFlight: currentIsRunActivityInFlight,
      onAppendLocalRunEvent: currentAppendLocalRunEvent,
      onStartRuntimeAutoFix: currentStartRuntimeAutoFix
    } = externalRef.current;
    const pendingAutoFix = pendingRuntimeAutoFixRef.current;
    if (!observationState || !pendingAutoFix || !currentIsOwner) return false;
    if (currentIsRunActivityInFlight({ includeBootstrap: true })) {
      return false;
    }
    if (Date.now() - pendingAutoFix.armedAt > currentRuntimeAutoFixWindowMs) {
      const sourceRunRequestId = pendingAutoFix.sourceRequestId || null;
      disarmRuntimeAutoFix();
      currentAppendLocalRunEvent({
        kind: 'status',
        phase: 'preview',
        message: 'Timed out while checking the updated preview.',
        targetRequestId: sourceRunRequestId
      });
      queueNextRequest();
      return true;
    }
    if (!observationState.codeSignature) {
      return false;
    }
    if (observationState.updatedAt < pendingAutoFix.armedAt) {
      return false;
    }
    const signatureKey = `${currentBuildId}:${observationState.codeSignature}`;
    if (runtimeAutoFixAttemptedSignaturesRef.current.has(signatureKey)) {
      disarmRuntimeAutoFix();
      queueNextRequest();
      return true;
    }
    runtimeAutoFixAttemptedSignaturesRef.current.add(signatureKey);
    disarmRuntimeAutoFix();
    if (
      currentRuntimeAutoFixEnabled &&
      (observationState.issues.some((issue) => issue.kind !== 'consoleerror') ||
        !observationState.health?.meaningfulRender ||
        observationState.health?.gameplayTelemetry?.status ===
          'out-of-bounds' ||
        (observationState.health?.gameLike &&
          ((observationState.health?.viewportOverflowY || 0) > 48 ||
            (observationState.health?.viewportOverflowX || 0) > 24)))
    ) {
      void currentStartRuntimeAutoFix(observationState, {
        sourceRequestId: pendingAutoFix.sourceRequestId,
        sourceArtifactVersionId: pendingAutoFix.sourceArtifactVersionId
      });
      return true;
    }
    queueNextRequest();
    return true;
  }

  function maybeProcessPendingRuntimeVerification(
    observationState = runtimeObservationStateRef.current
  ) {
    const {
      buildId: currentBuildId,
      isOwner: currentIsOwner,
      runtimePostFixVerificationWindowMs:
        currentRuntimePostFixVerificationWindowMs,
      isRunActivityInFlight: currentIsRunActivityInFlight,
      onAppendLocalRunEvent: currentAppendLocalRunEvent
    } = externalRef.current;
    const pendingVerification = pendingRuntimeVerificationRef.current;
    if (!observationState || !pendingVerification || !currentIsOwner) {
      return false;
    }
    if (currentIsRunActivityInFlight({ includeBootstrap: true })) {
      return false;
    }
    if (
      Date.now() - pendingVerification.armedAt >
      currentRuntimePostFixVerificationWindowMs
    ) {
      const sourceRunRequestId = pendingVerification.sourceRunRequestId;
      clearRuntimeVerification();
      currentAppendLocalRunEvent({
        kind: 'status',
        phase: 'preview',
        message:
          'Timed out while re-checking the repaired preview. Continuing without another automatic repair.',
        targetRequestId: sourceRunRequestId
      });
      queueNextRequest();
      return true;
    }
    if (
      !observationState.codeSignature ||
      observationState.updatedAt < pendingVerification.armedAt ||
      (!pendingVerification.allowSameCodeSignature &&
        observationState.codeSignature ===
          pendingVerification.beforeObservation.codeSignature)
    ) {
      return false;
    }
    if (pendingVerification.requestId) {
      return false;
    }
    const verificationRequestId = `${currentBuildId}-runtime-verify-${Date.now()}`;
    pendingRuntimeVerificationRef.current = {
      ...pendingVerification,
      requestId: verificationRequestId,
      afterObservation: cloneRuntimeObservationState(observationState)
    };
    socket.emit('build_runtime_verify', {
      buildId: currentBuildId,
      requestId: verificationRequestId,
      beforeObservation: pendingVerification.beforeObservation,
      afterObservation: observationState,
      remainingRepairs: pendingVerification.remainingRepairs
    });
    return true;
  }

  function processPendingRuntimeFollowUp() {
    return (
      maybeProcessPendingRuntimeAutoFix() ||
      maybeProcessPendingRuntimeVerification()
    );
  }

  useEffect(() => {
    const pendingVerification = pendingRuntimeVerificationRef.current;
    const pendingRequestId = String(pendingVerification?.requestId || '').trim();
    if (!pendingVerification || !pendingRequestId) {
      return;
    }
    const matchedRuntimeVerifyResult = getBuildRuntimeVerifyResultLookupKeys(
      buildId,
      pendingRequestId
    )
      .map((key) => sharedRuntimeVerifyResults[key] || null)
      .find(
        (runtimeVerifyResult): runtimeVerifyResult is BuildRuntimeVerifyResult =>
          Boolean(runtimeVerifyResult)
      );
    if (!matchedRuntimeVerifyResult) {
      return;
    }
    const matchedRuntimeVerifyBuildId = matchedRuntimeVerifyResult.buildId ?? 0;
    if (!externalRef.current.claimRuntimeVerifyResult(matchedRuntimeVerifyResult)) {
      externalRef.current.onClearBuildRuntimeVerifyResult({
        buildId: matchedRuntimeVerifyBuildId,
        requestId: matchedRuntimeVerifyResult.requestId
      });
      return;
    }
    externalRef.current.onClearBuildRuntimeVerifyResult({
      buildId: matchedRuntimeVerifyBuildId,
      requestId: matchedRuntimeVerifyResult.requestId
    });
    if (matchedRuntimeVerifyResult.status === 'error') {
      handleRuntimeVerifyErrorResult(matchedRuntimeVerifyResult);
      return;
    }
    handleRuntimeVerifyCompleteResult(matchedRuntimeVerifyResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, sharedRuntimeVerifyResults]);

  useEffect(() => {
    maybeProcessPendingRuntimeAutoFix(runtimeObservationState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner, runtimeObservationState]);

  useEffect(() => {
    maybeProcessPendingRuntimeVerification(runtimeObservationState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOwner, runtimeObservationState]);

  return {
    runtimeObservationChatNotes,
    runtimeFollowUpRevision,
    bumpRuntimeFollowUpRevision,
    reset,
    getCurrentRuntimeObservationSummary,
    hasPendingRuntimeFollowUp,
    shouldHoldTerminalSharedBuildRun,
    resetRuntimeHealthFollowUpState,
    handleCompletedRunFollowUp,
    handleRuntimeObservationChange,
    processPendingRuntimeFollowUp,
    prepareRuntimeAutoFixRun,
    removeRuntimeObservationChatNote
  };
}
