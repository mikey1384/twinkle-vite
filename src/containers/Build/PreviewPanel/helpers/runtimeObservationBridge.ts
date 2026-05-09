import type {
  BuildRuntimeExplorationExpectedSignals,
  BuildRuntimeGameplayTelemetry,
  BuildRuntimeExplorationPlan,
  BuildRuntimeExplorationPlanStep,
  BuildRuntimeHealthSnapshot,
  BuildRuntimeInteractionStep,
  BuildRuntimeObservationIssue,
  BuildRuntimeObservationState
} from '../../types/runtimeObservationTypes';

export function buildEmptyRuntimeObservationState({
  buildId,
  codeSignature
}: {
  buildId: number;
  codeSignature: string | null;
}): BuildRuntimeObservationState {
  return {
    buildId,
    codeSignature,
    issues: [],
    health: null,
    updatedAt: Date.now()
  };
}

export function filterResolvedRuntimeObservationIssues({
  issues,
  health,
  sourcePreviewNonce,
  retainedPreviewNonces
}: {
  issues: BuildRuntimeObservationIssue[];
  health: BuildRuntimeHealthSnapshot | null;
  sourcePreviewNonce: string | null;
  retainedPreviewNonces: string[];
}) {
  const retainedPreviewNonceSet = new Set(retainedPreviewNonces);
  const currentFrameIssues = retainedPreviewNonceSet.size > 0
    ? issues.filter(
        (issue) =>
          issue.previewNonce && retainedPreviewNonceSet.has(issue.previewNonce)
      )
    : issues;
  const removedStaleFrameIssues = currentFrameIssues.length !== issues.length;
  if (!health?.meaningfulRender) {
    return removedStaleFrameIssues ? currentFrameIssues : issues;
  }
  const unresolvedIssues = currentFrameIssues.filter((issue) => {
    if (issue.kind !== 'blankrender') return true;
    return sourcePreviewNonce && issue.previewNonce !== sourcePreviewNonce;
  });
  const removedResolvedIssues =
    unresolvedIssues.length !== currentFrameIssues.length;
  return removedStaleFrameIssues || removedResolvedIssues
    ? unresolvedIssues
    : issues;
}

export function isStaleRuntimePreviewSignature({
  messageCodeSignature,
  currentCodeSignature
}: {
  messageCodeSignature: string | null;
  currentCodeSignature: string | null;
}) {
  const normalizedMessageSignature = String(messageCodeSignature || '').trim();
  const normalizedCurrentSignature = String(currentCodeSignature || '').trim();
  return Boolean(
    normalizedMessageSignature &&
      normalizedCurrentSignature &&
      normalizedMessageSignature !== normalizedCurrentSignature
  );
}

export function normalizeRuntimeObservationIssue({
  payload,
  previewNonce
}: {
  payload: any;
  previewNonce: string | null;
}): BuildRuntimeObservationIssue | null {
  const kind =
    payload?.kind === 'unhandledrejection'
      ? 'unhandledrejection'
      : payload?.kind === 'consoleerror'
        ? 'consoleerror'
      : payload?.kind === 'blankrender'
        ? 'blankrender'
        : payload?.kind === 'formsubmitblocked'
          ? 'formsubmitblocked'
        : payload?.kind === 'sdkblocked'
          ? 'sdkblocked'
          : payload?.kind === 'keyboardscroll'
            ? 'keyboardscroll'
            : payload?.kind === 'playfieldmismatch'
              ? 'playfieldmismatch'
              : payload?.kind === 'interactionnoop'
                ? 'interactionnoop'
                : 'error';
  const message = String(payload?.message || '').trim();
  if (!message) return null;
  const stack = String(payload?.stack || '').trim();
  const filename = String(payload?.filename || '').trim();
  const lineNumber = Number(payload?.lineNumber);
  const columnNumber = Number(payload?.columnNumber);
  const createdAt = Number(payload?.createdAt);

  return {
    kind,
    message: message.slice(0, 400),
    stack: stack ? stack.slice(0, 1200) : null,
    filename: filename ? filename.slice(0, 240) : null,
    lineNumber:
      Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : null,
    columnNumber:
      Number.isFinite(columnNumber) && columnNumber > 0 ? columnNumber : null,
    createdAt:
      Number.isFinite(createdAt) && createdAt > 0 ? createdAt : Date.now(),
    previewNonce
  };
}

function normalizeRuntimeExpectedSignals(
  rawExpectedSignals: any
): BuildRuntimeExplorationExpectedSignals | null {
  if (!rawExpectedSignals || typeof rawExpectedSignals !== 'object') {
    return null;
  }
  const routeChange =
    typeof rawExpectedSignals.routeChange === 'boolean'
      ? rawExpectedSignals.routeChange
      : null;
  const textIncludes = Array.isArray(rawExpectedSignals.textIncludes)
    ? rawExpectedSignals.textIncludes
        .map((text: unknown) => String(text || '').trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const revealsLabels = Array.isArray(rawExpectedSignals.revealsLabels)
    ? rawExpectedSignals.revealsLabels
        .map((label: unknown) => String(label || '').trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  if (
    routeChange === null &&
    textIncludes.length === 0 &&
    revealsLabels.length === 0
  ) {
    return null;
  }
  return {
    routeChange,
    textIncludes: textIncludes.map((text: string) => text.slice(0, 80)),
    revealsLabels: revealsLabels.map((label: string) => label.slice(0, 80))
  };
}

function normalizeRuntimeGameplayRect(payload: any) {
  if (!payload || typeof payload !== 'object') return null;
  const x = Number(payload.x);
  const y = Number(payload.y);
  const width = Number(payload.width);
  const height = Number(payload.height);
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height)
  };
}

export function normalizeRuntimeHealthSnapshot(
  payload: any
): BuildRuntimeHealthSnapshot | null {
  if (!payload || typeof payload !== 'object') return null;
  const visibleTextSample = String(payload.visibleTextSample || '').trim();
  const headingCount = Number(payload.headingCount);
  const buttonCount = Number(payload.buttonCount);
  const formCount = Number(payload.formCount);
  const viewportOverflowY = Number(payload.viewportOverflowY);
  const viewportOverflowX = Number(payload.viewportOverflowX);
  const observedAt = Number(payload.observedAt);
  const interactionStatus = String(payload.interactionStatus || '').trim();
  const interactionTargetLabel = String(
    payload.interactionTargetLabel || ''
  ).trim();
  const interactionSteps = Array.isArray(payload.interactionSteps)
    ? (payload.interactionSteps
        .map((step: unknown): BuildRuntimeInteractionStep | null => {
          if (!step || typeof step !== 'object') return null;
          const stepRecord = step as Record<string, any>;
          const targetLabel = String(stepRecord.targetLabel || '').trim();
          const routeBefore = String(stepRecord.routeBefore || '').trim();
          const routeAfter = String(stepRecord.routeAfter || '').trim();
          const hashBefore = String(stepRecord.hashBefore || '').trim();
          const hashAfter = String(stepRecord.hashAfter || '').trim();
          const visibleTextBefore = String(
            stepRecord.visibleTextBefore || ''
          ).trim();
          const visibleTextAfter = String(
            stepRecord.visibleTextAfter || ''
          ).trim();
          const headingDelta = Number(stepRecord.headingDelta);
          const buttonDelta = Number(stepRecord.buttonDelta);
          const formDelta = Number(stepRecord.formDelta);
          const observedAtValue = Number(stepRecord.observedAt);
          const status = String(stepRecord.status || '').trim();
          const revealedTargetLabels = Array.isArray(
            stepRecord.revealedTargetLabels
          )
            ? stepRecord.revealedTargetLabels
                .map((label: unknown) => String(label || '').trim())
                .filter(Boolean)
                .slice(0, 4)
            : [];

          if (
            status !== 'changed' &&
            status !== 'unchanged' &&
            status !== 'skipped'
          ) {
            return null;
          }

          return {
            source: stepRecord.source === 'planned' ? 'planned' : 'generic',
            goal:
              typeof stepRecord.goal === 'string' && stepRecord.goal.trim()
                ? stepRecord.goal.trim().slice(0, 220)
                : null,
            actionKind:
              stepRecord.actionKind === 'submit-form'
                ? 'submit-form'
                : stepRecord.actionKind === 'click'
                  ? 'click'
                  : null,
            expectedSignals: normalizeRuntimeExpectedSignals(
              stepRecord.expectedSignals
            ),
            targetLabel: targetLabel ? targetLabel.slice(0, 120) : null,
            status,
            routeBefore: routeBefore ? routeBefore.slice(0, 240) : null,
            routeAfter: routeAfter ? routeAfter.slice(0, 240) : null,
            hashBefore: hashBefore ? hashBefore.slice(0, 240) : null,
            hashAfter: hashAfter ? hashAfter.slice(0, 240) : null,
            routeChanged: Boolean(stepRecord.routeChanged),
            hashChanged: Boolean(stepRecord.hashChanged),
            visibleTextBefore: visibleTextBefore
              ? visibleTextBefore.slice(0, 180)
              : null,
            visibleTextAfter: visibleTextAfter
              ? visibleTextAfter.slice(0, 180)
              : null,
            headingDelta: Number.isFinite(headingDelta)
              ? Math.trunc(headingDelta)
              : 0,
            buttonDelta: Number.isFinite(buttonDelta)
              ? Math.trunc(buttonDelta)
              : 0,
            formDelta: Number.isFinite(formDelta) ? Math.trunc(formDelta) : 0,
            revealedTargetLabels,
            observedAt:
              Number.isFinite(observedAtValue) && observedAtValue > 0
                ? observedAtValue
                : Date.now()
          };
        })
        .filter(Boolean)
        .slice(0, 4) as BuildRuntimeInteractionStep[])
    : [];
  const gameplayTelemetry: BuildRuntimeGameplayTelemetry | null =
    payload.gameplayTelemetry && typeof payload.gameplayTelemetry === 'object'
      ? {
          playfieldBounds: normalizeRuntimeGameplayRect(
            payload.gameplayTelemetry.playfieldBounds
          ),
          playerBounds: normalizeRuntimeGameplayRect(
            payload.gameplayTelemetry.playerBounds
          ),
          overflowTop: Number.isFinite(
            Number(payload.gameplayTelemetry.overflowTop)
          )
            ? Math.max(
                0,
                Math.floor(Number(payload.gameplayTelemetry.overflowTop))
              )
            : 0,
          overflowRight: Number.isFinite(
            Number(payload.gameplayTelemetry.overflowRight)
          )
            ? Math.max(
                0,
                Math.floor(Number(payload.gameplayTelemetry.overflowRight))
              )
            : 0,
          overflowBottom: Number.isFinite(
            Number(payload.gameplayTelemetry.overflowBottom)
          )
            ? Math.max(
                0,
                Math.floor(Number(payload.gameplayTelemetry.overflowBottom))
              )
            : 0,
          overflowLeft: Number.isFinite(
            Number(payload.gameplayTelemetry.overflowLeft)
          )
            ? Math.max(
                0,
                Math.floor(Number(payload.gameplayTelemetry.overflowLeft))
              )
            : 0,
          status:
            payload.gameplayTelemetry.status === 'out-of-bounds'
              ? 'out-of-bounds'
              : payload.gameplayTelemetry.status === 'ok'
                ? 'ok'
                : 'incomplete',
          reportedAt: Number.isFinite(
            Number(payload.gameplayTelemetry.reportedAt)
          )
            ? Math.floor(Number(payload.gameplayTelemetry.reportedAt))
            : Date.now()
        }
      : null;

  return {
    booted: Boolean(payload.booted),
    meaningfulRender: Boolean(payload.meaningfulRender),
    gameLike: Boolean(payload.gameLike),
    headingCount:
      Number.isFinite(headingCount) && headingCount >= 0
        ? Math.floor(headingCount)
        : 0,
    buttonCount:
      Number.isFinite(buttonCount) && buttonCount >= 0
        ? Math.floor(buttonCount)
        : 0,
    formCount:
      Number.isFinite(formCount) && formCount >= 0 ? Math.floor(formCount) : 0,
    viewportOverflowY:
      Number.isFinite(viewportOverflowY) && viewportOverflowY >= 0
        ? Math.floor(viewportOverflowY)
        : 0,
    viewportOverflowX:
      Number.isFinite(viewportOverflowX) && viewportOverflowX >= 0
        ? Math.floor(viewportOverflowX)
        : 0,
    visibleTextSample: visibleTextSample
      ? visibleTextSample.slice(0, 180)
      : null,
    interactionStatus:
      interactionStatus === 'changed' ||
      interactionStatus === 'unchanged' ||
      interactionStatus === 'skipped'
        ? interactionStatus
        : 'idle',
    interactionTargetLabel: interactionTargetLabel
      ? interactionTargetLabel.slice(0, 120)
      : null,
    interactionSteps,
    gameplayTelemetry,
    observedAt:
      Number.isFinite(observedAt) && observedAt > 0 ? observedAt : Date.now()
  };
}

function normalizeRuntimeExplorationPlanStep(
  step: any
): BuildRuntimeExplorationPlanStep | null {
  if (!step || typeof step !== 'object') return null;
  const kind =
    step.kind === 'submit-form'
      ? 'submit-form'
      : step.kind === 'click'
        ? 'click'
        : null;
  if (!kind) return null;
  const goal = String(step.goal || '').trim();
  const labelHints = Array.isArray(step.labelHints)
    ? step.labelHints
        .map((label: string) => String(label || '').trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const inputHints = Array.isArray(step.inputHints)
    ? step.inputHints
        .map((hint: unknown) => String(hint || '').trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const expectedSignals = normalizeRuntimeExpectedSignals(step.expectedSignals);
  if (!goal || labelHints.length === 0) return null;
  return {
    kind,
    goal: goal.slice(0, 220),
    labelHints: labelHints.map((label: string) => label.slice(0, 80)),
    inputHints: inputHints.map((hint: string) => hint.slice(0, 80)),
    expectedSignals
  };
}

export function normalizeRuntimeExplorationPlan(
  plan: any
): BuildRuntimeExplorationPlan | null {
  if (!plan || typeof plan !== 'object') return null;
  const summary = String(plan.summary || '').trim();
  const steps = Array.isArray(plan.steps)
    ? (plan.steps
        .map((step: unknown) => normalizeRuntimeExplorationPlanStep(step))
        .filter(Boolean)
        .slice(0, 3) as BuildRuntimeExplorationPlanStep[])
    : [];
  if (!summary || steps.length === 0) return null;
  return {
    summary: summary.slice(0, 240),
    generatedFrom: plan.generatedFrom === 'planner' ? 'planner' : 'heuristic',
    steps
  };
}
