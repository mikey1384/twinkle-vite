import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import SocialPanel from './SocialPanel';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { socket } from '~/constants/sockets/api';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

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
  background: rgba(65, 140, 235, 0.14);
  color: #1d4ed8;
  border: 1px solid rgba(65, 140, 235, 0.28);
  font-weight: 900;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: ${displayFontFamily};
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    border-color: var(--theme-border);
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

const headerActionsClass = css`
  display: flex;
  gap: 0.55rem;
  align-items: center;
  flex-wrap: wrap;
`;

const statusBadgeClass = css`
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

const panelShellWithSocialClass = css`
  ${panelShellClass};
  grid-template-columns: 1fr 320px;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
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
  status: string;
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
  createdAt: number;
  updatedAt: number;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'reviewer';
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
  estimatedCostUsd: number | null;
}

interface BuildCopilotPolicy {
  tier: 'free' | 'pro' | 'premium';
  assignedTier?: 'free' | 'pro' | 'premium';
  byo?: {
    enabled: boolean;
    requiredForPaidTiers: boolean;
    blockedAssignedTier: boolean;
  };
  pricing: {
    proMonthlyPriceUsd: number;
  };
  limits: {
    maxProjects: number;
    maxProjectBytes: number;
    maxFilesPerProject: number;
    maxFileBytes: number;
    maxPromptChars: number;
    historyMaxAgeSeconds: number;
    historyMaxMessages: number;
    historyMessageCharLimit: number;
    historyTotalCharBudget: number;
  };
  usage: {
    projectCount: number;
    projectCountRemaining: number;
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
    maxFileBytes: number;
  };
  requestBilling: {
    dayKey: string;
    tier: 'free' | 'pro' | 'premium';
    freeRequestsPerDay: number;
    coinCostPerRequest: number;
    billingEnabled: boolean;
    requestsToday: number;
    freeRequestsUsed: number;
    freeRequestsRemaining: number;
    paidRequestsToday: number;
    coinSpentToday: number;
    coinBalance: number | null;
  };
  codexReasoning: {
    allowedEfforts: Array<'low' | 'medium' | 'high' | 'xhigh'>;
    defaultEffort: 'low' | 'medium' | 'high' | 'xhigh';
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
    estimatedCostUsd?: number | null;
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

type BuildQueueMode = 'collect' | 'steer' | 'followup';
type BuildCodexReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh';

interface QueuedBuildRequest {
  id: string;
  message: string;
  mode: BuildQueueMode;
  reasoningEffort: BuildCodexReasoningEffort;
  createdAt: number;
}

interface BuildEditorProps {
  build: Build;
  chatMessages: ChatMessage[];
  copilotPolicy: BuildCopilotPolicy | null;
  isOwner: boolean;
  initialPrompt?: string;
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

export default function BuildEditor({
  build,
  chatMessages,
  copilotPolicy,
  isOwner,
  initialPrompt = '',
  onUpdateBuild,
  onUpdateChatMessages,
  onUpdateCopilotPolicy
}: BuildEditorProps) {
  const navigate = useNavigate();
  const { userId, missions } = useKeyContext((v) => v.myState);
  const updateBuildProjectFiles = useAppContext(
    (v) => v.requestHelpers.updateBuildProjectFiles
  );
  const loadBuildProjectFileChangeLogs = useAppContext(
    (v) => v.requestHelpers.loadBuildProjectFileChangeLogs
  );
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const deleteBuildChatMessage = useAppContext(
    (v) => v.requestHelpers.deleteBuildChatMessage
  );
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const onUpdateUserMissionState = useAppContext(
    (v) => v.user.actions.onUpdateUserMissionState
  );
  const publishBuild = useAppContext((v) => v.requestHelpers.publishBuild);
  const unpublishBuild = useAppContext((v) => v.requestHelpers.unpublishBuild);
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);

  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);
  const [reviewerStatusSteps, setReviewerStatusSteps] = useState<string[]>([]);
  const [assistantStatusSteps, setAssistantStatusSteps] = useState<string[]>(
    []
  );
  const [reviewing, setReviewing] = useState(false);
  const [_reviewPhase, setReviewPhase] = useState<
    'reviewing' | 'fixing' | null
  >(null);
  const [publishing, setPublishing] = useState(false);
  const [forking, setForking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [usageMetrics, setUsageMetrics] = useState<
    Record<string, BuildUsageMetric>
  >({});
  const [runEvents, setRunEvents] = useState<BuildRunEvent[]>([]);
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
  const [queueMode, setQueueMode] = useState<BuildQueueMode>('followup');
  const [selectedReasoningEffort, setSelectedReasoningEffort] =
    useState<BuildCodexReasoningEffort>('medium');
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
  const updateMissionStatusRef = useRef(updateMissionStatus);
  const onUpdateUserMissionStateRef = useRef(onUpdateUserMissionState);
  const missionProgressRef = useRef<any>(missions?.build || {});
  const streamRequestIdRef = useRef<string | null>(null);
  const userMessageIdRef = useRef<number | null>(null);
  const assistantMessageIdRef = useRef<number | null>(null);
  const reviewerMessageIdRef = useRef<number | null>(null);
  const dedupedProcessingReconcileRequestIdRef = useRef<string | null>(null);
  const dedupedProcessingReconcileStartedAtRef = useRef<number>(0);
  const dedupedProcessingReconcileTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const didInitialChatScrollRef = useRef(false);
  const didAutoPromptRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior>('auto');
  const scrollRafRef = useRef<number | null>(null);
  const DEDUPED_PROCESSING_RECONCILE_INTERVAL_MS = 8000;
  const DEDUPED_PROCESSING_RECONCILE_MAX_MS = 3 * 60 * 1000;
  const queuedRequestsRef = useRef<QueuedBuildRequest[]>([]);
  const dedupedProcessingInFlightRef = useRef(false);
  const generatingRef = useRef(false);
  const reviewingRef = useRef(false);
  const postCompleteSyncInFlightRef = useRef(false);
  const startingGenerationRef = useRef(false);
  const queuePausedForSaveRef = useRef(false);
  const requiresProjectFilesResyncBeforeSaveRef = useRef(false);
  const activeReasoningEffortRef = useRef<BuildCodexReasoningEffort | null>(
    null
  );
  const projectFilesDraftRef = useRef<
    Array<{ path: string; content?: string }>
  >([]);
  const hasUnsavedProjectFilesRef = useRef(false);
  const savingProjectFilesRef = useRef(false);
  const selectedReasoningEffortRef =
    useRef<BuildCodexReasoningEffort>('medium');
  const reasoningEffortOptionsRef = useRef<BuildCodexReasoningEffort[]>([
    'low',
    'medium',
    'high'
  ]);
  const reasoningEffortOptions = useMemo<BuildCodexReasoningEffort[]>(
    () =>
      copilotPolicy?.codexReasoning?.allowedEfforts?.length
        ? copilotPolicy.codexReasoning.allowedEfforts
        : ['low', 'medium', 'high'],
    [copilotPolicy?.codexReasoning]
  );

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    generatingRef.current = generating;
  }, [generating]);

  useEffect(() => {
    reviewingRef.current = reviewing;
  }, [reviewing]);

  useEffect(() => {
    selectedReasoningEffortRef.current = selectedReasoningEffort;
  }, [selectedReasoningEffort]);

  useEffect(() => {
    reasoningEffortOptionsRef.current = reasoningEffortOptions;
  }, [reasoningEffortOptions]);

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

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
    updateMissionStatusRef.current = updateMissionStatus;
  }, [updateMissionStatus]);

  useEffect(() => {
    onUpdateUserMissionStateRef.current = onUpdateUserMissionState;
  }, [onUpdateUserMissionState]);

  useEffect(() => {
    missionProgressRef.current = missions?.build || {};
  }, [missions?.build]);

  useEffect(() => {
    didInitialChatScrollRef.current = false;
    didAutoPromptRef.current = false;
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
    dedupedProcessingInFlightRef.current = false;
    postCompleteSyncInFlightRef.current = false;
    startingGenerationRef.current = false;
    queuePausedForSaveRef.current = false;
    requiresProjectFilesResyncBeforeSaveRef.current = false;
    activeReasoningEffortRef.current = null;
  }, [build.id]);

  useEffect(() => {
    const allowedEfforts = copilotPolicy?.codexReasoning?.allowedEfforts?.length
      ? copilotPolicy.codexReasoning.allowedEfforts
      : (['low', 'medium', 'high'] as BuildCodexReasoningEffort[]);
    const fallbackEffort =
      copilotPolicy?.codexReasoning?.defaultEffort ||
      allowedEfforts[0] ||
      'medium';
    setSelectedReasoningEffort((prev) =>
      allowedEfforts.includes(prev) ? prev : fallbackEffort
    );
  }, [copilotPolicy]);

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
    void startGeneration(
      prompt,
      'followup',
      copilotPolicy?.codexReasoning?.defaultEffort
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, isOwner, initialPrompt]);

  useEffect(() => {
    if (didInitialChatScrollRef.current) return;
    didInitialChatScrollRef.current = true;
    scrollChatToBottom('auto');
  }, [chatMessages.length, build.id]);

  useEffect(() => {
    function handleGenerateUpdate(payload: {
      requestId?: string;
      reply?: string;
      codeGenerated?: string | null;
    }) {
      const { requestId, reply, codeGenerated } = payload;
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      const assistantId = assistantMessageIdRef.current;
      if (!assistantId) return;
      const currentMessages = chatMessagesRef.current;
      const hasCodeGeneratedField = Object.prototype.hasOwnProperty.call(
        payload,
        'codeGenerated'
      );
      const nextMessages = currentMessages.map((message) => {
        if (message.id !== assistantId) return message;
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
      maybeAutoScrollDuringStream();
    }

    async function handleGenerateComplete({
      requestId,
      assistantText,
      artifact,
      code,
      projectFiles,
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
      message?: {
        id?: number | null;
        userMessageId?: number | null;
        artifactVersionId?: number | null;
        createdAt?: number;
      };
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      const wasReviewRun = reviewingRef.current;
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
      const shouldPreserveLocalCompletionMessages =
        wasReviewRun && !persistedAssistantId && !persistedUserId;

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

      const generatedCodeSuccessfully =
        artifactCode !== null ||
        (Array.isArray(payloadProjectFiles) && payloadProjectFiles.length > 0);
      if (!wasReviewRun && generatedCodeSuccessfully) {
        void markBuildMissionPromptCompleted();
      }

      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      reviewerMessageIdRef.current = null;
      activeReasoningEffortRef.current = null;
      generatingRef.current = false;
      reviewingRef.current = false;
      setGenerating(false);
      setReviewing(false);
      setReviewPhase(null);
      setGeneratingStatus(null);
      setReviewerStatusSteps([]);
      setAssistantStatusSteps([]);
      scrollChatToBottom();
      postCompleteSyncInFlightRef.current = true;
      try {
        await syncChatMessagesFromServer(undefined, true, {
          preserveLocalMessages: shouldPreserveLocalCompletionMessages
        });
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
      await maybeStartNextQueuedRequest();
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
      const assistantId = assistantMessageIdRef.current;
      const reviewerId = reviewerMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;
      const errorMessage = error || 'Failed to generate code.';

      // If phase 1 failed (reviewer exists but no assistant yet), show error on reviewer bubble
      const errorTargetId = assistantId || reviewerId;
      const nextMessages = errorTargetId
        ? currentMessages.map((entry) =>
            entry.id === errorTargetId
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
      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      reviewerMessageIdRef.current = null;
      activeReasoningEffortRef.current = null;
      generatingRef.current = false;
      reviewingRef.current = false;
      setGenerating(false);
      setReviewing(false);
      setReviewPhase(null);
      setGeneratingStatus(null);
      setReviewerStatusSteps([]);
      setAssistantStatusSteps([]);
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
            reviewerMessageIdRef.current = null;
            activeReasoningEffortRef.current = null;
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
            reviewerMessageIdRef.current = null;
            activeReasoningEffortRef.current = null;
          }
        }
        generatingRef.current = false;
        reviewingRef.current = false;
        setGenerating(false);
        setReviewing(false);
        setReviewPhase(null);
        setGeneratingStatus(null);
        setReviewerStatusSteps([]);
        setAssistantStatusSteps([]);
        scrollChatToBottom();
        if (shouldStartQueuedRequest) {
          await maybeStartNextQueuedRequest();
        }
        return;
      }
      resetDedupedProcessingReconcileState();
      const assistantId = assistantMessageIdRef.current;
      const reviewerId = reviewerMessageIdRef.current;
      const userId = userMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;

      const activeIdSet = new Set(
        [userId, assistantId, reviewerId].filter(
          (id): id is number => typeof id === 'number' && id > 0
        )
      );
      const nextMessages = currentMessages.filter(
        (entry) => !activeIdSet.has(entry.id)
      );

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      reviewerMessageIdRef.current = null;
      activeReasoningEffortRef.current = null;
      generatingRef.current = false;
      reviewingRef.current = false;
      setGenerating(false);
      setReviewing(false);
      setReviewPhase(null);
      setGeneratingStatus(null);
      setReviewerStatusSteps([]);
      setAssistantStatusSteps([]);
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

    function handleReviewUpdate({
      requestId,
      reviewText
    }: {
      requestId?: string;
      reviewText?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      const reviewerId = reviewerMessageIdRef.current;
      if (!reviewerId) return;
      const currentMessages = chatMessagesRef.current;
      const nextMessages = currentMessages.map((message) =>
        message.id === reviewerId
          ? { ...message, content: reviewText || '' }
          : message
      );
      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      maybeAutoScrollDuringStream();
    }

    function handleReviewComplete({
      requestId,
      reviewText
    }: {
      requestId?: string;
      reviewText?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      const reviewerId = reviewerMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;

      let nextMessages = currentMessages;
      if (reviewerId) {
        nextMessages = currentMessages.map((entry) =>
          entry.id === reviewerId
            ? { ...entry, content: reviewText || entry.content }
            : entry
        );
      }

      // Add placeholder assistant message for phase 2
      const assistantId = Date.now() + 2;
      assistantMessageIdRef.current = assistantId;
      nextMessages = [
        ...nextMessages,
        {
          id: assistantId,
          role: 'assistant' as const,
          content: '',
          codeGenerated: null,
          streamCodePreview: null,
          createdAt: Math.floor(Date.now() / 1000),
          persisted: false
        }
      ];

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      setReviewPhase('fixing');
      scrollChatToBottom();
    }

    function handleReviewStatus({
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
        setReviewerStatusSteps((prev) =>
          prev[prev.length - 1] === status ? prev : [...prev, status]
        );
      }
      maybeAutoScrollDuringStream();
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
        estimatedCostUsd?: number | null;
      };
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      const stage = usage?.stage?.trim();
      const model = usage?.model?.trim();
      if (!stage || !model) return;
      const inputTokens = Number(usage?.inputTokens || 0);
      const outputTokens = Number(usage?.outputTokens || 0);
      const totalTokens = Number(usage?.totalTokens || 0);
      const estimatedCostUsd =
        typeof usage?.estimatedCostUsd === 'number' &&
        Number.isFinite(usage.estimatedCostUsd)
          ? usage.estimatedCostUsd
          : null;

      setUsageMetrics((prev) => {
        const existing = prev[stage];
        const nextEstimatedCostUsd =
          existing?.estimatedCostUsd != null && estimatedCostUsd != null
            ? Number((existing.estimatedCostUsd + estimatedCostUsd).toFixed(6))
            : (existing?.estimatedCostUsd ?? estimatedCostUsd);

        return {
          ...prev,
          [stage]: {
            stage,
            model,
            inputTokens: (existing?.inputTokens || 0) + inputTokens,
            outputTokens: (existing?.outputTokens || 0) + outputTokens,
            totalTokens: (existing?.totalTokens || 0) + totalTokens,
            estimatedCostUsd: nextEstimatedCostUsd
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
          estimatedCostUsd?: number | null;
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
    }

    socket.on('build_generate_update', handleGenerateUpdate);
    socket.on('build_generate_complete', handleGenerateComplete);
    socket.on('build_generate_error', handleGenerateError);
    socket.on('build_generate_stopped', handleGenerateStopped);
    socket.on('build_generate_status', handleGenerateStatus);
    socket.on('build_review_update', handleReviewUpdate);
    socket.on('build_review_complete', handleReviewComplete);
    socket.on('build_review_status', handleReviewStatus);
    socket.on('build_usage_update', handleUsageUpdate);
    socket.on('build_run_event', handleRunEvent);

    return () => {
      socket.off('build_generate_update', handleGenerateUpdate);
      socket.off('build_generate_complete', handleGenerateComplete);
      socket.off('build_generate_error', handleGenerateError);
      socket.off('build_generate_stopped', handleGenerateStopped);
      socket.off('build_generate_status', handleGenerateStatus);
      socket.off('build_review_update', handleReviewUpdate);
      socket.off('build_review_complete', handleReviewComplete);
      socket.off('build_review_status', handleReviewStatus);
      socket.off('build_usage_update', handleUsageUpdate);
      socket.off('build_run_event', handleRunEvent);
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
    runType: 'copilot' | 'review';
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
      reviewingRef.current ||
      postCompleteSyncInFlightRef.current
    );
  }

  function enqueueBuildRequest(
    messageText: string,
    mode: BuildQueueMode,
    reasoningEffort: BuildCodexReasoningEffort
  ) {
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
      (entry) =>
        normalizeQueuedMessage(entry.message) === normalized &&
        entry.reasoningEffort === reasoningEffort
    );

    if (mode === 'collect') {
      if (
        (normalized === activeMessage &&
          activeReasoningEffortRef.current === reasoningEffort) ||
        duplicateIndex >= 0
      ) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'queued',
          message: 'Collected duplicate request (coalesced).'
        });
        return;
      }
      updateQueuedRequests([
        ...existing,
        {
          id: `${Date.now()}-${existing.length}`,
          message: trimmed,
          mode,
          reasoningEffort,
          createdAt: Date.now()
        }
      ]);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Collected request to run after current task.'
      });
      return;
    }

    if (mode === 'followup') {
      if (duplicateIndex >= 0) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'queued',
          message: 'Follow-up request already queued (coalesced).'
        });
        return;
      }
      updateQueuedRequests([
        ...existing,
        {
          id: `${Date.now()}-${existing.length}`,
          message: trimmed,
          mode,
          reasoningEffort,
          createdAt: Date.now()
        }
      ]);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Follow-up request queued.'
      });
      return;
    }

    const withoutDuplicate = existing.filter(
      (entry) => normalizeQueuedMessage(entry.message) !== normalized
    );
    const next = [
      {
        id: `${Date.now()}-steer`,
        message: trimmed,
        mode,
        reasoningEffort,
        createdAt: Date.now()
      },
      ...withoutDuplicate
    ];
    updateQueuedRequests(next);
    appendLocalRunEvent({
      kind: 'action',
      phase: 'stopping',
      message: 'Steering to latest request (current run will stop).'
    });
    if (generatingRef.current || reviewingRef.current) {
      handleStopGeneration();
    }
  }

  async function maybeStartNextQueuedRequest() {
    if (isRunActivityInFlight()) {
      return;
    }
    const [nextRequest, ...rest] = queuedRequestsRef.current;
    if (!nextRequest) return;
    updateQueuedRequests(rest);
    appendLocalRunEvent({
      kind: 'status',
      phase: 'queued',
      message: `Starting queued request (${nextRequest.mode}, ${nextRequest.reasoningEffort}).`
    });
    const started = await startGeneration(
      nextRequest.message,
      nextRequest.mode,
      nextRequest.reasoningEffort
    );
    if (!started) {
      queuePausedForSaveRef.current = true;
      updateQueuedRequests([nextRequest, ...queuedRequestsRef.current]);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Queued request paused until pending file changes are saved.'
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

  async function handleSendMessage() {
    if (!inputMessage.trim() || !isOwner) return;
    const messageText = inputMessage.trim();
    setInputMessage('');

    if (isRunActivityInFlight()) {
      enqueueBuildRequest(messageText, queueMode, selectedReasoningEffort);
      return;
    }

    const started = await startGeneration(
      messageText,
      queueMode,
      selectedReasoningEffort
    );
    if (!started) {
      if (isRunActivityInFlight()) {
        enqueueBuildRequest(messageText, queueMode, selectedReasoningEffort);
        return;
      }
      setInputMessage(messageText);
    }
  }

  async function handleReview() {
    if (!isOwner || isRunActivityInFlight()) return;
    const projectFilesReady = await ensureProjectFilesPersistedBeforeRun({
      runType: 'review'
    });
    if (!projectFilesReady) return;
    if (isRunActivityInFlight()) return;
    const activeBuild = buildRef.current;
    if (!activeBuild?.code) return;
    resetDedupedProcessingReconcileState();
    const reasoningEffort = selectedReasoningEffortRef.current;

    const now = Math.floor(Date.now() / 1000);
    const messageId = Date.now();
    const requestId = `${activeBuild.id}-review-${messageId}`;
    generatingRef.current = true;
    reviewingRef.current = true;
    setGenerating(true);
    setReviewing(true);
    setReviewPhase('reviewing');
    setReviewerStatusSteps([]);
    setAssistantStatusSteps([]);
    setUsageMetrics({});
    setRunEvents([]);
    streamRequestIdRef.current = requestId;
    userMessageIdRef.current = null;
    activeReasoningEffortRef.current = reasoningEffort;

    const reviewerMessage: ChatMessage = {
      id: messageId,
      role: 'reviewer',
      content: '',
      codeGenerated: null,
      streamCodePreview: null,
      createdAt: now,
      persisted: false
    };
    reviewerMessageIdRef.current = reviewerMessage.id;

    const messagesWithReviewer = [...chatMessagesRef.current, reviewerMessage];
    chatMessagesRef.current = messagesWithReviewer;
    updateChatMessagesRef.current(messagesWithReviewer);

    shouldAutoScrollRef.current = true;
    scrollChatToBottom();

    socket.emit('build_review', {
      buildId: activeBuild.id,
      requestId,
      reasoningEffort
    });
  }

  function handleStopGeneration() {
    const requestId = streamRequestIdRef.current;
    if (
      !requestId ||
      (!generatingRef.current && !reviewingRef.current) ||
      !isOwner
    ) {
      return;
    }
    setGeneratingStatus('Stopping...');
    setAssistantStatusSteps((prev) =>
      prev[prev.length - 1] === 'Stopping...' ? prev : [...prev, 'Stopping...']
    );
    setReviewerStatusSteps((prev) =>
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
    if (message.role === 'reviewer') {
      removeLocalMessageByIds([message.id]);
      return;
    }

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
    restoredCode?: string | null
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
        }))
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
          status: result.build.status,
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
          status: result.build.status,
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
          <Link to="/build" className={badgeClass} title="Back to Build menu">
            <Icon icon="rocket-launch" />
            Build Studio
          </Link>
          <h2 className={headerTitleClass}>{build.title}</h2>
          {build.description ? (
            <span
              className={css`
                font-size: 1.05rem;
                color: var(--chat-text);
                opacity: 0.75;
              `}
            >
              {build.description}
            </span>
          ) : (
            <span
              className={css`
                font-size: 0.95rem;
                color: var(--chat-text);
                opacity: 0.6;
              `}
            >
              {isOwner
                ? 'Your AI-powered build workspace'
                : `by ${build.username}`}
            </span>
          )}
        </div>
        <div className={headerActionsClass}>
          <span
            className={statusBadgeClass}
            style={getBuildStatusBadgeStyle(build.status)}
          >
            {build.status}
          </span>
          <span
            className={statusBadgeClass}
            style={getVisibilityBadgeStyle(build.isPublic)}
          >
            {build.isPublic ? 'public' : 'private'}
          </span>
          {isOwner && build.code && !generating && !reviewing && (
            <GameCTAButton
              onClick={handleReview}
              variant="orange"
              size="md"
              icon="magnifying-glass"
            >
              Review
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
          {!isOwner && userId && build.isPublic && (
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

      <div
        className={build.isPublic ? panelShellWithSocialClass : panelShellClass}
      >
        <div
          className={isOwner ? workspaceWithChatClass : workspaceNoChatClass}
        >
          {isOwner && (
            <ChatPanel
              messages={chatMessages}
              inputMessage={inputMessage}
              generating={generating || reviewing}
              generatingStatus={generatingStatus}
              reviewerStatusSteps={reviewerStatusSteps}
              assistantStatusSteps={assistantStatusSteps}
              usageMetrics={usageMetrics}
              copilotPolicy={copilotPolicy}
              projectFileChangeLogs={projectFileChangeLogs}
              projectFilePromptContextPreview={projectFilePromptContextPreview}
              projectFileChangeLogsLoading={projectFileChangeLogsLoading}
              projectFileChangeLogsError={projectFileChangeLogsError}
              projectFileChangeLogsLoadedAt={projectFileChangeLogsLoadedAt}
              runEvents={runEvents}
              queueMode={queueMode}
              selectedReasoningEffort={selectedReasoningEffort}
              reasoningEffortOptions={reasoningEffortOptions}
              queuedCount={queuedRequests.length}
              activeStreamMessageIds={getActiveStreamMessageIds()}
              isOwner={isOwner}
              chatScrollRef={chatScrollRef}
              chatEndRef={chatEndRef}
              onChatScroll={handleChatScroll}
              onInputChange={setInputMessage}
              onQueueModeChange={setQueueMode}
              onReasoningEffortChange={setSelectedReasoningEffort}
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              onReloadProjectFileChangeLogs={handleReloadProjectFileChangeLogs}
              onDeleteMessage={handleDeleteMessage}
            />
          )}
          <PreviewPanel
            build={build}
            code={build.code}
            projectFiles={build.projectFiles || []}
            isOwner={isOwner}
            onReplaceCode={handleReplaceCode}
            onApplyRestoredProjectFiles={handleApplyRestoredProjectFiles}
            onSaveProjectFiles={(files) =>
              handleSaveProjectFiles(files, { resumePausedQueue: true })
            }
            onEditableProjectFilesStateChange={
              handleProjectFilesDraftStateChange
            }
          />
        </div>
        {!!build.isPublic && (
          <SocialPanel
            buildId={build.id}
            buildTitle={build.title}
            ownerId={build.userId}
            isOwner={isOwner}
          />
        )}
      </div>
    </div>
  );

  function scrollChatToBottom(behavior: ScrollBehavior = 'smooth') {
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

  async function startGeneration(
    messageText: string,
    mode: BuildQueueMode = 'followup',
    reasoningEffort?: BuildCodexReasoningEffort
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
      const resolvedReasoningEffort =
        reasoningEffort &&
        reasoningEffortOptionsRef.current.includes(reasoningEffort)
          ? reasoningEffort
          : selectedReasoningEffortRef.current;
      generatingRef.current = true;
      reviewingRef.current = false;
      activeReasoningEffortRef.current = resolvedReasoningEffort;
      setGenerating(true);
      setReviewerStatusSteps([]);
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
      scrollChatToBottom();

      socket.emit('build_generate', {
        buildId: activeBuild.id,
        message: messageText,
        requestId,
        mode,
        reasoningEffort: resolvedReasoningEffort
      });
      return true;
    } finally {
      startingGenerationRef.current = false;
    }
  }

  async function markBuildMissionPromptCompleted() {
    if (!isOwner || !userId) return;
    const current = missionProgressRef.current || {};
    if (current.copilotPromptCompleted) return;
    const nextState = { copilotPromptCompleted: true };
    missionProgressRef.current = { ...current, ...nextState };
    onUpdateUserMissionStateRef.current({
      missionType: 'build',
      newState: nextState
    });
    try {
      await updateMissionStatusRef.current({
        missionType: 'build',
        newStatus: nextState
      });
    } catch {
      return;
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
    return [
      userMessageIdRef.current,
      assistantMessageIdRef.current,
      reviewerMessageIdRef.current
    ].filter((id): id is number => typeof id === 'number' && id > 0);
  }

  function isMessageLockedForActiveRequest(message: ChatMessage) {
    if (!generating && !reviewing) return false;
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
    if (
      reviewerMessageIdRef.current &&
      !messageIds.has(reviewerMessageIdRef.current)
    ) {
      reviewerMessageIdRef.current = null;
    }
    scrollChatToBottom();

    const hasActiveStreamPlaceholders = Boolean(
      userMessageIdRef.current ||
      assistantMessageIdRef.current ||
      reviewerMessageIdRef.current
    );
    if (!hasActiveStreamPlaceholders) {
      if (streamRequestIdRef.current === requestId) {
        streamRequestIdRef.current = null;
        activeReasoningEffortRef.current = null;
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
      reviewerMessageIdRef.current = null;
      activeReasoningEffortRef.current = null;
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

function getBuildStatusBadgeStyle(status: string): React.CSSProperties {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'draft') {
    return {
      background: 'rgba(255, 154, 0, 0.16)',
      borderColor: 'rgba(255, 154, 0, 0.36)',
      color: '#b45309'
    };
  }
  if (normalized === 'published') {
    return {
      background: 'rgba(34, 197, 94, 0.16)',
      borderColor: 'rgba(34, 197, 94, 0.36)',
      color: '#166534'
    };
  }
  return {
    background: 'rgba(65, 140, 235, 0.14)',
    borderColor: 'rgba(65, 140, 235, 0.34)',
    color: '#1d4ed8'
  };
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
