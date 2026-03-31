import {
  useEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction
} from 'react';
import type { BuildCapabilitySnapshot } from '../capabilityTypes';
import type {
  BuildRuntimeExplorationExpectedSignals,
  BuildRuntimeGameplayTelemetry,
  BuildRuntimeExplorationPlan,
  BuildRuntimeExplorationPlanStep,
  BuildRuntimeHealthSnapshot,
  BuildRuntimeInteractionStep,
  BuildRuntimeObservationIssue,
  BuildRuntimeObservationState
} from '../runtimeObservationTypes';
import {
  executeGuestViewerDbExec,
  executeGuestViewerDbQuery
} from './guestViewerDb';
import type { Build, PreviewFrameMeta } from './types';

const GUEST_SESSION_STORAGE_KEY = 'twinkle_build_guest_session_id';
const GUEST_RESTRICTION_ERROR_MESSAGE =
  'This feature requires signing in because it uses user-only data.';
const MUTATING_PREVIEW_REQUEST_TYPES = new Set([
  'ai:chat',
  'db:save',
  'private-db:remove',
  'private-db:set',
  'reminders:create',
  'reminders:get-due',
  'reminders:remove',
  'reminders:update',
  'shared-db:add-entry',
  'shared-db:create-topic',
  'shared-db:delete-entry',
  'shared-db:update-entry',
  'viewer-db:exec'
]);

type AsyncRequestRef = RefObject<(...args: any[]) => Promise<any>>;

interface BuildApiTokenState {
  token: string;
  scopes: string[];
  expiresAt: number;
}

export interface PreviewHostBridgeAuth {
  buildRef: RefObject<Build>;
  isOwnerRef: RefObject<boolean>;
  userIdRef: RefObject<number | null>;
  usernameRef: RefObject<string | null>;
  profilePicUrlRef: RefObject<string | null>;
  guestSessionIdRef: RefObject<string | null>;
  buildApiTokenRef: RefObject<BuildApiTokenState | null>;
  getBuildApiTokenRef: AsyncRequestRef;
  setGuestRestrictionBannerVisible: Dispatch<SetStateAction<boolean>>;
}

interface PreviewHostBridgeRequestRefs {
  downloadBuildDatabaseRef: AsyncRequestRef;
  uploadBuildDatabaseRef: AsyncRequestRef;
  loadBuildAiPromptsRef: AsyncRequestRef;
  callBuildAiChatRef: AsyncRequestRef;
  queryViewerDbRef: AsyncRequestRef;
  execViewerDbRef: AsyncRequestRef;
  getBuildApiUserRef: AsyncRequestRef;
  getBuildApiUsersRef: AsyncRequestRef;
  getBuildDailyReflectionsRef: AsyncRequestRef;
  getBuildMySubjectsRef: AsyncRequestRef;
  getBuildSubjectRef: AsyncRequestRef;
  getBuildSubjectCommentsRef: AsyncRequestRef;
  getBuildProfileCommentsRef: AsyncRequestRef;
  getBuildProfileCommentIdsRef: AsyncRequestRef;
  getBuildProfileCommentsByIdsRef: AsyncRequestRef;
  getBuildProfileCommentCountsRef: AsyncRequestRef;
  getSharedDbTopicsRef: AsyncRequestRef;
  createSharedDbTopicRef: AsyncRequestRef;
  getSharedDbEntriesRef: AsyncRequestRef;
  addSharedDbEntryRef: AsyncRequestRef;
  updateSharedDbEntryRef: AsyncRequestRef;
  deleteSharedDbEntryRef: AsyncRequestRef;
  getPrivateDbItemRef: AsyncRequestRef;
  listPrivateDbItemsRef: AsyncRequestRef;
  setPrivateDbItemRef: AsyncRequestRef;
  deletePrivateDbItemRef: AsyncRequestRef;
  listBuildRemindersRef: AsyncRequestRef;
  createBuildReminderRef: AsyncRequestRef;
  updateBuildReminderRef: AsyncRequestRef;
  deleteBuildReminderRef: AsyncRequestRef;
  getDueBuildRemindersRef: AsyncRequestRef;
}

interface UsePreviewHostBridgeArgs {
  runtimeOnly: boolean;
  buildId: number;
  buildIsPublic: boolean | number | null | undefined;
  isOwner: boolean;
  userId: number | null;
  username: string | null;
  profilePicUrl: string | null;
  resolvedCapabilitySnapshot: BuildCapabilitySnapshot | null;
  resolvedRuntimeExplorationPlan: BuildRuntimeExplorationPlan | null;
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
}

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

function normalizeRuntimeObservationIssue(
  payload: any
): BuildRuntimeObservationIssue | null {
  const kind =
    payload?.kind === 'unhandledrejection'
      ? 'unhandledrejection'
      : payload?.kind === 'blankrender'
        ? 'blankrender'
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
      Number.isFinite(createdAt) && createdAt > 0 ? createdAt : Date.now()
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

function normalizeRuntimeHealthSnapshot(
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

function isMutatingPreviewRequestType(type: string) {
  return MUTATING_PREVIEW_REQUEST_TYPES.has(type);
}

function isGuestViewerActive(previewAuth: PreviewHostBridgeAuth) {
  return (
    Boolean(previewAuth.buildRef.current?.isPublic) &&
    !previewAuth.isOwnerRef.current &&
    !previewAuth.userIdRef.current
  );
}

function ensureGuestSessionId(previewAuth: PreviewHostBridgeAuth) {
  if (previewAuth.guestSessionIdRef.current) {
    return previewAuth.guestSessionIdRef.current;
  }

  try {
    const storedGuestSessionId = window.localStorage.getItem(
      GUEST_SESSION_STORAGE_KEY
    );
    if (storedGuestSessionId) {
      previewAuth.guestSessionIdRef.current = storedGuestSessionId;
      return storedGuestSessionId;
    }
  } catch {
    // no-op
  }

  const generatedGuestSessionId = `guest_${
    window.crypto?.randomUUID?.() ||
    `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  }`;

  previewAuth.guestSessionIdRef.current = generatedGuestSessionId;

  try {
    window.localStorage.setItem(
      GUEST_SESSION_STORAGE_KEY,
      generatedGuestSessionId
    );
  } catch {
    // no-op
  }

  return generatedGuestSessionId;
}

function triggerGuestRestriction(previewAuth: PreviewHostBridgeAuth) {
  previewAuth.setGuestRestrictionBannerVisible(true);
  const error: any = new Error(GUEST_RESTRICTION_ERROR_MESSAGE);
  error.code = 'guest_restricted';
  throw error;
}

export async function ensureBuildApiToken(
  requiredScopes: string[],
  previewAuth: PreviewHostBridgeAuth
) {
  if (isGuestViewerActive(previewAuth)) {
    triggerGuestRestriction(previewAuth);
  }

  const now = Math.floor(Date.now() / 1000);
  const cached = previewAuth.buildApiTokenRef.current;
  if (
    cached &&
    cached.expiresAt - 30 > now &&
    requiredScopes.every((scope) => cached.scopes.includes(scope))
  ) {
    return cached.token;
  }

  const activeBuild = previewAuth.buildRef.current;
  if (!activeBuild?.id) {
    throw new Error('Build not found');
  }

  const scopeSet = new Set<string>([
    ...(cached?.scopes || []),
    ...requiredScopes
  ]);
  const requestedScopes = Array.from(scopeSet);

  const result = await previewAuth.getBuildApiTokenRef.current({
    buildId: activeBuild.id,
    scopes: requestedScopes
  });
  if (!result?.token) {
    throw new Error('Failed to obtain API token');
  }
  previewAuth.buildApiTokenRef.current = {
    token: result.token,
    scopes: result.scopes || requestedScopes,
    expiresAt: result.expiresAt || now + 600
  };
  return result.token;
}

function getViewerInfo(previewAuth: PreviewHostBridgeAuth) {
  if (previewAuth.userIdRef.current) {
    return {
      id: previewAuth.userIdRef.current,
      username: previewAuth.usernameRef.current,
      profilePicUrl: previewAuth.profilePicUrlRef.current,
      isLoggedIn: true,
      isOwner: Boolean(previewAuth.isOwnerRef.current),
      isGuest: false
    };
  }

  if (isGuestViewerActive(previewAuth)) {
    return {
      id: ensureGuestSessionId(previewAuth),
      username: 'Guest',
      profilePicUrl: null,
      isLoggedIn: false,
      isOwner: false,
      isGuest: true
    };
  }

  return {
    id: null,
    username: null,
    profilePicUrl: null,
    isLoggedIn: false,
    isOwner: Boolean(previewAuth.isOwnerRef.current),
    isGuest: false
  };
}

function postToPreviewFrames(
  primaryIframeRef: RefObject<HTMLIFrameElement | null>,
  secondaryIframeRef: RefObject<HTMLIFrameElement | null>,
  message: Record<string, any>
) {
  const previewFrames = [
    primaryIframeRef.current?.contentWindow,
    secondaryIframeRef.current?.contentWindow
  ];

  for (const targetWindow of previewFrames) {
    if (!targetWindow) continue;
    targetWindow.postMessage(message, '*');
  }
}

export function usePreviewHostBridge({
  runtimeOnly,
  buildId,
  buildIsPublic,
  isOwner,
  userId,
  username,
  profilePicUrl,
  resolvedCapabilitySnapshot,
  resolvedRuntimeExplorationPlan,
  capabilitySnapshotRef,
  runtimeExplorationPlanRef,
  messageTargetFrameRef,
  previewCodeSignatureRef,
  previewFrameMetaRef,
  previewFrameSourcesRef,
  previewTransitioningRef,
  primaryIframeRef,
  secondaryIframeRef,
  setRuntimeObservationState,
  previewAuth,
  requestRefs
}: UsePreviewHostBridgeArgs) {
  useEffect(() => {
    const viewer = getViewerInfo(previewAuth);
    postToPreviewFrames(primaryIframeRef, secondaryIframeRef, {
      source: 'twinkle-parent',
      type: 'viewer:update',
      viewer
    });
  }, [
    buildId,
    buildIsPublic,
    isOwner,
    userId,
    username,
    profilePicUrl,
    previewAuth,
    primaryIframeRef,
    secondaryIframeRef
  ]);

  useEffect(() => {
    postToPreviewFrames(primaryIframeRef, secondaryIframeRef, {
      source: 'twinkle-parent',
      type: 'capabilities:update',
      capabilities: resolvedCapabilitySnapshot
    });
  }, [primaryIframeRef, resolvedCapabilitySnapshot, secondaryIframeRef]);

  useEffect(() => {
    postToPreviewFrames(primaryIframeRef, secondaryIframeRef, {
      source: 'twinkle-parent',
      type: 'exploration-plan:update',
      explorationPlan: resolvedRuntimeExplorationPlan
    });
  }, [primaryIframeRef, resolvedRuntimeExplorationPlan, secondaryIframeRef]);

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'twinkle-build') return;
      const { id, type, payload } = data;

      const sourceWindow = event.source as Window | null;
      if (!sourceWindow) return;
      const primaryWindow = primaryIframeRef.current?.contentWindow || null;
      const secondaryWindow = secondaryIframeRef.current?.contentWindow || null;
      const sourceFrame =
        primaryWindow && sourceWindow === primaryWindow
          ? 'primary'
          : secondaryWindow && sourceWindow === secondaryWindow
            ? 'secondary'
            : null;
      if (!sourceFrame) return;
      const targetFrame = messageTargetFrameRef.current;
      const targetWindow =
        targetFrame === 'primary' ? primaryWindow : secondaryWindow;
      const alternateFrame =
        targetFrame === 'primary' ? 'secondary' : 'primary';
      const alternateWindow =
        alternateFrame === 'primary' ? primaryWindow : secondaryWindow;
      const frameMeta = previewFrameMetaRef.current;
      const activeBuild = previewAuth.buildRef.current;
      const activeBuildId = activeBuild?.id ?? null;
      if (!activeBuildId) return;
      const targetMeta = frameMeta[targetFrame];
      const alternateMeta = frameMeta[alternateFrame];
      const alternateHasSource = Boolean(
        previewFrameSourcesRef.current[alternateFrame]
      );
      const shouldAcceptAlternate =
        previewTransitioningRef.current &&
        alternateHasSource &&
        alternateMeta?.buildId === activeBuildId;
      const allowRuntimePrimaryWindow =
        runtimeOnly &&
        targetFrame === 'primary' &&
        primaryWindow &&
        sourceWindow === primaryWindow;
      const fromTargetWindow = Boolean(
        targetWindow &&
        sourceWindow === targetWindow &&
        (targetMeta?.buildId === activeBuildId || allowRuntimePrimaryWindow)
      );
      const fromAlternateWindow = Boolean(
        alternateWindow &&
        sourceWindow === alternateWindow &&
        alternateMeta?.buildId === activeBuildId
      );
      if (
        !fromTargetWindow &&
        !(shouldAcceptAlternate && fromAlternateWindow)
      ) {
        return;
      }

      if (type === 'runtime-observation') {
        const normalizedIssue = normalizeRuntimeObservationIssue(payload);
        if (!normalizedIssue) return;
        const observationCodeSignature = runtimeOnly
          ? previewCodeSignatureRef.current
          : frameMeta[sourceFrame]?.codeSignature ||
            previewCodeSignatureRef.current;

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
              issue.columnNumber === normalizedIssue.columnNumber
          );
          if (isDuplicate) {
            return {
              ...baseState,
              updatedAt: Math.max(Date.now(), normalizedIssue.createdAt)
            };
          }
          return {
            ...baseState,
            issues: [...baseState.issues, normalizedIssue].slice(-8),
            updatedAt: Math.max(Date.now(), normalizedIssue.createdAt)
          };
        });
        return;
      }

      if (type === 'preview-health') {
        const normalizedHealth = normalizeRuntimeHealthSnapshot(payload);
        if (!normalizedHealth) return;
        const healthCodeSignature = runtimeOnly
          ? previewCodeSignatureRef.current
          : frameMeta[sourceFrame]?.codeSignature ||
            previewCodeSignatureRef.current;

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
          if (isUnchanged) {
            return {
              ...baseState,
              updatedAt: Math.max(Date.now(), normalizedHealth.observedAt)
            };
          }
          return {
            ...baseState,
            health: normalizedHealth,
            updatedAt: Math.max(Date.now(), normalizedHealth.observedAt)
          };
        });
        return;
      }

      if (
        previewTransitioningRef.current &&
        isMutatingPreviewRequestType(type)
      ) {
        const mutationAuthorityFrame = shouldAcceptAlternate
          ? alternateFrame
          : targetFrame;
        if (sourceFrame !== mutationAuthorityFrame) {
          sourceWindow.postMessage(
            {
              source: 'twinkle-parent',
              id,
              error:
                'Preview is updating. This request was skipped to prevent duplicate side effects.'
            },
            '*'
          );
          return;
        }
      }

      const owner = previewAuth.isOwnerRef.current;

      try {
        let response: any = {};

        switch (type) {
          case 'init':
            response = {
              id: activeBuild.id,
              title: activeBuild.title,
              username: activeBuild.username,
              viewer: getViewerInfo(previewAuth),
              capabilities: capabilitySnapshotRef.current,
              explorationPlan: runtimeExplorationPlanRef.current
            };
            break;

          case 'capabilities:get':
            response = { capabilities: capabilitySnapshotRef.current };
            break;

          case 'db:load': {
            if (!owner) {
              throw new Error('Not authorized');
            }
            const dbData = await requestRefs.downloadBuildDatabaseRef.current(
              activeBuild.id
            );
            if (dbData) {
              const bytes = new Uint8Array(dbData);
              let binary = '';
              for (let i = 0; i < bytes.length; i += 1) {
                binary += String.fromCharCode(bytes[i]);
              }
              response = { data: btoa(binary) };
            } else {
              response = { data: null };
            }
            break;
          }

          case 'db:save': {
            if (!owner) {
              throw new Error('Not authorized');
            }
            const base64 = payload.data;
            const binaryStr = atob(base64);
            const len = binaryStr.length;
            const bytesArr = new Uint8Array(len);
            for (let i = 0; i < len; i += 1) {
              bytesArr[i] = binaryStr.charCodeAt(i);
            }
            response = await requestRefs.uploadBuildDatabaseRef.current({
              buildId: activeBuild.id,
              data: bytesArr.buffer
            });
            break;
          }

          case 'ai:list-prompts':
            response = {
              prompts:
                (await requestRefs.loadBuildAiPromptsRef.current())?.prompts ||
                []
            };
            break;

          case 'ai:chat':
            if (!owner) {
              throw new Error('Not authorized');
            }
            response = await requestRefs.callBuildAiChatRef.current({
              buildId: activeBuild.id,
              promptId: payload.promptId,
              message: payload.message,
              history: payload.history
            });
            break;

          case 'viewer:get':
            response = { viewer: getViewerInfo(previewAuth) };
            break;

          case 'viewer-db:query':
            if (isGuestViewerActive(previewAuth)) {
              response = await executeGuestViewerDbQuery({
                buildId: activeBuild.id,
                guestSessionId: ensureGuestSessionId(previewAuth),
                sql: payload?.sql,
                params: payload?.params
              });
            } else {
              response = await requestRefs.queryViewerDbRef.current({
                buildId: activeBuild.id,
                sql: payload?.sql,
                params: payload?.params
              });
            }
            break;

          case 'viewer-db:exec':
            if (isGuestViewerActive(previewAuth)) {
              response = await executeGuestViewerDbExec({
                buildId: activeBuild.id,
                guestSessionId: ensureGuestSessionId(previewAuth),
                sql: payload?.sql,
                params: payload?.params
              });
            } else {
              response = await requestRefs.execViewerDbRef.current({
                buildId: activeBuild.id,
                sql: payload?.sql,
                params: payload?.params
              });
            }
            break;

          case 'api:get-user': {
            const userToken = await ensureBuildApiToken(
              ['user:read'],
              previewAuth
            );
            response = await requestRefs.getBuildApiUserRef.current({
              buildId: activeBuild.id,
              userId: payload?.userId,
              token: userToken
            });
            break;
          }

          case 'api:get-users': {
            const usersToken = await ensureBuildApiToken(
              ['users:read'],
              previewAuth
            );
            response = await requestRefs.getBuildApiUsersRef.current({
              buildId: activeBuild.id,
              search: payload?.search,
              userIds: payload?.userIds,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: usersToken
            });
            break;
          }

          case 'api:get-daily-reflections': {
            const reflectionsToken = await ensureBuildApiToken(
              ['dailyReflections:read'],
              previewAuth
            );
            response = await requestRefs.getBuildDailyReflectionsRef.current({
              buildId: activeBuild.id,
              userIds: payload?.userIds,
              lastId: payload?.lastId,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: reflectionsToken
            });
            break;
          }

          case 'content:my-subjects': {
            const contentSubjectsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildMySubjectsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentSubjectsToken
            });
            break;
          }

          case 'content:subject': {
            const contentSubjectToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildSubjectRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              token: contentSubjectToken
            });
            break;
          }

          case 'content:subject-comments': {
            const contentCommentsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildSubjectCommentsRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentCommentsToken
            });
            break;
          }

          case 'content:profile-comments': {
            const contentProfileCountToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildProfileCommentsRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              limit: payload?.limit,
              offset: payload?.offset,
              sortBy: payload?.sortBy,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileCountToken
            });
            break;
          }

          case 'content:profile-comment-ids': {
            const contentProfileIdsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response = await requestRefs.getBuildProfileCommentIdsRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              limit: payload?.limit,
              offset: payload?.offset,
              sortBy: payload?.sortBy,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileIdsToken
            });
            break;
          }

          case 'content:profile-comments-by-ids': {
            const contentProfileByIdsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response =
              await requestRefs.getBuildProfileCommentsByIdsRef.current({
                buildId: activeBuild.id,
                ids: Array.isArray(payload?.ids) ? payload.ids : [],
                token: contentProfileByIdsToken
              });
            break;
          }

          case 'content:profile-comment-counts': {
            const contentProfileCountsToken = await ensureBuildApiToken(
              ['content:read'],
              previewAuth
            );
            response =
              await requestRefs.getBuildProfileCommentCountsRef.current({
                buildId: activeBuild.id,
                ids: Array.isArray(payload?.ids) ? payload.ids : [],
                token: contentProfileCountsToken
              });
            break;
          }

          case 'shared-db:get-topics': {
            const sharedDbTopicsToken = await ensureBuildApiToken(
              ['sharedDb:read'],
              previewAuth
            );
            response = await requestRefs.getSharedDbTopicsRef.current({
              buildId: activeBuild.id,
              token: sharedDbTopicsToken
            });
            break;
          }

          case 'shared-db:create-topic': {
            const sharedDbCreateTopicToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.createSharedDbTopicRef.current({
              buildId: activeBuild.id,
              name: payload?.name,
              token: sharedDbCreateTopicToken
            });
            break;
          }

          case 'shared-db:get-entries': {
            const sharedDbEntriesToken = await ensureBuildApiToken(
              ['sharedDb:read'],
              previewAuth
            );
            response = await requestRefs.getSharedDbEntriesRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: sharedDbEntriesToken
            });
            break;
          }

          case 'shared-db:add-entry': {
            const sharedDbAddEntryToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.addSharedDbEntryRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              data: payload?.data,
              token: sharedDbAddEntryToken
            });
            break;
          }

          case 'shared-db:update-entry': {
            const sharedDbUpdateEntryToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.updateSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              data: payload?.data,
              token: sharedDbUpdateEntryToken
            });
            break;
          }

          case 'shared-db:delete-entry': {
            const sharedDbDeleteEntryToken = await ensureBuildApiToken(
              ['sharedDb:write'],
              previewAuth
            );
            response = await requestRefs.deleteSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              token: sharedDbDeleteEntryToken
            });
            break;
          }

          case 'private-db:get': {
            const privateDbReadToken = await ensureBuildApiToken(
              ['privateDb:read'],
              previewAuth
            );
            response = await requestRefs.getPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbReadToken
            });
            break;
          }

          case 'private-db:list': {
            const privateDbListToken = await ensureBuildApiToken(
              ['privateDb:read'],
              previewAuth
            );
            response = await requestRefs.listPrivateDbItemsRef.current({
              buildId: activeBuild.id,
              prefix: payload?.prefix,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: privateDbListToken
            });
            break;
          }

          case 'private-db:set': {
            const privateDbWriteToken = await ensureBuildApiToken(
              ['privateDb:write'],
              previewAuth
            );
            response = await requestRefs.setPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              value: payload?.value,
              token: privateDbWriteToken
            });
            break;
          }

          case 'private-db:remove': {
            const privateDbDeleteToken = await ensureBuildApiToken(
              ['privateDb:write'],
              previewAuth
            );
            response = await requestRefs.deletePrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbDeleteToken
            });
            break;
          }

          case 'reminders:list': {
            const remindersReadToken = await ensureBuildApiToken(
              ['reminders:read'],
              previewAuth
            );
            response = await requestRefs.listBuildRemindersRef.current({
              buildId: activeBuild.id,
              includeDisabled: payload?.includeDisabled,
              limit: payload?.limit,
              token: remindersReadToken
            });
            break;
          }

          case 'reminders:create': {
            const remindersWriteToken = await ensureBuildApiToken(
              ['reminders:write'],
              previewAuth
            );
            response = await requestRefs.createBuildReminderRef.current({
              buildId: activeBuild.id,
              title: payload?.title,
              body: payload?.body,
              targetPath: payload?.targetPath,
              payload: payload?.payload,
              schedule: payload?.schedule,
              isEnabled: payload?.isEnabled,
              token: remindersWriteToken
            });
            break;
          }

          case 'reminders:update': {
            const remindersUpdateToken = await ensureBuildApiToken(
              ['reminders:write'],
              previewAuth
            );
            response = await requestRefs.updateBuildReminderRef.current({
              buildId: activeBuild.id,
              reminderId: payload?.reminderId,
              title: payload?.title,
              body: payload?.body,
              targetPath: payload?.targetPath,
              payload: payload?.payload,
              schedule: payload?.schedule,
              isEnabled: payload?.isEnabled,
              token: remindersUpdateToken
            });
            break;
          }

          case 'reminders:remove': {
            const remindersDeleteToken = await ensureBuildApiToken(
              ['reminders:write'],
              previewAuth
            );
            response = await requestRefs.deleteBuildReminderRef.current({
              buildId: activeBuild.id,
              reminderId: payload?.reminderId,
              token: remindersDeleteToken
            });
            break;
          }

          case 'reminders:get-due': {
            const remindersDueToken = await ensureBuildApiToken(
              ['reminders:read'],
              previewAuth
            );
            response = await requestRefs.getDueBuildRemindersRef.current({
              buildId: activeBuild.id,
              now: payload?.now,
              autoAcknowledge: payload?.autoAcknowledge,
              limit: payload?.limit,
              token: remindersDueToken
            });
            break;
          }

          default:
            throw new Error(`Unknown request type: ${type}`);
        }

        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            payload: response
          },
          '*'
        );
      } catch (error: any) {
        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            error: error.message || 'Unknown error'
          },
          '*'
        );
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    capabilitySnapshotRef,
    messageTargetFrameRef,
    previewAuth,
    previewCodeSignatureRef,
    previewFrameMetaRef,
    previewFrameSourcesRef,
    previewTransitioningRef,
    primaryIframeRef,
    requestRefs,
    runtimeExplorationPlanRef,
    runtimeOnly,
    secondaryIframeRef,
    setRuntimeObservationState
  ]);
}
