import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import BuildDescriptionModal from './BuildDescriptionModal';
import type { BuildCapabilitySnapshot } from './capabilityTypes';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from './runtimeObservationTypes';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ScopedTheme from '~/theme/ScopedTheme';
import { socket } from '~/constants/sockets/api';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const buildForkUiEnabled = false;

const pageClass = css`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  overflow: hidden;
  background: var(--page-bg);
`;

const headerClass = css`
  padding: 1.2rem 1.8rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const badgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--theme-bg) 12%, white);
  color: color-mix(in srgb, var(--theme-border) 82%, #24324a);
  border: 1px solid color-mix(in srgb, var(--theme-bg) 22%, white);
  font-weight: 900;
  font-size: 1.05rem;
  text-transform: none;
  letter-spacing: normal;
  font-family: ${displayFontFamily};
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--theme-bg) 18%, white);
    text-decoration: none;
  }
  &:active {
    text-decoration: none;
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
    text-decoration: none;
  }
`;

const headerTitleClass = css`
  margin: 0;
  font-size: 2rem;
  color: var(--chat-text);
  font-family: ${displayFontFamily};
  font-weight: 900;
  line-height: 1.15;
`;

const headerSubtitleClass = css`
  font-size: 1.05rem;
  color: var(--chat-text);
  opacity: 0.75;
`;

const headerActionsClass = css`
  display: flex;
  gap: 0.55rem;
  align-items: center;
  flex-wrap: wrap;
`;

const badgePillClass = css`
  font-size: 0.76rem;
  padding: 0.38rem 0.74rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 900;
  font-family: ${displayFontFamily};
  border: 1px solid transparent;
  line-height: 1;
`;

const panelShellClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 0.85rem 1.6rem 1.6rem;
  overflow: hidden;
  min-height: 0;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.75rem 1rem 1rem;
  }
`;

const workspaceShellBase = css`
  --build-workspace-header-height: 4.5rem;
  display: grid;
  min-height: 0;
  overflow: hidden;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fff;
`;

const workspaceWithChatClass = css`
  ${workspaceShellBase};
  grid-template-columns: 380px 1fr;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
`;

const workspaceNoChatClass = css`
  ${workspaceShellBase};
  grid-template-columns: 1fr;
`;

interface Build {
  id: number;
  userId: number;
  username: string;
  title: string;
  description: string | null;
  slug: string;
  code: string | null;
  primaryArtifactId?: number | null;
  currentArtifactVersionId?: number | null;
  isPublic: boolean;
  publishedAt?: number | null;
  thumbnailUrl?: string | null;
  sourceBuildId?: number | null;
  projectManifest?: {
    entryPath: string;
    storageMode: string;
    fileCount: number;
  } | null;
  projectFiles?: Array<{
    id?: number;
    path: string;
    content?: string;
    sizeBytes?: number;
    contentHash?: string;
    createdAt?: number;
    updatedAt?: number;
  }>;
  capabilitySnapshot?: BuildCapabilitySnapshot | null;
  executionPlan?: BuildExecutionPlan | null;
  createdAt: number;
  updatedAt: number;
}

interface BuildExecutionPlanChunk {
  id: string;
  kind: 'chunk' | 'big_chunk';
  title: string;
  summary: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  chunks: BuildExecutionPlanChunk[];
}

interface BuildExecutionPlan {
  buildId: number;
  mode: 'large' | 'too_broad';
  status: 'active' | 'completed' | 'cancelled';
  summary: string;
  plan: {
    version: 1;
    mode: 'large' | 'too_broad';
    summary: string;
    chunks: BuildExecutionPlanChunk[];
  };
  currentBigChunkId: string | null;
  currentChunkId: string | null;
  createdByUserId: number;
  createdAt: number;
  updatedAt: number;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  streamCodePreview?: string | null;
  artifactVersionId?: number | null;
  createdAt: number;
  persisted?: boolean;
}

interface BuildUsageMetric {
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface BuildCopilotPolicy {
  limits: {
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileLines: number;
  };
  usage: {
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
  };
  requestLimits: {
    dayIndex: number;
    dayKey: string;
    generationRequestsPerDay: number;
    generationRequestsToday: number;
    generationRequestsRemaining: number;
  };
}

interface BuildRunEvent {
  id: string;
  kind: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
  phase: string | null;
  message: string;
  createdAt: number;
  deduped?: boolean;
  usage?: {
    stage?: string | null;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
}

interface BuildProjectFileDiff {
  addedPaths: string[];
  updatedPaths: string[];
  deletedPaths: string[];
}

interface BuildProjectFileChangeLog {
  id: number;
  buildId: number;
  actorRole: 'user' | 'assistant' | 'system';
  summaryText: string;
  diff: BuildProjectFileDiff;
  createdAt: number;
}

interface QueuedBuildRequest {
  id: string;
  message: string;
  createdAt: number;
}

interface BuildEditorProps {
  build: Build;
  chatMessages: ChatMessage[];
  copilotPolicy: BuildCopilotPolicy | null;
  isOwner: boolean;
  initialPrompt?: string;
  seedGreeting?: boolean;
  onUpdateBuild: (build: Build) => void;
  onUpdateChatMessages: (messages: ChatMessage[]) => void;
  onUpdateCopilotPolicy: (policy: BuildCopilotPolicy | null) => void;
}

interface ProjectFileSaveResult {
  success: boolean;
  error?: string;
}

interface ProjectFileSaveOptions {
  resumePausedQueue?: boolean;
}

interface BuildEditorProjectFilesDraftState {
  files: Array<{ path: string; content?: string }>;
  hasUnsavedChanges: boolean;
  saving: boolean;
}

type BuildRunMode = 'user' | 'greeting' | 'runtime-autofix';

interface RuntimeAutoFixContext {
  beforeObservation: BuildRuntimeObservationState;
  remainingRepairsAfterVerification: number;
}

interface PendingRuntimeVerification {
  armedAt: number;
  beforeObservation: BuildRuntimeObservationState;
  remainingRepairs: number;
  allowSameCodeSignature: boolean;
  requestId: string | null;
  afterObservation: BuildRuntimeObservationState | null;
}

interface PendingRuntimeAutoFix {
  armedAt: number;
  sourceRequestId: string | null;
  sourceArtifactVersionId: number | null;
  sourceRunMode: BuildRunMode;
}

function normalizeProjectFilePath(rawPath: string) {
  const source = String(rawPath || '')
    .trim()
    .replace(/\\/g, '/');
  const withRoot = source.startsWith('/') ? source : `/${source}`;
  const normalized = withRoot.replace(/\/{2,}/g, '/').replace(/\/\.\//g, '/');
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

function resolveIndexHtmlFromProjectFiles(
  files: Array<{ path: string; content?: string }>,
  fallbackCode: string | null | undefined
) {
  const byPath = new Map<string, string>();
  for (const file of files || []) {
    const normalizedPath = normalizeProjectFilePath(file.path);
    if (typeof file.content !== 'string') continue;
    byPath.set(normalizedPath.toLowerCase(), file.content);
  }
  if (byPath.has('/index.html')) {
    return byPath.get('/index.html') ?? '';
  }
  if (byPath.has('/index.htm')) {
    return byPath.get('/index.htm') ?? '';
  }
  return String(fallbackCode || '');
}

function isIndexHtmlProjectFilePath(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath).toLowerCase();
  return normalized === '/index.html' || normalized === '/index.htm';
}

function resolveIndexEntryPathFromProjectFiles(
  files: Array<{ path: string; content?: string }>,
  fallbackEntryPath = '/index.html'
) {
  const byPath = new Map<string, string>();
  for (const file of files || []) {
    const normalizedPath = normalizeProjectFilePath(file.path);
    const lookupPath = normalizedPath.toLowerCase();
    if (!byPath.has(lookupPath)) {
      byPath.set(lookupPath, normalizedPath);
    }
  }
  return (
    byPath.get('/index.html') ||
    byPath.get('/index.htm') ||
    normalizeProjectFilePath(fallbackEntryPath)
  );
}

function normalizeProjectFilesForBuild(
  files: Array<{ path: string; content?: string }>,
  fallbackCode: string | null | undefined
) {
  const deduped = new Map<string, string>();
  for (const file of files || []) {
    if (!file || typeof file !== 'object') continue;
    const normalizedPath = normalizeProjectFilePath(file.path);
    if (!normalizedPath || normalizedPath === '/') continue;
    deduped.set(
      normalizedPath,
      typeof file.content === 'string' ? file.content : ''
    );
  }
  const hasIndex = Array.from(deduped.keys()).some(
    (path) =>
      path.toLowerCase() === '/index.html' ||
      path.toLowerCase() === '/index.htm'
  );
  if (!hasIndex) {
    deduped.set('/index.html', String(fallbackCode || ''));
  }
  return Array.from(deduped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([path, content]) => ({
      path,
      content,
      sizeBytes: content.length
    }));
}

function overlayStreamedProjectFilesForBuild({
  baseFiles,
  updates,
  fallbackCode
}: {
  baseFiles: Array<{ path: string; content?: string }>;
  updates: Array<{ path: string; content?: string }>;
  fallbackCode: string | null | undefined;
}) {
  const merged = new Map<string, string>();
  for (const file of baseFiles || []) {
    if (!file || typeof file !== 'object') continue;
    merged.set(
      normalizeProjectFilePath(file.path),
      typeof file.content === 'string' ? file.content : ''
    );
  }
  for (const file of updates || []) {
    if (!file || typeof file !== 'object') continue;
    merged.set(
      normalizeProjectFilePath(file.path),
      typeof file.content === 'string' ? file.content : ''
    );
  }
  return normalizeProjectFilesForBuild(
    Array.from(merged.entries()).map(([path, content]) => ({
      path,
      content
    })),
    fallbackCode
  );
}

function parseCodexImplementationAttempt(message: string) {
  const match = /^Codex started implementation attempt (\d+)\/\d+\./i.exec(
    String(message || '').trim()
  );
  if (!match) return null;
  return Number(match[1] || 0) || null;
}

function isCodexChecklistStepCompleted(message: string) {
  return /^Codex completed checklist step \d+\/\d+/i.test(
    String(message || '').trim()
  );
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
  function formatIssueKindLabel(kind: BuildRuntimeObservationState['issues'][number]['kind']) {
    switch (kind) {
      case 'unhandledrejection':
        return 'Unhandled rejection';
      case 'blankrender':
        return 'Blank render';
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
  const issuesText = observationState.issues
    .slice(-5)
    .map((issue, index) => {
      const locationParts = [
        issue.filename || null,
        issue.lineNumber != null ? `line ${issue.lineNumber}` : null,
        issue.columnNumber != null ? `col ${issue.columnNumber}` : null
      ].filter(Boolean);
      const locationText =
        locationParts.length > 0 ? ` (${locationParts.join(', ')})` : '';
      const stackLine = String(issue.stack || '')
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean);
      return [
        `${index + 1}. ${formatIssueKindLabel(issue.kind)}: ${issue.message}${locationText}`,
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
        step.expectedSignals &&
        step.expectedSignals.revealsLabels.length > 0
          ? `expected controls: ${step.expectedSignals.revealsLabels
              .map((label) => `"${label}"`)
              .join(', ')}`
          : null,
        step.routeChanged && step.routeAfter
          ? `route -> ${step.routeAfter}`
          : null,
        step.hashChanged && step.hashAfter ? `hash -> ${step.hashAfter}` : null,
        step.headingDelta !== 0 || step.buttonDelta !== 0 || step.formDelta !== 0
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
              step.visibleTextBefore
                ? `"${step.visibleTextBefore}"`
                : '[none]'
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
                playfieldBounds:
                  observationState.health.gameplayTelemetry.playfieldBounds
                    ? {
                        ...observationState.health.gameplayTelemetry
                          .playfieldBounds
                      }
                    : null,
                playerBounds:
                  observationState.health.gameplayTelemetry.playerBounds
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

export default function BuildEditor({
  build,
  chatMessages,
  copilotPolicy,
  isOwner,
  initialPrompt = '',
  seedGreeting = false,
  onUpdateBuild,
  onUpdateChatMessages,
  onUpdateCopilotPolicy
}: BuildEditorProps) {
  const navigate = useNavigate();
  const { userId, profileTheme } = useKeyContext((v) => v.myState);
  const updateBuildProjectFiles = useAppContext(
    (v) => v.requestHelpers.updateBuildProjectFiles
  );
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const loadBuildProjectFileChangeLogs = useAppContext(
    (v) => v.requestHelpers.loadBuildProjectFileChangeLogs
  );
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const deleteBuildChatMessage = useAppContext(
    (v) => v.requestHelpers.deleteBuildChatMessage
  );
  const publishBuild = useAppContext((v) => v.requestHelpers.publishBuild);
  const unpublishBuild = useAppContext((v) => v.requestHelpers.unpublishBuild);
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);

  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);
  const [assistantStatusSteps, setAssistantStatusSteps] = useState<string[]>(
    []
  );
  const [publishing, setPublishing] = useState(false);
  const [forking, setForking] = useState(false);
  const [descriptionModalShown, setDescriptionModalShown] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [usageMetrics, setUsageMetrics] = useState<
    Record<string, BuildUsageMetric>
  >({});
  const [runEvents, setRunEvents] = useState<BuildRunEvent[]>([]);
  const [streamingProjectFiles, setStreamingProjectFiles] = useState<
    Array<{ path: string; content?: string }> | null
  >(null);
  const [streamingFocusFilePath, setStreamingFocusFilePath] = useState<
    string | null
  >(null);
  const [projectFileChangeLogs, setProjectFileChangeLogs] = useState<
    BuildProjectFileChangeLog[]
  >([]);
  const [projectFilePromptContextPreview, setProjectFilePromptContextPreview] =
    useState('');
  const [projectFileChangeLogsLoading, setProjectFileChangeLogsLoading] =
    useState(false);
  const [projectFileChangeLogsError, setProjectFileChangeLogsError] =
    useState('');
  const [projectFileChangeLogsLoadedAt, setProjectFileChangeLogsLoadedAt] =
    useState<number | null>(null);
  const [runtimeObservationState, setRuntimeObservationState] =
    useState<BuildRuntimeObservationState | null>(null);
  const [runtimeExplorationPlan, setRuntimeExplorationPlan] =
    useState<BuildRuntimeExplorationPlan | null>(null);
  const [queuedRequests, setQueuedRequests] = useState<QueuedBuildRequest[]>(
    []
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef(chatMessages);
  const buildRef = useRef(build);
  const updateBuildRef = useRef(onUpdateBuild);
  const updateChatMessagesRef = useRef(onUpdateChatMessages);
  const updateCopilotPolicyRef = useRef(onUpdateCopilotPolicy);
  const streamRequestIdRef = useRef<string | null>(null);
  const userMessageIdRef = useRef<number | null>(null);
  const assistantMessageIdRef = useRef<number | null>(null);
  const streamingProjectFilesBaseRef = useRef<
    Array<{ path: string; content?: string }>
  >([]);
  const streamingProjectFilesRef = useRef<
    Array<{ path: string; content?: string }> | null
  >(null);
  const dedupedProcessingReconcileRequestIdRef = useRef<string | null>(null);
  const dedupedProcessingReconcileStartedAtRef = useRef<number>(0);
  const dedupedProcessingReconcileTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const didInitialChatScrollRef = useRef(false);
  const didAutoPromptRef = useRef(false);
  const didAutoGreetingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior>('auto');
  const scrollRafRef = useRef<number | null>(null);
  const DEDUPED_PROCESSING_RECONCILE_INTERVAL_MS = 8000;
  const DEDUPED_PROCESSING_RECONCILE_MAX_MS = 3 * 60 * 1000;
  const queuedRequestsRef = useRef<QueuedBuildRequest[]>([]);
  const dedupedProcessingInFlightRef = useRef(false);
  const generatingRef = useRef(false);
  const postCompleteSyncInFlightRef = useRef(false);
  const startingGenerationRef = useRef(false);
  const queuePausedForSaveRef = useRef(false);
  const requiresProjectFilesResyncBeforeSaveRef = useRef(false);
  const projectFilesDraftRef = useRef<
    Array<{ path: string; content?: string }>
  >([]);
  const hasUnsavedProjectFilesRef = useRef(false);
  const savingProjectFilesRef = useRef(false);
  const runtimeObservationStateRef =
    useRef<BuildRuntimeObservationState | null>(null);
  const lastRuntimeHealthEventKeyRef = useRef('');
  const pendingRuntimeAutoFixRef = useRef<PendingRuntimeAutoFix | null>(null);
  const pendingRuntimeVerificationRef =
    useRef<PendingRuntimeVerification | null>(null);
  const activeRuntimeAutoFixContextRef =
    useRef<RuntimeAutoFixContext | null>(null);
  const runtimeAutoFixAttemptedSignaturesRef = useRef<Set<string>>(new Set());
  const activeRunModeRef = useRef<BuildRunMode>('user');
  const RUNTIME_AUTOFIX_ENABLED = false;
  const RUNTIME_AUTO_FIX_WINDOW_MS = 12000;
  const RUNTIME_POST_FIX_VERIFICATION_WINDOW_MS = 18000;

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    streamingProjectFilesRef.current = streamingProjectFiles;
  }, [streamingProjectFiles]);

  useEffect(() => {
    generatingRef.current = generating;
  }, [generating]);

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    runtimeObservationStateRef.current = runtimeObservationState;
  }, [runtimeObservationState]);

  useEffect(() => {
    const normalizedFiles = normalizeProjectFilesForBuild(
      build.projectFiles || [],
      build.code || ''
    );
    projectFilesDraftRef.current = normalizedFiles.map((file) => ({
      path: file.path,
      content: file.content
    }));
    hasUnsavedProjectFilesRef.current = false;
    savingProjectFilesRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id]);

  useEffect(() => {
    updateBuildRef.current = onUpdateBuild;
  }, [onUpdateBuild]);

  useEffect(() => {
    updateChatMessagesRef.current = onUpdateChatMessages;
  }, [onUpdateChatMessages]);

  useEffect(() => {
    updateCopilotPolicyRef.current = onUpdateCopilotPolicy;
  }, [onUpdateCopilotPolicy]);

  useEffect(() => {
    didInitialChatScrollRef.current = false;
    didAutoPromptRef.current = false;
    didAutoGreetingRef.current = false;
    shouldAutoScrollRef.current = true;
    setUsageMetrics({});
    setRunEvents([]);
    setProjectFileChangeLogs([]);
    setProjectFilePromptContextPreview('');
    setProjectFileChangeLogsLoading(false);
    setProjectFileChangeLogsError('');
    setProjectFileChangeLogsLoadedAt(null);
    queuedRequestsRef.current = [];
    setQueuedRequests([]);
    setDescriptionModalShown(false);
    dedupedProcessingInFlightRef.current = false;
    postCompleteSyncInFlightRef.current = false;
    startingGenerationRef.current = false;
    queuePausedForSaveRef.current = false;
    requiresProjectFilesResyncBeforeSaveRef.current = false;
    runtimeObservationStateRef.current = null;
    lastRuntimeHealthEventKeyRef.current = '';
    setRuntimeObservationState(null);
    setRuntimeExplorationPlan(null);
    pendingRuntimeAutoFixRef.current = null;
    pendingRuntimeVerificationRef.current = null;
    activeRuntimeAutoFixContextRef.current = null;
    runtimeAutoFixAttemptedSignaturesRef.current = new Set();
    activeRunModeRef.current = 'user';
  }, [build.id]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      resetDedupedProcessingReconcileState();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (didAutoPromptRef.current) return;
    if (!isOwner) return;
    const prompt = initialPrompt.trim();
    if (!prompt) return;
    if (chatMessagesRef.current.length > 0) return;
    didAutoPromptRef.current = true;
    void startGeneration(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, isOwner, initialPrompt]);

  useEffect(() => {
    if (didAutoGreetingRef.current) return;
    if (!isOwner) return;
    if (!seedGreeting) return;
    if (initialPrompt.trim()) return;
    if (chatMessagesRef.current.length > 0) return;
    didAutoGreetingRef.current = true;
    void startGreetingGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, initialPrompt, isOwner, seedGreeting]);

  useEffect(() => {
    if (didInitialChatScrollRef.current) return;
    didInitialChatScrollRef.current = true;
    scrollChatToBottom('auto', { force: true });
  }, [chatMessages.length, build.id]);

  useEffect(() => {
    function handleGenerateUpdate(payload: {
      requestId?: string;
      reply?: string;
      codeGenerated?: string | null;
      projectFiles?: Array<{ path: string; content?: string }> | null;
    }) {
      const { requestId, reply, codeGenerated, projectFiles } = payload;
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      const targetMessageId = assistantMessageIdRef.current;
      if (!targetMessageId) return;
      const currentMessages = chatMessagesRef.current;
      const hasCodeGeneratedField = Object.prototype.hasOwnProperty.call(
        payload,
        'codeGenerated'
      );
      const nextMessages = currentMessages.map((message) => {
        if (message.id !== targetMessageId) return message;
        const nextMessage: ChatMessage = {
          ...message,
          content: typeof reply === 'string' ? reply : message.content
        };
        if (hasCodeGeneratedField) {
          // Keep streamed artifact text out of the final diff payload to avoid
          // recomputing expensive diffs on every chunk.
          nextMessage.streamCodePreview = codeGenerated ?? null;
        }
        return nextMessage;
      });
      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      if (Array.isArray(projectFiles) && projectFiles.length > 0) {
        const activeBuild = buildRef.current;
        const fallbackCode = activeBuild?.code || '';
        const nextFocusFilePath =
          projectFiles
            .map((file) => normalizeProjectFilePath(file.path))
            .find((filePath) => !isIndexHtmlProjectFilePath(filePath)) || null;
        const nextStreamingProjectFiles = overlayStreamedProjectFilesForBuild({
          baseFiles: streamingProjectFilesBaseRef.current,
          updates: projectFiles,
          fallbackCode
        });
        streamingProjectFilesRef.current = nextStreamingProjectFiles;
        setStreamingProjectFiles(nextStreamingProjectFiles);
        if (nextFocusFilePath) {
          setStreamingFocusFilePath(nextFocusFilePath);
        }
      }
      maybeAutoScrollDuringStream();
    }

    async function handleGenerateComplete({
      requestId,
      assistantText,
      artifact,
      code,
      projectFiles,
      executionPlan,
      runtimeExplorationPlan,
      runtimePlanRefined,
      message
    }: {
      requestId?: string;
      assistantText?: string;
      artifact?: {
        content?: string;
        id?: number | null;
        versionId?: number | null;
      };
      code?: string | null;
      projectFiles?: Array<{ path: string; content?: string }> | null;
      executionPlan?: BuildExecutionPlan | null;
      runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
      runtimePlanRefined?: boolean;
      message?: {
        id?: number | null;
        userMessageId?: number | null;
        artifactVersionId?: number | null;
        createdAt?: number;
      };
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      const completedRunMode = activeRunModeRef.current;
      const userMessageTempId = userMessageIdRef.current;
      const assistantId = assistantMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;
      const artifactCode = artifact?.content ?? code ?? null;
      const payloadProjectFiles = Array.isArray(projectFiles)
        ? normalizeProjectFilesForBuild(
            projectFiles,
            artifactCode ?? buildRef.current?.code ?? ''
          )
        : null;
      const artifactVersionId =
        message?.artifactVersionId ?? artifact?.versionId ?? null;
      const createdAt = message?.createdAt ?? Math.floor(Date.now() / 1000);
      const persistedAssistantId =
        typeof message?.id === 'number' && message.id > 0 ? message.id : null;
      const persistedUserId =
        typeof message?.userMessageId === 'number' && message.userMessageId > 0
          ? message.userMessageId
          : null;
      let nextMessages = currentMessages.map((entry) => {
        if (
          userMessageTempId &&
          persistedUserId &&
          entry.id === userMessageTempId
        ) {
          return { ...entry, id: persistedUserId, persisted: true };
        }
        if (assistantId && entry.id === assistantId) {
          return {
            ...entry,
            id: persistedAssistantId || entry.id,
            persisted: Boolean(persistedAssistantId),
            content: assistantText || entry.content,
            codeGenerated: artifactCode,
            streamCodePreview: null,
            artifactVersionId,
            createdAt
          };
        }
        return entry;
      });

      if (!assistantId) {
        nextMessages = [
          ...nextMessages,
          {
            id: persistedAssistantId || Date.now(),
            role: 'assistant' as const,
            content: assistantText || '',
            codeGenerated: artifactCode,
            streamCodePreview: null,
            artifactVersionId,
            createdAt,
            persisted: Boolean(persistedAssistantId)
          }
        ];
      }

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);

      if (artifactCode !== null || payloadProjectFiles) {
        const activeBuild = buildRef.current;
        if (activeBuild) {
          let completionUsedFallbackProjectFiles = false;
          let nextProjectFiles = payloadProjectFiles
            ? payloadProjectFiles
            : normalizeProjectFilesForBuild(
                activeBuild.projectFiles || [],
                activeBuild.code || ''
              );
          if (!payloadProjectFiles && artifactCode !== null) {
            completionUsedFallbackProjectFiles = true;
            const entryPath = resolveIndexEntryPathFromProjectFiles(
              nextProjectFiles,
              activeBuild.projectManifest?.entryPath || '/index.html'
            );
            const entryLookupPath =
              normalizeProjectFilePath(entryPath).toLowerCase();
            let updatedEntry = false;
            nextProjectFiles = nextProjectFiles.map((file) => {
              if (
                normalizeProjectFilePath(file.path).toLowerCase() !==
                entryLookupPath
              ) {
                return file;
              }
              updatedEntry = true;
              return {
                ...file,
                content: artifactCode,
                sizeBytes: artifactCode.length
              };
            });
            if (!updatedEntry) {
              nextProjectFiles = normalizeProjectFilesForBuild(
                [
                  ...nextProjectFiles,
                  { path: entryPath, content: artifactCode }
                ],
                artifactCode
              );
            }
          }
          const resolvedCode =
            artifactCode !== null
              ? artifactCode
              : resolveIndexHtmlFromProjectFiles(
                  nextProjectFiles,
                  activeBuild.code || ''
                );
          const nextBuild = {
            ...activeBuild,
            code: resolvedCode,
            primaryArtifactId: artifact?.id ?? activeBuild.primaryArtifactId,
            currentArtifactVersionId:
              artifactVersionId ?? activeBuild.currentArtifactVersionId ?? null,
            executionPlan:
              executionPlan !== undefined
                ? executionPlan || null
                : activeBuild.executionPlan || null,
            projectManifest: {
              entryPath: resolveIndexEntryPathFromProjectFiles(
                nextProjectFiles,
                activeBuild.projectManifest?.entryPath || '/index.html'
              ),
              storageMode: 'project-files',
              fileCount: nextProjectFiles.length
            },
            projectFiles: nextProjectFiles
          };
          buildRef.current = nextBuild;
          updateBuildRef.current(nextBuild);
          if (payloadProjectFiles) {
            requiresProjectFilesResyncBeforeSaveRef.current = false;
          } else if (completionUsedFallbackProjectFiles) {
            requiresProjectFilesResyncBeforeSaveRef.current = true;
          }
        }
      }
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);

      const generatedCodeSuccessfully =
        artifactCode !== null ||
        (Array.isArray(payloadProjectFiles) && payloadProjectFiles.length > 0);
      const planWasRefined = Boolean(
        runtimePlanRefined && runtimeExplorationPlan
      );
      setRuntimeExplorationPlan(
        generatedCodeSuccessfully || planWasRefined
          ? runtimeExplorationPlan || null
          : null
      );
      let shouldDelayQueuedRequestsForRuntimeFollowUp = false;
      if (
        generatedCodeSuccessfully &&
        completedRunMode === 'user'
      ) {
        armRuntimeAutoFix({
          sourceRequestId: requestId || null,
          sourceArtifactVersionId: artifactVersionId,
          sourceRunMode: completedRunMode
        });
        clearRuntimeVerification();
        appendLocalRunEvent({
          kind: 'status',
          phase: 'completed',
          message: 'Checking the updated preview for runtime issues...'
        });
        shouldDelayQueuedRequestsForRuntimeFollowUp = true;
      } else if (
        completedRunMode === 'runtime-autofix'
      ) {
        const runtimeAutoFixContext = activeRuntimeAutoFixContextRef.current;
        if (runtimeAutoFixContext) {
          if (generatedCodeSuccessfully) {
            armRuntimeVerification({
              beforeObservation: runtimeAutoFixContext.beforeObservation,
              remainingRepairs:
                runtimeAutoFixContext.remainingRepairsAfterVerification
            });
            appendLocalRunEvent({
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
              allowSameCodeSignature: true
            });
            appendLocalRunEvent({
              kind: 'action',
              phase: 'preview',
              message:
                "Lumine revised the runtime plan and is re-checking the preview before changing code."
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

      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      generatingRef.current = false;
      setGenerating(false);
      setGeneratingStatus(null);
      setAssistantStatusSteps([]);
      activeRunModeRef.current = 'user';
      scrollChatToBottom();
      postCompleteSyncInFlightRef.current = true;
      try {
        await syncChatMessagesFromServer(undefined, true);
        requiresProjectFilesResyncBeforeSaveRef.current = false;
      } catch (error) {
        console.error('Failed to sync chat messages after completion:', error);
        if (requiresProjectFilesResyncBeforeSaveRef.current) {
          appendLocalRunEvent({
            kind: 'status',
            phase: 'completed',
            message:
              'Build completed, but project file sync is pending. Save is temporarily blocked until a refresh succeeds.'
          });
        }
      } finally {
        postCompleteSyncInFlightRef.current = false;
      }
      if (
        maybeProcessPendingRuntimeAutoFix() ||
        maybeProcessPendingRuntimeVerification()
      ) {
        return;
      }
      if (!shouldDelayQueuedRequestsForRuntimeFollowUp) {
        await maybeStartNextQueuedRequest();
      }
    }

    function handleGenerateStatus({
      requestId,
      status
    }: {
      requestId?: string;
      status?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      setGeneratingStatus(status || null);
      if (status) {
        setAssistantStatusSteps((prev) =>
          prev[prev.length - 1] === status ? prev : [...prev, status]
        );
      }
      maybeAutoScrollDuringStream();
    }

    function handleGenerateError({
      requestId,
      error
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      resetRuntimeHealthFollowUpState();
      const assistantId = assistantMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;
      const errorMessage = error || 'Failed to generate code.';

      const nextMessages = assistantId
        ? currentMessages.map((entry) =>
            entry.id === assistantId
              ? {
                  ...entry,
                  content: errorMessage,
                  codeGenerated: null,
                  streamCodePreview: null,
                  artifactVersionId: null
                }
              : entry
          )
        : [
            ...currentMessages,
            {
              id: Date.now(),
              role: 'assistant' as const,
              content: errorMessage,
              codeGenerated: null,
              streamCodePreview: null,
              createdAt: Math.floor(Date.now() / 1000),
              persisted: false
            }
          ];

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);
      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      generatingRef.current = false;
      setGenerating(false);
      setGeneratingStatus(null);
      setAssistantStatusSteps([]);
      activeRunModeRef.current = 'user';
      scrollChatToBottom();
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
    }

    async function handleGenerateStopped({
      requestId,
      deduped,
      guardStatus
    }: {
      requestId?: string;
      deduped?: boolean;
      guardStatus?: 'processing' | 'completed' | 'conflict';
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      if (deduped) {
        resetDedupedProcessingReconcileState();
        resetRuntimeHealthFollowUpState();
        let shouldStartQueuedRequest = true;
        if (guardStatus === 'completed') {
          try {
            await syncChatMessagesFromServer(undefined, true);
          } catch (error) {
            console.error(
              'Failed to sync chat messages after deduped completed stop:',
              error
            );
          } finally {
            streamRequestIdRef.current = null;
            userMessageIdRef.current = null;
            assistantMessageIdRef.current = null;
          }
        } else if (guardStatus === 'processing') {
          // Keep request refs briefly in case late events from the claimed
          // worker arrive, then reconcile from writer if they do not.
          scheduleDedupedProcessingReconcile(requestId);
          shouldStartQueuedRequest = false;
        } else {
          try {
            await syncChatMessagesFromServer(undefined, true);
          } catch (error) {
            console.error(
              'Failed to sync chat messages after deduped stop:',
              error
            );
          } finally {
            streamRequestIdRef.current = null;
            userMessageIdRef.current = null;
            assistantMessageIdRef.current = null;
          }
        }
        generatingRef.current = false;
        setStreamingProjectFiles(null);
        setStreamingFocusFilePath(null);
        setGenerating(false);
        setGeneratingStatus(null);
        setAssistantStatusSteps([]);
        activeRunModeRef.current = 'user';
        scrollChatToBottom();
        if (shouldStartQueuedRequest) {
          await maybeStartNextQueuedRequest();
        }
        return;
      }
      resetDedupedProcessingReconcileState();
      resetRuntimeHealthFollowUpState();
      const assistantId = assistantMessageIdRef.current;
      const userId = userMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;

      const activeIdSet = new Set(
        [userId, assistantId].filter(
          (id): id is number => typeof id === 'number' && id > 0
        )
      );
      const nextMessages = currentMessages.filter(
        (entry) => !activeIdSet.has(entry.id)
      );

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);
      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      generatingRef.current = false;
      setGenerating(false);
      setGeneratingStatus(null);
      setAssistantStatusSteps([]);
      activeRunModeRef.current = 'user';
      postCompleteSyncInFlightRef.current = true;
      try {
        await syncChatMessagesFromServer(undefined, true);
      } catch (error) {
        console.error('Failed to sync chat messages after stop:', error);
      } finally {
        postCompleteSyncInFlightRef.current = false;
      }
      scrollChatToBottom();
      await maybeStartNextQueuedRequest();
    }

    function handleUsageUpdate({
      requestId,
      usage
    }: {
      requestId?: string;
      usage?: {
        stage?: string;
        model?: string;
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      };
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      const stage = usage?.stage?.trim();
      const model = usage?.model?.trim();
      if (!stage || !model) return;
      const inputTokens = Number(usage?.inputTokens || 0);
      const outputTokens = Number(usage?.outputTokens || 0);
      const totalTokens = Number(usage?.totalTokens || 0);

      setUsageMetrics((prev) => {
        const existing = prev[stage];
        return {
          ...prev,
          [stage]: {
            stage,
            model,
            inputTokens: (existing?.inputTokens || 0) + inputTokens,
            outputTokens: (existing?.outputTokens || 0) + outputTokens,
            totalTokens: (existing?.totalTokens || 0) + totalTokens
          }
        };
      });
    }

    function handleRunEvent({
      requestId,
      event
    }: {
      requestId?: string;
      event?: {
        kind?: 'lifecycle' | 'phase' | 'action' | 'status' | 'usage';
        phase?: string | null;
        message?: string;
        createdAt?: number;
        deduped?: boolean;
        usage?: {
          stage?: string | null;
          model?: string | null;
          inputTokens?: number;
          outputTokens?: number;
          totalTokens?: number;
        } | null;
      };
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      if (!event?.kind || !event?.message) return;
      const kind = event.kind;
      const message = event.message;
      const createdAt =
        typeof event.createdAt === 'number' && Number.isFinite(event.createdAt)
          ? event.createdAt
          : Date.now();
      setRunEvents((prev) => {
        const nextEvent: BuildRunEvent = {
          id: `${createdAt}-${kind}-${prev.length}`,
          kind,
          phase: event.phase || null,
          message,
          createdAt,
          deduped: Boolean(event.deduped),
          usage: event.usage || null
        };
        const last = prev[prev.length - 1];
        if (
          last &&
          last.kind === nextEvent.kind &&
          last.phase === nextEvent.phase &&
          last.message === nextEvent.message &&
          Math.abs(last.createdAt - nextEvent.createdAt) < 1500
        ) {
          return prev;
        }
        const next = [...prev, nextEvent];
        return next.slice(-40);
      });
      if (kind === 'action') {
        const implementationAttempt = parseCodexImplementationAttempt(message);
        if (implementationAttempt) {
          const committedBase = normalizeProjectFilesForBuild(
            streamingProjectFilesBaseRef.current,
            buildRef.current?.code || ''
          );
          streamingProjectFilesRef.current =
            committedBase.length > 0 ? committedBase : null;
          setStreamingProjectFiles(
            committedBase.length > 0 ? committedBase : null
          );
          if (implementationAttempt > 1) {
            setStreamingFocusFilePath(null);
          }
          return;
        }
        if (isCodexChecklistStepCompleted(message)) {
          const currentStreamingProjectFiles = streamingProjectFilesRef.current;
          if (
            Array.isArray(currentStreamingProjectFiles) &&
            currentStreamingProjectFiles.length > 0
          ) {
            const committedBase = normalizeProjectFilesForBuild(
              currentStreamingProjectFiles,
              buildRef.current?.code || ''
            );
            streamingProjectFilesBaseRef.current = committedBase;
            streamingProjectFilesRef.current = committedBase;
            setStreamingProjectFiles(committedBase);
          }
        }
      }
    }

    function handleRuntimeVerifyComplete({
      requestId,
      improved,
      reason,
      shouldRepairAgain,
      nextRemainingRepairs
    }: {
      requestId?: string;
      improved?: boolean;
      reason?: string;
      shouldRepairAgain?: boolean;
      nextRemainingRepairs?: number;
    }) {
      const pendingVerification = pendingRuntimeVerificationRef.current;
      if (
        !requestId ||
        !pendingVerification ||
        requestId !== pendingVerification.requestId
      ) {
        return;
      }
      const afterObservation = pendingVerification.afterObservation;
      clearRuntimeVerification();
      if (improved && reason) {
        appendLocalRunEvent({
          kind: 'action',
          phase: 'preview',
          message: `Lumine re-checked the repaired preview and it looks healthier: ${reason}.`
        });
      }
      if (shouldRepairAgain && afterObservation) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'preview',
          message: `Lumine re-checked the repaired preview, but it did not improve enough: ${reason || 'preview health did not improve'}. Trying one last repair pass.`
        });
        void startRuntimeAutoFix(afterObservation, {
          remainingRepairsAfterVerification: Math.max(
            0,
            Number(nextRemainingRepairs || 0)
          ),
          trigger: 'verification'
        });
        return;
      }
      if (!improved && reason) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'preview',
          message: `Lumine re-checked the repaired preview, but it still does not look healthier: ${reason}.`
        });
      }
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
    }

    function handleRuntimeVerifyError({
      requestId,
      error
    }: {
      requestId?: string;
      error?: string;
    }) {
      const pendingVerification = pendingRuntimeVerificationRef.current;
      if (
        !requestId ||
        !pendingVerification ||
        requestId !== pendingVerification.requestId
      ) {
        return;
      }
      clearRuntimeVerification();
      appendLocalRunEvent({
        kind: 'status',
        phase: 'preview',
        message: error || 'Runtime verification failed.'
      });
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
    }

    socket.on('build_generate_update', handleGenerateUpdate);
    socket.on('build_generate_complete', handleGenerateComplete);
    socket.on('build_generate_error', handleGenerateError);
    socket.on('build_generate_stopped', handleGenerateStopped);
    socket.on('build_generate_status', handleGenerateStatus);
    socket.on('build_usage_update', handleUsageUpdate);
    socket.on('build_run_event', handleRunEvent);
    socket.on('build_runtime_verify_complete', handleRuntimeVerifyComplete);
    socket.on('build_runtime_verify_error', handleRuntimeVerifyError);

    return () => {
      socket.off('build_generate_update', handleGenerateUpdate);
      socket.off('build_generate_complete', handleGenerateComplete);
      socket.off('build_generate_error', handleGenerateError);
      socket.off('build_generate_stopped', handleGenerateStopped);
      socket.off('build_generate_status', handleGenerateStatus);
      socket.off('build_usage_update', handleUsageUpdate);
      socket.off('build_run_event', handleRunEvent);
      socket.off('build_runtime_verify_complete', handleRuntimeVerifyComplete);
      socket.off('build_runtime_verify_error', handleRuntimeVerifyError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeQueuedMessage(message: string) {
    return message.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function appendLocalRunEvent({
    kind,
    phase,
    message
  }: {
    kind: BuildRunEvent['kind'];
    phase: string | null;
    message: string;
  }) {
    const createdAt = Date.now();
    setRunEvents((prev) => {
      const next: BuildRunEvent = {
        id: `${createdAt}-${kind}-${prev.length}`,
        kind,
        phase,
        message,
        createdAt
      };
      return [...prev, next].slice(-40);
    });
  }

  function handleRuntimeObservationChange(
    nextState: BuildRuntimeObservationState
  ) {
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
        appendLocalRunEvent({
          kind:
            health.interactionStatus === 'changed' || health.meaningfulRender
              ? 'action'
              : 'status',
          phase: 'preview',
          message:
            health.gameLike &&
            (health.viewportOverflowY > 48 || health.viewportOverflowX > 24)
              ? `Preview booted, but the game overflows its viewport (${health.viewportOverflowY}px tall overflow, ${health.viewportOverflowX}px wide overflow).`
              : health.gameplayTelemetry?.status === 'out-of-bounds'
                ? `Preview booted, but gameplay escaped the declared playfield (${health.gameplayTelemetry.overflowTop}px top, ${health.gameplayTelemetry.overflowRight}px right, ${health.gameplayTelemetry.overflowBottom}px bottom, ${health.gameplayTelemetry.overflowLeft}px left overflow).`
              : interactionStepCount >= 2 &&
                  health.interactionStatus === 'changed' &&
                  latestInteractionStep?.source === 'planned'
                ? `Preview followed Lumine's runtime plan for ${interactionStepCount} steps through the app.`
                : interactionStepCount >= 2 && health.interactionStatus === 'changed'
                  ? `Preview interaction probe advanced ${interactionStepCount} startup steps through the app.`
                  : health.interactionStatus === 'changed'
                    ? latestInteractionStep?.source === 'planned'
                      ? latestInteractionStep?.routeChanged && latestInteractionStep.routeAfter
                        ? `Preview followed Lumine's runtime plan and ${interactionTargetText} moved the app to ${latestInteractionStep.routeAfter}.`
                        : `Preview followed Lumine's runtime plan and ${interactionTargetText} moved the app forward.`
                      : latestInteractionStep?.routeChanged && latestInteractionStep.routeAfter
                        ? `Preview interaction probe changed the UI after clicking ${interactionTargetText} and moved to ${latestInteractionStep.routeAfter}.`
                        : `Preview interaction probe changed the UI after clicking ${interactionTargetText}.`
                    : health.interactionStatus === 'unchanged'
                      ? latestInteractionStep?.source === 'planned'
                        ? `Preview followed Lumine's runtime plan, but ${interactionTargetText} did not move the app forward.`
                        : `Preview interaction probe clicked ${interactionTargetText}, but the UI did not change.`
                      : health.meaningfulRender
                        ? 'Preview booted and rendered meaningful UI.'
                        : 'Preview booted, but the UI still looks sparse.'
        });
      }
    }
    setRuntimeObservationState(nextState);
  }

  function getCurrentRuntimeObservationSummary() {
    return formatRuntimeObservationSummary(runtimeObservationStateRef.current);
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
  }

  function disarmRuntimeAutoFix() {
    pendingRuntimeAutoFixRef.current = null;
  }

  function armRuntimeVerification({
    beforeObservation,
    remainingRepairs,
    allowSameCodeSignature = false
  }: {
    beforeObservation: BuildRuntimeObservationState;
    remainingRepairs: number;
    allowSameCodeSignature?: boolean;
  }) {
    pendingRuntimeVerificationRef.current = {
      armedAt: Date.now(),
      beforeObservation: cloneRuntimeObservationState(beforeObservation),
      remainingRepairs: Math.max(0, remainingRepairs),
      allowSameCodeSignature,
      requestId: null,
      afterObservation: null
    };
  }

  function clearRuntimeVerification() {
    pendingRuntimeVerificationRef.current = null;
    activeRuntimeAutoFixContextRef.current = null;
  }

  function resetRuntimeHealthFollowUpState() {
    disarmRuntimeAutoFix();
    clearRuntimeVerification();
  }

  function handleProjectFilesDraftStateChange(
    state: BuildEditorProjectFilesDraftState
  ) {
    projectFilesDraftRef.current = Array.isArray(state.files)
      ? state.files.map((file) => ({
          path: normalizeProjectFilePath(file.path),
          content: typeof file.content === 'string' ? file.content : ''
        }))
      : [];
    hasUnsavedProjectFilesRef.current = Boolean(state.hasUnsavedChanges);
    savingProjectFilesRef.current = Boolean(state.saving);
  }

  async function waitForProjectFileSaveToSettle(timeoutMs = 12000) {
    const startedAt = Date.now();
    while (
      savingProjectFilesRef.current &&
      Date.now() - startedAt < timeoutMs
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return !savingProjectFilesRef.current;
  }

  async function ensureProjectFilesPersistedBeforeRun({
    runType
  }: {
    runType: 'copilot';
  }) {
    const MAX_AUTOSAVE_ATTEMPTS = 3;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));
    const normalizeDraftForSave = (
      files: Array<{ path: string; content?: string }>
    ) =>
      files.map((file) => ({
        path: normalizeProjectFilePath(file.path),
        content: typeof file.content === 'string' ? file.content : ''
      }));
    const draftSignature = (files: Array<{ path: string; content?: string }>) =>
      files
        .map(
          (file) =>
            `${file.path}\n${typeof file.content === 'string' ? file.content : ''}`
        )
        .join('\n---\n');

    if (!isOwner) return true;
    const settled = await waitForProjectFileSaveToSettle();
    if (!settled) {
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'error',
        message:
          'Please wait for file save to finish before starting a new run.'
      });
      return false;
    }

    let attempt = 0;
    while (hasUnsavedProjectFilesRef.current) {
      if (attempt >= MAX_AUTOSAVE_ATTEMPTS) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Unable to start run: file drafts kept changing during auto-save. Please stop editing and try again.'
        });
        return false;
      }
      attempt += 1;

      const pendingFiles = normalizeDraftForSave(projectFilesDraftRef.current);
      if (!pendingFiles.length) {
        return true;
      }
      const pendingSignature = draftSignature(pendingFiles);

      appendLocalRunEvent({
        kind: 'status',
        phase: 'planning',
        message:
          attempt === 1
            ? 'Saving unsaved files before starting run...'
            : 'Draft changed during save. Saving latest edits again...'
      });
      const saveResult = await handleSaveProjectFiles(pendingFiles, {
        resumePausedQueue: false
      });
      if (!saveResult.success) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: `Unable to start ${runType}: ${saveResult.error || 'failed to save files'}`
        });
        return false;
      }

      // Allow draft/persisted-state sync effects to propagate before checking again.
      await wait(40);
      const settledAfterSave = await waitForProjectFileSaveToSettle(4000);
      if (!settledAfterSave) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Please wait for file save to finish before starting a new run.'
        });
        return false;
      }

      if (!hasUnsavedProjectFilesRef.current) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'planning',
          message: 'Saved pending file edits.'
        });
        return true;
      }

      const latestSignature = draftSignature(
        normalizeDraftForSave(projectFilesDraftRef.current)
      );
      if (latestSignature === pendingSignature) {
        // No new edits, but local unsaved marker has not converged yet.
        const settleDeadline = Date.now() + 1200;
        while (
          hasUnsavedProjectFilesRef.current &&
          Date.now() < settleDeadline
        ) {
          await wait(60);
        }
        if (!hasUnsavedProjectFilesRef.current) {
          appendLocalRunEvent({
            kind: 'status',
            phase: 'planning',
            message: 'Saved pending file edits.'
          });
          return true;
        }
      }
    }

    return true;
  }

  async function ensureProjectFilesPersistedBeforePublish() {
    const MAX_AUTOSAVE_ATTEMPTS = 3;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));
    const normalizeDraftForSave = (
      files: Array<{ path: string; content?: string }>
    ) =>
      files.map((file) => ({
        path: normalizeProjectFilePath(file.path),
        content: typeof file.content === 'string' ? file.content : ''
      }));
    const draftSignature = (files: Array<{ path: string; content?: string }>) =>
      files
        .map(
          (file) =>
            `${file.path}\n${typeof file.content === 'string' ? file.content : ''}`
        )
        .join('\n---\n');

    const settled = await waitForProjectFileSaveToSettle();
    if (!settled) {
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'error',
        message: 'Please wait for file save to finish before publishing.'
      });
      return false;
    }

    let attempt = 0;
    while (hasUnsavedProjectFilesRef.current) {
      if (attempt >= MAX_AUTOSAVE_ATTEMPTS) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Unable to publish: file drafts kept changing during auto-save. Please stop editing and publish again.'
        });
        return false;
      }
      attempt += 1;

      const pendingFiles = normalizeDraftForSave(projectFilesDraftRef.current);
      const pendingSignature = draftSignature(pendingFiles);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'publish',
        message:
          attempt === 1
            ? 'Saving unsaved files before publish...'
            : 'Draft changed during save. Saving latest edits before publish...'
      });
      const saveResult = await handleSaveProjectFiles(pendingFiles, {
        resumePausedQueue: false
      });
      if (!saveResult.success) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: `Unable to publish: ${saveResult.error || 'failed to save files'}`
        });
        return false;
      }

      await wait(40);
      const settledAfterSave = await waitForProjectFileSaveToSettle(4000);
      if (!settledAfterSave) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: 'Please wait for file save to finish before publishing.'
        });
        return false;
      }
      if (!hasUnsavedProjectFilesRef.current) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'publish',
          message: 'Saved pending file edits before publish.'
        });
        return true;
      }

      const latestSignature = draftSignature(
        normalizeDraftForSave(projectFilesDraftRef.current)
      );
      if (latestSignature === pendingSignature) {
        const settleDeadline = Date.now() + 1200;
        while (
          hasUnsavedProjectFilesRef.current &&
          Date.now() < settleDeadline
        ) {
          await wait(60);
        }
        if (!hasUnsavedProjectFilesRef.current) {
          appendLocalRunEvent({
            kind: 'status',
            phase: 'publish',
            message: 'Saved pending file edits before publish.'
          });
          return true;
        }
      }
    }

    return true;
  }

  function updateQueuedRequests(next: QueuedBuildRequest[]) {
    queuedRequestsRef.current = next;
    setQueuedRequests(next);
  }

  function isRunActivityInFlight({ includeBootstrap = true } = {}) {
    return (
      (includeBootstrap && startingGenerationRef.current) ||
      dedupedProcessingInFlightRef.current ||
      generatingRef.current ||
      postCompleteSyncInFlightRef.current
    );
  }

  function enqueueLatestBuildRequest(messageText: string) {
    const trimmed = String(messageText || '').trim();
    if (!trimmed) return;
    const normalized = normalizeQueuedMessage(trimmed);
    const activeMessage = normalizeQueuedMessage(
      String(
        chatMessagesRef.current.find(
          (entry) => entry.id === userMessageIdRef.current
        )?.content || ''
      )
    );
    const existing = queuedRequestsRef.current;
    const duplicateIndex = existing.findIndex(
      (entry) => normalizeQueuedMessage(entry.message) === normalized
    );

    if (normalized === activeMessage) {
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'That request is already in progress.'
      });
      return;
    }

    if (duplicateIndex >= 0) {
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Your latest request is already pending.'
      });
      return;
    }

    updateQueuedRequests([
      {
        id: `${Date.now()}-steer`,
        message: trimmed,
        createdAt: Date.now()
      }
    ]);
    appendLocalRunEvent({
      kind: 'action',
      phase: 'stopping',
      message: 'Switching to your latest request...'
    });
    if (generatingRef.current) {
      handleStopGeneration();
    }
  }

  async function maybeStartNextQueuedRequest() {
    if (
      pendingRuntimeAutoFixRef.current ||
      pendingRuntimeVerificationRef.current
    ) {
      return;
    }
    if (isRunActivityInFlight()) {
      return;
    }
    const [nextRequest, ...rest] = queuedRequestsRef.current;
    if (!nextRequest) return;
    updateQueuedRequests(rest);
    appendLocalRunEvent({
      kind: 'status',
      phase: 'queued',
      message: 'Starting your latest request.'
    });
    const started = await startGeneration(nextRequest.message);
    if (!started) {
      queuePausedForSaveRef.current = true;
      updateQueuedRequests([nextRequest, ...queuedRequestsRef.current]);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Waiting for file edits to save before continuing.'
      });
      return;
    }
    queuePausedForSaveRef.current = false;
  }

  function maybeResumePausedQueueAfterSave() {
    if (!queuePausedForSaveRef.current) return;
    if (isRunActivityInFlight()) {
      return;
    }
    queuePausedForSaveRef.current = false;
    void Promise.resolve().then(() => maybeStartNextQueuedRequest());
  }

  function maybeProcessPendingRuntimeAutoFix(
    observationState = runtimeObservationStateRef.current
  ) {
    const pendingAutoFix = pendingRuntimeAutoFixRef.current;
    if (!observationState || !pendingAutoFix || !isOwner) return false;
    if (isRunActivityInFlight({ includeBootstrap: true })) return false;
    if (Date.now() - pendingAutoFix.armedAt > RUNTIME_AUTO_FIX_WINDOW_MS) {
      disarmRuntimeAutoFix();
      appendLocalRunEvent({
        kind: 'status',
        phase: 'preview',
        message:
          'Timed out while checking the updated preview for runtime issues.'
      });
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
      return true;
    }
    if (!observationState.codeSignature) {
      return false;
    }
    if (observationState.updatedAt < pendingAutoFix.armedAt) {
      return false;
    }
    const signatureKey = `${build.id}:${observationState.codeSignature}`;
    if (runtimeAutoFixAttemptedSignaturesRef.current.has(signatureKey)) {
      disarmRuntimeAutoFix();
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
      return true;
    }
    runtimeAutoFixAttemptedSignaturesRef.current.add(signatureKey);
    disarmRuntimeAutoFix();
    if (
      RUNTIME_AUTOFIX_ENABLED &&
      (observationState.issues.length > 0 ||
        !observationState.health?.meaningfulRender ||
        observationState.health?.gameplayTelemetry?.status === 'out-of-bounds' ||
        (observationState.health?.gameLike &&
          ((observationState.health?.viewportOverflowY || 0) > 48 ||
            (observationState.health?.viewportOverflowX || 0) > 24)))
    ) {
      void startRuntimeAutoFix(observationState, {
        sourceRequestId: pendingAutoFix.sourceRequestId,
        sourceArtifactVersionId: pendingAutoFix.sourceArtifactVersionId
      });
      return true;
    }
    void Promise.resolve().then(() => maybeStartNextQueuedRequest());
    return true;
  }

  function maybeProcessPendingRuntimeVerification(
    observationState = runtimeObservationStateRef.current
  ) {
    const pendingVerification = pendingRuntimeVerificationRef.current;
    if (!observationState || !pendingVerification || !isOwner) return false;
    if (isRunActivityInFlight({ includeBootstrap: true })) return false;
    if (
      Date.now() - pendingVerification.armedAt >
      RUNTIME_POST_FIX_VERIFICATION_WINDOW_MS
    ) {
      clearRuntimeVerification();
      appendLocalRunEvent({
        kind: 'status',
        phase: 'preview',
        message:
          'Timed out while re-checking the repaired preview. Continuing without another automatic repair.'
      });
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
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
    const verificationRequestId = `${build.id}-runtime-verify-${Date.now()}`;
    pendingRuntimeVerificationRef.current = {
      ...pendingVerification,
      requestId: verificationRequestId,
      afterObservation: cloneRuntimeObservationState(observationState)
    };
    socket.emit('build_runtime_verify', {
      buildId: build.id,
      requestId: verificationRequestId,
      beforeObservation: pendingVerification.beforeObservation,
      afterObservation: observationState,
      remainingRepairs: pendingVerification.remainingRepairs
    });
    return true;
  }

  useEffect(() => {
    maybeProcessPendingRuntimeAutoFix(runtimeObservationState);
  }, [build.id, isOwner, runtimeObservationState]);

  useEffect(() => {
    maybeProcessPendingRuntimeVerification(runtimeObservationState);
  }, [build.id, isOwner, runtimeObservationState]);

  async function handleSendMessage() {
    if (!inputMessage.trim() || !isOwner) return;
    const messageText = inputMessage.trim();
    setInputMessage('');
    await sendBuildMessageText(messageText);
  }

  async function handleSendPresetMessage(messageText: string) {
    if (!String(messageText || '').trim() || !isOwner) return;
    await sendBuildMessageText(messageText);
  }

  async function sendBuildMessageText(messageText: string) {
    const trimmedMessage = String(messageText || '').trim();
    if (!trimmedMessage || !isOwner) return;

    if (
      isRunActivityInFlight() ||
      pendingRuntimeAutoFixRef.current ||
      pendingRuntimeVerificationRef.current
    ) {
      enqueueLatestBuildRequest(trimmedMessage);
      return;
    }

    const started = await startGeneration(trimmedMessage);
    if (!started) {
      if (isRunActivityInFlight()) {
        enqueueLatestBuildRequest(trimmedMessage);
        return;
      }
      setInputMessage(trimmedMessage);
    }
  }

  function handleStopGeneration() {
    const requestId = streamRequestIdRef.current;
    if (!requestId || !generatingRef.current || !isOwner) {
      return;
    }
    setGeneratingStatus('Stopping...');
    setAssistantStatusSteps((prev) =>
      prev[prev.length - 1] === 'Stopping...' ? prev : [...prev, 'Stopping...']
    );
    socket.emit('build_stop', {
      buildId: build.id,
      requestId
    });
  }

  async function handleDeleteMessage(message: ChatMessage) {
    if (!isOwner) return;
    if (isMessageLockedForActiveRequest(message)) return;

    try {
      if (message.persisted === false) {
        // Fail closed for optimistic-only rows: do not delete any server row by
        // fuzzy matching. Remove local bubble and reconcile from writer.
        removeLocalMessageByIds([message.id]);
        await syncChatMessagesFromServer(undefined, true);
        return;
      }

      const result = await deleteBuildChatMessage({
        buildId: build.id,
        messageId: message.id
      });

      if (result?.success !== true || result?.deleted !== true) {
        await syncChatMessagesFromServer(undefined, true);
        return;
      }

      removeLocalMessageByIds([message.id]);
    } catch (error) {
      console.error('Failed to delete build chat message:', error);
      await syncChatMessagesFromServer(undefined, true);
    }
  }

  function handleReplaceCode(newCode: string) {
    const activeBuild = buildRef.current;
    const currentFiles = normalizeProjectFilesForBuild(
      activeBuild?.projectFiles || [],
      activeBuild?.code || ''
    );
    const nextFiles = currentFiles.map((file) =>
      file.path.toLowerCase() === '/index.html' ||
      file.path.toLowerCase() === '/index.htm'
        ? { ...file, content: newCode, sizeBytes: newCode.length }
        : file
    );
    handleProjectFilesChange(nextFiles);
  }

  function handleApplyRestoredProjectFiles(
    restoredFilesInput: Array<{ path: string; content?: string }>,
    restoredCode?: string | null,
    options?: {
      artifactVersionId?: number | null;
      primaryArtifactId?: number | null;
    }
  ) {
    const activeBuild = buildRef.current;
    if (!activeBuild) return;
    if (!Array.isArray(restoredFilesInput) || restoredFilesInput.length === 0) {
      if (typeof restoredCode === 'string') {
        handleReplaceCode(restoredCode);
      }
      return;
    }
    const fallbackCode =
      typeof restoredCode === 'string' ? restoredCode : activeBuild.code || '';
    const normalizedFiles = normalizeProjectFilesForBuild(
      restoredFilesInput,
      fallbackCode
    );
    const nextCode = resolveIndexHtmlFromProjectFiles(
      normalizedFiles,
      fallbackCode
    );
    const nextBuild = {
      ...activeBuild,
      code: nextCode,
      primaryArtifactId:
        options?.primaryArtifactId ?? activeBuild.primaryArtifactId ?? null,
      currentArtifactVersionId:
        options?.artifactVersionId ??
        activeBuild.currentArtifactVersionId ??
        null,
      projectManifest: {
        entryPath: resolveIndexEntryPathFromProjectFiles(
          normalizedFiles,
          activeBuild?.projectManifest?.entryPath || '/index.html'
        ),
        storageMode: 'project-files',
        fileCount: normalizedFiles.length
      },
      projectFiles: normalizedFiles
    };
    buildRef.current = nextBuild;
    updateBuildRef.current(nextBuild);
  }

  function handleProjectFilesChange(
    nextFilesInput: Array<{ path: string; content?: string }>
  ) {
    const activeBuild = buildRef.current;
    if (!activeBuild) return;
    const normalizedFiles = normalizeProjectFilesForBuild(
      nextFilesInput,
      activeBuild.code || ''
    );
    const nextCode = resolveIndexHtmlFromProjectFiles(
      normalizedFiles,
      activeBuild.code || ''
    );
    const nextBuild = {
      ...activeBuild,
      code: nextCode,
      projectManifest: {
        entryPath: resolveIndexEntryPathFromProjectFiles(
          normalizedFiles,
          activeBuild?.projectManifest?.entryPath || '/index.html'
        ),
        storageMode: 'project-files',
        fileCount: normalizedFiles.length
      },
      projectFiles: normalizedFiles
    };
    buildRef.current = nextBuild;
    updateBuildRef.current(nextBuild);
  }

  async function handleSaveProjectFiles(
    nextFilesInput: Array<{ path: string; content?: string }>,
    options?: ProjectFileSaveOptions
  ): Promise<ProjectFileSaveResult> {
    if (!isOwner) {
      return { success: false, error: 'Not authorized' };
    }
    const activeBuild = buildRef.current;
    const requestBuild = activeBuild || build;
    const requestBuildId = Number(requestBuild?.id || 0);
    if (!Number.isFinite(requestBuildId) || requestBuildId <= 0) {
      return { success: false, error: 'Build not found' };
    }
    if (requiresProjectFilesResyncBeforeSaveRef.current) {
      try {
        await syncChatMessagesFromServer(undefined, true);
        requiresProjectFilesResyncBeforeSaveRef.current = false;
      } catch (syncError) {
        console.error(
          'Failed to refresh project files before save after generation:',
          syncError
        );
        return {
          success: false,
          error:
            'Unable to verify latest generated files yet. Please retry in a moment.'
        };
      }
    }
    const normalizedFiles = normalizeProjectFilesForBuild(
      nextFilesInput,
      requestBuild?.code || ''
    );
    try {
      const result = await updateBuildProjectFiles({
        buildId: requestBuildId,
        files: normalizedFiles.map((file) => ({
          path: file.path,
          content: file.content
        })),
        createVersion: true
      });
      const savedFiles = normalizeProjectFilesForBuild(
        Array.isArray(result?.projectFiles)
          ? result.projectFiles
          : normalizedFiles,
        requestBuild?.code || ''
      );
      const nextCode = resolveIndexHtmlFromProjectFiles(
        savedFiles,
        requestBuild?.code || ''
      );
      const latestBuild = buildRef.current;
      if (!latestBuild || Number(latestBuild.id) !== requestBuildId) {
        return {
          success: false,
          error:
            'Build changed while save was in progress. Please retry on the active build.'
        };
      }
      const nextBuild = {
        ...latestBuild,
        code: nextCode,
        primaryArtifactId:
          result?.artifactVersion?.artifactId ??
          latestBuild.primaryArtifactId ??
          null,
        currentArtifactVersionId:
          result?.artifactVersion?.versionId ??
          latestBuild.currentArtifactVersionId ??
          null,
        projectManifest: result?.projectManifest || {
          entryPath: resolveIndexEntryPathFromProjectFiles(
            savedFiles,
            latestBuild.projectManifest?.entryPath || '/index.html'
          ),
          storageMode: 'project-files',
          fileCount: savedFiles.length
        },
        projectFiles: savedFiles
      };
      buildRef.current = nextBuild;
      updateBuildRef.current(nextBuild);
      if (options?.resumePausedQueue) {
        maybeResumePausedQueueAfterSave();
      }
      return { success: true };
    } catch (error: any) {
      console.error('Failed to save project files:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save project files';
      return { success: false, error: message };
    }
  }

  async function handleReloadProjectFileChangeLogs(options?: {
    silent?: boolean;
  }) {
    if (!isOwner) return;
    const silent = Boolean(options?.silent);
    if (!silent) {
      setProjectFileChangeLogsLoading(true);
    }
    setProjectFileChangeLogsError('');
    try {
      const payload = await loadBuildProjectFileChangeLogs(build.id, {
        fromWriter: true,
        limit: 12
      });
      const logs = Array.isArray(payload?.projectFileChangeLogs)
        ? payload.projectFileChangeLogs
        : [];
      const contextPreview =
        typeof payload?.promptContextPreview === 'string'
          ? payload.promptContextPreview
          : '';
      setProjectFileChangeLogs(logs);
      setProjectFilePromptContextPreview(contextPreview);
      setProjectFileChangeLogsLoadedAt(Date.now());
      setProjectFileChangeLogsError('');
    } catch (error: any) {
      console.error('Failed to load project file change logs:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load project file change logs';
      setProjectFileChangeLogsError(message);
    } finally {
      setProjectFileChangeLogsLoading(false);
    }
  }

  async function handlePublish() {
    if (!isOwner || publishing) return;

    setPublishing(true);
    try {
      const requestedBuildId = Number(buildRef.current?.id || build.id);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: 'Unable to publish: build not found.'
        });
        return;
      }
      const projectFilesReady =
        await ensureProjectFilesPersistedBeforePublish();
      if (!projectFilesReady) {
        return;
      }
      const latestBuild = buildRef.current;
      if (!latestBuild || Number(latestBuild.id) !== requestedBuildId) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Build changed before publish. Please retry on the active build.'
        });
        return;
      }
      if (!latestBuild.code) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: 'Add code before publishing your build.'
        });
        return;
      }
      const result = await publishBuild({ buildId: latestBuild.id });
      if (result?.success && result?.build) {
        onUpdateBuild({
          ...latestBuild,
          isPublic: result.build.isPublic,
          publishedAt: result.build.publishedAt,
          thumbnailUrl: result.build.thumbnailUrl
        });
      }
    } catch (error) {
      console.error('Failed to publish build:', error);
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!isOwner || publishing) return;
    setPublishing(true);
    try {
      const result = await unpublishBuild(build.id);
      if (result?.success && result?.build) {
        onUpdateBuild({
          ...build,
          isPublic: result.build.isPublic
        });
      }
    } catch (error) {
      console.error('Failed to unpublish build:', error);
    }
    setPublishing(false);
  }

  async function handleFork() {
    if (!userId || forking || isOwner) return;
    setForking(true);
    try {
      const result = await forkBuild(build.id);
      if (result?.success && result?.build) {
        navigate(`/build/${result.build.id}`);
      }
    } catch (error) {
      console.error('Failed to fork build:', error);
    }
    setForking(false);
  }

  return (
    <div className={pageClass}>
      <header className={headerClass}>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
          `}
        >
          <ScopedTheme
            as="span"
            theme={(profileTheme || DEFAULT_PROFILE_THEME) as any}
          >
            <Link to="/build" className={badgeClass} title="Back to main menu">
              <Icon icon="arrow-left" />
              Back to Main Menu
            </Link>
          </ScopedTheme>
          <h2 className={headerTitleClass}>{build.title}</h2>
          {renderBuildDescription()}
        </div>
        <div className={headerActionsClass}>
          <span
            className={badgePillClass}
            style={getVisibilityBadgeStyle(build.isPublic)}
          >
            {build.isPublic ? 'public' : 'private'}
          </span>
          {isOwner && (
            <GameCTAButton
              onClick={handleOpenDescriptionModal}
              variant="neutral"
              size="md"
              icon="pencil-alt"
            >
              {build.description?.trim() ? 'Edit Description' : 'Add Description'}
            </GameCTAButton>
          )}
          {isOwner && (
            <GameCTAButton
              onClick={build.isPublic ? handleUnpublish : handlePublish}
              disabled={publishing || (!build.isPublic && !build.code)}
              loading={publishing}
              variant={build.isPublic ? 'neutral' : 'magenta'}
              size="md"
              icon={build.isPublic ? 'eye-slash' : 'globe'}
            >
              {publishing
                ? 'Processing...'
                : build.isPublic
                  ? 'Unpublish'
                  : 'Publish'}
            </GameCTAButton>
          )}
          {buildForkUiEnabled && !isOwner && userId && build.isPublic && (
            <GameCTAButton
              onClick={handleFork}
              disabled={forking}
              loading={forking}
              variant="primary"
              size="md"
              icon="code-branch"
            >
              {forking ? 'Forking...' : 'Fork'}
            </GameCTAButton>
          )}
        </div>
      </header>

      <div className={panelShellClass}>
        <div
          className={isOwner ? workspaceWithChatClass : workspaceNoChatClass}
        >
          {isOwner && (
            <ChatPanel
              messages={chatMessages}
              executionPlan={build.executionPlan || null}
              inputMessage={inputMessage}
              generating={generating}
              generatingStatus={generatingStatus}
              assistantStatusSteps={assistantStatusSteps}
              usageMetrics={usageMetrics}
              copilotPolicy={copilotPolicy}
              projectFileChangeLogs={projectFileChangeLogs}
              projectFilePromptContextPreview={projectFilePromptContextPreview}
              projectFileChangeLogsLoading={projectFileChangeLogsLoading}
              projectFileChangeLogsError={projectFileChangeLogsError}
              projectFileChangeLogsLoadedAt={projectFileChangeLogsLoadedAt}
              runEvents={runEvents}
              activeStreamMessageIds={getActiveStreamMessageIds()}
              isOwner={isOwner}
              chatScrollRef={chatScrollRef}
              chatEndRef={chatEndRef}
              onChatScroll={handleChatScroll}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              onSendPresetMessage={handleSendPresetMessage}
              onStopGeneration={handleStopGeneration}
              onReloadProjectFileChangeLogs={handleReloadProjectFileChangeLogs}
              onDeleteMessage={handleDeleteMessage}
            />
          )}
          <PreviewPanel
            build={build}
            code={build.code}
            projectFiles={build.projectFiles || []}
            streamingProjectFiles={streamingProjectFiles}
            streamingFocusFilePath={streamingFocusFilePath}
            isOwner={isOwner}
            capabilitySnapshot={build.capabilitySnapshot || null}
            runtimeExplorationPlan={runtimeExplorationPlan}
            onReplaceCode={handleReplaceCode}
            onApplyRestoredProjectFiles={handleApplyRestoredProjectFiles}
            onSaveProjectFiles={(files) =>
              handleSaveProjectFiles(files, { resumePausedQueue: true })
            }
            onEditableProjectFilesStateChange={
              handleProjectFilesDraftStateChange
            }
            onRuntimeObservationChange={handleRuntimeObservationChange}
          />
        </div>
      </div>
      {descriptionModalShown && isOwner && (
        <BuildDescriptionModal
          buildTitle={build.title}
          initialDescription={build.description}
          loading={savingDescription}
          onHide={handleCloseDescriptionModal}
          onSubmit={handleSaveDescription}
        />
      )}
    </div>
  );

  function renderBuildDescription() {
    if (build.description?.trim()) {
      return <span className={headerSubtitleClass}>{build.description}</span>;
    }

    return <span className={headerSubtitleClass}>by {build.username}</span>;
  }

  function handleOpenDescriptionModal() {
    setDescriptionModalShown(true);
  }

  function handleCloseDescriptionModal() {
    if (savingDescription) return;
    setDescriptionModalShown(false);
  }

  async function handleSaveDescription(description: string) {
    if (!isOwner || savingDescription) return;
    const latestBuild = buildRef.current;
    const nextDescription = description.trim();
    if ((latestBuild.description || '').trim() === nextDescription) {
      setDescriptionModalShown(false);
      return;
    }
    setSavingDescription(true);
    try {
      const result = await updateBuildMetadata({
        buildId: latestBuild.id,
        description: nextDescription
      });
      if (result?.success && result?.build) {
        const nextBuild = {
          ...latestBuild,
          ...result.build
        };
        buildRef.current = nextBuild;
        updateBuildRef.current(nextBuild);
        setDescriptionModalShown(false);
      }
    } catch (error) {
      console.error('Failed to update build description:', error);
    } finally {
      setSavingDescription(false);
    }
  }

  function scrollChatToBottom(
    behavior: ScrollBehavior = 'smooth',
    options?: { force?: boolean }
  ) {
    if (!options?.force && !shouldAutoScrollRef.current) {
      return;
    }
    pendingScrollBehaviorRef.current = behavior;
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: pendingScrollBehaviorRef.current
        });
        return;
      }
      chatEndRef.current?.scrollIntoView({
        behavior: pendingScrollBehaviorRef.current,
        block: 'nearest',
        inline: 'nearest'
      });
    });
  }

  async function startRuntimeAutoFix(
    observationState: BuildRuntimeObservationState,
    options?: {
      remainingRepairsAfterVerification?: number;
      trigger?: 'initial' | 'verification';
      sourceRequestId?: string | null;
      sourceArtifactVersionId?: number | null;
    }
  ): Promise<boolean> {
    if (!RUNTIME_AUTOFIX_ENABLED) {
      return false;
    }
    if (!isOwner || isRunActivityInFlight()) {
      return false;
    }
    const runtimeObservationSummary =
      formatRuntimeObservationSummary(observationState);
    if (!runtimeObservationSummary) {
      return false;
    }
    const activeBuild = buildRef.current;
    const requestedBuildId = Number(activeBuild?.id || build.id);
    if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
      return false;
    }

    resetDedupedProcessingReconcileState();
    disarmRuntimeAutoFix();
    pendingRuntimeVerificationRef.current = null;
    setRuntimeExplorationPlan(null);
    activeRuntimeAutoFixContextRef.current = {
      beforeObservation: cloneRuntimeObservationState(observationState),
      remainingRepairsAfterVerification: Math.max(
        0,
        options?.remainingRepairsAfterVerification ?? 1
      )
    };
    const now = Math.floor(Date.now() / 1000);
    const assistantMessageId = Date.now();
    const requestId = `${requestedBuildId}-runtime-fix-${assistantMessageId}`;
    activeRunModeRef.current = 'runtime-autofix';
    streamingProjectFilesBaseRef.current = normalizeProjectFilesForBuild(
      activeBuild?.projectFiles || [],
      activeBuild?.code || ''
    );
    setStreamingProjectFiles(null);
    setStreamingFocusFilePath(null);
    generatingRef.current = true;
    setGenerating(true);
    setGeneratingStatus(null);
    setAssistantStatusSteps([]);
    setUsageMetrics({});
    setRunEvents([]);
    streamRequestIdRef.current = requestId;
    userMessageIdRef.current = null;
    assistantMessageIdRef.current = assistantMessageId;

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      codeGenerated: null,
      streamCodePreview: null,
      createdAt: now,
      persisted: false
    };

    const nextMessages = [...chatMessagesRef.current, assistantMessage];
    chatMessagesRef.current = nextMessages;
    updateChatMessagesRef.current(nextMessages);
    appendLocalRunEvent({
      kind: 'action',
      phase: 'implementing',
      message:
        options?.trigger === 'verification'
          ? 'Lumine is taking one final repair pass after re-checking the preview.'
          : `Preview explorer sent its findings to Lumine for automatic repair${
              options?.sourceArtifactVersionId
                ? ` after artifact v${options.sourceArtifactVersionId}`
                : ''
            }.`
    });
    shouldAutoScrollRef.current = true;
    scrollChatToBottom('smooth', { force: true });

    socket.emit('build_generate', {
      buildId: requestedBuildId,
      requestId,
      message: 'Investigate and fix the observed runtime issues.',
      runtimeObservationSummary,
      runtimeObservation: observationState,
      runtimeExplorationPlan,
      autoFixRuntimeObservation: true,
      runtimeAutoFixSourceRequestId: options?.sourceRequestId || null,
      runtimeAutoFixSourceArtifactVersionId:
        options?.sourceArtifactVersionId || null
    });
    return true;
  }

  async function startGeneration(
    messageText: string
  ): Promise<boolean> {
    if (!messageText.trim() || isRunActivityInFlight() || !isOwner) {
      return false;
    }
    startingGenerationRef.current = true;
    try {
      const requestedBuildId = Number(buildRef.current?.id || build.id);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        return false;
      }
      const projectFilesReady = await ensureProjectFilesPersistedBeforeRun({
        runType: 'copilot'
      });
      if (!projectFilesReady) {
        return false;
      }
      const activeBuild = buildRef.current;
      if (!activeBuild || Number(activeBuild.id) !== requestedBuildId) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Build changed before run start. Please retry on the active build.'
        });
        return false;
      }
      resetDedupedProcessingReconcileState();
      const now = Math.floor(Date.now() / 1000);
      const messageId = Date.now();
      const requestId = `${activeBuild.id}-${messageId}`;
      const runtimeObservationSummary = getCurrentRuntimeObservationSummary();
      activeRunModeRef.current = 'user';
      resetRuntimeHealthFollowUpState();
      setRuntimeExplorationPlan(null);
      streamingProjectFilesBaseRef.current = normalizeProjectFilesForBuild(
        activeBuild.projectFiles || [],
        activeBuild.code || ''
      );
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);
      generatingRef.current = true;
      setGenerating(true);
      setAssistantStatusSteps([]);
      setUsageMetrics({});
      setRunEvents([]);
      streamRequestIdRef.current = requestId;

      const userMessage: ChatMessage = {
        id: messageId,
        role: 'user',
        content: messageText,
        codeGenerated: null,
        streamCodePreview: null,
        createdAt: now,
        persisted: false
      };
      const assistantMessage: ChatMessage = {
        id: messageId + 1,
        role: 'assistant',
        content: '',
        codeGenerated: null,
        streamCodePreview: null,
        createdAt: now + 1,
        persisted: false
      };
      userMessageIdRef.current = userMessage.id;
      assistantMessageIdRef.current = assistantMessage.id;

      const messagesWithUser = [
        ...chatMessagesRef.current,
        userMessage,
        assistantMessage
      ];
      chatMessagesRef.current = messagesWithUser;
      updateChatMessagesRef.current(messagesWithUser);
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('smooth', { force: true });

      socket.emit('build_generate', {
        buildId: activeBuild.id,
        message: messageText,
        requestId,
        runtimeObservationSummary: runtimeObservationSummary || undefined
      });
      return true;
    } finally {
      startingGenerationRef.current = false;
    }
  }

  async function startGreetingGeneration(): Promise<boolean> {
    if (isRunActivityInFlight() || !isOwner) {
      return false;
    }
    startingGenerationRef.current = true;
    try {
      const activeBuild = buildRef.current;
      const requestedBuildId = Number(activeBuild?.id || build.id);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        return false;
      }
      if (!activeBuild || Number(activeBuild.id) !== requestedBuildId) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Build changed before Lumine greeting could start. Please retry on the active build.'
        });
        return false;
      }
      resetDedupedProcessingReconcileState();
      const now = Math.floor(Date.now() / 1000);
      const assistantMessageId = Date.now();
      const requestId = `${activeBuild.id}-greeting-${assistantMessageId}`;
      activeRunModeRef.current = 'greeting';
      resetRuntimeHealthFollowUpState();
      setRuntimeExplorationPlan(null);
      streamingProjectFilesBaseRef.current = normalizeProjectFilesForBuild(
        activeBuild.projectFiles || [],
        activeBuild.code || ''
      );
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);
      generatingRef.current = true;
      setGenerating(true);
      setGeneratingStatus(null);
      setAssistantStatusSteps([]);
      setUsageMetrics({});
      setRunEvents([]);
      streamRequestIdRef.current = requestId;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = assistantMessageId;

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        codeGenerated: null,
        streamCodePreview: null,
        createdAt: now,
        persisted: false
      };

      const nextMessages = [...chatMessagesRef.current, assistantMessage];
      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('smooth', { force: true });

      socket.emit('build_generate_greeting', {
        buildId: activeBuild.id,
        requestId
      });
      return true;
    } finally {
      startingGenerationRef.current = false;
    }
  }

  function removeLocalMessageByIds(ids: number[]) {
    const idSet = new Set(ids);
    const nextMessages = chatMessagesRef.current.filter(
      (entry) => !idSet.has(entry.id)
    );
    chatMessagesRef.current = nextMessages;
    updateChatMessagesRef.current(nextMessages);
  }

  function getActiveStreamMessageIds() {
    return [userMessageIdRef.current, assistantMessageIdRef.current].filter(
      (id): id is number => typeof id === 'number' && id > 0
    );
  }

  function isMessageLockedForActiveRequest(message: ChatMessage) {
    if (!generating) return false;
    return getActiveStreamMessageIds().includes(message.id);
  }

  function handleChatScroll() {
    shouldAutoScrollRef.current = isChatNearBottom();
  }

  function maybeAutoScrollDuringStream() {
    if (!shouldAutoScrollRef.current) return;
    scrollChatToBottom('auto');
  }

  function clearDedupedProcessingReconcileTimer() {
    if (!dedupedProcessingReconcileTimerRef.current) return;
    clearTimeout(dedupedProcessingReconcileTimerRef.current);
    dedupedProcessingReconcileTimerRef.current = null;
  }

  function resetDedupedProcessingReconcileState() {
    clearDedupedProcessingReconcileTimer();
    dedupedProcessingInFlightRef.current = false;
    dedupedProcessingReconcileRequestIdRef.current = null;
    dedupedProcessingReconcileStartedAtRef.current = 0;
  }

  function scheduleDedupedProcessingReconcile(requestId: string) {
    dedupedProcessingInFlightRef.current = true;
    if (dedupedProcessingReconcileRequestIdRef.current !== requestId) {
      dedupedProcessingReconcileRequestIdRef.current = requestId;
      dedupedProcessingReconcileStartedAtRef.current = Date.now();
    } else if (!dedupedProcessingReconcileStartedAtRef.current) {
      dedupedProcessingReconcileStartedAtRef.current = Date.now();
    }
    clearDedupedProcessingReconcileTimer();
    dedupedProcessingReconcileTimerRef.current = setTimeout(() => {
      void reconcileDedupedProcessingRequest(requestId);
    }, DEDUPED_PROCESSING_RECONCILE_INTERVAL_MS);
  }

  async function reconcileDedupedProcessingRequest(requestId: string) {
    if (
      streamRequestIdRef.current !== requestId ||
      dedupedProcessingReconcileRequestIdRef.current !== requestId
    ) {
      resetDedupedProcessingReconcileState();
      return;
    }
    let shouldReschedule = false;
    try {
      await syncChatMessagesFromServer(undefined, true);
    } catch (error) {
      console.error('Failed to reconcile deduped build request:', error);
      shouldReschedule = true;
    } finally {
      clearDedupedProcessingReconcileTimer();
    }
    if (shouldReschedule) {
      scheduleDedupedProcessingReconcile(requestId);
      return;
    }
    if (
      streamRequestIdRef.current !== requestId ||
      dedupedProcessingReconcileRequestIdRef.current !== requestId
    ) {
      resetDedupedProcessingReconcileState();
      return;
    }
    const messageIds = new Set(
      chatMessagesRef.current.map((entry) => entry.id)
    );
    if (userMessageIdRef.current && !messageIds.has(userMessageIdRef.current)) {
      userMessageIdRef.current = null;
    }
    if (
      assistantMessageIdRef.current &&
      !messageIds.has(assistantMessageIdRef.current)
    ) {
      assistantMessageIdRef.current = null;
    }
    scrollChatToBottom();

    const hasActiveStreamPlaceholders = Boolean(
      userMessageIdRef.current || assistantMessageIdRef.current
    );
    if (!hasActiveStreamPlaceholders) {
      if (streamRequestIdRef.current === requestId) {
        streamRequestIdRef.current = null;
      }
      resetDedupedProcessingReconcileState();
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
      return;
    }

    const startedAt =
      dedupedProcessingReconcileStartedAtRef.current || Date.now();
    if (Date.now() - startedAt >= DEDUPED_PROCESSING_RECONCILE_MAX_MS) {
      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      resetDedupedProcessingReconcileState();
      void Promise.resolve().then(() => maybeStartNextQueuedRequest());
      return;
    }

    scheduleDedupedProcessingReconcile(requestId);
  }

  function isChatNearBottom(threshold = 120) {
    const container = chatScrollRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
  }

  async function syncChatMessagesFromServer(
    serverMessages?: any[],
    fromWriter = false,
    options?: { preserveLocalMessages?: boolean }
  ) {
    let messages = Array.isArray(serverMessages) ? serverMessages : null;
    if (!messages) {
      const buildPayload = await loadBuild(
        build.id,
        fromWriter ? { fromWriter: true } : undefined
      );
      if (buildPayload?.build) {
        const nextBuild = {
          ...buildPayload.build,
          executionPlan: buildPayload.executionPlan || null,
          projectManifest: buildPayload.projectManifest || null,
          projectFiles: Array.isArray(buildPayload.projectFiles)
            ? buildPayload.projectFiles
            : []
        };
        buildRef.current = nextBuild;
        updateBuildRef.current(nextBuild);
        if (fromWriter) {
          requiresProjectFilesResyncBeforeSaveRef.current = false;
        }
      }
      messages = buildPayload?.chatMessages;
      if (
        buildPayload &&
        Object.prototype.hasOwnProperty.call(buildPayload, 'copilotPolicy')
      ) {
        updateCopilotPolicyRef.current(buildPayload.copilotPolicy || null);
      }
    }
    if (!Array.isArray(messages)) return;
    const normalized = messages.map((entry: any) => ({
      ...entry,
      persisted: true,
      streamCodePreview: null
    }));
    if (!options?.preserveLocalMessages) {
      chatMessagesRef.current = normalized;
      updateChatMessagesRef.current(normalized);
    }
  }
}

function getVisibilityBadgeStyle(isPublic: boolean): React.CSSProperties {
  if (isPublic) {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      borderColor: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }
  return {
    background: 'rgba(100, 116, 139, 0.14)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  };
}
