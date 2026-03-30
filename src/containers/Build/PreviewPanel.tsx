import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { parse as parseJavaScriptModule } from '@babel/parser';
import { mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import type { BuildCapabilitySnapshot } from './capabilityTypes';
import type {
  BuildRuntimeExplorationExpectedSignals,
  BuildRuntimeExplorationPlan,
  BuildRuntimeExplorationPlanStep,
  BuildRuntimeInteractionStep,
  BuildRuntimeHealthSnapshot,
  BuildRuntimeObservationIssue,
  BuildRuntimeObservationState
} from './runtimeObservationTypes';

declare global {
  interface Window {
    initSqlJs?: (options: {
      locateFile: (file: string) => string;
    }) => Promise<any>;
  }
}

interface Build {
  id: number;
  title: string;
  username: string;
  primaryArtifactId?: number | null;
  isPublic?: boolean | number | null;
}

interface PreviewPanelProps {
  build: Build;
  code: string | null;
  projectFiles: Array<{
    path: string;
    content?: string;
  }>;
  streamingProjectFiles?: Array<{
    path: string;
    content?: string;
  }> | null;
  streamingFocusFilePath?: string | null;
  isOwner: boolean;
  onReplaceCode: (code: string) => void;
  onApplyRestoredProjectFiles: (
    files: Array<{ path: string; content?: string }>,
    restoredCode?: string | null
  ) => void;
  onSaveProjectFiles: (
    files: Array<{ path: string; content?: string }>
  ) => Promise<{ success: boolean; error?: string }>;
  runtimeOnly?: boolean;
  capabilitySnapshot?: BuildCapabilitySnapshot | null;
  onEditableProjectFilesStateChange?: (state: {
    files: Array<{ path: string; content?: string }>;
    hasUnsavedChanges: boolean;
    saving: boolean;
  }) => void;
  runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
  onRuntimeObservationChange?: (
    state: BuildRuntimeObservationState
  ) => void;
}

interface ArtifactVersion {
  id: number;
  version: number;
  summary: string | null;
  gitCommitSha: string | null;
  createdAt: number;
  createdByRole: 'user' | 'assistant';
}

interface PreviewSeedCacheEntry {
  buildId: number;
  codeSignature: string;
  src: string;
  cachedAt: number;
}

interface PreviewFrameMeta {
  buildId: number | null;
  codeSignature: string | null;
}

const PREVIEW_SEED_CACHE_TTL_MS = 10 * 60 * 1000;
const PREVIEW_SEED_CACHE_MAX_ENTRIES = 8;
const MODULE_SPECIFIER_REWRITE_CACHE_MAX_ENTRIES = 500;
const HOST_SQL_JS_CDN_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3';
const GUEST_SESSION_STORAGE_KEY = 'twinkle_build_guest_session_id';
const GUEST_VIEWER_DB_STORAGE_KEY_PREFIX = 'twinkle_build_guest_viewer_db:';
const GUEST_VIEWER_DB_SIZE_LIMIT_BYTES = 1 * 1024 * 1024;
const GUEST_VIEWER_DB_MAX_ROWS = 1000;
const GUEST_RESTRICTION_BANNER_TEXT =
  'Some features were restricted because this app uses user-only data. Sign in to access those parts.';
const GUEST_RESTRICTION_ERROR_MESSAGE =
  'This feature requires signing in because it uses user-only data.';
const previewSeedCache = new Map<number, PreviewSeedCacheEntry>();
const moduleSpecifierRewriteCache = new Map<string, string>();
const guestViewerDbCache = new Map<string, any>();
let hostSqlJsPromise: Promise<any> | null = null;
const LEGACY_TWINKLE_SDK_METHOD_REPLACEMENTS = [
  ['Twinkle.api.getUser', 'Twinkle.users.getUser'],
  ['Twinkle.api.getUsers', 'Twinkle.users.getUsers'],
  [
    'Twinkle.api.getDailyReflectionsByUser',
    'Twinkle.reflections.getDailyReflectionsByUser'
  ],
  ['Twinkle.api.getDailyReflections', 'Twinkle.reflections.getDailyReflections'],
  ['Twinkle.content.getMySubjects', 'Twinkle.subjects.getMySubjects'],
  ['Twinkle.content.getSubjectComments', 'Twinkle.subjects.getSubjectComments'],
  ['Twinkle.content.getSubject', 'Twinkle.subjects.getSubject'],
  [
    'Twinkle.content.getProfileCommentCounts',
    'Twinkle.profileComments.getProfileCommentCounts'
  ],
  [
    'Twinkle.content.getProfileCommentIds',
    'Twinkle.profileComments.getProfileCommentIds'
  ],
  [
    'Twinkle.content.getCommentsByIds',
    'Twinkle.profileComments.getCommentsByIds'
  ],
  [
    'Twinkle.content.getProfileComments',
    'Twinkle.profileComments.getProfileComments'
  ]
] as const;
const MUTATING_PREVIEW_REQUEST_TYPES = new Set([
  'ai:chat',
  'db:save',
  'private-db:remove',
  'private-db:set',
  'shared-db:add-entry',
  'shared-db:create-topic',
  'shared-db:delete-entry',
  'shared-db:update-entry',
  'viewer-db:exec'
]);

function hashPreviewCode(code: string) {
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function buildModuleSpecifierRewriteCacheKey({
  modulePath,
  source,
  localProjectPathsKey
}: {
  modulePath: string;
  source: string;
  localProjectPathsKey: string;
}) {
  const normalizedModulePath = normalizeProjectFilePath(modulePath || '/index.html');
  const sourceSignature = `${source.length}:${hashPreviewCode(source)}`;
  return `${normalizedModulePath}\n${localProjectPathsKey}\n${sourceSignature}`;
}

function readCachedModuleSpecifierRewrite(cacheKey: string) {
  const cached = moduleSpecifierRewriteCache.get(cacheKey);
  if (typeof cached !== 'string') return null;
  // Refresh insertion order for simple LRU behavior.
  moduleSpecifierRewriteCache.delete(cacheKey);
  moduleSpecifierRewriteCache.set(cacheKey, cached);
  return cached;
}

function writeCachedModuleSpecifierRewrite(cacheKey: string, rewrittenSource: string) {
  moduleSpecifierRewriteCache.set(cacheKey, rewrittenSource);
  while (
    moduleSpecifierRewriteCache.size > MODULE_SPECIFIER_REWRITE_CACHE_MAX_ENTRIES
  ) {
    const oldestKey = moduleSpecifierRewriteCache.keys().next().value;
    if (typeof oldestKey !== 'string') break;
    moduleSpecifierRewriteCache.delete(oldestKey);
  }
}

function buildPreviewCodeSignature(codeWithSdk: string | null) {
  if (!codeWithSdk) return null;
  return `${codeWithSdk.length}:${hashPreviewCode(codeWithSdk)}`;
}

function buildEmptyRuntimeObservationState({
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
        .map((text) => String(text || '').trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const revealsLabels = Array.isArray(rawExpectedSignals.revealsLabels)
    ? rawExpectedSignals.revealsLabels
        .map((label) => String(label || '').trim())
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
    textIncludes: textIncludes.map((text) => text.slice(0, 80)),
    revealsLabels: revealsLabels.map((label) => label.slice(0, 80))
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
    ? payload.interactionSteps
        .map((step): BuildRuntimeInteractionStep | null => {
          if (!step || typeof step !== 'object') return null;
          const targetLabel = String(step.targetLabel || '').trim();
          const routeBefore = String(step.routeBefore || '').trim();
          const routeAfter = String(step.routeAfter || '').trim();
          const hashBefore = String(step.hashBefore || '').trim();
          const hashAfter = String(step.hashAfter || '').trim();
          const visibleTextBefore = String(step.visibleTextBefore || '').trim();
          const visibleTextAfter = String(step.visibleTextAfter || '').trim();
          const headingDelta = Number(step.headingDelta);
          const buttonDelta = Number(step.buttonDelta);
          const formDelta = Number(step.formDelta);
          const observedAtValue = Number(step.observedAt);
          const status = String(step.status || '').trim();
          const revealedTargetLabels = Array.isArray(step.revealedTargetLabels)
            ? step.revealedTargetLabels
                .map((label) => String(label || '').trim())
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
            source: step.source === 'planned' ? 'planned' : 'generic',
            goal:
              typeof step.goal === 'string' && step.goal.trim()
                ? step.goal.trim().slice(0, 220)
                : null,
            actionKind:
              step.actionKind === 'submit-form'
                ? 'submit-form'
                : step.actionKind === 'click'
                  ? 'click'
                  : null,
            expectedSignals: normalizeRuntimeExpectedSignals(
              step.expectedSignals
            ),
            targetLabel: targetLabel ? targetLabel.slice(0, 120) : null,
            status,
            routeBefore: routeBefore ? routeBefore.slice(0, 240) : null,
            routeAfter: routeAfter ? routeAfter.slice(0, 240) : null,
            hashBefore: hashBefore ? hashBefore.slice(0, 240) : null,
            hashAfter: hashAfter ? hashAfter.slice(0, 240) : null,
            routeChanged: Boolean(step.routeChanged),
            hashChanged: Boolean(step.hashChanged),
            visibleTextBefore: visibleTextBefore
              ? visibleTextBefore.slice(0, 180)
              : null,
            visibleTextAfter: visibleTextAfter
              ? visibleTextAfter.slice(0, 180)
              : null,
            headingDelta:
              Number.isFinite(headingDelta) ? Math.trunc(headingDelta) : 0,
            buttonDelta:
              Number.isFinite(buttonDelta) ? Math.trunc(buttonDelta) : 0,
            formDelta: Number.isFinite(formDelta) ? Math.trunc(formDelta) : 0,
            revealedTargetLabels,
            observedAt:
              Number.isFinite(observedAtValue) && observedAtValue > 0
                ? observedAtValue
                : Date.now()
          };
        })
        .filter(Boolean)
        .slice(0, 4) as BuildRuntimeInteractionStep[]
    : [];
  const gameplayTelemetry =
    payload.gameplayTelemetry && typeof payload.gameplayTelemetry === 'object'
      ? {
          playfieldBounds: normalizeRuntimeGameplayRect(
            payload.gameplayTelemetry.playfieldBounds
          ),
          playerBounds: normalizeRuntimeGameplayRect(
            payload.gameplayTelemetry.playerBounds
          ),
          overflowTop: Number.isFinite(Number(payload.gameplayTelemetry.overflowTop))
            ? Math.max(0, Math.floor(Number(payload.gameplayTelemetry.overflowTop)))
            : 0,
          overflowRight: Number.isFinite(
            Number(payload.gameplayTelemetry.overflowRight)
          )
            ? Math.max(0, Math.floor(Number(payload.gameplayTelemetry.overflowRight)))
            : 0,
          overflowBottom: Number.isFinite(
            Number(payload.gameplayTelemetry.overflowBottom)
          )
            ? Math.max(0, Math.floor(Number(payload.gameplayTelemetry.overflowBottom)))
            : 0,
          overflowLeft: Number.isFinite(
            Number(payload.gameplayTelemetry.overflowLeft)
          )
            ? Math.max(0, Math.floor(Number(payload.gameplayTelemetry.overflowLeft)))
            : 0,
          status:
            payload.gameplayTelemetry.status === 'out-of-bounds'
              ? 'out-of-bounds'
              : payload.gameplayTelemetry.status === 'ok'
                ? 'ok'
                : 'incomplete',
          reportedAt: Number.isFinite(Number(payload.gameplayTelemetry.reportedAt))
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
      Number.isFinite(formCount) && formCount >= 0
        ? Math.floor(formCount)
        : 0,
    viewportOverflowY:
      Number.isFinite(viewportOverflowY) && viewportOverflowY >= 0
        ? Math.floor(viewportOverflowY)
        : 0,
    viewportOverflowX:
      Number.isFinite(viewportOverflowX) && viewportOverflowX >= 0
        ? Math.floor(viewportOverflowX)
        : 0,
    visibleTextSample: visibleTextSample ? visibleTextSample.slice(0, 180) : null,
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
        .map((label) => String(label || '').trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const inputHints = Array.isArray(step.inputHints)
    ? step.inputHints
        .map((hint) => String(hint || '').trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const expectedSignals = normalizeRuntimeExpectedSignals(step.expectedSignals);
  if (!goal || labelHints.length === 0) return null;
  return {
    kind,
    goal: goal.slice(0, 220),
    labelHints: labelHints.map((label) => label.slice(0, 80)),
    inputHints: inputHints.map((hint) => hint.slice(0, 80)),
    expectedSignals
  };
}

function normalizeRuntimeExplorationPlan(
  plan: any
): BuildRuntimeExplorationPlan | null {
  if (!plan || typeof plan !== 'object') return null;
  const summary = String(plan.summary || '').trim();
  const steps = Array.isArray(plan.steps)
    ? plan.steps
        .map((step) => normalizeRuntimeExplorationPlanStep(step))
        .filter(Boolean)
        .slice(0, 3) as BuildRuntimeExplorationPlanStep[]
    : [];
  if (!summary || steps.length === 0) return null;
  return {
    summary: summary.slice(0, 240),
    generatedFrom:
      plan.generatedFrom === 'planner' ? 'planner' : 'heuristic',
    steps
  };
}

function revokePreviewUrl(src: string | null | undefined) {
  if (!src) return;
  try {
    URL.revokeObjectURL(src);
  } catch {
    // no-op
  }
}

function prunePreviewSeedCache() {
  const now = Date.now();
  for (const [buildId, entry] of previewSeedCache.entries()) {
    if (now - entry.cachedAt > PREVIEW_SEED_CACHE_TTL_MS) {
      revokePreviewUrl(entry.src);
      previewSeedCache.delete(buildId);
    }
  }

  if (previewSeedCache.size <= PREVIEW_SEED_CACHE_MAX_ENTRIES) return;

  const oldestEntries = Array.from(previewSeedCache.entries()).sort(
    (a, b) => a[1].cachedAt - b[1].cachedAt
  );
  const overflow = previewSeedCache.size - PREVIEW_SEED_CACHE_MAX_ENTRIES;
  for (let i = 0; i < overflow; i++) {
    const [buildId, entry] = oldestEntries[i];
    revokePreviewUrl(entry.src);
    previewSeedCache.delete(buildId);
  }
}

function takeCachedPreviewSeed(buildId: number, codeSignature: string | null) {
  prunePreviewSeedCache();
  if (!codeSignature) return null;
  const entry = previewSeedCache.get(buildId);
  if (!entry) return null;
  if (entry.codeSignature !== codeSignature) return null;
  previewSeedCache.delete(buildId);
  return entry;
}

function putCachedPreviewSeed(entry: PreviewSeedCacheEntry) {
  prunePreviewSeedCache();
  const existing = previewSeedCache.get(entry.buildId);
  if (existing?.src && existing.src !== entry.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.set(entry.buildId, entry);
  prunePreviewSeedCache();
}

function clearCachedPreviewSeed(buildId: number) {
  const existing = previewSeedCache.get(buildId);
  if (existing?.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.delete(buildId);
}

function rewriteLegacyTwinkleSdkSource(source: string) {
  if (!source) return source;
  let rewrittenSource = source;
  for (const [legacyMethod, nextMethod] of LEGACY_TWINKLE_SDK_METHOD_REPLACEMENTS) {
    if (!rewrittenSource.includes(legacyMethod)) continue;
    rewrittenSource = rewrittenSource.split(legacyMethod).join(nextMethod);
  }
  return rewrittenSource;
}

function isMutatingPreviewRequestType(type: string) {
  return MUTATING_PREVIEW_REQUEST_TYPES.has(type);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getGuestViewerDbCacheKey(buildId: number, guestSessionId: string) {
  return `${buildId}:${guestSessionId}`;
}

function getGuestViewerDbStorageKey(buildId: number, guestSessionId: string) {
  return `${GUEST_VIEWER_DB_STORAGE_KEY_PREFIX}${buildId}:${guestSessionId}`;
}

async function loadHostSqlJs() {
  if (hostSqlJsPromise) return hostSqlJsPromise;

  hostSqlJsPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      hostSqlJsPromise = null;
      reject(new Error('Window not available'));
      return;
    }

    function initializeSqlJs() {
      if (typeof window.initSqlJs !== 'function') {
        hostSqlJsPromise = null;
        reject(new Error('Failed to initialize sql.js'));
        return;
      }

      window
        .initSqlJs({
          locateFile: (file) => `${HOST_SQL_JS_CDN_BASE}/${file}`
        })
        .then(resolve)
        .catch((error) => {
          hostSqlJsPromise = null;
          reject(
            error instanceof Error
              ? error
              : new Error('Failed to initialize sql.js')
          );
        });
    }

    if (typeof window.initSqlJs === 'function') {
      initializeSqlJs();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-twinkle-host-sqljs="true"]'
    ) as HTMLScriptElement | null;
    const script = existingScript || document.createElement('script');

    function handleLoad() {
      initializeSqlJs();
    }

    function handleError() {
      hostSqlJsPromise = null;
      reject(new Error('Failed to load sql.js'));
    }

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.src = `${HOST_SQL_JS_CDN_BASE}/sql-wasm.min.js`;
      script.async = true;
      script.setAttribute('data-twinkle-host-sqljs', 'true');
      document.head.appendChild(script);
    }
  });

  return hostSqlJsPromise;
}

async function getGuestViewerDb({
  buildId,
  guestSessionId
}: {
  buildId: number;
  guestSessionId: string;
}) {
  const cacheKey = getGuestViewerDbCacheKey(buildId, guestSessionId);
  const cached = guestViewerDbCache.get(cacheKey);
  if (cached) return cached;

  const SQL = await loadHostSqlJs();
  const storageKey = getGuestViewerDbStorageKey(buildId, guestSessionId);

  try {
    const storedBase64 = window.localStorage.getItem(storageKey);
    if (storedBase64) {
      const db = new SQL.Database(base64ToBytes(storedBase64));
      guestViewerDbCache.set(cacheKey, db);
      return db;
    }
  } catch {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // no-op
    }
  }

  const emptyDb = new SQL.Database();
  guestViewerDbCache.set(cacheKey, emptyDb);
  return emptyDb;
}

function persistGuestViewerDb({
  buildId,
  guestSessionId,
  db
}: {
  buildId: number;
  guestSessionId: string;
  db: any;
}) {
  const exported = db.export() as Uint8Array;
  if (exported.length > GUEST_VIEWER_DB_SIZE_LIMIT_BYTES) {
    throw new Error('Guest app data exceeds the local storage limit.');
  }

  try {
    window.localStorage.setItem(
      getGuestViewerDbStorageKey(buildId, guestSessionId),
      bytesToBase64(exported)
    );
  } catch {
    throw new Error('Failed to save guest app data locally.');
  }
}

async function executeGuestViewerDbQuery({
  buildId,
  guestSessionId,
  sql,
  params
}: {
  buildId: number;
  guestSessionId: string;
  sql: string;
  params?: any[];
}) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('SQL is required');
  }
  if (typeof params !== 'undefined' && !Array.isArray(params)) {
    throw new Error('Params must be an array');
  }

  const db = await getGuestViewerDb({ buildId, guestSessionId });
  const stmt = db.prepare(sql);

  try {
    if (!stmt.reader) {
      throw new Error('Query must return rows');
    }
    if (params?.length) {
      stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    const rowCount = rows.length;
    const truncated = rowCount > GUEST_VIEWER_DB_MAX_ROWS;

    return {
      rows: truncated ? rows.slice(0, GUEST_VIEWER_DB_MAX_ROWS) : rows,
      rowCount,
      truncated
    };
  } finally {
    stmt.free();
  }
}

async function executeGuestViewerDbExec({
  buildId,
  guestSessionId,
  sql,
  params
}: {
  buildId: number;
  guestSessionId: string;
  sql: string;
  params?: any[];
}) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new Error('SQL is required');
  }
  if (typeof params !== 'undefined' && !Array.isArray(params)) {
    throw new Error('Params must be an array');
  }

  const db = await getGuestViewerDb({ buildId, guestSessionId });
  const stmt = db.prepare(sql);

  try {
    if (stmt.reader) {
      throw new Error('Use query() for SELECT statements');
    }

    stmt.run(params || []);
    const metadataResult = db.exec(
      'SELECT changes() AS changes, last_insert_rowid() AS lastInsertRowid'
    );
    const metadataRow = metadataResult?.[0]?.values?.[0] || [];

    persistGuestViewerDb({ buildId, guestSessionId, db });

    return {
      changes: Number(metadataRow[0] || 0),
      lastInsertRowid: Number(metadataRow[1] || 0)
    };
  } finally {
    stmt.free();
  }
}

function normalizeProjectFilePath(rawPath: string) {
  const source = String(rawPath || '').trim().replace(/\\/g, '/');
  const withRoot = source.startsWith('/') ? source : `/${source}`;
  const normalized = withRoot
    .replace(/\/{2,}/g, '/')
    .replace(/\/\.\//g, '/');
  const parts = normalized.split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      out.pop();
      continue;
    }
    out.push(part);
  }
  return `/${out.join('/')}`;
}

function isIndexHtmlPath(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath).toLowerCase();
  return normalized === '/index.html' || normalized === '/index.htm';
}

function getPreferredIndexFile<T extends { path: string }>(files: T[]) {
  let htmMatch: T | null = null;
  for (const file of files || []) {
    const normalized = normalizeProjectFilePath(file.path).toLowerCase();
    if (normalized === '/index.html') {
      return file;
    }
    if (!htmMatch && normalized === '/index.htm') {
      htmMatch = file;
    }
  }
  return htmMatch;
}

function getPreferredIndexPath<T extends { path: string }>(files: T[]) {
  return getPreferredIndexFile(files)?.path || null;
}

interface EditableProjectFile {
  path: string;
  content: string;
}

interface ProjectFileTreeFolder {
  path: string;
  name: string;
  folders: ProjectFileTreeFolder[];
  files: EditableProjectFile[];
}

interface ProjectExplorerEntryFolder {
  kind: 'folder';
  path: string;
  name: string;
  depth: number;
  fileCount: number;
}

interface ProjectExplorerEntryFile {
  kind: 'file';
  file: EditableProjectFile;
  depth: number;
}

type ProjectExplorerEntry = ProjectExplorerEntryFolder | ProjectExplorerEntryFile;

function getFileNameFromPath(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath);
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || normalized;
}

function buildEditableProjectFiles({
  code,
  projectFiles
}: {
  code: string | null;
  projectFiles: Array<{ path: string; content?: string }>;
}): EditableProjectFile[] {
  const deduped = new Map<string, string>();
  for (const file of projectFiles || []) {
    if (!file || typeof file !== 'object') continue;
    const normalizedPath = normalizeProjectFilePath(file.path);
    if (!normalizedPath || normalizedPath === '/') continue;
    deduped.set(
      normalizedPath,
      typeof file.content === 'string' ? file.content : ''
    );
  }
  if (!Array.from(deduped.keys()).some((path) => isIndexHtmlPath(path))) {
    deduped.set('/index.html', String(code || ''));
  }
  return Array.from(deduped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([path, content]) => ({ path, content }));
}

function serializeEditableProjectFiles(files: EditableProjectFile[]) {
  return files.map((file) => `${file.path}\n${file.content}`).join('\n---\n');
}

function isPathWithinFolder(filePath: string, folderPath: string) {
  const normalizedFile = normalizeProjectFilePath(filePath);
  const normalizedFolder = normalizeProjectFilePath(folderPath);
  if (normalizedFolder === '/') return true;
  return normalizedFile.startsWith(`${normalizedFolder}/`);
}

function remapPathPrefix({
  filePath,
  fromPrefix,
  toPrefix
}: {
  filePath: string;
  fromPrefix: string;
  toPrefix: string;
}) {
  const normalizedFilePath = normalizeProjectFilePath(filePath);
  const normalizedFrom = normalizeProjectFilePath(fromPrefix);
  const normalizedTo = normalizeProjectFilePath(toPrefix);
  if (normalizedFilePath === normalizedFrom) {
    return normalizedTo;
  }
  if (normalizedFilePath.startsWith(`${normalizedFrom}/`)) {
    return `${normalizedTo}${normalizedFilePath.slice(normalizedFrom.length)}`;
  }
  return normalizedFilePath;
}

function buildProjectFileTree(files: EditableProjectFile[]) {
  const root: ProjectFileTreeFolder = {
    path: '/',
    name: '',
    folders: [],
    files: []
  };
  const folderByPath = new Map<string, ProjectFileTreeFolder>([['/', root]]);
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const normalizedPath = normalizeProjectFilePath(file.path);
    const pathParts = normalizedPath.split('/').filter(Boolean);
    const fileName = pathParts[pathParts.length - 1];
    if (!fileName) continue;
    const folderParts = pathParts.slice(0, -1);
    let currentFolder = root;
    let currentPath = '';

    for (const segment of folderParts) {
      currentPath += `/${segment}`;
      let nextFolder = folderByPath.get(currentPath);
      if (!nextFolder) {
        nextFolder = {
          path: currentPath,
          name: segment,
          folders: [],
          files: []
        };
        currentFolder.folders.push(nextFolder);
        folderByPath.set(currentPath, nextFolder);
      }
      currentFolder = nextFolder;
    }

    currentFolder.files.push({
      path: normalizedPath,
      content: file.content
    });
  }

  function sortFolder(folder: ProjectFileTreeFolder) {
    folder.folders.sort((a, b) => a.path.localeCompare(b.path));
    folder.files.sort((a, b) => a.path.localeCompare(b.path));
    for (const childFolder of folder.folders) {
      sortFolder(childFolder);
    }
  }
  sortFolder(root);
  return root;
}

function countFolderFiles(folder: ProjectFileTreeFolder): number {
  return folder.files.length + folder.folders.reduce((sum, childFolder) => {
    return sum + countFolderFiles(childFolder);
  }, 0);
}

function buildProjectExplorerEntries({
  files,
  collapsedFolders
}: {
  files: EditableProjectFile[];
  collapsedFolders: Record<string, boolean>;
}) {
  const root = buildProjectFileTree(files);
  const entries: ProjectExplorerEntry[] = [];

  function visitFolder(folder: ProjectFileTreeFolder, depth: number) {
    for (const childFolder of folder.folders) {
      const isCollapsed = Boolean(collapsedFolders[childFolder.path]);
      entries.push({
        kind: 'folder',
        path: childFolder.path,
        name: childFolder.name,
        depth,
        fileCount: countFolderFiles(childFolder)
      });
      if (!isCollapsed) {
        visitFolder(childFolder, depth + 1);
      }
    }
    for (const file of folder.files) {
      entries.push({
        kind: 'file',
        file,
        depth
      });
    }
  }

  visitFolder(root, 0);
  return entries;
}

function resolveLocalProjectPathFromBase(rawValue: string, basePath: string) {
  const value = String(rawValue || '').trim();
  if (!value || value.startsWith('#')) return null;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) || value.startsWith('//')) {
    return null;
  }
  try {
    const normalizedBasePath = normalizeProjectFilePath(basePath || '/index.html');
    const url = new URL(value, `https://twinkle.local${normalizedBasePath}`);
    return normalizeProjectFilePath(url.pathname);
  } catch {
    return null;
  }
}

function resolveLocalProjectPath(rawValue: string) {
  return resolveLocalProjectPathFromBase(rawValue, '/index.html');
}

function isPotentialLocalModuleFile(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath).toLowerCase();
  return (
    normalized.endsWith('.js') ||
    normalized.endsWith('.mjs') ||
    normalized.endsWith('.cjs') ||
    normalized.endsWith('.jsx') ||
    normalized.endsWith('.ts') ||
    normalized.endsWith('.tsx') ||
    normalized.endsWith('.json')
  );
}

function buildLocalModuleImportSpecifier(filePath: string) {
  return `twinkle-local${normalizeProjectFilePath(filePath)}`;
}

function rewriteLocalModuleSpecifiersToAbsolutePaths({
  source,
  modulePath,
  localProjectPaths,
  localProjectPathsKey,
  rewriteResolvedPath
}: {
  source: string;
  modulePath: string;
  localProjectPaths: Set<string>;
  localProjectPathsKey: string;
  rewriteResolvedPath?: ((resolvedPath: string) => string) | null;
}) {
  const cacheKey = buildModuleSpecifierRewriteCacheKey({
    modulePath,
    source,
    localProjectPathsKey
  });
  const cachedSource = readCachedModuleSpecifierRewrite(cacheKey);
  if (cachedSource !== null) {
    return cachedSource;
  }
  const maybeRewriteSpecifier = (rawSpecifier: string) => {
    const resolvedPath = resolveLocalProjectPathFromBase(rawSpecifier, modulePath);
    if (!resolvedPath || !localProjectPaths.has(resolvedPath)) {
      return rawSpecifier;
    }
    if (typeof rewriteResolvedPath === 'function') {
      return rewriteResolvedPath(resolvedPath);
    }
    return buildLocalModuleImportSpecifier(resolvedPath);
  };
  const rewrites: Array<{ start: number; end: number; replacement: string }> = [];

  function queueLiteralRewrite(node: any) {
    if (!node || typeof node !== 'object') return;
    if (node.type !== 'StringLiteral') return;
    if (typeof node.value !== 'string') return;
    if (!Number.isFinite(node.start) || !Number.isFinite(node.end)) return;
    const rewritten = maybeRewriteSpecifier(node.value);
    if (rewritten === node.value) return;
    rewrites.push({
      start: Number(node.start),
      end: Number(node.end),
      replacement: JSON.stringify(rewritten)
    });
  }

  function visitNode(node: any) {
    if (!node || typeof node !== 'object') return;

    if (
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportAllDeclaration' ||
      node.type === 'ExportNamedDeclaration'
    ) {
      queueLiteralRewrite(node.source);
    } else if (node.type === 'ImportExpression') {
      queueLiteralRewrite(node.source);
    } else if (
      node.type === 'CallExpression' &&
      node.callee &&
      node.callee.type === 'Import' &&
      Array.isArray(node.arguments) &&
      node.arguments.length > 0
    ) {
      queueLiteralRewrite(node.arguments[0]);
    }

    for (const value of Object.values(node)) {
      if (!value) continue;
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object') {
            visitNode(child);
          }
        }
        continue;
      }
      if (value && typeof value === 'object') {
        visitNode(value);
      }
    }
  }

  try {
    const ast = parseJavaScriptModule(source, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      plugins: [
        'jsx',
        'typescript',
        'dynamicImport',
        'importAttributes',
        'topLevelAwait',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'decorators-legacy'
      ]
    });
    visitNode(ast.program);
  } catch (parseError) {
    // Keep preview resilient: if module parsing fails, return source unchanged.
    console.error('Failed to parse module for specifier rewrite:', {
      modulePath,
      error: parseError
    });
    writeCachedModuleSpecifierRewrite(cacheKey, source);
    return source;
  }

  if (rewrites.length === 0) {
    writeCachedModuleSpecifierRewrite(cacheKey, source);
    return source;
  }

  rewrites.sort((a, b) => b.start - a.start);
  let rewritten = source;
  for (const entry of rewrites) {
    rewritten =
      rewritten.slice(0, entry.start) +
      entry.replacement +
      rewritten.slice(entry.end);
  }
  writeCachedModuleSpecifierRewrite(cacheKey, rewritten);
  return rewritten;
}

function buildLocalProjectPathsKey(localProjectPaths: Set<string>) {
  const sortedLocalProjectPaths = Array.from(localProjectPaths.values()).sort((a, b) =>
    a.localeCompare(b)
  );
  return `${sortedLocalProjectPaths.length}:${hashPreviewCode(
    sortedLocalProjectPaths.join('\n')
  )}`;
}

function buildLocalModuleImportMap({
  fileMap,
  localProjectPaths,
  localProjectPathsKey
}: {
  fileMap: Map<string, string>;
  localProjectPaths: Set<string>;
  localProjectPathsKey: string;
}) {
  const imports: Record<string, string> = {};
  for (const [filePath, source] of fileMap.entries()) {
    if (!isPotentialLocalModuleFile(filePath)) continue;
    const normalizedPath = normalizeProjectFilePath(filePath);
    const lowerPath = normalizedPath.toLowerCase();
    const isJsonModule = lowerPath.endsWith('.json');
    const rewrittenSdkSource = isJsonModule
      ? source
      : rewriteLegacyTwinkleSdkSource(source);
    const rewrittenSource = isJsonModule
      ? source
      : rewriteLocalModuleSpecifiersToAbsolutePaths({
          source: rewrittenSdkSource,
          modulePath: normalizedPath,
          localProjectPaths,
          localProjectPathsKey
        });
    const mimeType = isJsonModule ? 'application/json' : 'text/javascript';
    imports[buildLocalModuleImportSpecifier(normalizedPath)] = `data:${mimeType};charset=utf-8,${encodeURIComponent(
      rewrittenSource
    )}`;
  }
  return imports;
}

function buildPreviewSessionFileUrl(sessionId: string, filePath: string) {
  return `/build/preview/${encodeURIComponent(sessionId)}${normalizeProjectFilePath(
    filePath
  )}`;
}

function rewriteLocalCssUrlsForPreviewSession({
  source,
  filePath,
  localProjectPaths,
  sessionId
}: {
  source: string;
  filePath: string;
  localProjectPaths: Set<string>;
  sessionId: string;
}) {
  if (!source) return source;
  return source.replace(
    /url\(\s*(['"]?)([^)"']+)\1\s*\)/gi,
    (match, quote, rawValue) => {
      const resolvedPath = resolveLocalProjectPathFromBase(rawValue, filePath);
      if (!resolvedPath || !localProjectPaths.has(resolvedPath)) {
        return match;
      }
      const nextUrl = buildPreviewSessionFileUrl(sessionId, resolvedPath);
      if (quote) {
        return `url(${quote}${nextUrl}${quote})`;
      }
      return `url("${nextUrl}")`;
    }
  );
}

function rewriteHtmlSrcsetForPreviewSession({
  rawValue,
  filePath,
  localProjectPaths,
  sessionId
}: {
  rawValue: string;
  filePath: string;
  localProjectPaths: Set<string>;
  sessionId: string;
}) {
  return String(rawValue || '')
    .split(',')
    .map((entry) => {
      const trimmed = String(entry || '').trim();
      if (!trimmed) return '';
      const [candidateUrl, descriptor] = trimmed.split(/\s+/, 2);
      const resolvedPath = resolveLocalProjectPathFromBase(candidateUrl, filePath);
      if (!resolvedPath || !localProjectPaths.has(resolvedPath)) {
        return trimmed;
      }
      const rewrittenUrl = buildPreviewSessionFileUrl(sessionId, resolvedPath);
      return descriptor ? `${rewrittenUrl} ${descriptor}` : rewrittenUrl;
    })
    .filter(Boolean)
    .join(', ');
}

function buildPreviewSessionUrlBridgeScript({
  sessionId,
  localProjectPaths
}: {
  sessionId: string;
  localProjectPaths: Set<string>;
}) {
  const sortedPaths = Array.from(localProjectPaths.values()).sort((a, b) =>
    a.localeCompare(b)
  );
  return `<script>
(function() {
  var previewSessionBase = ${JSON.stringify(`/build/preview/${encodeURIComponent(sessionId)}`)};
  var localProjectPaths = ${JSON.stringify(sortedPaths)};
  var localProjectPathSet = Object.create(null);
  for (var i = 0; i < localProjectPaths.length; i += 1) {
    localProjectPathSet[localProjectPaths[i]] = true;
  }

  function resolvePreviewLocalUrl(value) {
    if (value == null) return null;
    try {
      var url = new URL(String(value), window.location.href);
      if (url.origin !== window.location.origin) return null;
      if (!localProjectPathSet[url.pathname]) return null;
      return previewSessionBase + url.pathname + url.search + url.hash;
    } catch (_) {
      return null;
    }
  }

  var originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = function(input, init) {
      if (typeof Request !== 'undefined' && input instanceof Request) {
        var rewrittenRequestUrl = resolvePreviewLocalUrl(input.url);
        if (rewrittenRequestUrl) {
          return originalFetch.call(this, new Request(rewrittenRequestUrl, input), init);
        }
      } else {
        var rewrittenFetchUrl = resolvePreviewLocalUrl(input);
        if (rewrittenFetchUrl) {
          return originalFetch.call(this, rewrittenFetchUrl, init);
        }
      }
      return originalFetch.call(this, input, init);
    };
  }

  var originalXhrOpen = XMLHttpRequest && XMLHttpRequest.prototype.open;
  if (typeof originalXhrOpen === 'function') {
    XMLHttpRequest.prototype.open = function(method, url) {
      var rewrittenXhrUrl = resolvePreviewLocalUrl(url);
      if (rewrittenXhrUrl) {
        arguments[1] = rewrittenXhrUrl;
      }
      return originalXhrOpen.apply(this, arguments);
    };
  }

  function wrapUrlConstructor(OriginalConstructor) {
    if (typeof OriginalConstructor !== 'function') return OriginalConstructor;
    return function(url) {
      var rewrittenUrl = resolvePreviewLocalUrl(url);
      if (rewrittenUrl) {
        arguments[0] = rewrittenUrl;
      }
      return Reflect.construct(OriginalConstructor, arguments, new.target || OriginalConstructor);
    };
  }

  if (typeof window.Worker === 'function') {
    window.Worker = wrapUrlConstructor(window.Worker);
  }
  if (typeof window.SharedWorker === 'function') {
    window.SharedWorker = wrapUrlConstructor(window.SharedWorker);
  }
  if (typeof window.EventSource === 'function') {
    window.EventSource = wrapUrlConstructor(window.EventSource);
  }
})();
</script>`;
}

function injectPreviewScriptsIntoHtml({
  html,
  scriptsHtml
}: {
  html: string;
  scriptsHtml: string;
}) {
  if (!html) return scriptsHtml;
  if (html.includes('<head>')) {
    return html.replace('<head>', '<head>' + scriptsHtml);
  }
  if (html.includes('<body>')) {
    return html.replace('<body>', '<body>' + scriptsHtml);
  }
  return scriptsHtml + html;
}

function rewriteLocalProjectHtmlForPreviewSession({
  html,
  filePath,
  localProjectPaths,
  localProjectPathsKey,
  sessionId
}: {
  html: string;
  filePath: string;
  localProjectPaths: Set<string>;
  localProjectPathsKey: string;
  sessionId: string;
}) {
  if (!html) return html;

  const rewriteLocalUrl = (rawValue: string) => {
    const resolvedPath = resolveLocalProjectPathFromBase(rawValue, filePath);
    if (!resolvedPath || !localProjectPaths.has(resolvedPath)) {
      return rawValue;
    }
    return buildPreviewSessionFileUrl(sessionId, resolvedPath);
  };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const scriptNodes = Array.from(doc.querySelectorAll('script'));
    for (const scriptNode of scriptNodes) {
      const scriptType = String(scriptNode.getAttribute('type') || '')
        .trim()
        .toLowerCase();
      const isModuleScript = scriptType === 'module';
      const rawSrc = scriptNode.getAttribute('src');
      if (rawSrc && rawSrc.trim()) {
        const rewrittenSrc = rewriteLocalUrl(rawSrc);
        if (rewrittenSrc !== rawSrc) {
          scriptNode.setAttribute('src', rewrittenSrc);
          scriptNode.removeAttribute('integrity');
        }
        continue;
      }
      const inlineSource = String(scriptNode.textContent || '');
      let rewrittenInlineSource = rewriteLegacyTwinkleSdkSource(inlineSource);
      if (isModuleScript) {
        rewrittenInlineSource = rewriteLocalModuleSpecifiersToAbsolutePaths({
          source: rewrittenInlineSource,
          modulePath: filePath,
          localProjectPaths,
          localProjectPathsKey,
          rewriteResolvedPath: (resolvedPath) =>
            buildPreviewSessionFileUrl(sessionId, resolvedPath)
        });
      }
      if (rewrittenInlineSource !== inlineSource) {
        scriptNode.textContent = rewrittenInlineSource;
      }
    }

    const styleNodes = Array.from(doc.querySelectorAll('style'));
    for (const styleNode of styleNodes) {
      styleNode.textContent = rewriteLocalCssUrlsForPreviewSession({
        source: String(styleNode.textContent || ''),
        filePath,
        localProjectPaths,
        sessionId
      });
    }

    const attrSelectors: Array<{
      selector: string;
      attribute: 'href' | 'src' | 'poster' | 'data' | 'srcset';
    }> = [
      { selector: '[href]', attribute: 'href' },
      { selector: '[src]', attribute: 'src' },
      { selector: '[poster]', attribute: 'poster' },
      { selector: 'object[data]', attribute: 'data' },
      { selector: 'img[srcset], source[srcset]', attribute: 'srcset' }
    ];

    for (const entry of attrSelectors) {
      const nodes = Array.from(doc.querySelectorAll(entry.selector));
      for (const node of nodes) {
        const currentValue = String(node.getAttribute(entry.attribute) || '');
        if (!currentValue) continue;
        const rewrittenValue =
          entry.attribute === 'srcset'
            ? rewriteHtmlSrcsetForPreviewSession({
                rawValue: currentValue,
                filePath,
                localProjectPaths,
                sessionId
              })
            : rewriteLocalUrl(currentValue);
        if (rewrittenValue !== currentValue) {
          node.setAttribute(entry.attribute, rewrittenValue);
          if (entry.attribute === 'src' || entry.attribute === 'href') {
            node.removeAttribute('integrity');
          }
        }
      }
    }

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  } catch (error) {
    console.error('Failed to rewrite preview-session HTML:', error);
    return html;
  }
}

function buildPreviewSessionProjectFiles({
  code,
  projectFiles,
  sessionId
}: {
  code: string | null;
  projectFiles: Array<{ path: string; content?: string }>;
  sessionId: string;
}) {
  const normalizedFiles = buildEditableProjectFiles({ code, projectFiles }).map(
    (file) => ({
      path: file.path,
      content: file.content
    })
  );
  const localProjectPaths = new Set<string>(
    normalizedFiles.map((file) => normalizeProjectFilePath(file.path))
  );
  const localProjectPathsKey = buildLocalProjectPathsKey(localProjectPaths);
  const injectedScripts =
    buildPreviewSessionUrlBridgeScript({
      sessionId,
      localProjectPaths
    }) + TWINKLE_SDK_SCRIPT;

  return normalizedFiles.map((file) => {
    const normalizedPath = normalizeProjectFilePath(file.path);
    const lowerPath = normalizedPath.toLowerCase();
    let content = String(file.content || '');

    if (lowerPath.endsWith('.html') || lowerPath.endsWith('.htm')) {
      content = rewriteLocalProjectHtmlForPreviewSession({
        html: content,
        filePath: normalizedPath,
        localProjectPaths,
        localProjectPathsKey,
        sessionId
      });
      content = injectPreviewScriptsIntoHtml({
        html: content,
        scriptsHtml: injectedScripts
      });
    } else if (isPotentialLocalModuleFile(normalizedPath)) {
      const rewrittenSdkSource = rewriteLegacyTwinkleSdkSource(content);
      content = rewriteLocalModuleSpecifiersToAbsolutePaths({
        source: rewrittenSdkSource,
        modulePath: normalizedPath,
        localProjectPaths,
        localProjectPathsKey,
        rewriteResolvedPath: (resolvedPath) =>
          buildPreviewSessionFileUrl(sessionId, resolvedPath)
      });
    } else if (lowerPath.endsWith('.css')) {
      content = rewriteLocalCssUrlsForPreviewSession({
        source: content,
        filePath: normalizedPath,
        localProjectPaths,
        sessionId
      });
    }

    return {
      path: normalizedPath,
      content
    };
  });
}

function buildLocalScriptDataUrl({
  source,
  mimeType = 'text/javascript'
}: {
  source: string;
  mimeType?: string;
}) {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(source)}`;
}

function preserveLocalStylesheetLinkAttributes({
  linkNode,
  styleNode
}: {
  linkNode: HTMLLinkElement;
  styleNode: HTMLStyleElement;
}) {
  const media = String(linkNode.getAttribute('media') || '').trim();
  if (media) {
    styleNode.setAttribute('media', media);
  }
  const title = String(linkNode.getAttribute('title') || '').trim();
  if (title) {
    styleNode.setAttribute('title', title);
  }
  const nonce = String(linkNode.getAttribute('nonce') || '').trim();
  if (nonce) {
    styleNode.setAttribute('nonce', nonce);
  }
  if (linkNode.hasAttribute('disabled')) {
    styleNode.setAttribute('disabled', '');
  }
  const id = String(linkNode.getAttribute('id') || '').trim();
  if (id) {
    styleNode.setAttribute('id', id);
  }
  const className = String(linkNode.getAttribute('class') || '').trim();
  if (className) {
    styleNode.setAttribute('class', className);
  }
  for (const attribute of Array.from(linkNode.attributes)) {
    const name = String(attribute?.name || '');
    const lowerName = name.toLowerCase();
    if (!lowerName.startsWith('data-') && !lowerName.startsWith('aria-')) continue;
    styleNode.setAttribute(name, String(attribute?.value || ''));
  }
}

function inlineLocalProjectAssets({
  html,
  projectFiles
}: {
  html: string;
  projectFiles: Array<{ path: string; content?: string }>;
}) {
  if (!html) return html;

  const fileMap = new Map<string, string>();
  if (Array.isArray(projectFiles)) {
    for (const file of projectFiles) {
      if (!file || typeof file !== 'object') continue;
      if (typeof file.content !== 'string') continue;
      const normalized = normalizeProjectFilePath(String(file.path || ''));
      if (!normalized || normalized === '/') continue;
      fileMap.set(normalized, file.content);
    }
  }
  const localProjectPaths = new Set<string>(fileMap.keys());
  const localProjectPathsKey = buildLocalProjectPathsKey(localProjectPaths);
  const moduleImportMap = buildLocalModuleImportMap({
    fileMap,
    localProjectPaths,
    localProjectPathsKey
  });
  const hasModuleImportMap = Object.keys(moduleImportMap).length > 0;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let firstLocalModuleEntryScript: HTMLScriptElement | null = null;

    const scriptNodes = Array.from(doc.querySelectorAll('script'));
    for (const scriptNode of scriptNodes) {
      const scriptType = String(scriptNode.getAttribute('type') || '')
        .trim()
        .toLowerCase();
      const isModuleScript = scriptType === 'module';
      const src = scriptNode.getAttribute('src');
      const hasSrc = typeof src === 'string' && src.trim().length > 0;
      if (!hasSrc) {
        const inlineSource = String(scriptNode.textContent || '');
        let rewrittenInlineSource = rewriteLegacyTwinkleSdkSource(inlineSource);
        if (isModuleScript && hasModuleImportMap) {
          rewrittenInlineSource = rewriteLocalModuleSpecifiersToAbsolutePaths({
            source: rewrittenInlineSource,
            modulePath: '/index.html',
            localProjectPaths,
            localProjectPathsKey
          });
        }
        if (rewrittenInlineSource !== inlineSource) {
          scriptNode.textContent = rewrittenInlineSource;
        }
        if (isModuleScript && hasModuleImportMap && !firstLocalModuleEntryScript) {
          firstLocalModuleEntryScript = scriptNode;
        }
        continue;
      }
      const resolvedPath = resolveLocalProjectPath(src || '');
      if (!resolvedPath) continue;
      if (isModuleScript) {
        // Keep module import resolution stable by routing local module paths
        // through an import map and preserving external module script loading
        // semantics (async/defer/ordering) via src rewrite.
        const mappedEntry = moduleImportMap[resolvedPath];
        if (!hasModuleImportMap || !mappedEntry) {
          continue;
        }
        const moduleEntryScript = scriptNode.cloneNode(false) as HTMLScriptElement;
        moduleEntryScript.setAttribute('src', mappedEntry);
        moduleEntryScript.removeAttribute('integrity');
        scriptNode.replaceWith(moduleEntryScript);
        if (!firstLocalModuleEntryScript) {
          firstLocalModuleEntryScript = moduleEntryScript;
        }
        continue;
      }
      const scriptContent = fileMap.get(resolvedPath);
      if (typeof scriptContent !== 'string') continue;
      const rawScriptType = String(scriptNode.getAttribute('type') || '').trim();
      const mimeType = rawScriptType || 'text/javascript';
      const rewrittenScriptContent = rewriteLegacyTwinkleSdkSource(scriptContent);
      const rewrittenClassicScript = scriptNode.cloneNode(false) as HTMLScriptElement;
      rewrittenClassicScript.setAttribute(
        'src',
        buildLocalScriptDataUrl({
          source: rewrittenScriptContent,
          mimeType
        })
      );
      rewrittenClassicScript.removeAttribute('integrity');
      scriptNode.replaceWith(rewrittenClassicScript);
    }
    if (firstLocalModuleEntryScript && hasModuleImportMap) {
      const importMapScript = doc.createElement('script');
      importMapScript.setAttribute('type', 'importmap');
      importMapScript.textContent = JSON.stringify({
        imports: moduleImportMap
      });
      firstLocalModuleEntryScript.before(importMapScript);
    }

    const stylesheetNodes = Array.from(
      doc.querySelectorAll('link[rel~="stylesheet"][href]')
    );
    for (const linkNode of stylesheetNodes) {
      const href = linkNode.getAttribute('href');
      const resolvedPath = resolveLocalProjectPath(href || '');
      if (!resolvedPath) continue;
      const stylesheetContent = fileMap.get(resolvedPath);
      if (typeof stylesheetContent !== 'string') continue;
      const styleNode = doc.createElement('style');
      styleNode.textContent = stylesheetContent;
      preserveLocalStylesheetLinkAttributes({
        linkNode: linkNode as HTMLLinkElement,
        styleNode
      });
      linkNode.replaceWith(styleNode);
    }

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  } catch (error) {
    console.error('Failed to inline project assets for preview:', error);
    return html;
  }
}

// The Twinkle SDK script that gets injected into builds
const TWINKLE_SDK_SCRIPT = String.raw`
<script>
var Twinkle;
(function() {
  'use strict';
  if (window.Twinkle) {
    Twinkle = window.Twinkle;
    return;
  }

  let SQL = null;
  let db = null;
  let isInitialized = false;
  let pendingRequests = new Map();
  let requestId = 0;
  let viewerInfo = null;
  let capabilitySnapshot = null;
  let runtimeExplorationPlan = null;
  var blankRenderProbeState = {
    scheduled: false,
    resolved: false,
    reported: false
  };
  var previewInteractionProbeState = {
    scheduled: false,
    completed: false,
    status: 'idle',
    targetLabel: '',
    steps: [],
    usedTargetLabels: Object.create(null),
    planStepIndex: 0
  };
  var previewHealthLastKey = '';
  var previewHealthMutationTimer = null;
  var previewHealthObserver = null;
  var keyboardScrollProbeState = {
    reported: false
  };
  var viewportModeState = {
    mode: 'document',
    styleInjected: false
  };
  var viewportFitState = {
    scheduled: false,
    candidate: null,
    scale: 1,
    baseWidth: 0,
    baseHeight: 0
  };
  var previewLayoutState = {
    reservedInsets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    listeners: [],
    current: null,
    lastKey: ''
  };
  var gameplayTelemetryState = {
    playfieldBounds: null,
    playerBounds: null,
    scheduled: false
  };

  function getRequestId() {
    return 'twinkle_' + (++requestId) + '_' + Date.now();
  }

  function resolveRequestTimeoutMs(type, options) {
    const requestedTimeout = Number(options && options.timeoutMs);
    if (Number.isFinite(requestedTimeout) && requestedTimeout > 0) {
      return requestedTimeout;
    }
    return 30000;
  }

  function sendRequest(type, payload, options) {
    return new Promise((resolve, reject) => {
      const id = getRequestId();
      const timeoutMs = resolveRequestTimeoutMs(type, options);
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }, timeoutMs);

      pendingRequests.set(id, { resolve, reject, timeout });

      window.parent.postMessage({
        source: 'twinkle-build',
        id: id,
        type: type,
        payload: payload
      }, '*');
    });
  }

  function applyViewerInfo(info) {
    viewerInfo = info || null;
    if (!window.Twinkle || !window.Twinkle.viewer) return;
    const viewer = window.Twinkle.viewer;
    if (!info) {
      viewer.id = null;
      viewer.username = null;
      viewer.profilePicUrl = null;
      viewer.isLoggedIn = false;
      viewer.isOwner = false;
      viewer.isGuest = false;
      return;
    }
    viewer.id = info.id || null;
    viewer.username = info.username || null;
    viewer.profilePicUrl = info.profilePicUrl || null;
    viewer.isLoggedIn = Boolean(info.isLoggedIn);
    viewer.isOwner = Boolean(info.isOwner);
    viewer.isGuest = Boolean(info.isGuest);
  }

  function applyCapabilitySnapshot(snapshot) {
    capabilitySnapshot = snapshot || null;
    if (!window.Twinkle || !window.Twinkle.capabilities) return;
    window.Twinkle.capabilities.current = capabilitySnapshot;
  }

  function normalizeExplorationPlanStep(rawStep) {
    if (!rawStep || typeof rawStep !== 'object') return null;
    function normalizeExpectedSignals(rawExpectedSignals) {
      if (!rawExpectedSignals || typeof rawExpectedSignals !== 'object') {
        return null;
      }
      var routeChange =
        typeof rawExpectedSignals.routeChange === 'boolean'
          ? rawExpectedSignals.routeChange
          : null;
      var textIncludes = Array.isArray(rawExpectedSignals.textIncludes)
        ? rawExpectedSignals.textIncludes
            .map(function(text) {
              return trimObservationText(text, 80);
            })
            .filter(Boolean)
            .slice(0, 4)
        : [];
      var revealsLabels = Array.isArray(rawExpectedSignals.revealsLabels)
        ? rawExpectedSignals.revealsLabels
            .map(function(label) {
              return trimObservationText(label, 80);
            })
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
        routeChange: routeChange,
        textIncludes: textIncludes,
        revealsLabels: revealsLabels
      };
    }
    var kind =
      rawStep.kind === 'submit-form'
        ? 'submit-form'
        : rawStep.kind === 'click'
          ? 'click'
          : null;
    if (!kind) return null;
    var goal = trimObservationText(rawStep.goal, 220);
    var labelHints = Array.isArray(rawStep.labelHints)
      ? rawStep.labelHints
          .map(function(label) {
            return trimObservationText(label, 80);
          })
          .filter(Boolean)
          .slice(0, 4)
      : [];
    var inputHints = Array.isArray(rawStep.inputHints)
      ? rawStep.inputHints
          .map(function(hint) {
            return trimObservationText(hint, 80);
          })
          .filter(Boolean)
          .slice(0, 4)
      : [];
    var expectedSignals = normalizeExpectedSignals(rawStep.expectedSignals);
    if (!goal || labelHints.length === 0) return null;
    return {
      kind: kind,
      goal: goal,
      labelHints: labelHints,
      inputHints: inputHints,
      expectedSignals: expectedSignals
    };
  }

  function applyRuntimeExplorationPlan(plan) {
    var shouldRestartProbe =
      previewInteractionProbeState.scheduled ||
      previewInteractionProbeState.completed ||
      previewInteractionProbeState.steps.length > 0;
    var normalizedPlan =
      plan && typeof plan === 'object'
        ? {
            summary: trimObservationText(plan.summary, 240),
            generatedFrom:
              plan.generatedFrom === 'planner' ? 'planner' : 'heuristic',
            steps: Array.isArray(plan.steps)
              ? plan.steps
                  .map(normalizeExplorationPlanStep)
                  .filter(Boolean)
                  .slice(0, 3)
              : []
          }
        : null;
    runtimeExplorationPlan =
      normalizedPlan &&
      normalizedPlan.summary &&
      normalizedPlan.steps &&
      normalizedPlan.steps.length > 0
        ? normalizedPlan
        : null;
    syncViewportAppMode('');
    previewInteractionProbeState.planStepIndex = 0;
    if (shouldRestartProbe && runtimeExplorationPlan) {
      restartPreviewInteractionProbe();
    }
  }

  var runtimeObservationKeys = Object.create(null);
  var runtimeObservationCount = 0;

  function trimObservationText(value, maxLength) {
    var text = String(value || '').trim();
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  }

  function sanitizeObservationStack(value) {
    var text = String(value || '').replace(/\r/g, '');
    if (!text) return '';
    text = text.replace(
      /data:text\/javascript[^)\s]*/gi,
      '[inline-preview-module]'
    );
    text = text.replace(/blob:[^)\s]{80,}/gi, '[blob-url]');
    return text
      .split('\n')
      .map(function(line) {
        var normalized = String(line || '').replace(/\s+/g, ' ').trim();
        if (!normalized) return '';
        return normalized.length > 180
          ? normalized.slice(0, 180) + '...'
          : normalized;
      })
      .filter(Boolean)
      .slice(0, 6)
      .join('\n');
  }

  function normalizeGameplayRect(rawValue) {
    if (rawValue == null) return null;
    if (!rawValue || typeof rawValue !== 'object') return null;
    var x = Number(rawValue.x);
    var y = Number(rawValue.y);
    var width = Number(rawValue.width);
    var height = Number(rawValue.height);
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

  function buildGameplayTelemetrySnapshot() {
    var playfieldBounds = gameplayTelemetryState.playfieldBounds;
    var playerBounds = gameplayTelemetryState.playerBounds;
    if (!playfieldBounds && !playerBounds) return null;
    if (!playfieldBounds || !playerBounds) {
      return {
        playfieldBounds: playfieldBounds,
        playerBounds: playerBounds,
        overflowTop: 0,
        overflowRight: 0,
        overflowBottom: 0,
        overflowLeft: 0,
        status: 'incomplete',
        reportedAt: Date.now()
      };
    }
    var overflowTop = Math.max(0, playfieldBounds.y - playerBounds.y);
    var overflowLeft = Math.max(0, playfieldBounds.x - playerBounds.x);
    var overflowRight = Math.max(
      0,
      playerBounds.x +
        playerBounds.width -
        (playfieldBounds.x + playfieldBounds.width)
    );
    var overflowBottom = Math.max(
      0,
      playerBounds.y +
        playerBounds.height -
        (playfieldBounds.y + playfieldBounds.height)
    );
    return {
      playfieldBounds: playfieldBounds,
      playerBounds: playerBounds,
      overflowTop: Math.ceil(overflowTop),
      overflowRight: Math.ceil(overflowRight),
      overflowBottom: Math.ceil(overflowBottom),
      overflowLeft: Math.ceil(overflowLeft),
      status:
        overflowTop > 0 ||
        overflowRight > 0 ||
        overflowBottom > 0 ||
        overflowLeft > 0
          ? 'out-of-bounds'
          : 'ok',
      reportedAt: Date.now()
    };
  }

  function buildGameplayMismatchMessage(telemetry) {
    if (!telemetry) {
      return 'The reported player bounds moved outside the reported playfield bounds.';
    }
    if (telemetry.overflowBottom > 0) {
      return 'The reported player bounds extend below the reported playfield floor. Clamp gameplay to the declared playfield instead of the raw canvas edge.';
    }
    if (telemetry.overflowTop > 0) {
      return 'The reported player bounds extend above the reported playfield ceiling. Clamp gameplay to the declared playfield.';
    }
    if (telemetry.overflowLeft > 0 || telemetry.overflowRight > 0) {
      return 'The reported player bounds extend outside the reported playfield walls. Clamp gameplay to the declared playfield.';
    }
    return 'The reported player bounds moved outside the reported playfield bounds.';
  }

  function evaluateGameplayTelemetry() {
    var telemetry = buildGameplayTelemetrySnapshot();
    if (telemetry && telemetry.status === 'out-of-bounds') {
      reportRuntimeObservation('playfieldmismatch', {
        message: buildGameplayMismatchMessage(telemetry)
      });
    }
    reportPreviewHealthSnapshot(false);
    return telemetry;
  }

  function scheduleGameplayTelemetryEvaluation() {
    if (gameplayTelemetryState.scheduled) return;
    gameplayTelemetryState.scheduled = true;
    requestAnimationFrame(function() {
      gameplayTelemetryState.scheduled = false;
      evaluateGameplayTelemetry();
    });
  }

  function normalizePreviewInsetValue(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.floor(numeric);
  }

  function clonePreviewInsets(insets) {
    var source = insets && typeof insets === 'object' ? insets : {};
    return {
      top: normalizePreviewInsetValue(source.top),
      right: normalizePreviewInsetValue(source.right),
      bottom: normalizePreviewInsetValue(source.bottom),
      left: normalizePreviewInsetValue(source.left)
    };
  }

  function previewInsetsEqual(a, b) {
    return (
      !!a &&
      !!b &&
      a.top === b.top &&
      a.right === b.right &&
      a.bottom === b.bottom &&
      a.left === b.left
    );
  }

  function getPreviewViewportSize() {
    return {
      width: Math.max(
        window.innerWidth || 0,
        document.documentElement ? document.documentElement.clientWidth || 0 : 0
      ),
      height: Math.max(
        window.innerHeight || 0,
        document.documentElement ? document.documentElement.clientHeight || 0 : 0
      )
    };
  }

  function buildPreviewLayoutSnapshot() {
    var viewport = getPreviewViewportSize();
    var stageWidth = viewport.width;
    var stageHeight = viewport.height;
    var safeInsets = clonePreviewInsets(previewLayoutState.reservedInsets);
    var maxVerticalInset = Math.max(0, stageHeight - 1);
    var maxHorizontalInset = Math.max(0, stageWidth - 1);
    if (safeInsets.top + safeInsets.bottom > maxVerticalInset) {
      var excessVertical =
        safeInsets.top + safeInsets.bottom - maxVerticalInset;
      if (safeInsets.bottom >= excessVertical) {
        safeInsets.bottom -= excessVertical;
      } else {
        safeInsets.top = Math.max(0, safeInsets.top - (excessVertical - safeInsets.bottom));
        safeInsets.bottom = 0;
      }
    }
    if (safeInsets.left + safeInsets.right > maxHorizontalInset) {
      var excessHorizontal =
        safeInsets.left + safeInsets.right - maxHorizontalInset;
      if (safeInsets.right >= excessHorizontal) {
        safeInsets.right -= excessHorizontal;
      } else {
        safeInsets.left = Math.max(
          0,
          safeInsets.left - (excessHorizontal - safeInsets.right)
        );
        safeInsets.right = 0;
      }
    }
    var playfieldWidth = Math.max(
      1,
      stageWidth - safeInsets.left - safeInsets.right
    );
    var playfieldHeight = Math.max(
      1,
      stageHeight - safeInsets.top - safeInsets.bottom
    );
    return {
      mode: viewportModeState.mode,
      viewport: viewport,
      stage: {
        width: stageWidth,
        height: stageHeight,
        scale:
          viewportModeState.mode === 'viewport-app' &&
          viewportFitState.scale > 0
            ? Number(viewportFitState.scale.toFixed(4))
            : 1
      },
      safeInsets: safeInsets,
      playfield: {
        x: safeInsets.left,
        y: safeInsets.top,
        width: playfieldWidth,
        height: playfieldHeight
      }
    };
  }

  function applyPreviewLayoutCssVariables(layout) {
    var documentElement = document.documentElement;
    if (!documentElement || !layout) return;
    documentElement.style.setProperty(
      '--twinkle-preview-viewport-width',
      String(layout.viewport.width) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-viewport-height',
      String(layout.viewport.height) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-stage-width',
      String(layout.stage.width) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-stage-height',
      String(layout.stage.height) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-stage-scale',
      String(layout.stage.scale)
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-top',
      String(layout.safeInsets.top) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-right',
      String(layout.safeInsets.right) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-bottom',
      String(layout.safeInsets.bottom) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-safe-left',
      String(layout.safeInsets.left) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-x',
      String(layout.playfield.x) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-y',
      String(layout.playfield.y) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-width',
      String(layout.playfield.width) + 'px'
    );
    documentElement.style.setProperty(
      '--twinkle-preview-playfield-height',
      String(layout.playfield.height) + 'px'
    );
  }

  function publishPreviewLayout(force) {
    var layout = readPreviewLayout();
    var key = buildPreviewLayoutKey(layout);
    if (!force && key === previewLayoutState.lastKey) {
      return layout;
    }
    previewLayoutState.lastKey = key;
    var listeners = previewLayoutState.listeners.slice();
    for (var i = 0; i < listeners.length; i += 1) {
      try {
        listeners[i](layout);
      } catch (_) {}
    }
    try {
      window.dispatchEvent(
        new CustomEvent('twinkle:preview-layout', {
          detail: layout
        })
      );
    } catch (_) {}
    return layout;
  }

  function buildPreviewLayoutKey(layout) {
    return [
      layout.mode,
      layout.viewport.width,
      layout.viewport.height,
      layout.stage.width,
      layout.stage.height,
      layout.stage.scale,
      layout.safeInsets.top,
      layout.safeInsets.right,
      layout.safeInsets.bottom,
      layout.safeInsets.left,
      layout.playfield.x,
      layout.playfield.y,
      layout.playfield.width,
      layout.playfield.height
    ].join('|');
  }

  function readPreviewLayout() {
    var layout = buildPreviewLayoutSnapshot();
    previewLayoutState.current = layout;
    applyPreviewLayoutCssVariables(layout);
    if (window.Twinkle && window.Twinkle.preview) {
      window.Twinkle.preview.current = layout;
    }
    return layout;
  }

  function ensureViewportModeStyle() {
    if (viewportModeState.styleInjected) return;
    viewportModeState.styleInjected = true;
    var styleNode = document.createElement('style');
    styleNode.setAttribute('data-twinkle-preview-viewport-style', '1');
    styleNode.textContent =
      'html[data-twinkle-preview-mode="viewport-app"]{' +
      'height:100% !important;' +
      'min-height:100% !important;' +
      'max-height:100% !important;' +
      'width:100% !important;' +
      'overflow:hidden !important;' +
      'overscroll-behavior:none !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body{' +
      'margin:0 !important;' +
      'height:100% !important;' +
      'min-height:100% !important;' +
      'max-height:100% !important;' +
      'width:100% !important;' +
      'max-width:100% !important;' +
      'overflow:hidden !important;' +
      'overscroll-behavior:none !important;' +
      'display:flex !important;' +
      'align-items:center !important;' +
      'justify-content:center !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body > *{' +
      'max-width:100% !important;' +
      'max-height:100% !important;' +
      'box-sizing:border-box !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body > #root,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > [id="app"],' +
      'html[data-twinkle-preview-mode="viewport-app"] body > main,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > section,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > article{' +
      'width:100% !important;' +
      'max-height:100% !important;' +
      'display:flex !important;' +
      'align-items:center !important;' +
      'justify-content:center !important;' +
      'overflow:hidden !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] body > #root > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > [id="app"] > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > main > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > section > *,' +
      'html[data-twinkle-preview-mode="viewport-app"] body > article > *{' +
      'max-width:100% !important;' +
      'max-height:100% !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] canvas,' +
      'html[data-twinkle-preview-mode="viewport-app"] svg,' +
      'html[data-twinkle-preview-mode="viewport-app"] video,' +
      'html[data-twinkle-preview-mode="viewport-app"] img{' +
      'max-width:100% !important;' +
      'max-height:100% !important;' +
      '}' +
      'html[data-twinkle-preview-mode="viewport-app"] [data-twinkle-preview-fit="1"]{' +
      'transform-origin:center center !important;' +
      '}';
    (document.head || document.documentElement).appendChild(styleNode);
  }

  function getRuntimePlanText() {
    var planText = '';
    if (!runtimeExplorationPlan) return planText;
    planText += ' ' + String(runtimeExplorationPlan.summary || '');
    if (Array.isArray(runtimeExplorationPlan.steps)) {
      for (var i = 0; i < runtimeExplorationPlan.steps.length; i += 1) {
        var step = runtimeExplorationPlan.steps[i];
        if (!step) continue;
        planText += ' ' + String(step.goal || '');
        if (Array.isArray(step.labelHints)) {
          planText += ' ' + step.labelHints.join(' ');
        }
      }
    }
    return planText;
  }

  function shouldUseViewportAppMode(visibleText) {
    var body = document.body;
    if (body && body.querySelector('canvas')) {
      return true;
    }
    var haystack = (
      String(visibleText || '') +
      ' ' +
      String(document.title || '') +
      ' ' +
      getRuntimePlanText()
    ).toLowerCase();
    return /\\b(game|play|player|score|level|enemy|boss|jump|dodge|flappy|restart|game over|lives?)\\b/.test(
      haystack
    );
  }

  function applyViewportAppMode(enabled) {
    ensureViewportModeStyle();
    var documentElement = document.documentElement;
    if (!documentElement) return;
    var nextMode = enabled ? 'viewport-app' : 'document';
    if (viewportModeState.mode === nextMode) return;
    viewportModeState.mode = nextMode;
    if (enabled) {
      documentElement.setAttribute('data-twinkle-preview-mode', 'viewport-app');
    } else {
      documentElement.removeAttribute('data-twinkle-preview-mode');
    }
    scheduleViewportAppFit();
  }

  function syncViewportAppMode(visibleText) {
    applyViewportAppMode(shouldUseViewportAppMode(visibleText));
  }

  function clearViewportFitCandidate(candidate) {
    if (!candidate || !candidate.style) return;
    candidate.removeAttribute('data-twinkle-preview-fit');
    candidate.style.transform = '';
    candidate.style.transformOrigin = '';
  }

  function getViewportAppFitCandidate() {
    var body = document.body;
    if (!body) return null;
    var canvases = body.querySelectorAll('canvas');
    for (var i = 0; i < canvases.length; i += 1) {
      var canvas = canvases[i];
      if (!isVisibleUiElement(canvas)) continue;
      var parent = canvas.parentElement;
      if (
        parent &&
        parent !== body &&
        parent !== document.documentElement &&
        parent.id !== 'root' &&
        parent.getAttribute('id') !== 'app'
      ) {
        return parent;
      }
      return canvas;
    }
    var fallbackSelectors = [
      'body > #root > *',
      'body > [id="app"] > *',
      'body > main > *',
      'body > section > *',
      'body > article > *'
    ];
    for (var j = 0; j < fallbackSelectors.length; j += 1) {
      var candidate = body.querySelector(fallbackSelectors[j]);
      if (candidate && isVisibleUiElement(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  function fitViewportAppCandidate() {
    if (viewportModeState.mode !== 'viewport-app') {
      if (viewportFitState.candidate) {
        clearViewportFitCandidate(viewportFitState.candidate);
        viewportFitState.candidate = null;
        viewportFitState.scale = 1;
        viewportFitState.baseWidth = 0;
        viewportFitState.baseHeight = 0;
      }
      publishPreviewLayout(false);
      return;
    }
    var candidate = getViewportAppFitCandidate();
    if (viewportFitState.candidate && viewportFitState.candidate !== candidate) {
      clearViewportFitCandidate(viewportFitState.candidate);
      viewportFitState.candidate = null;
      viewportFitState.scale = 1;
      viewportFitState.baseWidth = 0;
      viewportFitState.baseHeight = 0;
    }
    if (!candidate) {
      publishPreviewLayout(false);
      return;
    }
    var rect = candidate.getBoundingClientRect();
    var baseWidth = Math.max(
      candidate.offsetWidth || 0,
      candidate.clientWidth || 0,
      candidate.scrollWidth || 0,
      rect && rect.width ? Math.round(rect.width) : 0
    );
    var baseHeight = Math.max(
      candidate.offsetHeight || 0,
      candidate.clientHeight || 0,
      candidate.scrollHeight || 0,
      rect && rect.height ? Math.round(rect.height) : 0
    );
    var viewportWidth = Math.max(window.innerWidth || 0, document.documentElement ? document.documentElement.clientWidth || 0 : 0);
    var viewportHeight = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight || 0 : 0);
    if (baseWidth <= 0 || baseHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }
    var padding = 12;
    var scale = Math.min(
      1,
      Math.max(0.1, (viewportWidth - padding * 2) / baseWidth),
      Math.max(0.1, (viewportHeight - padding * 2) / baseHeight)
    );
    viewportFitState.candidate = candidate;
    viewportFitState.scale = scale;
    viewportFitState.baseWidth = baseWidth;
    viewportFitState.baseHeight = baseHeight;
    if (scale >= 0.995) {
      clearViewportFitCandidate(candidate);
      viewportFitState.candidate = null;
      viewportFitState.scale = 1;
      viewportFitState.baseWidth = 0;
      viewportFitState.baseHeight = 0;
      publishPreviewLayout(false);
      return;
    }
    candidate.setAttribute('data-twinkle-preview-fit', '1');
    candidate.style.transformOrigin = 'center center';
    candidate.style.transform = 'scale(' + scale.toFixed(4) + ')';
    publishPreviewLayout(false);
  }

  function scheduleViewportAppFit() {
    if (viewportFitState.scheduled) return;
    viewportFitState.scheduled = true;
    requestAnimationFrame(function() {
      viewportFitState.scheduled = false;
      fitViewportAppCandidate();
    });
  }

  function rememberRuntimeObservationKey(key) {
    if (!key) return false;
    if (runtimeObservationKeys[key]) return true;
    runtimeObservationKeys[key] = true;
    runtimeObservationCount += 1;
    if (runtimeObservationCount > 40) {
      runtimeObservationKeys = Object.create(null);
      runtimeObservationCount = 0;
    }
    return false;
  }

  function reportRuntimeObservation(kind, details) {
    try {
      var message = trimObservationText(details && details.message, 400);
      if (!message) return;
      var filename = trimObservationText(details && details.filename, 240);
      var stack = trimObservationText(
        sanitizeObservationStack(details && details.stack),
        1200
      );
      var lineNumber = Number(details && details.lineNumber);
      var columnNumber = Number(details && details.columnNumber);
      var key = [
        kind || 'error',
        message,
        filename,
        Number.isFinite(lineNumber) ? lineNumber : '',
        Number.isFinite(columnNumber) ? columnNumber : ''
      ].join('|');
      if (rememberRuntimeObservationKey(key)) return;
      window.parent.postMessage({
        source: 'twinkle-build',
        type: 'runtime-observation',
        payload: {
          kind:
            kind === 'unhandledrejection'
              ? 'unhandledrejection'
              : kind === 'blankrender'
                ? 'blankrender'
                : kind === 'sdkblocked'
                  ? 'sdkblocked'
                  : kind === 'keyboardscroll'
                    ? 'keyboardscroll'
                    : kind === 'playfieldmismatch'
                      ? 'playfieldmismatch'
                  : kind === 'interactionnoop'
                    ? 'interactionnoop'
                  : 'error',
          message: message,
          stack: stack || null,
          filename: filename || null,
          lineNumber:
            Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : null,
          columnNumber:
            Number.isFinite(columnNumber) && columnNumber > 0 ? columnNumber : null,
          createdAt: Date.now()
        }
      }, '*');
    } catch (_) {}
  }

  function collectSafeInteractionTargetLabels(limit, excludeUsed) {
    var labels = [];
    var seen = Object.create(null);
    var candidates = document.querySelectorAll(
      'button,[role="button"],input[type="button"],a[href]'
    );
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (!isSafeInteractionTarget(candidate)) continue;
      var label = getPreviewInteractionTargetLabel(candidate);
      var normalizedLabel = String(label || '').trim().toLowerCase();
      if (!normalizedLabel || seen[normalizedLabel]) continue;
      if (
        excludeUsed &&
        previewInteractionProbeState.usedTargetLabels[normalizedLabel]
      ) {
        continue;
      }
      seen[normalizedLabel] = true;
      labels.push(label);
      if (labels.length >= (limit || 6)) break;
    }
    return labels;
  }

  function collectPreviewUiState() {
    var body = document.body;
    var documentElement = document.documentElement;
    var text = trimObservationText(
      body && body.innerText ? String(body.innerText).replace(/\s+/g, ' ') : '',
      180
    );
    syncViewportAppMode(text);
    fitViewportAppCandidate();
    var headingCount = body
      ? body.querySelectorAll('h1,h2,h3,[role="heading"]').length
      : 0;
    var buttonCount = body
      ? body.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],a[href]').length
      : 0;
    var formCount = body ? body.querySelectorAll('form').length : 0;
    var meaningfulRender =
      text.length >= 24 ||
      headingCount > 0 ||
      buttonCount > 0 ||
      formCount > 0 ||
      hasMeaningfulRender();
    var viewportHeight = Math.max(
      window.innerHeight || 0,
      documentElement ? documentElement.clientHeight || 0 : 0
    );
    var viewportWidth = Math.max(
      window.innerWidth || 0,
      documentElement ? documentElement.clientWidth || 0 : 0
    );
    var contentHeight = Math.max(
      body ? body.scrollHeight || 0 : 0,
      body ? body.offsetHeight || 0 : 0,
      documentElement ? documentElement.scrollHeight || 0 : 0,
      documentElement ? documentElement.offsetHeight || 0 : 0
    );
    var contentWidth = Math.max(
      body ? body.scrollWidth || 0 : 0,
      body ? body.offsetWidth || 0 : 0,
      documentElement ? documentElement.scrollWidth || 0 : 0,
      documentElement ? documentElement.offsetWidth || 0 : 0
    );
    var documentOverflowY =
      viewportHeight > 0 ? Math.max(0, contentHeight - viewportHeight) : 0;
    var documentOverflowX =
      viewportWidth > 0 ? Math.max(0, contentWidth - viewportWidth) : 0;
    var maxElementBottom = 0;
    var maxElementRight = 0;
    var measuredElements = 0;
    var overflowCandidates = body
      ? body.querySelectorAll(
          'main,section,article,form,table,canvas,svg,img,video,button,input,textarea,select,a[href],[role="button"],body > *'
        )
      : [];
    for (var i = 0; i < overflowCandidates.length; i += 1) {
      var candidate = overflowCandidates[i];
      if (!isVisibleUiElement(candidate)) continue;
      var candidateRect = candidate.getBoundingClientRect();
      if (!candidateRect) continue;
      maxElementBottom = Math.max(maxElementBottom, candidateRect.bottom || 0);
      maxElementRight = Math.max(maxElementRight, candidateRect.right || 0);
      measuredElements += 1;
      if (measuredElements >= 120) break;
    }
    var elementOverflowY =
      viewportHeight > 0 ? Math.max(0, Math.ceil(maxElementBottom - viewportHeight)) : 0;
    var elementOverflowX =
      viewportWidth > 0 ? Math.max(0, Math.ceil(maxElementRight - viewportWidth)) : 0;
    var viewportOverflowY = Math.max(documentOverflowY, elementOverflowY);
    var viewportOverflowX = Math.max(documentOverflowX, elementOverflowX);

    return {
      meaningfulRender: meaningfulRender,
      gameLike: viewportModeState.mode === 'viewport-app',
      headingCount: headingCount,
      buttonCount: buttonCount,
      formCount: formCount,
      viewportOverflowY: viewportOverflowY,
      viewportOverflowX: viewportOverflowX,
      visibleTextSample: text || null,
      route: (window.location.pathname || '') + (window.location.search || ''),
      hash: window.location.hash || '',
      safeTargetLabels: collectSafeInteractionTargetLabels(6, false)
    };
  }

  function collectPreviewHealthSnapshot() {
    var uiState = collectPreviewUiState();
    var gameplayTelemetry = buildGameplayTelemetrySnapshot();
    return {
      booted: true,
      meaningfulRender: uiState.meaningfulRender,
      gameLike: uiState.gameLike,
      headingCount: uiState.headingCount,
      buttonCount: uiState.buttonCount,
      formCount: uiState.formCount,
      viewportOverflowY: uiState.viewportOverflowY,
      viewportOverflowX: uiState.viewportOverflowX,
      visibleTextSample: uiState.visibleTextSample,
      interactionStatus: previewInteractionProbeState.status || 'idle',
      interactionTargetLabel:
        trimObservationText(previewInteractionProbeState.targetLabel, 120) ||
        null,
      interactionSteps: previewInteractionProbeState.steps.slice(0, 4),
      gameplayTelemetry: gameplayTelemetry,
      observedAt: Date.now()
    };
  }

  function reportPreviewHealthSnapshot(force) {
    try {
      var snapshot = collectPreviewHealthSnapshot();
      var key = [
        snapshot.booted ? '1' : '0',
        snapshot.meaningfulRender ? '1' : '0',
        snapshot.gameLike ? '1' : '0',
        snapshot.headingCount,
        snapshot.buttonCount,
        snapshot.formCount,
        snapshot.viewportOverflowY,
        snapshot.viewportOverflowX,
        snapshot.interactionStatus || 'idle',
        snapshot.interactionTargetLabel || '',
        snapshot.gameplayTelemetry
          ? snapshot.gameplayTelemetry.status || 'incomplete'
          : 'none',
        snapshot.gameplayTelemetry
          ? Math.floor((snapshot.gameplayTelemetry.overflowTop || 0) / 16)
          : 0,
        snapshot.gameplayTelemetry
          ? Math.floor((snapshot.gameplayTelemetry.overflowRight || 0) / 16)
          : 0,
        snapshot.gameplayTelemetry
          ? Math.floor((snapshot.gameplayTelemetry.overflowBottom || 0) / 16)
          : 0,
        snapshot.gameplayTelemetry
          ? Math.floor((snapshot.gameplayTelemetry.overflowLeft || 0) / 16)
          : 0,
        JSON.stringify(snapshot.interactionSteps || []),
        snapshot.visibleTextSample || ''
      ].join('|');
      if (!force && key === previewHealthLastKey) return;
      previewHealthLastKey = key;
      window.parent.postMessage({
        source: 'twinkle-build',
        type: 'preview-health',
        payload: snapshot
      }, '*');
    } catch (_) {}
  }

  function schedulePreviewHealthReport(delayMs, force) {
    setTimeout(function() {
      reportPreviewHealthSnapshot(Boolean(force));
    }, Math.max(0, Number(delayMs) || 0));
  }

  function startPreviewHealthMonitoring() {
    schedulePreviewHealthReport(250, true);
    schedulePreviewHealthReport(1200, false);
    schedulePreviewHealthReport(3200, false);

    if (!window.MutationObserver || previewHealthObserver) return;
    var body = document.body;
    if (!body) return;
    previewHealthObserver = new MutationObserver(function() {
      if (previewHealthMutationTimer) {
        clearTimeout(previewHealthMutationTimer);
      }
      previewHealthMutationTimer = setTimeout(function() {
        previewHealthMutationTimer = null;
        scheduleViewportAppFit();
        reportPreviewHealthSnapshot(false);
      }, 350);
    });
    try {
      previewHealthObserver.observe(body, {
        childList: true,
        subtree: true,
        characterData: true
      });
      setTimeout(function() {
        try {
          if (previewHealthObserver) {
            previewHealthObserver.disconnect();
            previewHealthObserver = null;
          }
        } catch (_) {}
      }, 7000);
    } catch (_) {
      previewHealthObserver = null;
    }
  }

  function completePreviewInteractionProbe(status, targetLabel) {
    previewInteractionProbeState.completed = true;
    previewInteractionProbeState.status = status || 'idle';
    previewInteractionProbeState.targetLabel = trimObservationText(targetLabel, 120);
    reportPreviewHealthSnapshot(true);
  }

  function appendPreviewInteractionStep(step) {
    if (!step || typeof step !== 'object') return;
    previewInteractionProbeState.steps = previewInteractionProbeState.steps
      .concat([step])
      .slice(-4);
    previewInteractionProbeState.status = step.status || 'idle';
    previewInteractionProbeState.targetLabel = trimObservationText(
      step.targetLabel,
      120
    );
    reportPreviewHealthSnapshot(true);
  }

  function collectPreviewInteractionSignatureFromUiState(uiState) {
    var body = document.body;
    var childCount = body ? body.children.length : 0;
    return [
      uiState.meaningfulRender ? '1' : '0',
      uiState.gameLike ? '1' : '0',
      uiState.headingCount,
      uiState.buttonCount,
      uiState.formCount,
      uiState.viewportOverflowY,
      uiState.viewportOverflowX,
      uiState.visibleTextSample || '',
      childCount,
      uiState.route || '',
      uiState.hash || ''
    ].join('|');
  }

  function getPreviewInteractionTargetLabel(element) {
    if (!element) return 'a control';
    var text = trimObservationText(
      element.innerText ||
        element.textContent ||
        element.value ||
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        '',
      60
    );
    if (text) return text;
    var tagName = String(element.tagName || '').toLowerCase();
    if (tagName === 'a') return 'a link';
    if (tagName === 'input') return 'an input';
    return 'a control';
  }

  function rememberPreviewInteractionTargetLabel(label) {
    var normalizedLabel = String(label || '')
      .trim()
      .toLowerCase();
    if (!normalizedLabel) return;
    previewInteractionProbeState.usedTargetLabels[normalizedLabel] = true;
  }

  function normalizeExplorationHint(value) {
    return trimObservationText(value, 80).toLowerCase();
  }

  function doesLabelMatchHints(label, hints) {
    var normalizedLabel = normalizeExplorationHint(label);
    if (!normalizedLabel) return false;
    for (var i = 0; i < (hints || []).length; i += 1) {
      var hint = normalizeExplorationHint(hints[i]);
      if (!hint) continue;
      if (
        normalizedLabel === hint ||
        normalizedLabel.indexOf(hint) !== -1 ||
        hint.indexOf(normalizedLabel) !== -1
      ) {
        return true;
      }
    }
    return false;
  }

  function getNextRuntimeExplorationPlanStep() {
    if (
      !runtimeExplorationPlan ||
      !Array.isArray(runtimeExplorationPlan.steps) ||
      runtimeExplorationPlan.steps.length === 0
    ) {
      return null;
    }
    var index = Number(previewInteractionProbeState.planStepIndex || 0);
    if (index < 0 || index >= runtimeExplorationPlan.steps.length) {
      return null;
    }
    return runtimeExplorationPlan.steps[index] || null;
  }

  function isVisibleUiElement(element) {
    if (!element || !document.body || !document.body.contains(element)) {
      return false;
    }
    if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }
    var style = window.getComputedStyle(element);
    if (!style || style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    var rect = element.getBoundingClientRect();
    if (!rect || rect.width < 16 || rect.height < 16) {
      return false;
    }
    return true;
  }

  function isVisibleInteractionTarget(element) {
    if (!isVisibleUiElement(element)) return false;
    if (element.closest('form')) {
      return false;
    }
    return true;
  }

  function isVisibleTextInput(element) {
    if (!isVisibleUiElement(element)) return false;
    var tagName = String(element.tagName || '').toLowerCase();
    if (tagName === 'textarea') return true;
    if (tagName !== 'input') return false;
    var type = trimObservationText(
      element.getAttribute('type') || '',
      30
    ).toLowerCase();
    return (
      !type ||
      type === 'text' ||
      type === 'search' ||
      type === 'email' ||
      type === 'url' ||
      type === 'number'
    );
  }

  function isSafeInteractionTarget(element) {
    if (!isVisibleInteractionTarget(element)) return false;
    var tagName = String(element.tagName || '').toLowerCase();
    var type = trimObservationText(
      element.getAttribute('type') || '',
      30
    ).toLowerCase();
    if (tagName === 'a') {
      var href = trimObservationText(element.getAttribute('href') || '', 300);
      if (
        !href ||
        /^https?:/i.test(href) ||
        /^mailto:/i.test(href) ||
        /^tel:/i.test(href) ||
        element.getAttribute('download') != null ||
        element.getAttribute('target') === '_blank'
      ) {
        return false;
      }
    }
    if (tagName === 'input' && type && type !== 'button') {
      return false;
    }
    var label = getPreviewInteractionTargetLabel(element).toLowerCase();
    if (
      /(delete|remove|destroy|clear|reset|logout|sign out|publish|unpublish|buy|pay|checkout|reward|tip|send|mail|email|invite|transfer|deploy|save)/i.test(
        label
      )
    ) {
      return false;
    }
    if (
      /(start|play|begin|continue|next|open|show|launch|run|try|enter|go|toggle|reveal)/i.test(
        label
      )
    ) {
      return true;
    }
    return false;
  }

  function findSafeInteractionTarget() {
    var candidates = document.querySelectorAll(
      'button,[role="button"],input[type="button"],a[href]'
    );
    for (var i = 0; i < candidates.length; i += 1) {
      if (!isSafeInteractionTarget(candidates[i])) continue;
      var label = getPreviewInteractionTargetLabel(candidates[i])
        .trim()
        .toLowerCase();
      if (label && previewInteractionProbeState.usedTargetLabels[label]) {
        continue;
      }
        return candidates[i];
    }
    return null;
  }

  function findPlannedInteractionTarget(planStep) {
    if (!planStep || planStep.kind !== 'click') return null;
    var candidates = document.querySelectorAll(
      'button,[role="button"],input[type="button"],a[href]'
    );
    var bestCandidate = null;
    var bestScore = -1;
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (!isSafeInteractionTarget(candidate)) continue;
      var label = getPreviewInteractionTargetLabel(candidate);
      var normalizedLabel = normalizeExplorationHint(label);
      if (
        normalizedLabel &&
        previewInteractionProbeState.usedTargetLabels[normalizedLabel]
      ) {
        continue;
      }
      if (!doesLabelMatchHints(label, planStep.labelHints)) continue;
      var score = 1;
      if (
        Array.isArray(planStep.labelHints) &&
        normalizeExplorationHint(planStep.labelHints[0]) === normalizedLabel
      ) {
        score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
    return bestCandidate;
  }

  function getSafeFormLabel(form) {
    if (!form) return '';
    var heading = form.querySelector('h1,h2,h3,[role="heading"]');
    if (heading) {
      var headingText = trimObservationText(
        heading.innerText || heading.textContent || '',
        60
      );
      if (headingText) return headingText;
    }
    var submit = form.querySelector(
      'button,[role="button"],input[type="submit"],input[type="button"]'
    );
    if (submit) {
      return getPreviewInteractionTargetLabel(submit);
    }
    return trimObservationText(
      form.getAttribute('aria-label') ||
        form.getAttribute('name') ||
        form.getAttribute('id') ||
        'a form',
      60
    );
  }

  function collectSafeFormInputHints(form) {
    if (!form) return [];
    var inputs = form.querySelectorAll('input,textarea,select');
    var seen = Object.create(null);
    var hints = [];
    for (var i = 0; i < inputs.length; i += 1) {
      var input = inputs[i];
      var candidates = [
        input.getAttribute('placeholder'),
        input.getAttribute('aria-label'),
        input.getAttribute('name')
      ];
      for (var j = 0; j < candidates.length; j += 1) {
        var hint = trimObservationText(candidates[j], 80);
        var normalizedHint = normalizeExplorationHint(hint);
        if (!normalizedHint || seen[normalizedHint]) continue;
        seen[normalizedHint] = true;
        hints.push(hint);
        if (hints.length >= 4) return hints;
      }
    }
    return hints;
  }

  function fillSafeFormInputs(form) {
    if (!form) return false;
    var changed = false;
    var inputs = form.querySelectorAll('input,textarea');
    for (var i = 0; i < inputs.length; i += 1) {
      var input = inputs[i];
      if (!isVisibleTextInput(input)) continue;
      if (input.disabled || input.readOnly) continue;
      var currentValue = String(input.value || '').trim();
      if (currentValue) continue;
      var type = trimObservationText(
        input.getAttribute('type') || '',
        30
      ).toLowerCase();
      var placeholder = trimObservationText(
        input.getAttribute('placeholder') || '',
        80
      ).toLowerCase();
      var nextValue = 'Test';
      if (type === 'email' || /email/.test(placeholder)) {
        nextValue = 'test@example.com';
      } else if (type === 'url' || /url|website|link/.test(placeholder)) {
        nextValue = 'https://example.com';
      } else if (type === 'number') {
        nextValue = '1';
      } else if (/search/.test(type) || /search/.test(placeholder)) {
        nextValue = 'test';
      } else if (
        /name|title|label|task|item|goal|prompt|message|note|text|description/.test(
          placeholder
        )
      ) {
        nextValue = 'Test entry';
      }
      try {
        input.focus();
      } catch (_) {}
      input.value = nextValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      changed = true;
    }
    return changed;
  }

  function findSafeFormTarget() {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i += 1) {
      var form = forms[i];
      if (!form || !document.body || !document.body.contains(form)) continue;
      var formLabel = getSafeFormLabel(form);
      var normalizedLabel = String(formLabel || '').trim().toLowerCase();
      if (
        normalizedLabel &&
        previewInteractionProbeState.usedTargetLabels[normalizedLabel]
      ) {
        continue;
      }
      var submit = form.querySelector(
        'button,[role="button"],input[type="submit"],input[type="button"]'
      );
      if (!submit || !isVisibleUiElement(submit)) continue;
      var submitLabel = getPreviewInteractionTargetLabel(submit).toLowerCase();
      if (
        /(delete|remove|destroy|clear|reset|logout|sign out|publish|unpublish|buy|pay|checkout|reward|tip|send|mail|email|invite|transfer|deploy|save)/i.test(
          submitLabel
        )
      ) {
        continue;
      }
      if (!fillSafeFormInputs(form)) continue;
      return {
        element: submit,
        label: formLabel || getPreviewInteractionTargetLabel(submit),
        actionKind: 'submit-form'
      };
    }
    return null;
  }

  function findPlannedFormTarget(planStep) {
    if (!planStep || planStep.kind !== 'submit-form') return null;
    var forms = document.querySelectorAll('form');
    var bestMatch = null;
    var bestScore = -1;
    for (var i = 0; i < forms.length; i += 1) {
      var form = forms[i];
      if (!form || !document.body || !document.body.contains(form)) continue;
      var submit = form.querySelector(
        'button,[role="button"],input[type="submit"],input[type="button"]'
      );
      if (!submit || !isVisibleUiElement(submit)) continue;
      var submitLabel = getPreviewInteractionTargetLabel(submit);
      if (
        /(delete|remove|destroy|clear|reset|logout|sign out|publish|unpublish|buy|pay|checkout|reward|tip|send|mail|email|invite|transfer|deploy|save)/i.test(
          submitLabel.toLowerCase()
        )
      ) {
        continue;
      }
      var formLabel = getSafeFormLabel(form);
      var inputHints = collectSafeFormInputHints(form);
      var score = 0;
      if (doesLabelMatchHints(submitLabel, planStep.labelHints)) {
        score += 2;
      }
      if (doesLabelMatchHints(formLabel, planStep.labelHints)) {
        score += 2;
      }
      for (var j = 0; j < inputHints.length; j += 1) {
        if (doesLabelMatchHints(inputHints[j], planStep.inputHints)) {
          score += 1;
        }
      }
      if (score <= 0) continue;
      if (!fillSafeFormInputs(form)) continue;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          element: submit,
          label: formLabel || submitLabel,
          actionKind: 'submit-form'
        };
      }
    }
    return bestMatch;
  }

  function activateInteractionTarget(element) {
    if (!element) return;
    if (typeof element.click === 'function') {
      element.click();
      return;
    }
    var clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(clickEvent);
  }

  function buildPreviewInteractionStep(
    targetLabel,
    beforeState,
    afterState,
    status,
    meta
  ) {
    var stepMeta = meta && typeof meta === 'object' ? meta : {};
    var beforeLabels = Array.isArray(beforeState.safeTargetLabels)
      ? beforeState.safeTargetLabels
      : [];
    var beforeMap = Object.create(null);
    for (var i = 0; i < beforeLabels.length; i += 1) {
      beforeMap[String(beforeLabels[i] || '').trim().toLowerCase()] = true;
    }
    var revealedTargetLabels = (Array.isArray(afterState.safeTargetLabels)
      ? afterState.safeTargetLabels
      : []
    )
      .filter(function(label) {
        var normalized = String(label || '').trim().toLowerCase();
        if (!normalized) return false;
        if (beforeMap[normalized]) return false;
        if (normalized === String(targetLabel || '').trim().toLowerCase()) {
          return false;
        }
        return true;
      })
      .slice(0, 4);

    return {
      source: stepMeta.source === 'planned' ? 'planned' : 'generic',
      goal: trimObservationText(stepMeta.goal, 220) || null,
      actionKind:
        stepMeta.actionKind === 'submit-form'
          ? 'submit-form'
          : stepMeta.actionKind === 'click'
            ? 'click'
            : null,
      expectedSignals:
        stepMeta.expectedSignals &&
        typeof stepMeta.expectedSignals === 'object'
          ? {
              routeChange:
                typeof stepMeta.expectedSignals.routeChange === 'boolean'
                  ? stepMeta.expectedSignals.routeChange
                  : null,
              textIncludes: Array.isArray(stepMeta.expectedSignals.textIncludes)
                ? stepMeta.expectedSignals.textIncludes
                    .map(function(text) {
                      return trimObservationText(text, 80);
                    })
                    .filter(Boolean)
                    .slice(0, 4)
                : [],
              revealsLabels: Array.isArray(stepMeta.expectedSignals.revealsLabels)
                ? stepMeta.expectedSignals.revealsLabels
                    .map(function(label) {
                      return trimObservationText(label, 80);
                    })
                    .filter(Boolean)
                    .slice(0, 4)
                : []
            }
          : null,
      targetLabel: targetLabel || null,
      status: status,
      routeBefore: beforeState.route || null,
      routeAfter: afterState.route || null,
      hashBefore: beforeState.hash || null,
      hashAfter: afterState.hash || null,
      routeChanged: beforeState.route !== afterState.route,
      hashChanged: beforeState.hash !== afterState.hash,
      visibleTextBefore: beforeState.visibleTextSample || null,
      visibleTextAfter: afterState.visibleTextSample || null,
      headingDelta: Number(afterState.headingCount || 0) - Number(beforeState.headingCount || 0),
      buttonDelta: Number(afterState.buttonCount || 0) - Number(beforeState.buttonCount || 0),
      formDelta: Number(afterState.formCount || 0) - Number(beforeState.formCount || 0),
      revealedTargetLabels: revealedTargetLabels,
      observedAt: Date.now()
    };
  }

  function continuePreviewInteractionProbeIfUseful() {
    if (previewInteractionProbeState.completed) return;
    if (previewInteractionProbeState.steps.length >= 4) {
      completePreviewInteractionProbe(
        previewInteractionProbeState.status,
        previewInteractionProbeState.targetLabel
      );
      return;
    }
    setTimeout(function() {
      runPreviewInteractionProbe(true);
    }, 900);
  }

  function runPreviewInteractionProbe(isFinalAttempt) {
    if (previewInteractionProbeState.completed) return;
    if (!hasMeaningfulRender()) {
      if (isFinalAttempt) {
        completePreviewInteractionProbe(
          previewInteractionProbeState.steps.length > 0
            ? previewInteractionProbeState.status
            : 'skipped',
          previewInteractionProbeState.steps.length > 0
            ? previewInteractionProbeState.targetLabel
            : ''
        );
      }
      return;
    }

    var planStep = getNextRuntimeExplorationPlanStep();
    var target = null;
    var targetLabel = '';
    var interactionSource = planStep ? 'planned' : 'generic';
    var actionKind = planStep ? planStep.kind : 'click';
    if (planStep) {
      if (planStep.kind === 'submit-form') {
        var plannedFormTarget = findPlannedFormTarget(planStep);
        if (plannedFormTarget) {
          target = plannedFormTarget.element;
          targetLabel =
            plannedFormTarget.label || getPreviewInteractionTargetLabel(target);
          actionKind = plannedFormTarget.actionKind || 'submit-form';
        }
      } else {
        target = findPlannedInteractionTarget(planStep);
        if (target) {
          targetLabel = getPreviewInteractionTargetLabel(target);
        }
      }
      if (!target) {
        var plannedGoal = trimObservationText(planStep.goal, 220) || 'planned interaction';
        reportRuntimeObservation('interactionnoop', {
          message:
            'Preview could not find a safe control for planned goal: ' +
            plannedGoal +
            '.'
        });
        appendPreviewInteractionStep(
          buildPreviewInteractionStep(
            planStep.labelHints && planStep.labelHints[0]
              ? planStep.labelHints[0]
              : '',
            collectPreviewUiState(),
            collectPreviewUiState(),
            'skipped',
            {
              source: 'planned',
              goal: plannedGoal,
              actionKind: planStep.kind,
              expectedSignals: planStep.expectedSignals || null
            }
          )
        );
        completePreviewInteractionProbe('skipped', '');
        return;
      }
    }

    if (!target) {
      target = findSafeInteractionTarget();
    }
    if (!target) {
      var formTarget = findSafeFormTarget();
      if (formTarget) {
        target = formTarget.element;
        targetLabel = formTarget.label || getPreviewInteractionTargetLabel(target);
        actionKind = formTarget.actionKind || 'submit-form';
      }
    }
    if (!target) {
      if (isFinalAttempt) {
        completePreviewInteractionProbe(
          previewInteractionProbeState.steps.length > 0
            ? previewInteractionProbeState.status
            : 'skipped',
          previewInteractionProbeState.steps.length > 0
            ? previewInteractionProbeState.targetLabel
            : ''
        );
      }
      return;
    }

    targetLabel = targetLabel || getPreviewInteractionTargetLabel(target);
    rememberPreviewInteractionTargetLabel(targetLabel);
    var beforeState = collectPreviewUiState();
    var beforeSignature = collectPreviewInteractionSignatureFromUiState(beforeState);
    var beforeObservationCount = runtimeObservationCount;
    try {
      activateInteractionTarget(target);
    } catch (error) {
      reportRuntimeObservation('error', {
        message:
          'Preview interaction probe failed while clicking "' +
          targetLabel +
          '".',
        stack: error && error.stack ? error.stack : String(error || '')
      });
      appendPreviewInteractionStep(
        buildPreviewInteractionStep(targetLabel, beforeState, beforeState, 'unchanged', {
          source: interactionSource,
          goal: planStep ? planStep.goal : null,
          actionKind: actionKind,
          expectedSignals: planStep ? planStep.expectedSignals || null : null
        })
      );
      completePreviewInteractionProbe('unchanged', targetLabel);
      return;
    }

    setTimeout(function() {
      var afterState = collectPreviewUiState();
      var afterSignature = collectPreviewInteractionSignatureFromUiState(afterState);
      var changed =
        afterSignature !== beforeSignature ||
        runtimeObservationCount > beforeObservationCount;
      var step = buildPreviewInteractionStep(
        targetLabel,
        beforeState,
        afterState,
        changed ? 'changed' : 'unchanged',
        {
          source: interactionSource,
          goal: planStep ? planStep.goal : null,
          actionKind: actionKind,
          expectedSignals: planStep ? planStep.expectedSignals || null : null
        }
      );
      if (planStep) {
        previewInteractionProbeState.planStepIndex += 1;
      }
      appendPreviewInteractionStep(step);
      if (!changed) {
        reportRuntimeObservation('interactionnoop', {
          message:
            'Auto-clicked "' +
            targetLabel +
            '" but the preview UI did not visibly change.'
        });
        completePreviewInteractionProbe('unchanged', targetLabel);
        return;
      }
      continuePreviewInteractionProbeIfUseful();
    }, 1100);
  }

  function schedulePreviewInteractionProbe() {
    if (previewInteractionProbeState.scheduled) return;
    previewInteractionProbeState.scheduled = true;
    setTimeout(function() {
      runPreviewInteractionProbe(false);
    }, 1800);
    setTimeout(function() {
      runPreviewInteractionProbe(true);
    }, 4200);
  }

  function restartPreviewInteractionProbe() {
    previewInteractionProbeState.scheduled = false;
    previewInteractionProbeState.completed = false;
    previewInteractionProbeState.status = 'idle';
    previewInteractionProbeState.targetLabel = '';
    previewInteractionProbeState.steps = [];
    previewInteractionProbeState.usedTargetLabels = Object.create(null);
    previewInteractionProbeState.planStepIndex = 0;
    schedulePreviewInteractionProbe();
  }

  function hasMeaningfulRender() {
    var body = document.body;
    if (!body) return false;
    var text = trimObservationText(
      String(body.innerText || '').replace(/\s+/g, ' '),
      240
    );
    if (text.length >= 24) return true;
    return Boolean(
      body.querySelector(
        'main,section,article,form,table,canvas,svg,img,video,button,input,textarea,select,a[href],[role="button"]'
      )
    );
  }

  function looksLikeGamePreview(visibleText) {
    return shouldUseViewportAppMode(visibleText);
  }

  function runBlankRenderProbe(isFinalCheck) {
    if (blankRenderProbeState.reported || blankRenderProbeState.resolved) {
      return;
    }
    if (hasMeaningfulRender()) {
      blankRenderProbeState.resolved = true;
      return;
    }
    if (!isFinalCheck) return;
    var body = document.body;
    var text = trimObservationText(
      body && body.innerText ? String(body.innerText).replace(/\s+/g, ' ') : '',
      160
    );
    var meaningfulElements = body
      ? body.querySelectorAll(
          'main,section,article,form,table,canvas,svg,img,video,button,input,textarea,select,a[href],[role="button"]'
        ).length
      : 0;
    reportRuntimeObservation('blankrender', {
      message:
        'Preview stayed blank or near-empty after startup' +
        ' (visibleText=' +
        String(text.length) +
        ', meaningfulElements=' +
        String(meaningfulElements) +
        ').',
      stack: text ? 'visible text: ' + text : ''
    });
    blankRenderProbeState.reported = true;
  }

  function scheduleBlankRenderProbe() {
    if (blankRenderProbeState.scheduled) return;
    blankRenderProbeState.scheduled = true;
    setTimeout(function() {
      runBlankRenderProbe(false);
    }, 2200);
    setTimeout(function() {
      runBlankRenderProbe(true);
    }, 5000);
  }

  function isEditableTarget(element) {
    if (!element || typeof element.closest !== 'function') return false;
    return Boolean(
      element.closest(
        'input,textarea,select,[contenteditable=""],[contenteditable="true"]'
      )
    );
  }

  window.addEventListener(
    'keydown',
    function(event) {
      if (!event) return;
      if (!looksLikeGamePreview()) return;
      if (
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== ' '
      ) {
        return;
      }
      if (isEditableTarget(event.target)) return;
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      var documentElement = document.documentElement;
      var beforeScrollTop = Math.max(
        window.scrollY || 0,
        documentElement ? documentElement.scrollTop || 0 : 0
      );
      setTimeout(function() {
        if (keyboardScrollProbeState.reported) return;
        var afterScrollTop = Math.max(
          window.scrollY || 0,
          documentElement ? documentElement.scrollTop || 0 : 0
        );
        if (afterScrollTop === beforeScrollTop) return;
        keyboardScrollProbeState.reported = true;
        reportRuntimeObservation('keyboardscroll', {
          message:
            'Game-control keys scrolled the preview document. Prevent default browser scrolling for arrow or space controls and keep the game inside the viewport.'
        });
      }, 0);
    },
    true
  );

  function looksLikeBlockedCapabilityError(message) {
    var text = String(message || '').trim();
    if (!text) return false;
    return (
      /sign in is required/i.test(text) ||
      /only the owner workspace/i.test(text) ||
      /user-only/i.test(text) ||
      /not allowed in this context/i.test(text) ||
      /blocked/i.test(text) ||
      /not available in this context/i.test(text) ||
      /unavailable in this context/i.test(text)
    );
  }

  window.addEventListener('error', function(event) {
    if (!event) return;
    reportRuntimeObservation('error', {
      message: event.message || (event.error && event.error.message) || 'Runtime error',
      stack: event.error && event.error.stack,
      filename: event.filename || (event.error && event.error.fileName) || '',
      lineNumber: event.lineno || (event.error && event.error.lineNumber),
      columnNumber: event.colno || (event.error && event.error.columnNumber)
    });
  });

  window.addEventListener('unhandledrejection', function(event) {
    if (!event) return;
    var reason = event.reason;
    var message = '';
    var stack = '';
    if (typeof reason === 'string') {
      message = reason;
    } else if (reason && typeof reason === 'object') {
      message = reason.message || reason.reason || String(reason);
      stack = reason.stack || '';
    } else {
      message = String(reason || 'Unhandled promise rejection');
    }
    reportRuntimeObservation('unhandledrejection', {
      message: message || 'Unhandled promise rejection',
      stack: stack
    });
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    syncViewportAppMode('');
    scheduleViewportAppFit();
    scheduleBlankRenderProbe();
    startPreviewHealthMonitoring();
    schedulePreviewInteractionProbe();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      syncViewportAppMode('');
      scheduleViewportAppFit();
      scheduleBlankRenderProbe();
      startPreviewHealthMonitoring();
      schedulePreviewInteractionProbe();
    }, { once: true });
  }
  window.addEventListener('load', function() {
    syncViewportAppMode('');
    scheduleViewportAppFit();
    scheduleBlankRenderProbe();
    startPreviewHealthMonitoring();
    schedulePreviewInteractionProbe();
  }, { once: true });
  window.addEventListener('resize', function() {
    scheduleViewportAppFit();
  });

  window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || data.source !== 'twinkle-parent') return;

    if (data.type === 'viewer:update') {
      applyViewerInfo(data.viewer);
      return;
    }
    if (data.type === 'capabilities:update') {
      applyCapabilitySnapshot(data.capabilities);
      return;
    }
    if (data.type === 'exploration-plan:update') {
      applyRuntimeExplorationPlan(data.explorationPlan);
      return;
    }

    const pending = pendingRequests.get(data.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingRequests.delete(data.id);

    if (data.error) {
      if (looksLikeBlockedCapabilityError(data.error)) {
        reportRuntimeObservation('sdkblocked', {
          message:
            'Twinkle request "' +
            String(data.type || 'unknown') +
            '" was blocked: ' +
            String(data.error || ''),
          stack: null
        });
      }
      pending.reject(new Error(data.error));
    } else {
      pending.resolve(data.payload);
    }
  });

  async function loadSqlJs() {
    if (SQL) return SQL;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js';
      script.onload = async () => {
        try {
          SQL = await window.initSqlJs({
            locateFile: file => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + file
          });
          resolve(SQL);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = () => reject(new Error('Failed to load sql.js'));
      document.head.appendChild(script);
    });
  }

  Twinkle = (window.Twinkle = {
    db: {
      async open() {
        if (db) return db;
        await loadSqlJs();
        try {
          const response = await sendRequest('db:load', {});
          if (response && response.data) {
            const binary = atob(response.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            db = new SQL.Database(bytes);
          } else {
            db = new SQL.Database();
          }
          isInitialized = true;
          return db;
        } catch (err) {
          console.warn('Failed to load database, creating new one:', err);
          db = new SQL.Database();
          isInitialized = true;
          return db;
        }
      },

      async save() {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const data = db.export();
        let binary = '';
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        const base64 = btoa(binary);
        return await sendRequest('db:save', { data: base64 });
      },

      exec(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        return db.exec(sql, params);
      },

      run(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        db.run(sql, params);
      },

      query(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const stmt = db.prepare(sql);
        if (params) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },

      getDb() { return db; },
      isOpen() { return isInitialized && db !== null; },
      close() {
        if (db) { db.close(); db = null; isInitialized = false; }
      }
    },

    ai: {
      _prompts: null,

      async listPrompts() {
        if (this._prompts) return this._prompts;
        const response = await sendRequest('ai:list-prompts', {});
        this._prompts = response.prompts || [];
        return this._prompts;
      },

      async chat({ promptId, message, history }) {
        if (!promptId) throw new Error('promptId is required');
        if (!message) throw new Error('message is required');

        const response = await sendRequest('ai:chat', {
          promptId: promptId,
          message: message,
          history: history || []
        });

        return {
          text: response.response,
          prompt: response.prompt
        };
      }
    },

    capabilities: {
      current: null,

      async get() {
        if (capabilitySnapshot) return capabilitySnapshot;
        const response = await sendRequest('capabilities:get', {});
        applyCapabilitySnapshot(response?.capabilities);
        return capabilitySnapshot;
      },

      async can(actionName) {
        if (!actionName) throw new Error('actionName is required');
        const snapshot = await this.get();
        const normalizedActionName = String(actionName || '').trim();
        return Boolean(
          snapshot?.lumine?.actionDetails?.some(
            (detail) =>
              detail?.name === normalizedActionName && detail?.allowed === true
          )
        );
      },

      async listActions() {
        const snapshot = await this.get();
        return {
          available: Array.isArray(snapshot?.lumine?.availableActions)
            ? snapshot.lumine.availableActions
            : [],
          blocked: Array.isArray(snapshot?.lumine?.blockedActions)
            ? snapshot.lumine.blockedActions
            : [],
          details: Array.isArray(snapshot?.lumine?.actionDetails)
            ? snapshot.lumine.actionDetails
            : []
        };
      },

      async refresh() {
        capabilitySnapshot = null;
        return await this.get();
      }
    },

    viewer: {
      id: null,
      username: null,
      profilePicUrl: null,
      isLoggedIn: false,
      isOwner: false,
      isGuest: false,

      async get() {
        if (viewerInfo) return viewerInfo;
        const response = await sendRequest('viewer:get', {});
        applyViewerInfo(response?.viewer);
        return viewerInfo;
      },

      async refresh() {
        viewerInfo = null;
        return await this.get();
      }
    },

    preview: {
      current: null,

      getLayout() {
        return readPreviewLayout();
      },

      getGameplayTelemetry() {
        return buildGameplayTelemetrySnapshot();
      },

      wrapResult(result) {
        var promise = Promise.resolve(result);
        if (result && typeof result === 'object') {
          try {
            if (typeof result.then !== 'function') {
              Object.defineProperty(result, 'then', {
                configurable: true,
                enumerable: false,
                value: function(onFulfilled, onRejected) {
                  return promise.then(onFulfilled, onRejected);
                }
              });
            }
            if (typeof result.catch !== 'function') {
              Object.defineProperty(result, 'catch', {
                configurable: true,
                enumerable: false,
                value: function(onRejected) {
                  return promise.catch(onRejected);
                }
              });
            }
            if (typeof result.finally !== 'function') {
              Object.defineProperty(result, 'finally', {
                configurable: true,
                enumerable: false,
                value: function(onFinally) {
                  return promise.finally(onFinally);
                }
              });
            }
          } catch (_) {}
          return result;
        }
        return promise;
      },

      reserveInsets(insets) {
        var currentInsets = clonePreviewInsets(previewLayoutState.reservedInsets);
        var nextInsets = {
          top:
            insets && Object.prototype.hasOwnProperty.call(insets, 'top')
              ? normalizePreviewInsetValue(insets.top)
              : currentInsets.top,
          right:
            insets && Object.prototype.hasOwnProperty.call(insets, 'right')
              ? normalizePreviewInsetValue(insets.right)
              : currentInsets.right,
          bottom:
            insets && Object.prototype.hasOwnProperty.call(insets, 'bottom')
              ? normalizePreviewInsetValue(insets.bottom)
              : currentInsets.bottom,
          left:
            insets && Object.prototype.hasOwnProperty.call(insets, 'left')
              ? normalizePreviewInsetValue(insets.left)
              : currentInsets.left
        };
        if (previewInsetsEqual(currentInsets, nextInsets)) {
          return this.wrapResult(readPreviewLayout());
        }
        previewLayoutState.reservedInsets = nextInsets;
        return this.wrapResult(publishPreviewLayout(true));
      },

      setPlayfield(bounds) {
        gameplayTelemetryState.playfieldBounds = normalizeGameplayRect(bounds);
        scheduleGameplayTelemetryEvaluation();
        return this.wrapResult(buildGameplayTelemetrySnapshot());
      },

      reportGameplayState(state) {
        if (state == null) {
          gameplayTelemetryState.playerBounds = null;
          scheduleGameplayTelemetryEvaluation();
          return this.wrapResult(buildGameplayTelemetrySnapshot());
        }
        if (typeof state !== 'object') {
          throw new Error('state object is required');
        }
        if (Object.prototype.hasOwnProperty.call(state, 'playfieldBounds')) {
          gameplayTelemetryState.playfieldBounds = normalizeGameplayRect(
            state.playfieldBounds
          );
        }
        if (Object.prototype.hasOwnProperty.call(state, 'playerBounds')) {
          gameplayTelemetryState.playerBounds = normalizeGameplayRect(
            state.playerBounds
          );
        }
        scheduleGameplayTelemetryEvaluation();
        return this.wrapResult(buildGameplayTelemetrySnapshot());
      },

      clearReservedInsets() {
        var clearedInsets = {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        };
        if (previewInsetsEqual(previewLayoutState.reservedInsets, clearedInsets)) {
          return this.wrapResult(readPreviewLayout());
        }
        previewLayoutState.reservedInsets = clearedInsets;
        return this.wrapResult(publishPreviewLayout(true));
      },

      clearGameplayState() {
        gameplayTelemetryState.playfieldBounds = null;
        gameplayTelemetryState.playerBounds = null;
        scheduleGameplayTelemetryEvaluation();
        return this.wrapResult(buildGameplayTelemetrySnapshot());
      },

      subscribe(listener, options) {
        if (typeof listener !== 'function') {
          throw new Error('listener is required');
        }
        previewLayoutState.listeners.push(listener);
        var shouldEmitImmediately =
          !options || options.immediate !== false;
        if (shouldEmitImmediately) {
          try {
            listener(readPreviewLayout());
          } catch (_) {}
        }
        return function unsubscribe() {
          previewLayoutState.listeners = previewLayoutState.listeners.filter(
            function(candidate) {
              return candidate !== listener;
            }
          );
        };
      }
    },

    viewerDb: {
      async query(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:query', { sql: sql, params: params });
      },

      async exec(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:exec', { sql: sql, params: params });
      }
    },

    users: {
      async getUser(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('api:get-user', { userId: userId });
        if (result?.user) return result.user;
        if (result && typeof result === 'object') return result;
        return null;
      },

      async getUsers({ search, userIds, cursor, limit } = {}) {
        return await sendRequest('api:get-users', {
          search: search,
          userIds: userIds,
          cursor: cursor,
          limit: limit
        });
      }
    },

    reflections: {
      async getDailyReflections({ userIds, lastId, cursor, limit } = {}) {
        return await sendRequest('api:get-daily-reflections', {
          userIds: userIds,
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      },

      async getDailyReflectionsByUser(userId, { lastId, cursor, limit } = {}) {
        if (!userId) throw new Error('userId is required');
        return await sendRequest('api:get-daily-reflections', {
          userIds: [userId],
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      }
    },

    subjects: {
      async getMySubjects(opts) {
        var options = opts || {};
        return await sendRequest('content:my-subjects', {
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async getSubject(subjectId) {
        if (!subjectId) throw new Error('subjectId is required');
        return await sendRequest('content:subject', { subjectId: subjectId });
      },

      async getSubjectComments(subjectId, opts) {
        if (!subjectId) throw new Error('subjectId is required');
        var options = opts || {};
        return await sendRequest('content:subject-comments', {
          subjectId: subjectId,
          limit: options.limit,
          cursor: options.cursor
        });
      }
    },

    profileComments: {
      async getProfileComments(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comments', {
          profileUserId: options.profileUserId,
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getProfileCommentIds(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-ids', {
          profileUserId: options.profileUserId,
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getCommentsByIds(idsOrOpts) {
        var options = Array.isArray(idsOrOpts)
          ? { ids: idsOrOpts }
          : idsOrOpts || {};
        if (!Array.isArray(options.ids)) {
          throw new Error('ids array is required');
        }
        return await sendRequest('content:profile-comments-by-ids', {
          ids: options.ids
        });
      },

      async getProfileCommentCounts(idsOrOpts) {
        var options = Array.isArray(idsOrOpts)
          ? { ids: idsOrOpts }
          : idsOrOpts || {};
        if (!Array.isArray(options.ids)) {
          throw new Error('ids array is required');
        }
        return await sendRequest('content:profile-comment-counts', {
          ids: options.ids
        });
      }
    },

    sharedDb: {
      async getTopics() {
        return await sendRequest('shared-db:get-topics', {});
      },

      async createTopic(name) {
        if (!name) throw new Error('name is required');
        return await sendRequest('shared-db:create-topic', { name: name });
      },

      async getEntries(topicName, opts) {
        if (!topicName) throw new Error('topicName is required');
        var options = opts || {};
        return await sendRequest('shared-db:get-entries', {
          topicName: topicName,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async addEntry(topicName, data) {
        if (!topicName) throw new Error('topicName is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:add-entry', {
          topicName: topicName,
          data: data
        });
      },

      async updateEntry(entryId, data) {
        if (!entryId) throw new Error('entryId is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:update-entry', {
          entryId: entryId,
          data: data
        });
      },

      async deleteEntry(entryId) {
        if (!entryId) throw new Error('entryId is required');
        return await sendRequest('shared-db:delete-entry', {
          entryId: entryId
        });
      }
    },

    privateDb: {
      async get(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:get', { key: key });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('private-db:list', {
          prefix: options.prefix,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async set(key, value) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:set', {
          key: key,
          value: value
        });
      },

      async remove(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:remove', { key: key });
      }
    },

    build: { id: null, title: null, username: null },
    _init(info) {
      this.build.id = info.id;
      this.build.title = info.title;
      this.build.username = info.username;
      applyViewerInfo(info.viewer);
      applyCapabilitySnapshot(info.capabilities);
      applyRuntimeExplorationPlan(info.explorationPlan);
      publishPreviewLayout(true);
    }
  });

  sendRequest('init', {}).then(info => {
    if (info) window.Twinkle._init(info);
  }).catch(() => {});

  console.log('Twinkle SDK loaded');
})();
</script>
`;

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const panelClass = css`
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  background: #fff;
  gap: 0;
  overflow: hidden;
`;

const runtimePanelClass = css`
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: 1fr;
  background: #fff;
  overflow: hidden;
`;

const toolbarClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: var(--build-workspace-header-height);
  padding: 0 1rem;
  column-gap: 0.75rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    row-gap: 0.65rem;
    padding: 0.9rem 1rem;
  }
`;

const toolbarTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 1.2rem;
  font-family: ${displayFontFamily};
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const guestRestrictionBannerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-top: 1px solid rgba(120, 77, 0, 0.18);
  background: linear-gradient(180deg, #fff8dc 0%, #fff1b8 100%);
  color: #4f3a00;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const guestRestrictionBannerTextClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.5;
`;

const guestRestrictionBannerActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
`;

const guestRestrictionBannerDismissClass = css`
  border: none;
  background: transparent;
  color: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

const previewStageClass = css`
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: hidden;
`;

const previewPreloadSurfaceClass = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  background: #fafbff;
  color: var(--chat-text);
  z-index: 1;
`;

const previewPreloadIconWrapClass = css`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const previewPreloadLabelClass = css`
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0.82;
`;

const previewIframeClass = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  transition: opacity 0.18s ease;
`;

const previewLoadingOverlayClass = css`
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--chat-text);
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 4;
  backdrop-filter: blur(1px);
`;

const previewSpinnerClass = css`
  animation: previewSpin 0.9s linear infinite;
  @keyframes previewSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const versionRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--ui-border);
`;

const versionMetaClass = css`
  font-size: 0.8rem;
  color: var(--chat-text);
  opacity: 0.6;
  margin-top: 0.2rem;
`;

const historyModalShellClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const historyModalHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
`;

const historyModalTitleClass = css`
  font-weight: 700;
  color: var(--chat-text);
  font-size: 1.1rem;
`;

const historyModalCloseButtonClass = css`
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    background: var(--chat-bg);
    border-color: var(--theme-border);
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
  }
`;

const historyModalContentClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
`;

const workspaceViewOptions = [
  { value: 'preview', label: 'Preview', icon: 'eye' },
  { value: 'code', label: 'Code', icon: 'code' }
] as const;

export default function PreviewPanel({
  build,
  code,
  projectFiles,
  streamingProjectFiles = null,
  streamingFocusFilePath = null,
  isOwner,
  onReplaceCode,
  onApplyRestoredProjectFiles,
  onSaveProjectFiles,
  runtimeOnly = false,
  capabilitySnapshot = null,
  onEditableProjectFilesStateChange,
  runtimeExplorationPlan = null,
  onRuntimeObservationChange
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [activePreviewFrame, setActivePreviewFrame] = useState<
    'primary' | 'secondary'
  >('primary');
  const [previewFrameSources, setPreviewFrameSources] = useState<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const [previewFrameReady, setPreviewFrameReady] = useState<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const [previewTransitioning, setPreviewTransitioning] = useState(false);
  const [workspacePreviewSrc, setWorkspacePreviewSrc] = useState<string | null>(
    null
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(
    null
  );
  const [artifactId, setArtifactId] = useState<number | null>(
    build.primaryArtifactId ?? null
  );
  const [editableProjectFiles, setEditableProjectFiles] = useState<
    EditableProjectFile[]
  >(() => buildEditableProjectFiles({ code, projectFiles }));
  const deferredPreviewProjectFiles = useDeferredValue(editableProjectFiles);
  const [activeFilePath, setActiveFilePath] = useState('/index.html');
  const [newFilePath, setNewFilePath] = useState('');
  const [renamePathInput, setRenamePathInput] = useState('/index.html');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
    null
  );
  const [folderMoveTargetPath, setFolderMoveTargetPath] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<
    Record<string, boolean>
  >({});
  const [savingProjectFiles, setSavingProjectFiles] = useState(false);
  const [projectFileError, setProjectFileError] = useState('');
  const [guestRestrictionBannerVisible, setGuestRestrictionBannerVisible] =
    useState(false);
  const [runtimeObservationState, setRuntimeObservationState] = useState<
    BuildRuntimeObservationState
  >(() =>
    buildEmptyRuntimeObservationState({
      buildId: build.id,
      codeSignature: null
    })
  );
  const primaryIframeRef = useRef<HTMLIFrameElement>(null);
  const secondaryIframeRef = useRef<HTMLIFrameElement>(null);
  const activePreviewFrameRef = useRef<'primary' | 'secondary'>('primary');
  const messageTargetFrameRef = useRef<'primary' | 'secondary'>('primary');
  const previewTransitioningRef = useRef(false);
  const previewFrameMetaRef = useRef<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>({
    primary: { buildId: null, codeSignature: null },
    secondary: { buildId: null, codeSignature: null }
  });
  const previewFrameSourcesRef = useRef<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const previewFrameReadyRef = useRef<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const previewSessionRequestSeqRef = useRef(0);
  const buildRef = useRef(build);
  const previewCodeSignatureRef = useRef<string | null>(null);
  const wasShowingStreamingCodeRef = useRef(false);
  const streamingAutoFollowEnabledRef = useRef(false);
  const autoReturnToPreviewPendingRef = useRef(false);
  const lastStreamingFocusFilePathRef = useRef<string | null>(null);
  const runtimeObservationStateRef = useRef<BuildRuntimeObservationState>(
    buildEmptyRuntimeObservationState({
      buildId: build.id,
      codeSignature: null
    })
  );
  const isOwnerRef = useRef(isOwner);
  const userIdRef = useRef<number | null>(null);
  const usernameRef = useRef<string | null>(null);
  const profilePicUrlRef = useRef<string | null>(null);
  const guestSessionIdRef = useRef<string | null>(null);

  const persistedProjectFiles = useMemo(
    () => buildEditableProjectFiles({ code, projectFiles }),
    [code, projectFiles]
  );
  const streamedProjectFiles = useMemo(
    () =>
      Array.isArray(streamingProjectFiles) && streamingProjectFiles.length > 0
        ? buildEditableProjectFiles({ code, projectFiles: streamingProjectFiles })
        : null,
    [code, streamingProjectFiles]
  );
  const persistedProjectFilesSignature = useMemo(
    () => serializeEditableProjectFiles(persistedProjectFiles),
    [persistedProjectFiles]
  );
  const editableProjectFilesSignature = useMemo(
    () => serializeEditableProjectFiles(editableProjectFiles),
    [editableProjectFiles]
  );
  const hasUnsavedProjectFileChanges =
    editableProjectFilesSignature !== persistedProjectFilesSignature;
  const isShowingStreamingCode =
    Boolean(streamedProjectFiles && streamedProjectFiles.length > 0) &&
    !hasUnsavedProjectFileChanges;
  const displayedProjectFiles = isShowingStreamingCode
    ? streamedProjectFiles || editableProjectFiles
    : editableProjectFiles;
  const editableProjectFilesForParent = useMemo(
    () =>
      editableProjectFiles.map((file) => ({
        path: file.path,
        content: file.content
      })),
    [editableProjectFiles]
  );
  const activeFile = useMemo(
    () =>
      displayedProjectFiles.find((file) => file.path === activeFilePath) ||
      displayedProjectFiles[0] ||
      null,
    [displayedProjectFiles, activeFilePath]
  );
  const persistedFileContentByPath = useMemo(() => {
    const byPath = new Map<string, string>();
    for (const file of persistedProjectFiles) {
      byPath.set(file.path, file.content);
    }
    return byPath;
  }, [persistedProjectFiles]);
  const projectExplorerEntries = useMemo(
    () =>
      buildProjectExplorerEntries({
        files: displayedProjectFiles,
        collapsedFolders
      }),
    [displayedProjectFiles, collapsedFolders]
  );

  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const downloadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.downloadBuildDatabase
  );
  const uploadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.uploadBuildDatabase
  );
  const loadBuildAiPrompts = useAppContext(
    (v) => v.requestHelpers.loadBuildAiPrompts
  );
  const callBuildAiChat = useAppContext(
    (v) => v.requestHelpers.callBuildAiChat
  );
  const listBuildArtifacts = useAppContext(
    (v) => v.requestHelpers.listBuildArtifacts
  );
  const listBuildArtifactVersions = useAppContext(
    (v) => v.requestHelpers.listBuildArtifactVersions
  );
  const restoreBuildArtifactVersion = useAppContext(
    (v) => v.requestHelpers.restoreBuildArtifactVersion
  );
  const createBuildPreviewSession = useAppContext(
    (v) => v.requestHelpers.createBuildPreviewSession
  );
  const queryViewerDb = useAppContext((v) => v.requestHelpers.queryViewerDb);
  const execViewerDb = useAppContext((v) => v.requestHelpers.execViewerDb);
  const getBuildApiToken = useAppContext(
    (v) => v.requestHelpers.getBuildApiToken
  );
  const getBuildApiUser = useAppContext(
    (v) => v.requestHelpers.getBuildApiUser
  );
  const getBuildApiUsers = useAppContext(
    (v) => v.requestHelpers.getBuildApiUsers
  );
  const getBuildDailyReflections = useAppContext(
    (v) => v.requestHelpers.getBuildDailyReflections
  );
  const getBuildMySubjects = useAppContext(
    (v) => v.requestHelpers.getBuildMySubjects
  );
  const getBuildSubject = useAppContext(
    (v) => v.requestHelpers.getBuildSubject
  );
  const getBuildSubjectComments = useAppContext(
    (v) => v.requestHelpers.getBuildSubjectComments
  );
  const getBuildProfileComments = useAppContext(
    (v) => v.requestHelpers.getBuildProfileComments
  );
  const getBuildProfileCommentIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentIds
  );
  const getBuildProfileCommentsByIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentsByIds
  );
  const getBuildProfileCommentCounts = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentCounts
  );
  const getSharedDbTopics = useAppContext(
    (v) => v.requestHelpers.getSharedDbTopics
  );
  const createSharedDbTopic = useAppContext(
    (v) => v.requestHelpers.createSharedDbTopic
  );
  const getSharedDbEntries = useAppContext(
    (v) => v.requestHelpers.getSharedDbEntries
  );
  const addSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.addSharedDbEntry
  );
  const updateSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.updateSharedDbEntry
  );
  const deleteSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbEntry
  );
  const getPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.getPrivateDbItem
  );
  const listPrivateDbItems = useAppContext(
    (v) => v.requestHelpers.listPrivateDbItems
  );
  const setPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.setPrivateDbItem
  );
  const deletePrivateDbItem = useAppContext(
    (v) => v.requestHelpers.deletePrivateDbItem
  );
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );

  const downloadBuildDatabaseRef = useRef(downloadBuildDatabase);
  const uploadBuildDatabaseRef = useRef(uploadBuildDatabase);
  const loadBuildAiPromptsRef = useRef(loadBuildAiPrompts);
  const callBuildAiChatRef = useRef(callBuildAiChat);
  const listBuildArtifactsRef = useRef(listBuildArtifacts);
  const listBuildArtifactVersionsRef = useRef(listBuildArtifactVersions);
  const restoreBuildArtifactVersionRef = useRef(restoreBuildArtifactVersion);
  const createBuildPreviewSessionRef = useRef(createBuildPreviewSession);
  const queryViewerDbRef = useRef(queryViewerDb);
  const execViewerDbRef = useRef(execViewerDb);
  const getBuildApiTokenRef = useRef(getBuildApiToken);
  const getBuildApiUserRef = useRef(getBuildApiUser);
  const getBuildApiUsersRef = useRef(getBuildApiUsers);
  const getBuildDailyReflectionsRef = useRef(getBuildDailyReflections);
  const getBuildMySubjectsRef = useRef(getBuildMySubjects);
  const getBuildSubjectRef = useRef(getBuildSubject);
  const getBuildSubjectCommentsRef = useRef(getBuildSubjectComments);
  const getBuildProfileCommentsRef = useRef(getBuildProfileComments);
  const getBuildProfileCommentIdsRef = useRef(getBuildProfileCommentIds);
  const getBuildProfileCommentsByIdsRef = useRef(getBuildProfileCommentsByIds);
  const getBuildProfileCommentCountsRef = useRef(getBuildProfileCommentCounts);
  const getSharedDbTopicsRef = useRef(getSharedDbTopics);
  const createSharedDbTopicRef = useRef(createSharedDbTopic);
  const getSharedDbEntriesRef = useRef(getSharedDbEntries);
  const addSharedDbEntryRef = useRef(addSharedDbEntry);
  const updateSharedDbEntryRef = useRef(updateSharedDbEntry);
  const deleteSharedDbEntryRef = useRef(deleteSharedDbEntry);
  const getPrivateDbItemRef = useRef(getPrivateDbItem);
  const listPrivateDbItemsRef = useRef(listPrivateDbItems);
  const setPrivateDbItemRef = useRef(setPrivateDbItem);
  const deletePrivateDbItemRef = useRef(deletePrivateDbItem);

  const buildApiTokenRef = useRef<{
    token: string;
    scopes: string[];
    expiresAt: number;
  } | null>(null);
  const hydratedBuildIdRef = useRef<number | null>(null);
  const capabilitySnapshotRef = useRef<BuildCapabilitySnapshot | null>(
    capabilitySnapshot
  );
  const runtimeExplorationPlanRef = useRef<BuildRuntimeExplorationPlan | null>(
    normalizeRuntimeExplorationPlan(runtimeExplorationPlan)
  );
  const resolvedCapabilitySnapshot = useMemo(() => {
    if (!capabilitySnapshot) return null;
    return {
      ...capabilitySnapshot,
      build: {
        ...capabilitySnapshot.build,
        isPublic: Boolean(build.isPublic)
      }
    };
  }, [build.isPublic, capabilitySnapshot]);
  const resolvedRuntimeExplorationPlan = useMemo(
    () => normalizeRuntimeExplorationPlan(runtimeExplorationPlan),
    [runtimeExplorationPlan]
  );

  const runtimeCodeWithSdk = useMemo(() => {
    if (!runtimeOnly) return null;
    const indexFile = getPreferredIndexFile(deferredPreviewProjectFiles);
    const hasIndexFile = Boolean(indexFile);
    const runtimeIndexHtml = hasIndexFile
      ? indexFile?.content ?? ''
      : String(code || '');
    if (!hasIndexFile && runtimeIndexHtml.length === 0) return null;
    const htmlWithInlinedAssets = inlineLocalProjectAssets({
      html: runtimeIndexHtml,
      projectFiles: deferredPreviewProjectFiles
    });
    return injectPreviewScriptsIntoHtml({
      html: htmlWithInlinedAssets,
      scriptsHtml: TWINKLE_SDK_SCRIPT
    });
  }, [code, deferredPreviewProjectFiles, runtimeOnly]);

  const runtimeBlobPreviewSrc = useMemo(() => {
    if (!runtimeOnly || !runtimeCodeWithSdk) return null;
    const blob = new Blob([runtimeCodeWithSdk], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [runtimeCodeWithSdk, runtimeOnly]);

  const rawPreviewProjectFilesSignature = useMemo(
    () => serializeEditableProjectFiles(deferredPreviewProjectFiles),
    [deferredPreviewProjectFiles]
  );
  const workspacePreviewSessionId = useMemo(() => {
    if (runtimeOnly || !rawPreviewProjectFilesSignature) return null;
    return `preview_${build.id}_${hashPreviewCode(rawPreviewProjectFilesSignature)}`;
  }, [build.id, rawPreviewProjectFilesSignature, runtimeOnly]);
  const workspacePreviewSessionFiles = useMemo(() => {
    if (runtimeOnly || !workspacePreviewSessionId) {
      return [] as Array<{ path: string; content: string }>;
    }
    return buildPreviewSessionProjectFiles({
      code,
      projectFiles: deferredPreviewProjectFiles,
      sessionId: workspacePreviewSessionId
    });
  }, [
    code,
    deferredPreviewProjectFiles,
    runtimeOnly,
    workspacePreviewSessionId
  ]);
  const workspacePreviewCodeSignature = useMemo(() => {
    if (runtimeOnly || workspacePreviewSessionFiles.length === 0) return null;
    return buildPreviewCodeSignature(
      serializeEditableProjectFiles(workspacePreviewSessionFiles)
    );
  }, [runtimeOnly, workspacePreviewSessionFiles]);
  const previewSrc = runtimeOnly ? runtimeBlobPreviewSrc : workspacePreviewSrc;
  const previewCodeSignature = runtimeOnly
    ? buildPreviewCodeSignature(runtimeCodeWithSdk)
    : workspacePreviewCodeSignature;

  useEffect(() => {
    previewCodeSignatureRef.current = previewCodeSignature;
  }, [previewCodeSignature]);

  useEffect(() => {
    if (runtimeOnly) {
      setWorkspacePreviewSrc(null);
      return;
    }
    if (!workspacePreviewSessionId || workspacePreviewSessionFiles.length === 0) {
      setWorkspacePreviewSrc(null);
      return;
    }

    let cancelled = false;
    const requestSeq = ++previewSessionRequestSeqRef.current;
    const entryPath =
      getPreferredIndexPath(workspacePreviewSessionFiles) || '/index.html';

    (async () => {
      const result = await createBuildPreviewSessionRef.current({
        buildId: build.id,
        sessionId: workspacePreviewSessionId,
        entryPath,
        codeSignature: workspacePreviewCodeSignature,
        files: workspacePreviewSessionFiles
      });
      if (cancelled || requestSeq !== previewSessionRequestSeqRef.current) {
        return;
      }
      if (typeof result?.entryUrl === 'string' && result.entryUrl.trim()) {
        setWorkspacePreviewSrc(result.entryUrl);
        return;
      }
      console.error('Failed to create preview session:', result);
      setWorkspacePreviewSrc(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    build.id,
    runtimeOnly,
    workspacePreviewCodeSignature,
    workspacePreviewSessionFiles,
    workspacePreviewSessionId
  ]);

  useEffect(() => {
    const nextState = buildEmptyRuntimeObservationState({
      buildId: build.id,
      codeSignature: previewCodeSignature
    });
    runtimeObservationStateRef.current = nextState;
    setRuntimeObservationState(nextState);
  }, [build.id, previewCodeSignature]);

  useEffect(() => {
    runtimeObservationStateRef.current = runtimeObservationState;
    onRuntimeObservationChange?.(runtimeObservationState);
  }, [onRuntimeObservationChange, runtimeObservationState]);

  useEffect(() => {
    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';
    const currentSources = previewFrameSourcesRef.current;
    let activeSrc = currentSources[activeFrame];
    let inactiveSrc = currentSources[inactiveFrame];
    let seededFromCache = false;

    if (!activeSrc && !inactiveSrc && previewCodeSignature) {
      const cached = takeCachedPreviewSeed(build.id, previewCodeSignature);
      if (cached?.src) {
        const seededSources = {
          ...currentSources,
          [activeFrame]: cached.src
        };
        previewFrameSourcesRef.current = seededSources;
        setPreviewFrameSources(seededSources);
        const seededMeta = {
          ...previewFrameMetaRef.current,
          [activeFrame]: {
            buildId: build.id,
            codeSignature: cached.codeSignature || previewCodeSignature
          }
        };
        previewFrameMetaRef.current = seededMeta;
        const seededReady = {
          ...previewFrameReadyRef.current,
          [activeFrame]: false
        };
        previewFrameReadyRef.current = seededReady;
        setPreviewFrameReady(seededReady);
        activeSrc = cached.src;
        messageTargetFrameRef.current = activeFrame;
        seededFromCache = true;
      }
    }

    if (!previewSrc) {
      clearCachedPreviewSeed(build.id);
      if (currentSources.primary) {
        revokePreviewUrl(currentSources.primary);
      }
      if (
        currentSources.secondary &&
        currentSources.secondary !== currentSources.primary
      ) {
        revokePreviewUrl(currentSources.secondary);
      }
      const cleared = { primary: null, secondary: null };
      previewFrameSourcesRef.current = cleared;
      setPreviewFrameSources(cleared);
      previewFrameMetaRef.current = {
        primary: { buildId: null, codeSignature: null },
        secondary: { buildId: null, codeSignature: null }
      };
      const clearedReady = { primary: false, secondary: false };
      previewFrameReadyRef.current = clearedReady;
      setPreviewFrameReady(clearedReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (seededFromCache) {
      revokePreviewUrl(previewSrc);
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (!activeSrc) {
      const nextSources = {
        ...currentSources,
        [activeFrame]: previewSrc
      };
      previewFrameSourcesRef.current = nextSources;
      setPreviewFrameSources(nextSources);
      const nextMeta = {
        ...previewFrameMetaRef.current,
        [activeFrame]: {
          buildId: build.id,
          codeSignature: previewCodeSignature
        }
      };
      previewFrameMetaRef.current = nextMeta;
      const nextReady = {
        ...previewFrameReadyRef.current,
        [activeFrame]: false
      };
      previewFrameReadyRef.current = nextReady;
      setPreviewFrameReady(nextReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = true;
      setPreviewTransitioning(true);
      return;
    }

    if (previewSrc === activeSrc || previewSrc === inactiveSrc) {
      const reusedFrame =
        previewSrc === activeSrc ? activeFrame : inactiveFrame;
      const currentMeta = previewFrameMetaRef.current[reusedFrame];
      const nextSignature = previewCodeSignature || currentMeta?.codeSignature;
      if (
        currentMeta?.buildId !== build.id ||
        currentMeta?.codeSignature !== nextSignature
      ) {
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [reusedFrame]: {
            buildId: build.id,
            codeSignature: nextSignature
          }
        };
      }
      return;
    }

    if (inactiveSrc && inactiveSrc !== previewSrc) {
      revokePreviewUrl(inactiveSrc);
    }

    const nextSources = {
      ...currentSources,
      [inactiveFrame]: previewSrc
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    const nextMeta = {
      ...previewFrameMetaRef.current,
      [inactiveFrame]: {
        buildId: build.id,
        codeSignature: previewCodeSignature
      }
    };
    previewFrameMetaRef.current = nextMeta;
    const nextReady = {
      ...previewFrameReadyRef.current,
      [inactiveFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
    messageTargetFrameRef.current = activeFrame;
    previewTransitioningRef.current = true;
    setPreviewTransitioning(true);
  }, [build.id, previewCodeSignature, previewSrc]);

  useEffect(() => {
    activePreviewFrameRef.current = activePreviewFrame;
  }, [activePreviewFrame]);

  useEffect(() => {
    previewFrameSourcesRef.current = previewFrameSources;
  }, [previewFrameSources]);

  useEffect(() => {
    previewFrameReadyRef.current = previewFrameReady;
  }, [previewFrameReady]);

  useEffect(() => {
    previewTransitioningRef.current = previewTransitioning;
  }, [previewTransitioning]);

  useEffect(() => {
    if (!runtimeOnly) return;

    const nextMeta = {
      primary: {
        buildId: build.id,
        codeSignature: previewCodeSignature
      },
      secondary: {
        buildId: null,
        codeSignature: null
      }
    };
    previewFrameMetaRef.current = nextMeta;
    messageTargetFrameRef.current = 'primary';
    activePreviewFrameRef.current = 'primary';
    setActivePreviewFrame('primary');
    previewTransitioningRef.current = false;
    setPreviewTransitioning(false);
    const nextReadyState = {
      primary: false,
      secondary: false
    };
    previewFrameReadyRef.current = nextReadyState;
    setPreviewFrameReady(nextReadyState);
  }, [build.id, previewCodeSignature, runtimeOnly]);

  useEffect(() => {
    return () => {
      const activeFrame = activePreviewFrameRef.current;
      const sources = previewFrameSourcesRef.current;
      const ready = previewFrameReadyRef.current;
      const frameMeta = previewFrameMetaRef.current;
      const activeMeta = frameMeta[activeFrame];
      const activeSrc = sources[activeFrame];
      const shouldCacheActive =
        Boolean(activeSrc) &&
        ready[activeFrame] &&
        Boolean(activeMeta?.codeSignature) &&
        activeMeta?.buildId === buildRef.current?.id;

      if (
        shouldCacheActive &&
        activeSrc &&
        activeMeta?.buildId &&
        activeMeta?.codeSignature
      ) {
        putCachedPreviewSeed({
          buildId: activeMeta.buildId,
          codeSignature: activeMeta.codeSignature,
          src: activeSrc,
          cachedAt: Date.now()
        });
      } else if (activeSrc) {
        revokePreviewUrl(activeSrc);
      }

      if (sources.primary && sources.primary !== activeSrc) {
        revokePreviewUrl(sources.primary);
      }
      if (sources.secondary && sources.secondary !== sources.primary) {
        if (sources.secondary !== activeSrc) {
          revokePreviewUrl(sources.secondary);
        }
      }
    };
  }, []);

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    setArtifactId(build.primaryArtifactId ?? null);
  }, [build.primaryArtifactId]);

  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  useEffect(() => {
    userIdRef.current = userId || null;
  }, [userId]);

  useEffect(() => {
    usernameRef.current = username || null;
  }, [username]);

  useEffect(() => {
    profilePicUrlRef.current = profilePicUrl || null;
  }, [profilePicUrl]);

  useEffect(() => {
    buildApiTokenRef.current = null;
  }, [build.id, userId]);

  useEffect(() => {
    if (userId) {
      setGuestRestrictionBannerVisible(false);
    }
  }, [userId]);

  useEffect(() => {
    capabilitySnapshotRef.current = resolvedCapabilitySnapshot;
  }, [resolvedCapabilitySnapshot]);

  useEffect(() => {
    runtimeExplorationPlanRef.current = resolvedRuntimeExplorationPlan;
  }, [resolvedRuntimeExplorationPlan]);

  useEffect(() => {
    const viewer = getViewerInfo();
    const previewFrames = [
      primaryIframeRef.current?.contentWindow,
      secondaryIframeRef.current?.contentWindow
    ];

    for (const targetWindow of previewFrames) {
      if (!targetWindow) continue;
      targetWindow.postMessage(
        {
          source: 'twinkle-parent',
          type: 'viewer:update',
          viewer
        },
        '*'
      );
    }
  }, [build.id, build.isPublic, isOwner, userId, username, profilePicUrl]);

  useEffect(() => {
    const previewFrames = [
      primaryIframeRef.current?.contentWindow,
      secondaryIframeRef.current?.contentWindow
    ];

    for (const targetWindow of previewFrames) {
      if (!targetWindow) continue;
      targetWindow.postMessage(
        {
          source: 'twinkle-parent',
          type: 'capabilities:update',
          capabilities: resolvedCapabilitySnapshot
        },
        '*'
      );
    }
  }, [resolvedCapabilitySnapshot]);

  useEffect(() => {
    const previewFrames = [
      primaryIframeRef.current?.contentWindow,
      secondaryIframeRef.current?.contentWindow
    ];

    for (const targetWindow of previewFrames) {
      if (!targetWindow) continue;
      targetWindow.postMessage(
        {
          source: 'twinkle-parent',
          type: 'exploration-plan:update',
          explorationPlan: resolvedRuntimeExplorationPlan
        },
        '*'
      );
    }
  }, [resolvedRuntimeExplorationPlan]);

  useEffect(() => {
    const shouldHydrateForBuild =
      hydratedBuildIdRef.current === null || hydratedBuildIdRef.current !== build.id;
    if (!shouldHydrateForBuild) return;
    hydratedBuildIdRef.current = build.id;
    setEditableProjectFiles(persistedProjectFiles);
    setActiveFilePath(
      getPreferredIndexPath(persistedProjectFiles) ||
        persistedProjectFiles[0]?.path ||
        '/index.html'
    );
    setProjectFileError('');
    setNewFilePath('');
    setRenamePathInput('/index.html');
    setSelectedFolderPath(null);
    setFolderMoveTargetPath('');
    setCollapsedFolders({});
    wasShowingStreamingCodeRef.current = false;
    streamingAutoFollowEnabledRef.current = false;
    autoReturnToPreviewPendingRef.current = false;
    lastStreamingFocusFilePathRef.current = null;
  }, [build.id, persistedProjectFiles, persistedProjectFilesSignature]);

  useEffect(() => {
    if (hasUnsavedProjectFileChanges) return;
    setEditableProjectFiles(persistedProjectFiles);
    setActiveFilePath((prev) => {
      const hasPrev = persistedProjectFiles.some((file) => file.path === prev);
      if (hasPrev) return prev;
      return (
        getPreferredIndexPath(persistedProjectFiles) ||
        persistedProjectFiles[0]?.path ||
        '/index.html'
      );
    });
  }, [
    persistedProjectFiles,
    persistedProjectFilesSignature,
    hasUnsavedProjectFileChanges
  ]);

  useEffect(() => {
    const justStartedStreaming =
      isShowingStreamingCode && !wasShowingStreamingCodeRef.current;
    const justStoppedStreaming =
      !isShowingStreamingCode && wasShowingStreamingCodeRef.current;
    wasShowingStreamingCodeRef.current = isShowingStreamingCode;

    if (justStartedStreaming) {
      streamingAutoFollowEnabledRef.current = true;
      autoReturnToPreviewPendingRef.current = false;
      if (viewMode !== 'code') {
        setViewMode('code');
      }
    } else if (justStoppedStreaming) {
      streamingAutoFollowEnabledRef.current = false;
      autoReturnToPreviewPendingRef.current = true;
      lastStreamingFocusFilePathRef.current = null;
    }
  }, [isShowingStreamingCode, viewMode]);

  useEffect(() => {
    if (runtimeOnly) return;
    if (isShowingStreamingCode) return;
    if (!autoReturnToPreviewPendingRef.current) return;
    const hasPreviewSurface = Boolean(
      previewFrameSources.primary || previewFrameSources.secondary || previewSrc
    );
    if (!hasPreviewSurface) return;
    autoReturnToPreviewPendingRef.current = false;
    if (viewMode !== 'preview') {
      setViewMode('preview');
    }
  }, [
    isShowingStreamingCode,
    previewFrameSources.primary,
    previewFrameSources.secondary,
    previewSrc,
    runtimeOnly,
    viewMode
  ]);

  useEffect(() => {
    if (!isShowingStreamingCode || !streamingFocusFilePath) return;
    const nextPath = normalizeProjectFilePath(streamingFocusFilePath);
    if (lastStreamingFocusFilePathRef.current === nextPath) return;
    lastStreamingFocusFilePathRef.current = nextPath;
    if (!streamingAutoFollowEnabledRef.current) return;
    setActiveFilePath((prev) => {
      const exists = displayedProjectFiles.some((file) => file.path === nextPath);
      if (!exists) return prev;
      return nextPath;
    });
  }, [displayedProjectFiles, isShowingStreamingCode, streamingFocusFilePath]);

  useEffect(() => {
    onEditableProjectFilesStateChange?.({
      files: editableProjectFilesForParent,
      hasUnsavedChanges: hasUnsavedProjectFileChanges,
      saving: savingProjectFiles
    });
  }, [
    editableProjectFilesForParent,
    hasUnsavedProjectFileChanges,
    savingProjectFiles,
    onEditableProjectFilesStateChange
  ]);

  useEffect(() => {
    setRenamePathInput(activeFile?.path || '/index.html');
  }, [activeFile?.path]);

  useEffect(() => {
    if (!selectedFolderPath) {
      setFolderMoveTargetPath('');
      return;
    }
    setFolderMoveTargetPath(selectedFolderPath);
  }, [selectedFolderPath]);

  function setEditableFiles(nextFiles: EditableProjectFile[]) {
    const sorted = [...nextFiles].sort((a, b) => a.path.localeCompare(b.path));
    setEditableProjectFiles(sorted);
    setActiveFilePath((prev) => {
      if (sorted.some((file) => file.path === prev)) return prev;
      return (
        getPreferredIndexPath(sorted) ||
        sorted[0]?.path ||
        '/index.html'
      );
    });
  }

  function handleViewModeChange(nextMode: 'preview' | 'code') {
    if (nextMode === viewMode) return;
    if (isShowingStreamingCode) {
      streamingAutoFollowEnabledRef.current = nextMode === 'code';
    }
    setViewMode(nextMode);
  }

  function toggleFolderCollapsed(folderPath: string) {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  }

  function handleSelectFolder(folderPath: string) {
    setSelectedFolderPath(folderPath);
    setProjectFileError('');
  }

  function handleEditableFileContentChange(content: string) {
    if (!isOwner || !activeFile) return;
    setEditableFiles(
      editableProjectFiles.map((file) =>
        file.path === activeFile.path ? { ...file, content } : file
      )
    );
    setProjectFileError('');
  }

  function handleAddProjectFile() {
    if (!isOwner) return;
    const normalizedPath = normalizeProjectFilePath(newFilePath);
    if (
      !normalizedPath ||
      normalizedPath === '/' ||
      normalizedPath.endsWith('/')
    ) {
      setProjectFileError('Enter a valid file path like /src/app.js');
      return;
    }
    if (editableProjectFiles.some((file) => file.path === normalizedPath)) {
      setProjectFileError('A file with this path already exists');
      return;
    }
    const nextFiles = [
      ...editableProjectFiles,
      { path: normalizedPath, content: '' }
    ];
    setEditableFiles(nextFiles);
    setActiveFilePath(normalizedPath);
    setSelectedFolderPath(null);
    setNewFilePath('');
    setProjectFileError('');
  }

  function handleDeleteProjectFile(filePath: string) {
    if (!isOwner) return;
    if (isIndexHtmlPath(filePath)) {
      setProjectFileError('Cannot delete /index.html');
      return;
    }
    const nextFiles = editableProjectFiles.filter((file) => file.path !== filePath);
    if (nextFiles.length === editableProjectFiles.length) return;
    if (!window.confirm(`Delete ${filePath}?`)) return;
    setEditableFiles(nextFiles);
    setProjectFileError('');
  }

  function handleRenameOrMoveActiveFile() {
    if (!isOwner || !activeFile) return;
    const normalizedPath = normalizeProjectFilePath(renamePathInput);
    if (
      !normalizedPath ||
      normalizedPath === '/' ||
      normalizedPath.endsWith('/')
    ) {
      setProjectFileError('Enter a valid target path like /src/app.js');
      return;
    }
    const activeIsIndex = isIndexHtmlPath(activeFile.path);
    if (activeIsIndex && !isIndexHtmlPath(normalizedPath)) {
      setProjectFileError('/index.html can only be moved to /index.htm');
      return;
    }
    if (
      normalizedPath !== activeFile.path &&
      editableProjectFiles.some((file) => file.path === normalizedPath)
    ) {
      // Replace the destination file automatically. Restore history is the
      // safety net for mistaken overwrites.
    }
    if (normalizedPath === activeFile.path) {
      setProjectFileError('');
      return;
    }
    const nextFiles = editableProjectFiles
      .filter(
        (file) => file.path !== normalizedPath || file.path === activeFile.path
      )
      .map((file) =>
        file.path === activeFile.path
          ? { ...file, path: normalizedPath }
          : file
      );
    setEditableFiles(nextFiles);
    setActiveFilePath(normalizedPath);
    setSelectedFolderPath(null);
    setRenamePathInput(normalizedPath);
    setProjectFileError('');
  }

  function handleMoveSelectedFolder() {
    if (!isOwner || !selectedFolderPath) return;
    const sourceFolder = normalizeProjectFilePath(selectedFolderPath);
    const targetFolder = normalizeProjectFilePath(folderMoveTargetPath);
    if (!targetFolder || targetFolder === '/') {
      setProjectFileError('Enter a valid target folder like /src/ui');
      return;
    }
    if (sourceFolder === targetFolder) {
      setProjectFileError('');
      return;
    }
    if (
      targetFolder === sourceFolder ||
      targetFolder.startsWith(`${sourceFolder}/`)
    ) {
      setProjectFileError('Cannot move a folder into itself.');
      return;
    }

    const filesInFolder = editableProjectFiles.filter((file) =>
      isPathWithinFolder(file.path, sourceFolder)
    );
    if (filesInFolder.length === 0) {
      setProjectFileError('Selected folder has no files to move.');
      return;
    }

    const movedSourcePaths = new Set(filesInFolder.map((file) => file.path));
    const remappedFiles = filesInFolder.map((file) => ({
      path: remapPathPrefix({
        filePath: file.path,
        fromPrefix: sourceFolder,
        toPrefix: targetFolder
      }),
      content: file.content
    }));
    const remappedTargetPaths = new Set(remappedFiles.map((file) => file.path));
    const conflictPaths = editableProjectFiles
      .filter(
        (file) =>
          !movedSourcePaths.has(file.path) && remappedTargetPaths.has(file.path)
      )
      .map((file) => file.path)
      .sort((a, b) => a.localeCompare(b));

    const conflictSet = new Set(conflictPaths);
    const retainedFiles = editableProjectFiles.filter((file) => {
      if (movedSourcePaths.has(file.path)) return false;
      if (conflictSet.has(file.path)) return false;
      return true;
    });
    const merged = [...retainedFiles, ...remappedFiles];
    const deduped = new Map<string, string>();
    for (const file of merged) {
      deduped.set(file.path, file.content);
    }
    const nextFiles = Array.from(deduped.entries()).map(([path, content]) => ({
      path,
      content
    }));

    setEditableFiles(nextFiles);
    setActiveFilePath((prev) =>
      remapPathPrefix({
        filePath: prev,
        fromPrefix: sourceFolder,
        toPrefix: targetFolder
      })
    );
    setCollapsedFolders((prev) => {
      const next: Record<string, boolean> = {};
      for (const [path, value] of Object.entries(prev)) {
        if (path === sourceFolder || path.startsWith(`${sourceFolder}/`)) {
          const remappedPath = remapPathPrefix({
            filePath: path,
            fromPrefix: sourceFolder,
            toPrefix: targetFolder
          });
          next[remappedPath] = value;
        } else {
          next[path] = value;
        }
      }
      return next;
    });
    setSelectedFolderPath(targetFolder);
    setFolderMoveTargetPath(targetFolder);
    setProjectFileError('');
  }

  async function handleSaveEditableProjectFiles() {
    if (!isOwner || savingProjectFiles || !hasUnsavedProjectFileChanges) return;
    setSavingProjectFiles(true);
    setProjectFileError('');
    const result = await onSaveProjectFiles(editableProjectFiles);
    setSavingProjectFiles(false);
    if (!result?.success) {
      setProjectFileError(result?.error || 'Failed to save project files');
      return;
    }
    setProjectFileError('');
  }

  function isGuestViewerActive() {
    return (
      Boolean(buildRef.current?.isPublic) &&
      !isOwnerRef.current &&
      !userIdRef.current
    );
  }

  function ensureGuestSessionId() {
    if (guestSessionIdRef.current) {
      return guestSessionIdRef.current;
    }

    try {
      const storedGuestSessionId = window.localStorage.getItem(
        GUEST_SESSION_STORAGE_KEY
      );
      if (storedGuestSessionId) {
        guestSessionIdRef.current = storedGuestSessionId;
        return storedGuestSessionId;
      }
    } catch {
      // no-op
    }

    const generatedGuestSessionId = `guest_${
      window.crypto?.randomUUID?.() ||
      `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    }`;

    guestSessionIdRef.current = generatedGuestSessionId;

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

  function triggerGuestRestriction() {
    setGuestRestrictionBannerVisible(true);
    const error: any = new Error(GUEST_RESTRICTION_ERROR_MESSAGE);
    error.code = 'guest_restricted';
    throw error;
  }

  async function ensureBuildApiToken(requiredScopes: string[]) {
    if (isGuestViewerActive()) {
      triggerGuestRestriction();
    }

    const now = Math.floor(Date.now() / 1000);
    const cached = buildApiTokenRef.current;
    if (
      cached &&
      cached.expiresAt - 30 > now &&
      requiredScopes.every((scope) => cached.scopes.includes(scope))
    ) {
      return cached.token;
    }

    const activeBuild = buildRef.current;
    if (!activeBuild?.id) {
      throw new Error('Build not found');
    }

    const scopeSet = new Set<string>([
      ...(cached?.scopes || []),
      ...requiredScopes
    ]);
    const requestedScopes = Array.from(scopeSet);

    const result = await getBuildApiTokenRef.current({
      buildId: activeBuild.id,
      scopes: requestedScopes
    });
    if (!result?.token) {
      throw new Error('Failed to obtain API token');
    }
    buildApiTokenRef.current = {
      token: result.token,
      scopes: result.scopes || requestedScopes,
      expiresAt: result.expiresAt || now + 600
    };
    return result.token;
  }

  function getViewerInfo() {
    if (userIdRef.current) {
      return {
        id: userIdRef.current,
        username: usernameRef.current,
        profilePicUrl: profilePicUrlRef.current,
        isLoggedIn: true,
        isOwner: Boolean(isOwnerRef.current),
        isGuest: false
      };
    }

    if (isGuestViewerActive()) {
      return {
        id: ensureGuestSessionId(),
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
      isOwner: Boolean(isOwnerRef.current),
      isGuest: false
    };
  }

  useEffect(() => {
    if (historyOpen) {
      void loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, artifactId]);

  async function loadVersions() {
    if (!isOwnerRef.current) {
      setVersions([]);
      return;
    }
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setLoadingVersions(true);
    try {
      let activeArtifactId = artifactId;
      if (!activeArtifactId) {
        const artifactsData = await listBuildArtifactsRef.current(
          activeBuild.id
        );
        activeArtifactId = artifactsData?.artifacts?.[0]?.id ?? null;
        if (activeArtifactId) {
          setArtifactId(activeArtifactId);
        }
      }

      if (!activeArtifactId) {
        setVersions([]);
        return;
      }

      const data = await listBuildArtifactVersionsRef.current({
        buildId: activeBuild.id,
        artifactId: activeArtifactId,
        limit: 50
      });
      setVersions(data?.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleRestoreVersion(versionId: number) {
    if (!isOwnerRef.current || !artifactId || restoringVersionId) return;
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setRestoringVersionId(versionId);
    try {
      const result = await restoreBuildArtifactVersionRef.current({
        buildId: activeBuild.id,
        artifactId,
        versionId
      });
      const restoredProjectFiles = Array.isArray(result?.projectFiles)
        ? result.projectFiles
        : [];
      if (restoredProjectFiles.length > 0) {
        const restoredCode =
          typeof result?.code === 'string' ? result.code : null;
        onApplyRestoredProjectFiles(restoredProjectFiles, restoredCode);
        const restoredEditableFiles = buildEditableProjectFiles({
          code: restoredCode,
          projectFiles: restoredProjectFiles
        });
        setEditableProjectFiles(restoredEditableFiles);
        setActiveFilePath(
          getPreferredIndexPath(restoredEditableFiles) ||
            restoredEditableFiles[0]?.path ||
            '/index.html'
        );
        setProjectFileError('');
      } else if (result?.code) {
        onReplaceCode(result.code);
      }
      if (historyOpen) {
        await loadVersions();
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
    setRestoringVersionId(null);
  }

  function handlePreviewFrameLoad(
    frame: 'primary' | 'secondary',
    expectedSrc: string | null
  ) {
    if (!expectedSrc) return;
    const sources = previewFrameSourcesRef.current;
    if (sources[frame] !== expectedSrc) return;
    const nextReadyState = {
      ...previewFrameReadyRef.current,
      [frame]: true
    };
    previewFrameReadyRef.current = nextReadyState;
    setPreviewFrameReady(nextReadyState);

    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';

    if (frame === activeFrame) {
      messageTargetFrameRef.current = frame;
      if (!sources[inactiveFrame]) {
        previewTransitioningRef.current = false;
        setPreviewTransitioning(false);
      }
      return;
    }

    const outgoingSrc = sources[activeFrame];
    setActivePreviewFrame(frame);
    activePreviewFrameRef.current = frame;
    messageTargetFrameRef.current = frame;
    previewTransitioningRef.current = false;
    setPreviewTransitioning(false);

    if (outgoingSrc && outgoingSrc !== expectedSrc) {
      revokePreviewUrl(outgoingSrc);
    }

    const nextSources = {
      ...sources,
      [activeFrame]: null
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    const nextMeta = {
      ...previewFrameMetaRef.current,
      [activeFrame]: {
        buildId: null,
        codeSignature: null
      }
    };
    previewFrameMetaRef.current = nextMeta;
    const nextReady = {
      ...previewFrameReadyRef.current,
      [activeFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
  }

  function handleRuntimePreviewFrameLoad() {
    const nextReadyState = {
      primary: true,
      secondary: false
    };
    previewFrameReadyRef.current = nextReadyState;
    setPreviewFrameReady(nextReadyState);
    messageTargetFrameRef.current = 'primary';
    activePreviewFrameRef.current = 'primary';
    setActivePreviewFrame('primary');
    previewTransitioningRef.current = false;
    setPreviewTransitioning(false);
  }

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
      const activeBuild = buildRef.current;
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
            previousHealth.meaningfulRender === normalizedHealth.meaningfulRender &&
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

      // SECURITY: Validate the message came from our iframe, not an external source.
      // We use '*' for postMessage origin because blob/srcdoc iframes have null origins,
      // but we validate event.source to ensure messages only come from our preview iframes.
      const owner = isOwnerRef.current;

      try {
        let response: any = {};

        switch (type) {
          case 'init':
            response = {
              id: activeBuild.id,
              title: activeBuild.title,
              username: activeBuild.username,
              viewer: getViewerInfo(),
              capabilities: capabilitySnapshotRef.current,
              explorationPlan: runtimeExplorationPlanRef.current
            };
            break;

          case 'capabilities:get':
            response = { capabilities: capabilitySnapshotRef.current };
            break;

          case 'db:load':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const dbData = await downloadBuildDatabaseRef.current(
              activeBuild.id
            );
            if (dbData) {
              const bytes = new Uint8Array(dbData);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              response = { data: btoa(binary) };
            } else {
              response = { data: null };
            }
            break;

          case 'db:save':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const base64 = payload.data;
            const binaryStr = atob(base64);
            const len = binaryStr.length;
            const bytesArr = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytesArr[i] = binaryStr.charCodeAt(i);
            }
            const result = await uploadBuildDatabaseRef.current({
              buildId: activeBuild.id,
              data: bytesArr.buffer
            });
            response = result;
            break;

          case 'ai:list-prompts':
            const promptsData = await loadBuildAiPromptsRef.current();
            response = { prompts: promptsData?.prompts || [] };
            break;

          case 'ai:chat':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const aiResult = await callBuildAiChatRef.current({
              buildId: activeBuild.id,
              promptId: payload.promptId,
              message: payload.message,
              history: payload.history
            });
            response = aiResult;
            break;

          case 'viewer:get':
            response = { viewer: getViewerInfo() };
            break;

          case 'viewer-db:query':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (isGuestViewerActive()) {
              response = await executeGuestViewerDbQuery({
                buildId: activeBuild.id,
                guestSessionId: ensureGuestSessionId(),
                sql: payload?.sql,
                params: payload?.params
              });
            } else {
              response = await queryViewerDbRef.current({
                buildId: activeBuild.id,
                sql: payload?.sql,
                params: payload?.params
              });
            }
            break;

          case 'viewer-db:exec':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (isGuestViewerActive()) {
              response = await executeGuestViewerDbExec({
                buildId: activeBuild.id,
                guestSessionId: ensureGuestSessionId(),
                sql: payload?.sql,
                params: payload?.params
              });
            } else {
              response = await execViewerDbRef.current({
                buildId: activeBuild.id,
                sql: payload?.sql,
                params: payload?.params
              });
            }
            break;

          case 'api:get-user': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const userToken = await ensureBuildApiToken(['user:read']);
            response = await getBuildApiUserRef.current({
              buildId: activeBuild.id,
              userId: payload?.userId,
              token: userToken
            });
            break;
          }

          case 'api:get-users': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const usersToken = await ensureBuildApiToken(['users:read']);
            response = await getBuildApiUsersRef.current({
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
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const reflectionsToken = await ensureBuildApiToken([
              'dailyReflections:read'
            ]);
            response = await getBuildDailyReflectionsRef.current({
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
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentSubjectsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildMySubjectsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentSubjectsToken
            });
            break;
          }

          case 'content:subject': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentSubjectToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildSubjectRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              token: contentSubjectToken
            });
            break;
          }

          case 'content:subject-comments': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentCommentsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildSubjectCommentsRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentCommentsToken
            });
            break;
          }

          case 'content:profile-comments': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileCountToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentsRef.current({
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
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileIdsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentIdsRef.current({
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
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileByIdsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentsByIdsRef.current({
              buildId: activeBuild.id,
              ids: Array.isArray(payload?.ids) ? payload.ids : [],
              token: contentProfileByIdsToken
            });
            break;
          }

          case 'content:profile-comment-counts': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileCountsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentCountsRef.current({
              buildId: activeBuild.id,
              ids: Array.isArray(payload?.ids) ? payload.ids : [],
              token: contentProfileCountsToken
            });
            break;
          }

          case 'shared-db:get-topics': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbTopicsToken = await ensureBuildApiToken([
              'sharedDb:read'
            ]);
            response = await getSharedDbTopicsRef.current({
              buildId: activeBuild.id,
              token: sharedDbTopicsToken
            });
            break;
          }

          case 'shared-db:create-topic': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbCreateTopicToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await createSharedDbTopicRef.current({
              buildId: activeBuild.id,
              name: payload?.name,
              token: sharedDbCreateTopicToken
            });
            break;
          }

          case 'shared-db:get-entries': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbEntriesToken = await ensureBuildApiToken([
              'sharedDb:read'
            ]);
            response = await getSharedDbEntriesRef.current({
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
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbAddEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await addSharedDbEntryRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              data: payload?.data,
              token: sharedDbAddEntryToken
            });
            break;
          }

          case 'shared-db:update-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbUpdateEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await updateSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              data: payload?.data,
              token: sharedDbUpdateEntryToken
            });
            break;
          }

          case 'shared-db:delete-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbDeleteEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await deleteSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              token: sharedDbDeleteEntryToken
            });
            break;
          }

          case 'private-db:get': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbReadToken = await ensureBuildApiToken([
              'privateDb:read'
            ]);
            response = await getPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbReadToken
            });
            break;
          }

          case 'private-db:list': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbListToken = await ensureBuildApiToken([
              'privateDb:read'
            ]);
            response = await listPrivateDbItemsRef.current({
              buildId: activeBuild.id,
              prefix: payload?.prefix,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: privateDbListToken
            });
            break;
          }

          case 'private-db:set': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbWriteToken = await ensureBuildApiToken([
              'privateDb:write'
            ]);
            response = await setPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              value: payload?.value,
              token: privateDbWriteToken
            });
            break;
          }

          case 'private-db:remove': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbDeleteToken = await ensureBuildApiToken([
              'privateDb:write'
            ]);
            response = await deletePrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbDeleteToken
            });
            break;
          }

          default:
            throw new Error(`Unknown request type: ${type}`);
        }

        // SECURITY: Use '*' because blob URLs have null origins.
        // Security is enforced by validating event.source above.
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={runtimeOnly ? runtimePanelClass : panelClass}>
      {!runtimeOnly && (
        <div className={toolbarClass}>
          <div className={toolbarTitleClass}>
            <Icon icon="laptop-code" />
            Workspace
          </div>
          <div className={toolbarActionsClass}>
            {isOwner && (
              <GameCTAButton
                variant="purple"
                size="md"
                icon="clock"
                onClick={() => setHistoryOpen(true)}
              >
                History
              </GameCTAButton>
            )}
            <SegmentedToggle<'preview' | 'code'>
              value={viewMode}
              onChange={handleViewModeChange}
              options={workspaceViewOptions}
              size="md"
              ariaLabel="Workspace mode"
            />
          </div>
        </div>
      )}

      <div
        className={css`
          flex: 1;
          overflow: hidden;
          background: #fff;
          min-height: 0;
        `}
      >
        {runtimeOnly ? (
          codeWithSdk ? (
            <div className={previewStageClass}>
              {!previewFrameReady.primary && (
                <div className={previewPreloadSurfaceClass}>
                  <div className={previewPreloadIconWrapClass}>
                    <Icon icon="spinner" className={previewSpinnerClass} />
                  </div>
                  <div className={previewPreloadLabelClass}>Loading...</div>
                </div>
              )}
              <iframe
                ref={primaryIframeRef}
                srcDoc={codeWithSdk}
                title="App preview"
                sandbox="allow-scripts"
                onLoad={handleRuntimePreviewFrameLoad}
                className={previewIframeClass}
                style={{
                  opacity: previewFrameReady.primary ? 1 : 0,
                  pointerEvents: previewFrameReady.primary ? 'auto' : 'none'
                }}
              />
            </div>
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--chat-text);
                text-align: center;
                padding: 2rem;
                background: #fff;
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.6 }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                No preview available yet
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--chat-text)',
                  opacity: 0.6
                }}
              >
                This build has no code yet
              </p>
            </div>
          )
        ) : viewMode === 'preview' ? (
          (previewFrameSources.primary ||
            previewFrameSources.secondary ||
            previewSrc) ? (
            <div className={previewStageClass}>
              {!previewFrameReady[activePreviewFrame] && (
                <div className={previewPreloadSurfaceClass}>
                  <div className={previewPreloadIconWrapClass}>
                    <Icon icon="spinner" className={previewSpinnerClass} />
                  </div>
                  <div className={previewPreloadLabelClass}>Loading...</div>
                </div>
              )}
              {previewFrameSources.primary && (
                <iframe
                  ref={primaryIframeRef}
                  src={previewFrameSources.primary}
                  title="Preview (primary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'primary',
                      previewFrameSources.primary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewFrameSources.secondary && (
                <iframe
                  ref={secondaryIframeRef}
                  src={previewFrameSources.secondary}
                  title="Preview (secondary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'secondary',
                      previewFrameSources.secondary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewTransitioning && (
                <div className={previewLoadingOverlayClass}>
                  <Icon icon="spinner" className={previewSpinnerClass} />
                  Updating preview
                </div>
              )}
            </div>
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--chat-text);
                text-align: center;
                padding: 2rem;
                background: #fff;
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.6 }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                No preview available yet
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--chat-text)',
                  opacity: 0.6
                }}
              >
                {isOwner
                  ? 'Use the chat to describe what you want to build'
                  : 'This build has no code yet'}
              </p>
            </div>
          )
        ) : (
          <div
            className={css`
              height: 100%;
              min-height: 0;
              display: grid;
              grid-template-columns: 280px 1fr;
              background: #111827;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr;
                grid-template-rows: 220px 1fr;
              }
            `}
          >
            <div
              className={css`
                border-right: 1px solid rgba(255, 255, 255, 0.08);
                background: #0b1220;
                min-height: 0;
                display: flex;
                flex-direction: column;
                @media (max-width: ${mobileMaxWidth}) {
                  border-right: none;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
              `}
            >
              <div
                className={css`
                  padding: 0.7rem 0.8rem;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.5rem;
                  color: #e5e7eb;
                  font-size: 0.75rem;
                  letter-spacing: 0.02em;
                  text-transform: uppercase;
                  font-weight: 800;
                `}
              >
                <span>Project files</span>
                <span>{displayedProjectFiles.length}</span>
              </div>
              {isOwner && !isShowingStreamingCode && (
                <div
                  className={css`
                    padding: 0.6rem 0.65rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    gap: 0.4rem;
                  `}
                >
                  <input
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    placeholder="/src/app.js"
                    className={css`
                      flex: 1;
                      min-width: 0;
                      border: 1px solid rgba(255, 255, 255, 0.16);
                      border-radius: 8px;
                      background: rgba(17, 24, 39, 0.8);
                      color: #e5e7eb;
                      padding: 0.45rem 0.5rem;
                      font-size: 0.75rem;
                      &:focus {
                        outline: none;
                        border-color: rgba(65, 140, 235, 0.8);
                      }
                    `}
                  />
                  <button
                    type="button"
                    onClick={handleAddProjectFile}
                    className={css`
                      border: 1px solid rgba(255, 255, 255, 0.16);
                      border-radius: 8px;
                      background: rgba(65, 140, 235, 0.18);
                      color: #dbeafe;
                      padding: 0.4rem 0.55rem;
                      cursor: pointer;
                      font-size: 0.75rem;
                      font-weight: 700;
                      &:hover {
                        background: rgba(65, 140, 235, 0.3);
                      }
                    `}
                    aria-label="Add file"
                    title="Add file"
                  >
                    <Icon icon="plus" />
                  </button>
                </div>
              )}
              {isOwner && !isShowingStreamingCode && (
                <div
                  className={css`
                    padding: 0.55rem 0.7rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                  `}
                >
                  {selectedFolderPath && (
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                      `}
                    >
                      <input
                        value={folderMoveTargetPath}
                        onChange={(e) =>
                          setFolderMoveTargetPath(e.target.value)
                        }
                        placeholder="/new/folder/path"
                        className={css`
                          flex: 1;
                          min-width: 0;
                          border: 1px solid rgba(255, 255, 255, 0.16);
                          border-radius: 8px;
                          background: rgba(17, 24, 39, 0.82);
                          color: #e5e7eb;
                          padding: 0.42rem 0.5rem;
                          font-size: 0.72rem;
                        `}
                      />
                      <button
                        type="button"
                        onClick={handleMoveSelectedFolder}
                        className={css`
                          border: 1px solid rgba(255, 255, 255, 0.18);
                          border-radius: 8px;
                          background: rgba(34, 197, 94, 0.2);
                          color: #bbf7d0;
                          padding: 0.36rem 0.52rem;
                          font-size: 0.72rem;
                          font-weight: 700;
                          cursor: pointer;
                        `}
                        title={`Move folder ${selectedFolderPath}`}
                      >
                        Move folder
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div
                className={css`
                  flex: 1;
                  min-height: 0;
                  overflow: auto;
                  padding: 0.45rem;
                  display: flex;
                  flex-direction: column;
                  gap: 0.35rem;
                `}
              >
                {projectExplorerEntries.map((entry) => {
                  if (entry.kind === 'folder') {
                    const isCollapsed = Boolean(collapsedFolders[entry.path]);
                    const isSelected = selectedFolderPath === entry.path;
                    return (
                      <div
                        key={`folder-${entry.path}`}
                        className={css`
                          display: flex;
                          align-items: center;
                          gap: 0.28rem;
                        `}
                        style={{
                          marginLeft: `${entry.depth * 0.8}rem`
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFolderCollapsed(entry.path)}
                          className={css`
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            border-radius: 8px;
                            background: rgba(148, 163, 184, 0.16);
                            color: #cbd5e1;
                            padding: 0.3rem 0.45rem;
                            font-size: 0.68rem;
                            cursor: pointer;
                          `}
                        >
                          {isCollapsed ? '[+]' : '[-]'} {entry.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectFolder(entry.path)}
                          className={css`
                            flex: 1;
                            min-width: 0;
                            text-align: left;
                            border: 1px solid
                              ${isSelected
                                ? 'rgba(65, 140, 235, 0.7)'
                                : 'rgba(255, 255, 255, 0.08)'};
                            background: ${isSelected
                              ? 'rgba(65, 140, 235, 0.25)'
                              : 'rgba(148, 163, 184, 0.1)'};
                            color: #cbd5e1;
                            border-radius: 8px;
                            padding: 0.34rem 0.48rem;
                            cursor: pointer;
                            font-size: 0.74rem;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 0.5rem;
                          `}
                          title={entry.path}
                        >
                          <span
                            className={css`
                              overflow: hidden;
                              text-overflow: ellipsis;
                              white-space: nowrap;
                            `}
                          >
                            {entry.name}
                          </span>
                          <span>{entry.fileCount}</span>
                        </button>
                      </div>
                    );
                  }

                  const file = entry.file;
                  const isActive = file.path === activeFilePath;
                    const isDirty =
                      !isShowingStreamingCode &&
                      persistedFileContentByPath.get(file.path) !== file.content;
                  const displayName = getFileNameFromPath(file.path);
                  return (
                    <div
                      key={`file-${file.path}`}
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.3rem;
                        margin-left: ${(entry.depth + 1) * 0.8}rem;
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isShowingStreamingCode) {
                            streamingAutoFollowEnabledRef.current = false;
                          }
                          setActiveFilePath(file.path);
                          setSelectedFolderPath(null);
                          setProjectFileError('');
                        }}
                        className={css`
                          flex: 1;
                          min-width: 0;
                          text-align: left;
                          border: 1px solid
                            ${isActive
                              ? 'rgba(65, 140, 235, 0.65)'
                              : 'rgba(255, 255, 255, 0.08)'};
                          background: ${isActive
                            ? 'rgba(65, 140, 235, 0.2)'
                            : 'rgba(17, 24, 39, 0.6)'};
                          color: ${isActive ? '#dbeafe' : '#e5e7eb'};
                          border-radius: 8px;
                          padding: 0.42rem 0.5rem;
                          cursor: pointer;
                          font-size: 0.76rem;
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 0.45rem;
                        `}
                        title={file.path}
                      >
                        <span
                          className={css`
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                          `}
                        >
                          {displayName}
                        </span>
                        {isDirty && (
                          <span
                            className={css`
                              color: #fbbf24;
                              font-weight: 900;
                            `}
                            aria-label="Unsaved changes"
                            title="Unsaved changes"
                          >
                            •
                          </span>
                        )}
                      </button>
                      {isOwner &&
                        !isShowingStreamingCode &&
                        !isIndexHtmlPath(file.path) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProjectFile(file.path)}
                          className={css`
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            background: rgba(239, 68, 68, 0.14);
                            color: #fecaca;
                            border-radius: 8px;
                            padding: 0.38rem 0.5rem;
                            cursor: pointer;
                            &:hover {
                              background: rgba(239, 68, 68, 0.24);
                            }
                          `}
                          title={`Delete ${file.path}`}
                        >
                          <Icon icon="trash-alt" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className={css`
                position: relative;
                min-height: 0;
                display: grid;
                grid-template-rows: auto 1fr;
              `}
            >
              <div
                className={css`
                  padding: 0.55rem 0.75rem;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.75rem;
                  background: #0f172a;
                `}
              >
                <div
                  className={css`
                    min-width: 0;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                  `}
                >
                  <div
                    className={css`
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      color: #e5e7eb;
                      font-size: 0.8rem;
                      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                    `}
                    title={activeFile?.path || '/index.html'}
                  >
                    {activeFile?.path || '/index.html'}
                  </div>
                  {isOwner && activeFile && !isShowingStreamingCode && (
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                      `}
                    >
                      <input
                        value={renamePathInput}
                        onChange={(e) => setRenamePathInput(e.target.value)}
                        placeholder="/src/new-path.js"
                        className={css`
                          flex: 1;
                          min-width: 0;
                          border: 1px solid rgba(255, 255, 255, 0.16);
                          border-radius: 8px;
                          background: rgba(17, 24, 39, 0.85);
                          color: #e5e7eb;
                          padding: 0.3rem 0.45rem;
                          font-size: 0.72rem;
                          font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                          &:focus {
                            outline: none;
                            border-color: rgba(65, 140, 235, 0.8);
                          }
                        `}
                      />
                      <button
                        type="button"
                        onClick={handleRenameOrMoveActiveFile}
                        className={css`
                          border: 1px solid rgba(255, 255, 255, 0.18);
                          border-radius: 8px;
                          background: rgba(65, 140, 235, 0.18);
                          color: #dbeafe;
                          padding: 0.3rem 0.55rem;
                          font-size: 0.72rem;
                          font-weight: 700;
                          cursor: pointer;
                          &:hover {
                            background: rgba(65, 140, 235, 0.3);
                          }
                        `}
                      >
                        Move
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #e5e7eb;
                    font-size: 0.72rem;
                  `}
                >
                  {isShowingStreamingCode ? (
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.45rem;
                        flex-wrap: wrap;
                        justify-content: flex-end;
                      `}
                    >
                      <span
                        className={css`
                          color: #93c5fd;
                          font-weight: 700;
                        `}
                      >
                        Lumine is writing...
                      </span>
                      {streamingAutoFollowEnabledRef.current && (
                        <span
                          className={css`
                            color: #cbd5e1;
                            opacity: 0.85;
                            font-size: 0.69rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.03em;
                          `}
                        >
                          Following edits
                        </span>
                      )}
                    </div>
                  ) : hasUnsavedProjectFileChanges ? (
                    <span
                      className={css`
                        color: #fbbf24;
                        font-weight: 700;
                      `}
                    >
                      Unsaved
                    </span>
                  ) : (
                    <span
                      className={css`
                        color: #86efac;
                        font-weight: 700;
                      `}
                    >
                      Saved
                    </span>
                  )}
                  {isOwner && !isShowingStreamingCode && (
                    <GameCTAButton
                      variant="primary"
                      size="sm"
                      disabled={
                        savingProjectFiles || !hasUnsavedProjectFileChanges
                      }
                      loading={savingProjectFiles}
                      onClick={handleSaveEditableProjectFiles}
                    >
                      {savingProjectFiles ? 'Saving...' : 'Save files'}
                    </GameCTAButton>
                  )}
                </div>
              </div>
              {activeFile ? (
                <textarea
                  value={activeFile.content}
                  onChange={(e) =>
                    handleEditableFileContentChange(e.target.value)
                  }
                  readOnly={!isOwner || isShowingStreamingCode}
                  spellCheck={false}
                  className={css`
                    width: 100%;
                    height: 100%;
                    padding: 1rem;
                    border: none;
                    resize: none;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.85rem;
                    line-height: 1.5;
                    background: #111827;
                    color: #d4d4d4;
                    &:focus {
                      outline: none;
                    }
                  `}
                />
              ) : (
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #cbd5e1;
                    background: #111827;
                  `}
                >
                  No file selected
                </div>
              )}
              {projectFileError && (
                <div
                  className={css`
                    position: absolute;
                    right: 0.8rem;
                    bottom: 0.8rem;
                    background: rgba(239, 68, 68, 0.16);
                    border: 1px solid rgba(239, 68, 68, 0.35);
                    color: #fecaca;
                    border-radius: 8px;
                    padding: 0.45rem 0.6rem;
                    font-size: 0.75rem;
                    max-width: 28rem;
                  `}
                >
                  {projectFileError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {guestRestrictionBannerVisible && !userId && (
        <div className={guestRestrictionBannerClass}>
          <div className={guestRestrictionBannerTextClass}>
            <Icon icon="lock" />
            <span>{GUEST_RESTRICTION_BANNER_TEXT}</span>
          </div>
          <div className={guestRestrictionBannerActionsClass}>
            <GameCTAButton variant="gold" size="sm" onClick={onOpenSigninModal}>
              Log In
            </GameCTAButton>
            <button
              type="button"
              className={guestRestrictionBannerDismissClass}
              onClick={() => setGuestRestrictionBannerVisible(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {!runtimeOnly && (
        <Modal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          size="md"
          modalKey="BuildVersionHistory"
          hasHeader={false}
          showCloseButton={false}
          bodyPadding={0}
          aria-label="Version history"
          style={{
            backgroundColor: '#fff',
            boxShadow: 'none',
            border: '1px solid var(--ui-border)'
          }}
        >
          <div className={historyModalShellClass}>
            <div className={historyModalHeaderClass}>
              <div className={historyModalTitleClass}>Version History</div>
              <button
                className={historyModalCloseButtonClass}
                onClick={() => setHistoryOpen(false)}
                type="button"
                aria-label="Close version history"
              >
                <Icon icon="times" />
              </button>
            </div>
            <div className={historyModalContentClass}>
              {loadingVersions ? (
                <div
                  className={css`
                    padding: 1rem;
                    text-align: center;
                    color: var(--chat-text);
                    opacity: 0.7;
                  `}
                >
                  Loading versions...
                </div>
              ) : versions.length === 0 ? (
                <div
                  className={css`
                    padding: 1rem;
                    text-align: center;
                    color: var(--chat-text);
                    opacity: 0.7;
                  `}
                >
                  No versions yet. Lumine runs and saved file changes will
                  create version history.
                </div>
              ) : (
                versions.map((version) => (
                  <div key={version.id} className={versionRowClass}>
                    <div>
                      <div
                        className={css`
                          font-weight: 700;
                          color: var(--chat-text);
                        `}
                      >
                        v{version.version}
                      </div>
                      {version.summary ? (
                        <div
                          className={css`
                            font-size: 0.9rem;
                            color: var(--chat-text);
                            opacity: 0.75;
                          `}
                        >
                          {version.summary}
                        </div>
                      ) : null}
                      <div className={versionMetaClass}>
                        {timeSince(version.createdAt)} ·{' '}
                        {version.createdByRole === 'assistant' ? 'AI' : 'You'}
                        {version.gitCommitSha
                          ? ` · ${String(version.gitCommitSha).slice(0, 7)}`
                          : ''}
                      </div>
                    </div>
                    <GameCTAButton
                      variant="orange"
                      size="sm"
                      onClick={() => handleRestoreVersion(version.id)}
                      disabled={restoringVersionId === version.id}
                      loading={restoringVersionId === version.id}
                    >
                      {restoringVersionId === version.id
                        ? 'Restoring...'
                        : 'Restore'}
                    </GameCTAButton>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
