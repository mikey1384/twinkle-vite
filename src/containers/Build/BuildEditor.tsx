import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import type {
  PreviewPanelHandle,
  PreviewRuntimeUploadsSyncPayload
} from './PreviewPanel/types';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import BuildDescriptionModal from './BuildDescriptionModal';
import BuildThumbnailModal from './BuildThumbnailModal';
import type { BuildCapabilitySnapshot } from './capabilityTypes';
import type {
  BuildLiveRunEvent,
  BuildLiveRunMessage,
  BuildLiveRunState
} from '~/contexts/Build/reducer';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from './runtimeObservationTypes';
import {
  useAppContext,
  useBuildContext,
  useKeyContext,
  useViewContext
} from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, DEFAULT_PROFILE_THEME } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ScopedTheme from '~/theme/ScopedTheme';
import { socket } from '~/constants/sockets/api';
import UploadModal from '~/components/Modals/UploadModal';
import UploadFileModal from '~/containers/Chat/Modals/UploadFileModal';
import { generateFileName } from '~/helpers/stringHelpers';
import { returnImageFileFromUrl } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const buildForkUiEnabled = false;
const EMPTY_BUILD_PROJECT_FILES: Array<{ path: string; content?: string }> = [];

type BuildChatUploadRoute =
  | 'project_files_import'
  | 'runtime_asset_upload'
  | 'chat_reference'
  | 'clarify';

interface BuildChatUploadDecision {
  route?: BuildChatUploadRoute;
  confidence?: 'low' | 'medium' | 'high';
  reason?: string;
  clarificationQuestion?: string | null;
}

interface PendingBuildChatUploadClarification {
  files: File[];
  messageText: string;
  intentPersisted: boolean;
}

interface BuildChatFileSelectionResult {
  handled: boolean;
}

const pageClass = css`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  overflow: hidden;
  background: var(--page-bg);
  @media (max-width: ${mobileMaxWidth}) {
    height: calc(100% - var(--mobile-nav-total-height, 7rem));
  }
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

const headerTitleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const headerTitleEditButtonClass = css`
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  opacity: 0.78;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
  &:hover {
    opacity: 1;
    transform: translateY(-1px);
    border-color: var(--ui-border-strong);
    background: #f8faff;
  }
  &:focus-visible {
    outline: 2px solid var(--ui-border-strong);
    outline-offset: 2px;
  }
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
    grid-template-rows: auto 1fr;
    gap: 0.5rem;
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
    grid-template-rows: 1fr;
  }
`;

const mobilePanelHiddenClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const mobileTabBarClass = css`
  display: none;
  @media (max-width: ${mobileMaxWidth}) {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 1rem 0;
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
  followUpPrompt?: BuildFollowUpPrompt | null;
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
  status: 'awaiting_confirmation' | 'running' | 'completed' | 'cancelled';
  summary: string;
  question?: string | null;
  plan: {
    version: 1;
    mode: 'large' | 'too_broad';
    summary: string;
    question?: string | null;
    chunks: BuildExecutionPlanChunk[];
  };
  currentBigChunkId: string | null;
  currentChunkId: string | null;
  createdByUserId: number;
  createdAt: number;
  updatedAt: number;
}

interface BuildFollowUpPrompt {
  question?: string | null;
  suggestedMessage?: string | null;
  sourceMessageId?: number | null;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  streamCodePreview?: string | null;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
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
    maxPublishedBuildStorageBytes: number;
    maxRuntimeFileStorageBytes: number;
    maxRuntimeFileBytes: number;
  };
  usage: {
    currentProjectBytes: number;
    projectBytesRemaining: number;
    projectFileCount: number;
    projectFileBytes: number;
    maxFilesPerProject: number;
    publishedBuildStorageBytes: number;
    publishedBuildStorageRemaining: number;
    publishedBuildCount: number;
    runtimeFileStorageBytes: number;
    runtimeFileStorageRemaining: number;
    runtimeFileCount: number;
  };
  requestLimits: {
    dayIndex: number;
    dayKey: string;
    generationBaseRequestsPerDay: number;
    generationResetPurchasesToday: number;
    generationResetCost: number;
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
  details?: {
    thoughtContent?: string | null;
    isComplete?: boolean;
    isThinkingHard?: boolean;
  } | null;
  usage?: {
    stage?: string | null;
    model?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } | null;
}

type BuildPlanAction = 'continue' | 'cancel';

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

interface BuildRuntimeUploadAsset {
  id: number;
  buildId: number;
  buildTitle: string | null;
  buildSlug: string | null;
  buildIsPublic: boolean;
  fileName: string;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number;
  filePath: string;
  url: string;
  thumbUrl: string | null;
  fileType: 'image' | 'audio' | 'pdf' | 'archive' | 'other';
  uploadedByUserId: number;
  createdAt: number;
}

interface BuildRuntimeUploadUsage {
  totalBytes: number;
  fileCount: number;
  maxRuntimeFileStorageBytes: number;
  remainingBytes: number;
}

interface QueuedBuildRequest {
  id: string;
  message: string;
  planAction?: BuildPlanAction | null;
  messageContext?: string | null;
  existingUserMessageId?: number | null;
  createdAt: number;
}

interface BuildHiddenMessageContextOptions {
  messageText?: string;
  references: Array<{
    fileName: string;
    url: string;
  }>;
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

const BUILD_CHAT_HIDDEN_REFERENCE_CONTEXT_PREFIX =
  '[[[reference_context]]]';

interface ProjectFileSaveResult {
  success: boolean;
  error?: string;
}

interface ProjectFileSaveOptions {
  resumePausedQueue?: boolean;
  targetBuildId?: number | null;
  targetBuildCode?: string | null;
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

function applyRuntimeUploadUsageToCopilotPolicy(
  policy: BuildCopilotPolicy | null,
  usage: BuildRuntimeUploadUsage | null | undefined
) {
  if (!policy || !usage) {
    return policy;
  }
  return {
    ...policy,
    limits: {
      ...policy.limits,
      maxRuntimeFileStorageBytes: Math.max(
        0,
        Math.floor(Number(usage.maxRuntimeFileStorageBytes) || 0)
      )
    },
    usage: {
      ...policy.usage,
      runtimeFileStorageBytes: Math.max(
        0,
        Math.floor(Number(usage.totalBytes) || 0)
      ),
      runtimeFileStorageRemaining: Math.max(
        0,
        Math.floor(Number(usage.remainingBytes) || 0)
      ),
      runtimeFileCount: Math.max(0, Math.floor(Number(usage.fileCount) || 0))
    }
  };
}

function applyRequestLimitsToCopilotPolicy(
  policy: BuildCopilotPolicy | null,
  requestLimits:
    | BuildCopilotPolicy['requestLimits']
    | null
    | undefined
) {
  if (!policy || !requestLimits) {
    return policy;
  }
  return {
    ...policy,
    requestLimits: {
      ...policy.requestLimits,
      ...requestLimits
    }
  };
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

function mergeChatMessagesWithBuildRun({
  persistedMessages,
  buildRun
}: {
  persistedMessages: ChatMessage[];
  buildRun: BuildLiveRunState | null;
}) {
  if (!buildRun) return persistedMessages;
  const nextMessages = [...persistedMessages];
  const liveMessages = [buildRun.userMessage, buildRun.assistantMessage].filter(
    (message): message is BuildLiveRunMessage => Boolean(message)
  );

  for (const liveMessage of liveMessages) {
    const existingIndex = nextMessages.findIndex((message) => {
      if (message.id === liveMessage.id) return true;
      return doChatMessagesRepresentSameBuildMessage(message, liveMessage);
    });
    if (existingIndex >= 0) {
      nextMessages[existingIndex] = {
        ...nextMessages[existingIndex],
        ...liveMessage,
        id: nextMessages[existingIndex].id,
        persisted:
          nextMessages[existingIndex].persisted ||
          liveMessage.persisted ||
          false
      };
      continue;
    }
    nextMessages.push({
      ...liveMessage
    });
  }

  nextMessages.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  return nextMessages;
}

function doChatMessagesRepresentSameBuildMessage(
  persistedMessage: ChatMessage,
  liveMessage: BuildLiveRunMessage
) {
  if (!persistedMessage || !liveMessage) return false;
  if (persistedMessage.role !== liveMessage.role) return false;
  if (
    String(persistedMessage.content || '') !== String(liveMessage.content || '')
  ) {
    return false;
  }
  if (
    String(persistedMessage.codeGenerated || '') !==
    String(liveMessage.codeGenerated || '')
  ) {
    return false;
  }
  if (
    Number(persistedMessage.artifactVersionId || 0) !==
    Number(liveMessage.artifactVersionId || 0)
  ) {
    return false;
  }
  return (
    Math.abs(
      Number(persistedMessage.createdAt || 0) -
        Number(liveMessage.createdAt || 0)
    ) <= 5
  );
}

function chatMessagesEqual(a: ChatMessage[], b: ChatMessage[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.role !== right.role ||
      left.content !== right.content ||
      left.codeGenerated !== right.codeGenerated ||
      left.streamCodePreview !== right.streamCodePreview ||
      left.artifactVersionId !== right.artifactVersionId ||
      left.createdAt !== right.createdAt ||
      Boolean(left.persisted) !== Boolean(right.persisted)
    ) {
      return false;
    }
  }
  return true;
}

function projectFilesEqual(
  a: Array<{ path: string; content?: string }> | undefined,
  b: Array<{ path: string; content?: string }> | undefined
) {
  const left = normalizeProjectFilesForBuild(a || [], '');
  const right = normalizeProjectFilesForBuild(b || [], '');
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (
      left[i].path !== right[i].path ||
      String(left[i].content || '') !== String(right[i].content || '')
    ) {
      return false;
    }
  }
  return true;
}

function serializedComparableValue(value: any) {
  try {
    return JSON.stringify(value ?? null) || 'null';
  } catch {
    return String(value ?? null);
  }
}

function isExecutableBuildExecutionChunkStatus(
  status: BuildExecutionPlanChunk['status']
) {
  return (
    status === 'pending' || status === 'in_progress' || status === 'blocked'
  );
}

function resolveBuildExecutionPlanTarget(
  plan: BuildExecutionPlan | null | undefined
) {
  if (!plan?.plan?.chunks?.length) return null;
  if (plan.plan.mode === 'too_broad') {
    if (plan.currentBigChunkId && plan.currentChunkId) {
      const currentBigChunk = plan.plan.chunks.find(
        (chunk) => chunk.id === plan.currentBigChunkId
      );
      const currentChunk = currentBigChunk?.chunks.find(
        (chunk) => chunk.id === plan.currentChunkId
      );
      if (currentBigChunk && currentChunk) {
        return {
          chunkTitle: currentChunk.title,
          bigChunkTitle: currentBigChunk.title
        };
      }
    }
    for (const bigChunk of plan.plan.chunks) {
      for (const chunk of bigChunk.chunks || []) {
        if (!isExecutableBuildExecutionChunkStatus(chunk.status)) continue;
        return {
          chunkTitle: chunk.title,
          bigChunkTitle: bigChunk.title
        };
      }
    }
    return null;
  }

  if (plan.currentChunkId) {
    const currentChunk = plan.plan.chunks.find(
      (chunk) => chunk.id === plan.currentChunkId
    );
    if (currentChunk) {
      return {
        chunkTitle: currentChunk.title,
        bigChunkTitle: null
      };
    }
  }

  const nextChunk = plan.plan.chunks.find((chunk) =>
    isExecutableBuildExecutionChunkStatus(chunk.status)
  );
  return nextChunk
    ? {
        chunkTitle: nextChunk.title,
        bigChunkTitle: null
      }
    : null;
}

function resolveScopedPlanQuestion(plan: BuildExecutionPlan | null | undefined) {
  const explicitQuestion = String(
    plan?.question || plan?.plan?.question || ''
  ).trim();
  if (explicitQuestion) return explicitQuestion;
  const target = resolveBuildExecutionPlanTarget(plan);
  if (!target) return '';
  return target.bigChunkTitle
    ? `Should Lumine keep going with ${target.chunkTitle} under ${target.bigChunkTitle}?`
    : `Should Lumine keep going with ${target.chunkTitle}?`;
}

function resolveBuildFollowUpPromptKey(
  prompt: BuildFollowUpPrompt | null | undefined
) {
  const sourceMessageId = Number(prompt?.sourceMessageId || 0);
  if (sourceMessageId > 0) {
    return `message:${sourceMessageId}`;
  }
  const question = String(prompt?.question || '').trim();
  const suggestedMessage = String(prompt?.suggestedMessage || '').trim();
  if (!question && !suggestedMessage) {
    return '';
  }
  return `${question}::${suggestedMessage}`;
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
  function formatIssueKindLabel(
    kind: BuildRuntimeObservationState['issues'][number]['kind']
  ) {
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
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const sharedBuildRun = useBuildContext(
    (v) => v.state.buildRuns[String(build.id)] || null
  );
  const onRegisterBuildRun = useBuildContext(
    (v) => v.actions.onRegisterBuildRun
  );
  const onUpdateBuildRunStatus = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStatus
  );
  const onUpdateBuildRunStream = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStream
  );
  const onAppendBuildRunEvent = useBuildContext(
    (v) => v.actions.onAppendBuildRunEvent
  );
  const onUpdateBuildRunUsage = useBuildContext(
    (v) => v.actions.onUpdateBuildRunUsage
  );
  const onCompleteBuildRun = useBuildContext(
    (v) => v.actions.onCompleteBuildRun
  );
  const onFailBuildRun = useBuildContext((v) => v.actions.onFailBuildRun);
  const onStopBuildRun = useBuildContext((v) => v.actions.onStopBuildRun);
  const onClearBuildRun = useBuildContext((v) => v.actions.onClearBuildRun);
  const navigate = useNavigate();
  const { userId, profileTheme, twinkleCoins } = useKeyContext(
    (v) => v.myState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const updateBuildProjectFiles = useAppContext(
    (v) => v.requestHelpers.updateBuildProjectFiles
  );
  const updateBuildMetadata = useAppContext(
    (v) => v.requestHelpers.updateBuildMetadata
  );
  const uploadBuildThumbnail = useAppContext(
    (v) => v.requestHelpers.uploadBuildThumbnail
  );
  const loadBuildProjectFileChangeLogs = useAppContext(
    (v) => v.requestHelpers.loadBuildProjectFileChangeLogs
  );
  const loadBuild = useAppContext((v) => v.requestHelpers.loadBuild);
  const loadBuildRuntimeUploads = useAppContext(
    (v) => v.requestHelpers.loadBuildRuntimeUploads
  );
  const deleteBuildRuntimeUpload = useAppContext(
    (v) => v.requestHelpers.deleteBuildRuntimeUpload
  );
  const deleteBuildChatMessage = useAppContext(
    (v) => v.requestHelpers.deleteBuildChatMessage
  );
  const routeBuildChatUpload = useAppContext(
    (v) => v.requestHelpers.routeBuildChatUpload
  );
  const createBuildChatAssistantNote = useAppContext(
    (v) => v.requestHelpers.createBuildChatAssistantNote
  );
  const createBuildChatUserNote = useAppContext(
    (v) => v.requestHelpers.createBuildChatUserNote
  );
  const createBuildChatReferenceNote = useAppContext(
    (v) => v.requestHelpers.createBuildChatReferenceNote
  );
  const cleanupBuildChatReferenceUploads = useAppContext(
    (v) => v.requestHelpers.cleanupBuildChatReferenceUploads
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const publishBuild = useAppContext((v) => v.requestHelpers.publishBuild);
  const unpublishBuild = useAppContext((v) => v.requestHelpers.unpublishBuild);
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);
  const purchaseBuildGenerationReset = useAppContext(
    (v) => v.requestHelpers.purchaseBuildGenerationReset
  );

  const [mobilePanelTab, setMobilePanelTab] = useState<'chat' | 'preview'>(
    'chat'
  );
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);
  const [assistantStatusSteps, setAssistantStatusSteps] = useState<string[]>(
    []
  );
  const [publishing, setPublishing] = useState(false);
  const [forking, setForking] = useState(false);
  const [descriptionModalShown, setDescriptionModalShown] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [thumbnailModalShown, setThumbnailModalShown] = useState(false);
  const [savingThumbnail, setSavingThumbnail] = useState(false);
  const [thumbnailSaveError, setThumbnailSaveError] = useState('');
  const [usageMetrics, setUsageMetrics] = useState<
    Record<string, BuildUsageMetric>
  >({});
  const [runEvents, setRunEvents] = useState<BuildRunEvent[]>([]);
  const [streamingProjectFiles, setStreamingProjectFiles] = useState<Array<{
    path: string;
    content?: string;
  }> | null>(null);
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
  const [runtimeUploadsModalShown, setRuntimeUploadsModalShown] =
    useState(false);
  const [runtimeUploadAssets, setRuntimeUploadAssets] = useState<
    BuildRuntimeUploadAsset[]
  >([]);
  const [currentBuildRuntimeAssets, setCurrentBuildRuntimeAssets] = useState<
    BuildRuntimeUploadAsset[]
  >([]);
  const [runtimeUploadsNextCursor, setRuntimeUploadsNextCursor] = useState<
    number | null
  >(null);
  const [runtimeUploadsLoading, setRuntimeUploadsLoading] = useState(false);
  const [runtimeUploadsLoadingMore, setRuntimeUploadsLoadingMore] =
    useState(false);
  const [runtimeUploadsError, setRuntimeUploadsError] = useState('');
  const [runtimeUploadDeletingId, setRuntimeUploadDeletingId] = useState<
    number | null
  >(null);
  const [purchasingGenerationReset, setPurchasingGenerationReset] =
    useState(false);
  const [generationResetError, setGenerationResetError] = useState('');
  const [buildChatDraftMessage, setBuildChatDraftMessage] = useState('');
  const [buildChatUploadModalShown, setBuildChatUploadModalShown] =
    useState(false);
  const [buildChatUploadFileObj, setBuildChatUploadFileObj] = useState<
    File | File[] | null
  >(null);
  const [buildChatUploadInFlight, setBuildChatUploadInFlight] = useState(false);
  const [dismissedFollowUpPromptKey, setDismissedFollowUpPromptKey] =
    useState('');
  const [buildSocketListenersReady, setBuildSocketListenersReady] =
    useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<PreviewPanelHandle | null>(null);
  const chatMessagesRef = useRef(chatMessages);
  const buildRef = useRef(build);
  const copilotPolicyRef = useRef(copilotPolicy);
  const updateBuildRef = useRef(onUpdateBuild);
  const updateChatMessagesRef = useRef(onUpdateChatMessages);
  const updateCopilotPolicyRef = useRef(onUpdateCopilotPolicy);
  const streamRequestIdRef = useRef<string | null>(null);
  const buildSocketListenersReadyRef = useRef(false);
  const userMessageIdRef = useRef<number | null>(null);
  const assistantMessageIdRef = useRef<number | null>(null);
  const activeRunMessageContextRef = useRef<string | null>(null);
  const streamingProjectFilesBaseRef = useRef<
    Array<{ path: string; content?: string }>
  >([]);
  const streamingProjectFilesRef = useRef<Array<{
    path: string;
    content?: string;
  }> | null>(null);
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
  const shouldHydrateSharedRunRef = useRef(true);
  const pendingBuildChatUploadClarificationRef =
    useRef<PendingBuildChatUploadClarification[]>([]);
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
  const activeRuntimeAutoFixContextRef = useRef<RuntimeAutoFixContext | null>(
    null
  );
  const runtimeAutoFixAttemptedSignaturesRef = useRef<Set<string>>(new Set());
  const activeRunModeRef = useRef<BuildRunMode>('user');
  const sharedRunReplicaCheckKeyRef = useRef('');
  const lastResumeAttemptAtRef = useRef(0);
  const RUNTIME_AUTOFIX_ENABLED = false;
  const RUNTIME_AUTO_FIX_WINDOW_MS = 12000;
  const RUNTIME_POST_FIX_VERIFICATION_WINDOW_MS = 18000;
  const mergedChatMessages = mergeChatMessagesWithBuildRun({
    persistedMessages: chatMessages,
    buildRun: sharedBuildRun
  });
  const renderRun = sharedBuildRun?.generating ? sharedBuildRun : null;
  const displayedGenerating = renderRun ? true : generating;
  const displayedGeneratingStatus = renderRun
    ? renderRun.status
    : generatingStatus;
  const displayedAssistantStatusSteps = renderRun
    ? renderRun.assistantStatusSteps
    : assistantStatusSteps;
  const displayedUsageMetrics = renderRun ? renderRun.usageMetrics : usageMetrics;
  const displayedRunEvents = renderRun ? renderRun.runEvents : runEvents;
  const displayedExecutionPlan =
    renderRun &&
    Object.prototype.hasOwnProperty.call(renderRun, 'executionPlan')
      ? renderRun.executionPlan ?? build.executionPlan ?? null
      : build.executionPlan || null;
  const baseDisplayedFollowUpPrompt =
    renderRun &&
    Object.prototype.hasOwnProperty.call(renderRun, 'followUpPrompt')
      ? renderRun.followUpPrompt ?? build.followUpPrompt ?? null
      : build.followUpPrompt || null;
  const displayedFollowUpPrompt =
    resolveBuildFollowUpPromptKey(baseDisplayedFollowUpPrompt) &&
    resolveBuildFollowUpPromptKey(baseDisplayedFollowUpPrompt) ===
      dismissedFollowUpPromptKey
      ? null
      : baseDisplayedFollowUpPrompt;
  const displayedActiveStreamMessageIds = renderRun
    ? [renderRun.userMessage?.id, renderRun.assistantMessage?.id].filter(
        (id): id is number => typeof id === 'number' && id > 0
      )
    : getActiveStreamMessageIds();

  useEffect(() => {
    if (!chatMessagesEqual(chatMessagesRef.current, mergedChatMessages)) {
      chatMessagesRef.current = mergedChatMessages;
    }
  }, [mergedChatMessages]);

  useEffect(() => {
    setBuildChatDraftMessage('');
    setBuildChatUploadModalShown(false);
    setBuildChatUploadFileObj(null);
    setBuildChatUploadInFlight(false);
    setDismissedFollowUpPromptKey('');
    pendingBuildChatUploadClarificationRef.current = [];
  }, [build.id]);

  useEffect(() => {
    streamingProjectFilesRef.current = streamingProjectFiles;
  }, [streamingProjectFiles]);

  useEffect(() => {
    if (streamingProjectFiles && streamingProjectFiles.length > 0) {
      setMobilePanelTab('preview');
    }
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
    didInitialChatScrollRef.current = false;
    didAutoPromptRef.current = false;
    didAutoGreetingRef.current = false;
    buildSocketListenersReadyRef.current = false;
    setBuildSocketListenersReady(false);
    shouldAutoScrollRef.current = true;
    setUsageMetrics({});
    setRunEvents([]);
    setProjectFileChangeLogs([]);
    setProjectFilePromptContextPreview('');
    setProjectFileChangeLogsLoading(false);
    setProjectFileChangeLogsError('');
    setProjectFileChangeLogsLoadedAt(null);
    queuedRequestsRef.current = [];
    setDescriptionModalShown(false);
    setThumbnailModalShown(false);
    setSavingThumbnail(false);
    setThumbnailSaveError('');
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
    shouldHydrateSharedRunRef.current = true;
    sharedRunReplicaCheckKeyRef.current = '';
    lastResumeAttemptAtRef.current = 0;
  }, [build.id]);

  useEffect(() => {
    if (!sharedBuildRun) return;
    if (!shouldHydrateSharedRunRef.current) return;
    if (streamRequestIdRef.current === sharedBuildRun.requestId) {
      shouldHydrateSharedRunRef.current = false;
      return;
    }

    const normalizedBaseProjectFiles = Array.isArray(
      sharedBuildRun.baseProjectFiles
    )
      ? sharedBuildRun.baseProjectFiles.map((file: any) => ({
          path: normalizeProjectFilePath(file.path),
          content: typeof file.content === 'string' ? file.content : ''
        }))
      : [];

    if (sharedBuildRun.generating) {
      generatingRef.current = true;
      setGenerating(true);
      setGeneratingStatus(sharedBuildRun.status);
      setAssistantStatusSteps(sharedBuildRun.assistantStatusSteps);
      setUsageMetrics(sharedBuildRun.usageMetrics);
      setRunEvents(sharedBuildRun.runEvents);
      streamingProjectFilesBaseRef.current = normalizedBaseProjectFiles;
      setStreamingProjectFiles(sharedBuildRun.streamingProjectFiles);
      setStreamingFocusFilePath(sharedBuildRun.streamingFocusFilePath);
      streamRequestIdRef.current = sharedBuildRun.requestId;
      userMessageIdRef.current = sharedBuildRun.userMessage?.id || null;
      assistantMessageIdRef.current =
        sharedBuildRun.assistantMessage?.id || null;
      activeRunMessageContextRef.current = null;
      activeRunModeRef.current = sharedBuildRun.runMode;
      shouldHydrateSharedRunRef.current = false;
      return;
    }

    if (normalizedBaseProjectFiles.length > 0) {
      const currentBuild = buildRef.current;
      if (currentBuild) {
        const nextProjectFiles = normalizeProjectFilesForBuild(
          normalizedBaseProjectFiles,
          sharedBuildRun.assistantMessage?.codeGenerated ??
            currentBuild.code ??
            ''
        );
        const nextCode = resolveIndexHtmlFromProjectFiles(
          nextProjectFiles,
          sharedBuildRun.assistantMessage?.codeGenerated ??
            currentBuild.code ??
            ''
        );
        const nextArtifactVersionId =
          sharedBuildRun.assistantMessage?.artifactVersionId ??
          currentBuild.currentArtifactVersionId ??
          null;
        if (
          !projectFilesEqual(currentBuild.projectFiles, nextProjectFiles) ||
          String(currentBuild.code || '') !== String(nextCode || '') ||
          Number(currentBuild.currentArtifactVersionId || 0) !==
            Number(nextArtifactVersionId || 0)
        ) {
          const nextBuild = {
            ...currentBuild,
            code: nextCode,
            currentArtifactVersionId: nextArtifactVersionId,
            projectManifest: {
              entryPath: resolveIndexEntryPathFromProjectFiles(
                nextProjectFiles,
                currentBuild.projectManifest?.entryPath || '/index.html'
              ),
              storageMode: 'project-files',
              fileCount: nextProjectFiles.length
            },
            projectFiles: nextProjectFiles
          };
          buildRef.current = nextBuild;
          updateBuildRef.current(nextBuild);
        }
      }
    }
    if (
      Object.prototype.hasOwnProperty.call(sharedBuildRun, 'executionPlan') &&
      buildRef.current &&
      buildRef.current.executionPlan !== sharedBuildRun.executionPlan
    ) {
      const nextBuild = {
        ...buildRef.current,
        executionPlan: sharedBuildRun.executionPlan ?? null,
        followUpPrompt:
          Object.prototype.hasOwnProperty.call(sharedBuildRun, 'followUpPrompt')
            ? sharedBuildRun.followUpPrompt ?? null
            : buildRef.current.followUpPrompt ?? null
      };
      buildRef.current = nextBuild;
      updateBuildRef.current(nextBuild);
    } else if (
      Object.prototype.hasOwnProperty.call(sharedBuildRun, 'followUpPrompt') &&
      buildRef.current &&
      buildRef.current.followUpPrompt !==
        (sharedBuildRun.followUpPrompt ?? null)
    ) {
      const nextBuild = {
        ...buildRef.current,
        followUpPrompt: sharedBuildRun.followUpPrompt ?? null
      };
      buildRef.current = nextBuild;
      updateBuildRef.current(nextBuild);
    }
    if (
      Object.prototype.hasOwnProperty.call(
        sharedBuildRun,
        'runtimeExplorationPlan'
      )
    ) {
      setRuntimeExplorationPlan(sharedBuildRun.runtimeExplorationPlan ?? null);
    }
    shouldHydrateSharedRunRef.current = false;
  }, [sharedBuildRun]);

  useEffect(() => {
    if (!sharedBuildRun || sharedBuildRun.generating) return;
    const liveMessages = [
      sharedBuildRun.userMessage,
      sharedBuildRun.assistantMessage
    ].filter((message): message is BuildLiveRunMessage => Boolean(message));
    if (
      liveMessages.some(
        (liveMessage) =>
          !chatMessages.some(
            (message) =>
              message.id === liveMessage.id ||
              doChatMessagesRepresentSameBuildMessage(message, liveMessage)
          )
      )
    ) {
      return;
    }
    const sharedRunKey = `${build.id}:${sharedBuildRun.updatedAt}`;
    if (sharedRunReplicaCheckKeyRef.current === sharedRunKey) {
      return;
    }
    sharedRunReplicaCheckKeyRef.current = sharedRunKey;
    let cancelled = false;

    async function maybeClearSharedBuildRun() {
      const shouldVerifyReplica =
        sharedBuildRun.baseProjectFiles.length > 0 ||
        Object.prototype.hasOwnProperty.call(sharedBuildRun, 'executionPlan') ||
        Number(sharedBuildRun.assistantMessage?.artifactVersionId || 0) > 0;

      if (shouldVerifyReplica) {
        const buildPayload = await loadBuild(build.id);
        if (cancelled) return;
        if (!buildPayload?.build) {
          sharedRunReplicaCheckKeyRef.current = '';
          return;
        }
        const replicaProjectFiles = normalizeProjectFilesForBuild(
          Array.isArray(buildPayload.projectFiles)
            ? buildPayload.projectFiles
            : [],
          buildPayload.build.code || ''
        );
        const expectedProjectFiles = normalizeProjectFilesForBuild(
          sharedBuildRun.baseProjectFiles || [],
          sharedBuildRun.assistantMessage?.codeGenerated ??
            buildPayload.build.code ??
            ''
        );
        const hasExpectedProjectFiles = expectedProjectFiles.length > 0;
        const replicaArtifactVersionId =
          Number(buildPayload.build.currentArtifactVersionId || 0) || null;
        const expectedArtifactVersionId =
          Number(sharedBuildRun.assistantMessage?.artifactVersionId || 0) ||
          null;
        const hasExpectedExecutionPlan = Object.prototype.hasOwnProperty.call(
          sharedBuildRun,
          'executionPlan'
        );
        const replicaExecutionPlan = buildPayload.executionPlan || null;

        if (
          (hasExpectedProjectFiles &&
            !projectFilesEqual(replicaProjectFiles, expectedProjectFiles)) ||
          (expectedArtifactVersionId !== null &&
            replicaArtifactVersionId !== expectedArtifactVersionId) ||
          (hasExpectedExecutionPlan &&
            serializedComparableValue(replicaExecutionPlan) !==
              serializedComparableValue(sharedBuildRun.executionPlan ?? null))
        ) {
          sharedRunReplicaCheckKeyRef.current = '';
          return;
        }
      }

      onClearBuildRun(build.id);
    }

    void maybeClearSharedBuildRun();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, chatMessages, sharedBuildRun]);

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
    setRuntimeUploadsModalShown(false);
    setRuntimeUploadAssets([]);
    setCurrentBuildRuntimeAssets([]);
    setRuntimeUploadsNextCursor(null);
    setRuntimeUploadsLoading(false);
    setRuntimeUploadsLoadingMore(false);
    setRuntimeUploadsError('');
    setRuntimeUploadDeletingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id]);

  useEffect(() => {
    copilotPolicyRef.current = copilotPolicy;
  }, [copilotPolicy]);

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
    function handleSocketConnect() {
      maybeResumeActiveBuildRun();
    }

    function handlePageShow() {
      maybeResumeActiveBuildRun();
    }

    function handleOnline() {
      maybeResumeActiveBuildRun();
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      maybeResumeActiveBuildRun();
    }

    socket.on('connect', handleSocketConnect);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('connect', handleSocketConnect);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id]);

  useEffect(() => {
    if (didAutoPromptRef.current) return;
    if (!buildSocketListenersReady) return;
    if (AI_FEATURES_DISABLED) return;
    if (!isOwner) return;
    const prompt = initialPrompt.trim();
    if (!prompt) return;
    if (chatMessagesRef.current.length > 0) return;
    didAutoPromptRef.current = true;
    void startGeneration(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, buildSocketListenersReady, isOwner, initialPrompt]);

  useEffect(() => {
    if (didAutoGreetingRef.current) return;
    if (!buildSocketListenersReady) return;
    if (AI_FEATURES_DISABLED) return;
    if (!isOwner) return;
    if (!seedGreeting) return;
    if (initialPrompt.trim()) return;
    if (chatMessagesRef.current.length > 0) return;
    didAutoGreetingRef.current = true;
    void startGreetingGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.id,
    buildSocketListenersReady,
    initialPrompt,
    isOwner,
    seedGreeting
  ]);

  useEffect(() => {
    if (didInitialChatScrollRef.current) return;
    didInitialChatScrollRef.current = true;
    scrollChatToBottom('auto', { force: true });
  }, [mergedChatMessages.length, build.id]);

  useEffect(() => {
    function handleGenerateUpdate(payload: {
      requestId?: string;
      reply?: string;
      codeGenerated?: string | null;
      projectFiles?: Array<{ path: string; content?: string }> | null;
      projectFilesMode?: 'patch' | 'snapshot' | null;
      projectFilesPersisted?: boolean;
    }) {
      const {
        requestId,
        reply,
        codeGenerated,
        projectFiles,
        projectFilesMode,
        projectFilesPersisted
      } = payload;
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
      const sharedRunStreamUpdate: {
        requestId: string;
        reply?: string;
        codeGenerated?: string | null;
        projectFiles?: Array<{ path: string; content?: string }> | null;
        projectFilesMode?: 'patch' | 'snapshot' | null;
        projectFilesPersisted?: boolean;
      } = { requestId };
      if (typeof reply === 'string') {
        sharedRunStreamUpdate.reply = reply;
      }
      if (hasCodeGeneratedField) {
        sharedRunStreamUpdate.codeGenerated = codeGenerated ?? null;
      }
      if (Array.isArray(projectFiles) && projectFiles.length > 0) {
        sharedRunStreamUpdate.projectFiles = projectFiles;
        sharedRunStreamUpdate.projectFilesMode =
          projectFilesMode === 'snapshot' ? 'snapshot' : 'patch';
        sharedRunStreamUpdate.projectFilesPersisted =
          projectFilesPersisted === true;
      }
      onUpdateBuildRunStream(sharedRunStreamUpdate);
      if (Array.isArray(projectFiles) && projectFiles.length > 0) {
        const activeBuild = buildRef.current;
        const fallbackCode = activeBuild?.code || '';
        const normalizedProjectFiles = normalizeProjectFilesForBuild(
          projectFiles,
          fallbackCode
        );
        const nextFocusFilePath =
          normalizedProjectFiles
            .map((file) => normalizeProjectFilePath(file.path))
            .find((filePath) => !isIndexHtmlProjectFilePath(filePath)) || null;
        const nextStreamingProjectFiles =
          projectFilesMode === 'snapshot'
            ? normalizedProjectFiles
            : overlayStreamedProjectFilesForBuild({
                baseFiles: streamingProjectFilesBaseRef.current,
                updates: projectFiles,
                fallbackCode
              });
        if (projectFilesPersisted && activeBuild) {
          const nextCode = resolveIndexHtmlFromProjectFiles(
            nextStreamingProjectFiles,
            fallbackCode
          );
          const nextBuild = {
            ...activeBuild,
            code: nextCode,
            projectManifest: {
              entryPath: resolveIndexEntryPathFromProjectFiles(
                nextStreamingProjectFiles,
                activeBuild.projectManifest?.entryPath || '/index.html'
              ),
              storageMode: 'project-files',
              fileCount: nextStreamingProjectFiles.length
            },
            projectFiles: nextStreamingProjectFiles
          };
          buildRef.current = nextBuild;
          updateBuildRef.current(nextBuild);
          streamingProjectFilesBaseRef.current = nextStreamingProjectFiles;
          streamingProjectFilesRef.current = null;
          setStreamingProjectFiles(null);
          setStreamingFocusFilePath(null);
        } else {
          streamingProjectFilesRef.current = nextStreamingProjectFiles;
          setStreamingProjectFiles(nextStreamingProjectFiles);
          if (nextFocusFilePath) {
            setStreamingFocusFilePath(nextFocusFilePath);
          }
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
      followUpPrompt,
      runtimeExplorationPlan,
      runtimePlanRefined,
      billingState,
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
      followUpPrompt?: BuildFollowUpPrompt | null;
      runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
      runtimePlanRefined?: boolean;
      billingState?: 'charged' | 'not_charged' | 'pending' | null;
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
      const hasFollowUpPromptField = Object.prototype.hasOwnProperty.call(
        arguments[0] || {},
        'followUpPrompt'
      );
      const persistedAssistantId =
        typeof message?.id === 'number' && message.id > 0 ? message.id : null;
      const persistedUserId =
        typeof message?.userMessageId === 'number' && message.userMessageId > 0
          ? message.userMessageId
          : null;
      onCompleteBuildRun({
        requestId,
        assistantText,
        artifactCode,
        projectFiles: payloadProjectFiles,
        executionPlan,
        followUpPrompt: hasFollowUpPromptField ? followUpPrompt ?? null : undefined,
        runtimeExplorationPlan,
        runtimePlanRefined,
        billingState,
        artifactVersionId,
        persistedAssistantId,
        persistedUserId,
        createdAt,
        workspaceChanged:
          artifactCode !== null ||
          (Array.isArray(payloadProjectFiles) && payloadProjectFiles.length > 0)
      });
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
            billingState: billingState ?? null,
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
            billingState: billingState ?? null,
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
            followUpPrompt: hasFollowUpPromptField
              ? followUpPrompt || null
              : activeBuild.followUpPrompt || null,
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
      } else if (
        buildRef.current &&
        ((executionPlan !== undefined &&
          buildRef.current.executionPlan !== (executionPlan || null)) ||
          (hasFollowUpPromptField &&
            buildRef.current.followUpPrompt !== (followUpPrompt || null)))
      ) {
        const nextBuild = {
          ...buildRef.current,
          executionPlan:
            executionPlan !== undefined
              ? executionPlan || null
              : buildRef.current.executionPlan || null,
          followUpPrompt: hasFollowUpPromptField
            ? followUpPrompt || null
            : buildRef.current.followUpPrompt || null
        };
        buildRef.current = nextBuild;
        updateBuildRef.current(nextBuild);
      }
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);

      const generatedCodeSuccessfully =
        artifactCode !== null ||
        (Array.isArray(payloadProjectFiles) && payloadProjectFiles.length > 0);
      const planWasRefined = Boolean(
        runtimePlanRefined && runtimeExplorationPlan
      );
      if (generatedCodeSuccessfully || planWasRefined) {
        setMobilePanelTab('preview');
      } else {
        setMobilePanelTab('chat');
      }
      setRuntimeExplorationPlan(
        generatedCodeSuccessfully || planWasRefined
          ? runtimeExplorationPlan || null
          : null
      );
      let shouldDelayQueuedRequestsForRuntimeFollowUp = false;
      if (generatedCodeSuccessfully && completedRunMode === 'user') {
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
      } else if (completedRunMode === 'runtime-autofix') {
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
                'Lumine revised the runtime plan and is re-checking the preview before changing code.'
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
      activeRunMessageContextRef.current = null;
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
      onUpdateBuildRunStatus({
        requestId,
        status: status || null
      });
      maybeAutoScrollDuringStream();
    }

    function handleResumeRunState({
      requestId,
      status,
      assistantStatusSteps,
      usageMetrics,
      runEvents: resumedRunEvents,
      streamUpdate,
      terminal
    }: {
      requestId?: string;
      status?: string | null;
      assistantStatusSteps?: string[];
      usageMetrics?: Record<
        string,
        {
          stage?: string;
          model?: string;
          inputTokens?: number;
          outputTokens?: number;
          totalTokens?: number;
        }
      >;
      runEvents?: Array<{
        id?: string;
        kind?: BuildLiveRunEvent['kind'];
        phase?: string | null;
        message?: string;
        createdAt?: number;
        deduped?: boolean;
        details?: BuildLiveRunEvent['details'];
        usage?: BuildLiveRunEvent['usage'];
      }>;
      streamUpdate?: {
        reply?: string;
        codeGenerated?: string | null;
        hasCodeGeneratedField?: boolean;
        projectFiles?: Array<{ path: string; content?: string }> | null;
        projectFilesMode?: 'patch' | 'snapshot' | null;
        projectFilesPersisted?: boolean;
      } | null;
      terminal?: {
        type?: 'complete' | 'error' | 'stopped';
        payload?: any;
      } | null;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      if (terminal?.type === 'complete' && terminal.payload) {
        void handleGenerateComplete(terminal.payload);
        return;
      }
      if (terminal?.type === 'error' && terminal.payload) {
        handleGenerateError(terminal.payload);
        return;
      }
      if (terminal?.type === 'stopped' && terminal.payload) {
        void handleGenerateStopped(terminal.payload);
        return;
      }
      generatingRef.current = true;
      setGenerating(true);
      const nextStatus = typeof status === 'string' ? status : null;
      const nextAssistantStatusSteps = Array.isArray(assistantStatusSteps)
        ? assistantStatusSteps.filter(
            (entry): entry is string =>
              typeof entry === 'string' && entry.trim().length > 0
          )
        : [];
      const nextUsageMetrics = Object.values(usageMetrics || {}).reduce<
        Record<string, BuildUsageMetric>
      >((result, metric) => {
        const stage = String(metric?.stage || '').trim();
        const model = String(metric?.model || '').trim();
        if (!stage || !model) return result;
        result[stage] = {
          stage,
          model,
          inputTokens: Number(metric?.inputTokens || 0),
          outputTokens: Number(metric?.outputTokens || 0),
          totalTokens: Number(metric?.totalTokens || 0)
        };
        return result;
      }, {});
      const nextRunEvents = Array.isArray(resumedRunEvents)
        ? resumedRunEvents
            .filter(
              (
                event
              ): event is NonNullable<typeof resumedRunEvents>[number] =>
                Boolean(event?.kind && event?.message)
            )
            .map((event, index) => ({
              id:
                typeof event.id === 'string' && event.id.trim().length > 0
                  ? event.id
                  : `${requestId}-${event.createdAt || Date.now()}-${index}`,
              kind: event.kind as BuildRunEvent['kind'],
              phase: event.phase || null,
              message: String(event.message || ''),
              createdAt:
                typeof event.createdAt === 'number' &&
                Number.isFinite(event.createdAt)
                  ? event.createdAt
                  : Date.now(),
              deduped: Boolean(event.deduped),
              details: event.details || null,
              usage: event.usage || null
            }))
            .slice(-40)
        : [];
      setGeneratingStatus(nextStatus);
      setAssistantStatusSteps(nextAssistantStatusSteps);
      setUsageMetrics(nextUsageMetrics);
      setRunEvents(nextRunEvents);
      onRegisterBuildRun({
        buildId: buildRef.current?.id || build.id,
        requestId,
        runMode: activeRunModeRef.current,
        userMessage:
          userMessageIdRef.current && userMessageIdRef.current > 0
            ? (chatMessagesRef.current.find(
                (message) => message.id === userMessageIdRef.current
              ) as ChatMessage | undefined) || null
            : null,
        assistantMessage:
          assistantMessageIdRef.current && assistantMessageIdRef.current > 0
            ? (chatMessagesRef.current.find(
                (message) => message.id === assistantMessageIdRef.current
              ) as ChatMessage | undefined) || null
            : null,
        baseProjectFiles: streamingProjectFilesBaseRef.current
      });
      const resumeStatusStepsToReplay =
        nextAssistantStatusSteps.length > 0
          ? nextAssistantStatusSteps
          : nextStatus
            ? [nextStatus]
            : [];
      for (const step of resumeStatusStepsToReplay) {
        onUpdateBuildRunStatus({
          requestId,
          status: step
        });
      }
      for (const metric of Object.values(nextUsageMetrics)) {
        onUpdateBuildRunUsage({
          requestId,
          usage: metric
        });
      }
      for (const runEvent of nextRunEvents) {
        onAppendBuildRunEvent({
          requestId,
          event: runEvent
        });
      }
      if (streamUpdate) {
        const resumeUpdatePayload: {
          requestId: string;
          reply?: string;
          codeGenerated?: string | null;
          projectFiles?: Array<{ path: string; content?: string }> | null;
          projectFilesMode?: 'patch' | 'snapshot' | null;
          projectFilesPersisted?: boolean;
        } = {
          requestId
        };
        if (typeof streamUpdate.reply === 'string') {
          resumeUpdatePayload.reply = streamUpdate.reply;
        }
        if (streamUpdate.hasCodeGeneratedField) {
          resumeUpdatePayload.codeGenerated =
            streamUpdate.codeGenerated ?? null;
        }
        if (
          Array.isArray(streamUpdate.projectFiles) &&
          streamUpdate.projectFiles.length > 0
        ) {
          resumeUpdatePayload.projectFiles = streamUpdate.projectFiles;
          resumeUpdatePayload.projectFilesMode =
            streamUpdate.projectFilesMode === 'snapshot' ? 'snapshot' : 'patch';
          resumeUpdatePayload.projectFilesPersisted =
            streamUpdate.projectFilesPersisted === true;
        }
        handleGenerateUpdate(resumeUpdatePayload);
      }
      maybeAutoScrollDuringStream();
    }

    function handleGenerateError({
      requestId,
      error,
      requestLimits
    }: {
      requestId?: string;
      error?: string;
      requestLimits?: BuildCopilotPolicy['requestLimits'] | null;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      resetDedupedProcessingReconcileState();
      resetRuntimeHealthFollowUpState();
      const assistantId = assistantMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;
      const errorMessage = error || 'Failed to generate code.';
      const nextPolicy = applyRequestLimitsToCopilotPolicy(
        copilotPolicyRef.current,
        requestLimits
      );
      if (nextPolicy) {
        copilotPolicyRef.current = nextPolicy;
        updateCopilotPolicyRef.current(nextPolicy);
      }

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
      onFailBuildRun({
        requestId,
        error: errorMessage
      });
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);
      setMobilePanelTab('chat');
      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      activeRunMessageContextRef.current = null;
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
            activeRunMessageContextRef.current = null;
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
            activeRunMessageContextRef.current = null;
          }
        }
        generatingRef.current = false;
        onStopBuildRun({
          requestId
        });
        setStreamingProjectFiles(null);
        setStreamingFocusFilePath(null);
        setMobilePanelTab('chat');
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
      const activeUserMessage =
        typeof userId === 'number' && userId > 0
          ? currentMessages.find((entry) => entry.id === userId) || null
          : null;

      const activeIdSet = new Set(
        [activeUserMessage?.persisted ? null : userId, assistantId].filter(
          (id): id is number => typeof id === 'number' && id > 0
        )
      );
      const nextMessages = currentMessages.filter(
        (entry) => !activeIdSet.has(entry.id)
      );

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      onStopBuildRun({
        requestId
      });
      setStreamingProjectFiles(null);
      setStreamingFocusFilePath(null);
      setMobilePanelTab('chat');
      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      activeRunMessageContextRef.current = null;
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
      onUpdateBuildRunUsage({
        requestId,
        usage: {
          stage,
          model,
          inputTokens,
          outputTokens,
          totalTokens
        }
      });
    }

    function handleRunEvent({
      requestId,
      event
    }: {
      requestId?: string;
      event?: {
        id?: string;
        kind?: BuildLiveRunEvent['kind'];
        phase?: string | null;
        message?: string;
        createdAt?: number;
        deduped?: boolean;
        details?: BuildLiveRunEvent['details'];
        usage?: BuildLiveRunEvent['usage'];
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
      const nextEvent: BuildRunEvent = {
        id:
          typeof event.id === 'string' && event.id.trim().length > 0
            ? event.id
            : `${createdAt}-${kind}-${message}`,
        kind,
        phase: event.phase || null,
        message,
        createdAt,
        deduped: Boolean(event.deduped),
        details: event.details || null,
        usage: event.usage || null
      };
      setRunEvents((prev) => {
        if (prev.some((existing) => existing.id === nextEvent.id)) {
          return prev;
        }
        const last = prev[prev.length - 1];
        if (
          last &&
          last.kind === nextEvent.kind &&
          last.phase === nextEvent.phase &&
          last.message === nextEvent.message &&
          Math.abs(last.createdAt - nextEvent.createdAt) < 1500
        ) {
          return [
            ...prev.slice(0, -1),
            {
              ...last,
              createdAt: nextEvent.createdAt,
              deduped: nextEvent.deduped,
              details: nextEvent.details ?? last.details ?? null,
              usage: nextEvent.usage ?? last.usage ?? null
            }
          ];
        }
        const next = [...prev, nextEvent];
        return next.slice(-40);
      });
      onAppendBuildRunEvent({
        requestId,
        event: nextEvent
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
    socket.on('build_resume_run_state', handleResumeRunState);
    socket.on('build_runtime_verify_complete', handleRuntimeVerifyComplete);
    socket.on('build_runtime_verify_error', handleRuntimeVerifyError);
    buildSocketListenersReadyRef.current = true;
    setBuildSocketListenersReady(true);

    return () => {
      buildSocketListenersReadyRef.current = false;
      setBuildSocketListenersReady(false);
      socket.off('build_generate_update', handleGenerateUpdate);
      socket.off('build_generate_complete', handleGenerateComplete);
      socket.off('build_generate_error', handleGenerateError);
      socket.off('build_generate_stopped', handleGenerateStopped);
      socket.off('build_generate_status', handleGenerateStatus);
      socket.off('build_usage_update', handleUsageUpdate);
      socket.off('build_run_event', handleRunEvent);
      socket.off('build_resume_run_state', handleResumeRunState);
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
    const requestId = String(streamRequestIdRef.current || '').trim();
    const nextEvent: BuildRunEvent = {
      id: `${createdAt}-${kind}-${message}`,
      kind,
      phase,
      message,
      createdAt
    };
    setRunEvents((prev) => {
      return [...prev, nextEvent].slice(-40);
    });
    if (requestId) {
      onAppendBuildRunEvent({
        requestId,
        event: nextEvent
      });
    }
  }

  function handleRuntimeObservationChange(
    nextState: BuildRuntimeObservationState
  ) {
    if (runtimeObservationStateRef.current === nextState) {
      return;
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
            ? `Preview booted, but the game overflows its viewport (${health.viewportOverflowY}px tall overflow, ${health.viewportOverflowX}px wide overflow).`
            : health.gameplayTelemetry?.status === 'out-of-bounds'
              ? `Preview booted, but gameplay escaped the declared playfield (${health.gameplayTelemetry.overflowTop}px top, ${health.gameplayTelemetry.overflowRight}px right, ${health.gameplayTelemetry.overflowBottom}px bottom, ${health.gameplayTelemetry.overflowLeft}px left overflow).`
              : interactionStepCount >= 2 &&
                  health.interactionStatus === 'changed' &&
                  latestInteractionStep?.source === 'planned'
                ? `Preview followed Lumine's runtime plan for ${interactionStepCount} steps through the app.`
                : interactionStepCount >= 2 &&
                    health.interactionStatus === 'changed'
                  ? `Preview interaction probe advanced ${interactionStepCount} startup steps through the app.`
                  : health.interactionStatus === 'changed'
                    ? latestInteractionStep?.source === 'planned'
                      ? latestInteractionStep?.routeChanged &&
                        latestInteractionStep.routeAfter
                        ? `Preview followed Lumine's runtime plan and ${interactionTargetText} moved the app to ${latestInteractionStep.routeAfter}.`
                        : `Preview followed Lumine's runtime plan and ${interactionTargetText} moved the app forward.`
                      : latestInteractionStep?.routeChanged &&
                          latestInteractionStep.routeAfter
                        ? `Preview interaction probe changed the UI after clicking ${interactionTargetText} and moved to ${latestInteractionStep.routeAfter}.`
                        : `Preview interaction probe changed the UI after clicking ${interactionTargetText}.`
                    : health.interactionStatus === 'unchanged'
                      ? latestInteractionStep?.source === 'planned'
                        ? `Preview followed Lumine's runtime plan, but ${interactionTargetText} did not move the app forward.`
                        : `Preview interaction probe clicked ${interactionTargetText}, but the UI did not change.`
                      : health.meaningfulRender
                        ? 'Preview booted and rendered meaningful UI.'
                        : 'Preview booted, but the UI still looks sparse.';
        if (
          previewHealthMessage !== 'Preview booted and rendered meaningful UI.' &&
          previewHealthMessage !== 'Preview booted, but the UI still looks sparse.'
        ) {
          appendLocalRunEvent({
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
  }

  function isRunActivityInFlight({ includeBootstrap = true } = {}) {
    return (
      (includeBootstrap && startingGenerationRef.current) ||
      dedupedProcessingInFlightRef.current ||
      generatingRef.current ||
      postCompleteSyncInFlightRef.current
    );
  }

  function enqueueLatestBuildRequest(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ) {
    const trimmed = String(messageText || '').trim();
    const trimmedMessageContext = String(options?.messageContext || '').trim();
    if (!trimmed) return;
    const normalized = normalizeQueuedMessage(trimmed);
    const activeMessage = normalizeQueuedMessage(
      String(
        chatMessagesRef.current.find(
          (entry) => entry.id === userMessageIdRef.current
        )?.content || ''
      )
    );
    const activeMessageContext = normalizeQueuedMessage(
      String(activeRunMessageContextRef.current || '')
    );
    const normalizedMessageContext = normalizeQueuedMessage(
      trimmedMessageContext
    );
    const existing = queuedRequestsRef.current;
    const duplicateIndex = existing.findIndex(
      (entry) => normalizeQueuedMessage(entry.message) === normalized
    );

    if (
      normalized === activeMessage &&
      normalizedMessageContext === activeMessageContext
    ) {
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'That request is already in progress.'
      });
      return;
    }

    if (duplicateIndex >= 0) {
      const nextQueuedRequests = [...existing];
      nextQueuedRequests[duplicateIndex] = {
        ...nextQueuedRequests[duplicateIndex],
        planAction: options?.planAction || null,
        messageContext: trimmedMessageContext || null,
        existingUserMessageId:
          Number(options?.existingUserMessageId || 0) || null
      };
      updateQueuedRequests(nextQueuedRequests);
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
        planAction: options?.planAction || null,
        messageContext: trimmedMessageContext || null,
        existingUserMessageId:
          Number(options?.existingUserMessageId || 0) || null,
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
    const started = await startGeneration(nextRequest.message, {
      planAction: nextRequest.planAction || null,
      messageContext: nextRequest.messageContext || null,
      existingUserMessageId: nextRequest.existingUserMessageId || null
    });
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
        observationState.health?.gameplayTelemetry?.status ===
          'out-of-bounds' ||
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, isOwner, runtimeObservationState]);

  useEffect(() => {
    maybeProcessPendingRuntimeVerification(runtimeObservationState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, isOwner, runtimeObservationState]);

  async function handleSendMessage(messageText: string) {
    return await sendBuildMessageText(messageText);
  }

  async function handleContinueScopedPlan() {
    if (!isOwner) return;
    await sendBuildMessageText('Continue current plan.', {
      planAction: 'continue'
    });
  }

  async function handleCancelScopedPlan() {
    if (!isOwner) return;
    await sendBuildMessageText('Stop current plan.', {
      planAction: 'cancel'
    });
  }

  async function handleAcceptFollowUpPrompt() {
    if (!isOwner) return;
    const suggestedMessage = String(
      displayedFollowUpPrompt?.suggestedMessage || ''
    ).trim();
    if (!suggestedMessage) return;
    await sendBuildMessageText(suggestedMessage);
  }

  function handleDismissFollowUpPrompt() {
    const nextKey = resolveBuildFollowUpPromptKey(displayedFollowUpPrompt);
    if (!nextKey) return;
    setDismissedFollowUpPromptKey(nextKey);
  }

  function appendPersistedBuildChatMessage(
    message: any,
    options?: { buildId?: number | null }
  ) {
    const persistedMessage = message
      ? {
          ...message,
          persisted: true,
          streamCodePreview: null
        }
      : null;
    if (!persistedMessage?.id) {
      return;
    }
    if (
      String(persistedMessage.content || '')
        .trim()
        .startsWith(BUILD_CHAT_HIDDEN_REFERENCE_CONTEXT_PREFIX)
    ) {
      return;
    }
    const targetBuildId = Number(options?.buildId || 0);
    if (targetBuildId > 0 && Number(buildRef.current?.id || 0) !== targetBuildId) {
      return;
    }
    const existingIds = new Set(chatMessagesRef.current.map((entry) => entry.id));
    if (existingIds.has(persistedMessage.id)) {
      return;
    }
    const nextMessages = [...chatMessagesRef.current, persistedMessage].sort(
      (a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt - b.createdAt;
        }
        return a.id - b.id;
      }
    );
    chatMessagesRef.current = nextMessages;
    updateChatMessagesRef.current(nextMessages);
    shouldAutoScrollRef.current = true;
    scrollChatToBottom('smooth', { force: true });
  }

  async function persistBuildChatAssistantNote(
    text: string,
    options?: { buildId?: number | null }
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    const targetBuildId = Number(options?.buildId || build.id || 0);
    const result = await createBuildChatAssistantNote({
      buildId: targetBuildId,
      text: trimmedText
    });
    if (result?.message) {
      appendPersistedBuildChatMessage(result.message, {
        buildId: targetBuildId
      });
      return result.message;
    }
    return null;
  }

  async function persistBuildChatUserNote(
    text: string,
    options?: { buildId?: number | null }
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    const targetBuildId = Number(options?.buildId || build.id || 0);
    const result = await createBuildChatUserNote({
      buildId: targetBuildId,
      text: trimmedText
    });
    if (result?.message) {
      appendPersistedBuildChatMessage(result.message, {
        buildId: targetBuildId
      });
      return result.message;
    }
    return null;
  }

  async function persistBuildChatUploadIntentNote(
    text?: string | null,
    options?: { buildId?: number | null }
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    return await persistBuildChatUserNote(trimmedText, options);
  }

  function isImageChatReferenceFile(file: File) {
    const mimeType = String(file?.type || '').toLowerCase();
    if (mimeType.startsWith('image/')) {
      return true;
    }
    const normalizedName = String(file?.name || '').toLowerCase();
    return (
      normalizedName.endsWith('.png') ||
      normalizedName.endsWith('.jpg') ||
      normalizedName.endsWith('.jpeg') ||
      normalizedName.endsWith('.gif') ||
      normalizedName.endsWith('.webp') ||
      normalizedName.endsWith('.bmp') ||
      normalizedName.endsWith('.svg') ||
      normalizedName.endsWith('.avif') ||
      normalizedName.endsWith('.heic') ||
      normalizedName.endsWith('.heif')
    );
  }

  async function uploadBuildChatReferenceFiles(
    files: File[],
    targetBuildId: number
  ) {
    const uploadedReferences: Array<{
      fileName: string;
      url: string;
      mimeType?: string | null;
      filePath: string;
      storedFileName: string;
    }> = [];

    try {
      for (const file of files) {
        const filePath = buildBuildChatReferenceUploadPath(targetBuildId);
        const appliedFileName = generateFileName(file.name || 'reference.png');
        await uploadFile({
          filePath,
          fileName: appliedFileName,
          file,
          context: 'embed'
        });
        uploadedReferences.push({
          fileName: file.name || appliedFileName,
          url: `${cloudFrontURL}/attachments/embed/${filePath}/${encodeURIComponent(
            appliedFileName
          )}`,
          mimeType: file.type || null,
          filePath,
          storedFileName: appliedFileName
        });
        await saveFileData({
          fileName: appliedFileName,
          filePath,
          actualFileName: file.name || appliedFileName,
          rootType: 'embed'
        });
      }
    } catch (error) {
      await cleanupBuildChatReferenceUploadsQuietly(
        uploadedReferences.map((reference) => ({
          filePath: reference.filePath,
          storedFileName: reference.storedFileName
        })),
        targetBuildId
      );
      throw error;
    }

    return uploadedReferences;
  }

  async function cleanupBuildChatReferenceUploadsQuietly(
    uploads: Array<{
      filePath: string;
      storedFileName: string;
    }>,
    buildId: number
  ) {
    if (!uploads.length) {
      return;
    }
    try {
      await cleanupBuildChatReferenceUploads({
        buildId,
        uploads
      });
    } catch (error) {
      console.error('Failed to clean up build chat reference uploads:', error);
    }
  }

  function buildBuildChatReferenceUploadPath(targetBuildId: number) {
    return `build-chat-reference/${Number(targetBuildId || 0)}/${Number(
      userId || 0
    )}/${uuidv1()}`;
  }

  function buildImportedProjectFilesNote({
    importedCount,
    warningText
  }: {
    importedCount: number;
    warningText?: string;
  }) {
    const baseText = `Imported ${importedCount} project file${
      importedCount === 1 ? '' : 's'
    } into the workspace.`;
    return warningText ? `${baseText} ${warningText}` : baseText;
  }

  function buildUploadedRuntimeAssetsNote({
    uploadedCount,
    warningText
  }: {
    uploadedCount: number;
    warningText?: string;
  }) {
    const baseText = `Uploaded ${uploadedCount} asset${
      uploadedCount === 1 ? '' : 's'
    } for this build.`;
    return warningText ? `${baseText} ${warningText}` : baseText;
  }

  function buildBuildChatUploadRoutingMessage(...parts: Array<string | undefined>) {
    return parts
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join('\n\n');
  }

  function buildBuildChatHiddenMessageContext({
    messageText,
    references
  }: BuildHiddenMessageContextOptions) {
    const trimmedMessageText = String(messageText || '').trim();
    const normalizedReferences = Array.isArray(references)
      ? references
          .map((reference) => ({
            fileName: String(reference?.fileName || '').trim(),
            url: String(reference?.url || '').trim()
          }))
          .filter((reference) => reference.fileName && reference.url)
      : [];

    const lines = [
      'The user uploaded screenshots or mockups for this request.',
      'Treat them as visual evidence for what is wrong or what should change.',
      'Do not repeat them back as filler, chat clutter, or product UI.'
    ];
    if (trimmedMessageText) {
      lines.push(`User intent: ${trimmedMessageText}`);
    }
    if (normalizedReferences.length > 0) {
      lines.push('Reference image URLs:');
      for (const reference of normalizedReferences.slice(0, 4)) {
        lines.push(`- ${reference.fileName}: ${reference.url}`);
      }
      if (normalizedReferences.length > 4) {
        lines.push(
          `- plus ${normalizedReferences.length - 4} more reference image${
            normalizedReferences.length - 4 === 1 ? '' : 's'
          }`
        );
      }
    }
    return lines.join('\n').slice(0, 1800);
  }

  async function handleBuildChatFileSelection(
    selectedFiles: File[],
    options?: {
      messageText?: string;
      historyUserNoteText?: string | null;
      resolvingPendingClarification?: boolean;
    }
  ): Promise<BuildChatFileSelectionResult> {
    if (!isOwner || isRunActivityInFlight() || buildChatUploadInFlight) {
      return { handled: false };
    }
    const uploadBuildId = Number(build.id);
    const files = Array.isArray(selectedFiles)
      ? selectedFiles.filter((file) => file instanceof File)
      : [];
    if (files.length === 0) {
      return { handled: false };
    }
    const routingMessageText = buildBuildChatUploadRoutingMessage(
      options?.messageText ?? buildChatDraftMessage
    );
    const historyUserNoteText =
      options && Object.prototype.hasOwnProperty.call(options, 'historyUserNoteText')
        ? options.historyUserNoteText
        : buildChatDraftMessage;
    const resolvingPendingClarification = Boolean(
      options?.resolvingPendingClarification
    );
    const currentPendingBuildChatUploadClarification =
      resolvingPendingClarification
        ? pendingBuildChatUploadClarificationRef.current[
            pendingBuildChatUploadClarificationRef.current.length - 1
          ] || null
        : null;
    const pendingClarificationIntentAlreadyPersisted = Boolean(
      currentPendingBuildChatUploadClarification?.intentPersisted
    );
    const consumedComposerDraft =
      !options ||
      !Object.prototype.hasOwnProperty.call(options, 'messageText');

    function didBuildChatUploadTargetChange() {
      return Number(buildRef.current?.id || 0) !== uploadBuildId;
    }

    function clearConsumedBuildChatUploadDraft() {
      if (!consumedComposerDraft) return;
      setBuildChatDraftMessage('');
    }

    function pushPendingBuildChatUploadClarification(
      pendingClarification: PendingBuildChatUploadClarification
    ) {
      pendingBuildChatUploadClarificationRef.current = [pendingClarification];
    }

    function replaceCurrentPendingBuildChatUploadClarification(
      pendingClarification: PendingBuildChatUploadClarification
    ) {
      const pendingClarifications =
        pendingBuildChatUploadClarificationRef.current;
      if (pendingClarifications.length === 0) {
        pendingBuildChatUploadClarificationRef.current = [
          pendingClarification
        ];
        return;
      }
      pendingBuildChatUploadClarificationRef.current = [
        ...pendingClarifications.slice(0, -1),
        pendingClarification
      ];
    }

    function clearCurrentPendingBuildChatUploadClarification() {
      if (!resolvingPendingClarification) return;
      const pendingClarifications =
        pendingBuildChatUploadClarificationRef.current;
      if (pendingClarifications.length === 0) return;
      pendingBuildChatUploadClarificationRef.current =
        pendingClarifications.slice(0, -1);
    }

    async function persistClarificationIntentIfNeeded() {
      if (pendingClarificationIntentAlreadyPersisted) {
        return true;
      }
      const trimmedHistoryUserNoteText = String(historyUserNoteText || '').trim();
      if (!trimmedHistoryUserNoteText) {
        return false;
      }
      await persistBuildChatUploadIntentNote(trimmedHistoryUserNoteText, {
        buildId: uploadBuildId
      });
      return true;
    }

    setBuildChatUploadInFlight(true);
    try {
      const decision = (await routeBuildChatUpload({
        buildId: build.id,
        messageText: routingMessageText,
        files: files.map((file) => ({
          fileName: file.name,
          mimeType: file.type || null,
          sizeBytes: file.size
        }))
      })) as BuildChatUploadDecision | null;
      if (didBuildChatUploadTargetChange()) {
        return { handled: true };
      }

      const route = String(decision?.route || '').trim() as BuildChatUploadRoute;
      if (!route) {
        throw new Error('Failed to determine what to do with these files.');
      }

      if (route === 'clarify') {
        const intentPersisted = await persistClarificationIntentIfNeeded();
        const pendingClarification = {
          files: [...files],
          messageText: routingMessageText,
          intentPersisted
        };
        if (resolvingPendingClarification) {
          replaceCurrentPendingBuildChatUploadClarification(
            pendingClarification
          );
        } else {
          pushPendingBuildChatUploadClarification(pendingClarification);
        }
        await persistBuildChatAssistantNote(
          decision?.clarificationQuestion ||
            'Tell me whether you want these uploaded into the project, used as build assets, or kept as reference in chat.',
          { buildId: uploadBuildId }
        );
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      clearCurrentPendingBuildChatUploadClarification();

      if (route === 'project_files_import') {
        const previewPanel = previewPanelRef.current;
        if (!previewPanel || didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        const result = await previewPanel.importProjectFilesFromChatUpload(files);
        if (didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        if (!result?.success) {
          await persistBuildChatAssistantNote(
            result?.error || 'I could not import those project files.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        await persistBuildChatUploadIntentNote(historyUserNoteText, {
          buildId: uploadBuildId
        });
        await persistBuildChatAssistantNote(
          buildImportedProjectFilesNote(result),
          { buildId: uploadBuildId }
        );
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      if (route === 'runtime_asset_upload') {
        const previewPanel = previewPanelRef.current;
        if (!previewPanel || didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        const result = await previewPanel.uploadProjectAssetsFromChatUpload(files);
        if (didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        if (!result?.success) {
          await persistBuildChatAssistantNote(
            result?.error || 'I could not upload those build assets.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        await persistBuildChatUploadIntentNote(historyUserNoteText, {
          buildId: uploadBuildId
        });
        await persistBuildChatAssistantNote(
          buildUploadedRuntimeAssetsNote(result),
          { buildId: uploadBuildId }
        );
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      if (route === 'chat_reference') {
        const referenceFiles = files.filter(isImageChatReferenceFile);
        if (referenceFiles.length === 0) {
          await persistBuildChatAssistantNote(
            'I can only use image uploads as chat reference right now.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const references = await uploadBuildChatReferenceFiles(
          referenceFiles,
          uploadBuildId
        );
        const cleanupUploads = references.map((reference) => ({
          filePath: reference.filePath,
          storedFileName: reference.storedFileName
        }));
        if (didBuildChatUploadTargetChange()) {
          await cleanupBuildChatReferenceUploadsQuietly(
            cleanupUploads,
            uploadBuildId
          );
          return { handled: true };
        }
        const hiddenMessageContext = buildBuildChatHiddenMessageContext({
          messageText: routingMessageText,
          references: references.map((reference) => ({
            fileName: reference.fileName,
            url: reference.url
          }))
        });
        if (!resolvingPendingClarification && routingMessageText.trim()) {
          let hiddenReferenceContext = hiddenMessageContext;
          let existingUserMessageId = null as number | null;
          try {
            const result = await createBuildChatReferenceNote({
              buildId: uploadBuildId,
              messageText: routingMessageText,
              references: references.map((reference) => ({
                fileName: reference.fileName,
                url: reference.url,
                mimeType: reference.mimeType || null
              })),
              hidden: true
            });
            const resolvedMessageContext = String(
              result?.messageContext || ''
            ).trim();
            if (resolvedMessageContext) {
              hiddenReferenceContext = resolvedMessageContext;
            }
            if (result?.userMessage) {
              appendPersistedBuildChatMessage(result.userMessage, {
                buildId: uploadBuildId
              });
              existingUserMessageId =
                Number(result.userMessage?.id || 0) || null;
            }
          } catch (error) {
            await cleanupBuildChatReferenceUploadsQuietly(
              cleanupUploads,
              uploadBuildId
            );
            throw error;
          }
          setBuildChatUploadInFlight(false);
          const started = await sendBuildMessageText(routingMessageText, {
            messageContext: hiddenReferenceContext,
            existingUserMessageId,
            ignoreUploadInFlight: true
          });
          if (started) {
            clearConsumedBuildChatUploadDraft();
            return { handled: true };
          }
          await persistBuildChatAssistantNote(
            'I saved the screenshot reference, but the run did not start. Retry your message when ready.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        let result;
        try {
          result = await createBuildChatReferenceNote({
            buildId: uploadBuildId,
            messageText: routingMessageText,
            references: references.map((reference) => ({
              fileName: reference.fileName,
              url: reference.url,
              mimeType: reference.mimeType || null
            }))
          });
        } catch (error) {
          await cleanupBuildChatReferenceUploadsQuietly(
            cleanupUploads,
            uploadBuildId
          );
          throw error;
        }
        if (result?.userMessage) {
          appendPersistedBuildChatMessage(result.userMessage, {
            buildId: uploadBuildId
          });
        }
        if (result?.assistantMessage) {
          appendPersistedBuildChatMessage(result.assistantMessage, {
            buildId: uploadBuildId
          });
        }
        if (result?.userMessage || result?.assistantMessage) {
          clearConsumedBuildChatUploadDraft();
          return { handled: true };
        }
        await persistBuildChatAssistantNote(
          `Using ${referenceFiles.length} reference image${
            referenceFiles.length === 1 ? '' : 's'
          } for your request.`,
          { buildId: uploadBuildId }
        );
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      const fallbackIntentPersisted = await persistClarificationIntentIfNeeded();
      const pendingClarification = {
        files: [...files],
        messageText: routingMessageText,
        intentPersisted: fallbackIntentPersisted
      };
      if (resolvingPendingClarification) {
        replaceCurrentPendingBuildChatUploadClarification(
          pendingClarification
        );
      } else {
        pushPendingBuildChatUploadClarification(pendingClarification);
      }
      await persistBuildChatAssistantNote(
        'I was not confident enough to route those files automatically. Tell me whether they should be imported, uploaded as assets, or used as reference.',
        { buildId: uploadBuildId }
      );
      clearConsumedBuildChatUploadDraft();
      return { handled: true };
    } catch (error: any) {
      console.error('Failed to process build chat upload:', error);
      await persistBuildChatAssistantNote(
        error?.message || 'I could not process those uploaded files.',
        { buildId: uploadBuildId }
      );
      return { handled: true };
    } finally {
      setBuildChatUploadInFlight(false);
    }
  }

  function handleOpenBuildChatUpload() {
    if (!isOwner || isRunActivityInFlight() || buildChatUploadInFlight) return;
    setBuildChatUploadModalShown(true);
  }

  async function sendBuildMessageText(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
      ignoreUploadInFlight?: boolean;
    }
  ) {
    const trimmedMessage = String(messageText || '').trim();
    if (
      !trimmedMessage ||
      !isOwner ||
      (buildChatUploadInFlight && options?.ignoreUploadInFlight !== true)
    ) {
      return false;
    }
    const pendingBuildChatUploadClarification =
      pendingBuildChatUploadClarificationRef.current[
        pendingBuildChatUploadClarificationRef.current.length - 1
      ] || null;
    if (pendingBuildChatUploadClarification) {
      await persistBuildChatUserNote(trimmedMessage);
      const result = await handleBuildChatFileSelection(
        pendingBuildChatUploadClarification.files,
        {
          messageText: buildBuildChatUploadRoutingMessage(
            pendingBuildChatUploadClarification.messageText,
            trimmedMessage
          ),
          historyUserNoteText: pendingBuildChatUploadClarification.intentPersisted
            ? null
            : pendingBuildChatUploadClarification.messageText,
          resolvingPendingClarification: true
        }
      );
      return result.handled;
    }

    if (
      isRunActivityInFlight() ||
      pendingRuntimeAutoFixRef.current ||
      pendingRuntimeVerificationRef.current
    ) {
      enqueueLatestBuildRequest(trimmedMessage, options);
      return true;
    }

    const started = await startGeneration(trimmedMessage, options);
    if (!started) {
      if (isRunActivityInFlight()) {
        enqueueLatestBuildRequest(trimmedMessage, options);
        return true;
      }
      return false;
    }
    return true;
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
    onUpdateBuildRunStatus({
      requestId,
      status: 'Stopping...'
    });
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
    const explicitTargetBuildId = Number(options?.targetBuildId || 0);
    const hasExplicitTargetBuild =
      Number.isFinite(explicitTargetBuildId) && explicitTargetBuildId > 0;
    const requestBuild = hasExplicitTargetBuild ? null : activeBuild || build;
    const requestBuildId = hasExplicitTargetBuild
      ? explicitTargetBuildId
      : Number(requestBuild?.id || 0);
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
    const requestBuildCode = hasExplicitTargetBuild
      ? options?.targetBuildCode || null
      : requestBuild?.code || '';
    const normalizedFiles = normalizeProjectFilesForBuild(
      nextFilesInput,
      requestBuildCode
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
        requestBuildCode
      );
      const nextCode = resolveIndexHtmlFromProjectFiles(
        savedFiles,
        requestBuildCode
      );
      const latestBuild = buildRef.current;
      if (!latestBuild || Number(latestBuild.id) !== requestBuildId) {
        if (options?.resumePausedQueue && !hasExplicitTargetBuild) {
          maybeResumePausedQueueAfterSave();
        }
        if (hasExplicitTargetBuild) {
          return { success: true };
        }
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
      if (Object.prototype.hasOwnProperty.call(result || {}, 'copilotPolicy')) {
        copilotPolicyRef.current = result?.copilotPolicy || null;
        updateCopilotPolicyRef.current(result?.copilotPolicy || null);
      }
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

  function updateRuntimeUploadQuotaUsage(
    usage: BuildRuntimeUploadUsage | null | undefined
  ) {
    const nextPolicy = applyRuntimeUploadUsageToCopilotPolicy(
      copilotPolicyRef.current,
      usage
    );
    if (!nextPolicy) {
      return;
    }
    copilotPolicyRef.current = nextPolicy;
    updateCopilotPolicyRef.current(nextPolicy);
  }

  function handleRuntimeUploadsSyncFromPreview(
    payload: PreviewRuntimeUploadsSyncPayload | null
  ) {
    if (!payload) {
      return;
    }
    setRuntimeUploadsError('');
    updateRuntimeUploadQuotaUsage(payload.usage || null);
    const currentBuildTitle = String(buildRef.current?.title || build.title || '');
    const currentBuildIsPublic = Boolean(buildRef.current?.isPublic);
    const currentBuildAssets = Array.isArray(payload.assets)
      ? payload.assets.map((asset) => ({
          ...asset,
          buildTitle: currentBuildTitle || null,
          buildSlug: null,
          buildIsPublic: currentBuildIsPublic
        }))
      : [];
    setCurrentBuildRuntimeAssets(currentBuildAssets);
    if (runtimeUploadsModalShown) {
      void loadRuntimeUploadsPage();
    }
  }

  async function loadRuntimeUploadsPage(options?: { append?: boolean }) {
    if (!isOwner) return;
    const append = Boolean(options?.append);
    const cursor = append ? runtimeUploadsNextCursor : null;
    if (append) {
      if (runtimeUploadsLoadingMore || !cursor) return;
      setRuntimeUploadsLoadingMore(true);
    } else {
      if (runtimeUploadsLoading) return;
      setRuntimeUploadsLoading(true);
    }
    setRuntimeUploadsError('');
    try {
      const payload = await loadBuildRuntimeUploads({
        cursor,
        limit: 30
      });
      const nextAssets = Array.isArray(payload?.assets) ? payload.assets : [];
      const nextCursor = Number(payload?.nextCursor);
      setRuntimeUploadAssets((prev) => {
        if (!append) {
          return nextAssets;
        }
        const merged = [...prev];
        const seenIds = new Set(prev.map((asset) => asset.id));
        for (const asset of nextAssets) {
          if (seenIds.has(asset.id)) continue;
          seenIds.add(asset.id);
          merged.push(asset);
        }
        return merged;
      });
      setRuntimeUploadsNextCursor(
        Number.isFinite(nextCursor) && nextCursor > 0 ? nextCursor : null
      );
      updateRuntimeUploadQuotaUsage(payload?.usage || null);
    } catch (error: any) {
      console.error('Failed to load runtime uploads:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load uploaded files';
      setRuntimeUploadsError(message);
    } finally {
      setRuntimeUploadsLoading(false);
      setRuntimeUploadsLoadingMore(false);
    }
  }

  function handleOpenRuntimeUploadsManager() {
    if (!isOwner) return;
    setRuntimeUploadsModalShown(true);
    void loadRuntimeUploadsPage();
  }

  function handleCloseRuntimeUploadsManager() {
    setRuntimeUploadsModalShown(false);
  }

  function handleLoadMoreRuntimeUploads() {
    void loadRuntimeUploadsPage({ append: true });
  }

  async function handleDeleteRuntimeUploadManagerAsset(
    asset: BuildRuntimeUploadAsset
  ) {
    if (!asset?.id || runtimeUploadDeletingId) return;
    const fileLabel = asset.originalFileName || asset.fileName || 'this file';
    const confirmed = window.confirm(
      `Delete "${fileLabel}" from your Twinkle uploads?`
    );
    if (!confirmed) return;
    setRuntimeUploadDeletingId(asset.id);
    setRuntimeUploadsError('');
    try {
      const payload = await deleteBuildRuntimeUpload(asset.id);
      setRuntimeUploadAssets((prev) =>
        prev.filter((item) => item.id !== asset.id)
      );
      setCurrentBuildRuntimeAssets((prev) =>
        prev.filter((item) => item.id !== asset.id)
      );
      updateRuntimeUploadQuotaUsage(payload?.usage || null);
    } catch (error: any) {
      console.error('Failed to delete runtime upload:', error);
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete uploaded file';
      setRuntimeUploadsError(message);
    } finally {
      setRuntimeUploadDeletingId(null);
    }
  }

  function applyBuildUpdate(nextBuild: Build) {
    buildRef.current = nextBuild;
    updateBuildRef.current(nextBuild);
  }

  function clearLocalFollowUpPrompt() {
    const activeBuild = buildRef.current;
    if (!activeBuild?.followUpPrompt) return;
    applyBuildUpdate({
      ...activeBuild,
      followUpPrompt: null
    });
  }

  async function captureThumbnailFromPreview() {
    const previewPanel = previewPanelRef.current;
    if (!previewPanel) {
      throw new Error('Preview is unavailable right now');
    }
    return await previewPanel.captureThumbnail();
  }

  async function persistBuildThumbnailFromDataUrl(imageUrl: string) {
    const latestBuild = buildRef.current;
    const file = returnImageFileFromUrl({
      imageUrl,
      fileName: `build-thumbnail-${latestBuild.id}.jpg`
    });
    const result = await uploadBuildThumbnail({
      buildId: latestBuild.id,
      file
    });
    if (!result?.success || !result?.build) {
      throw new Error('Failed to save build thumbnail');
    }
    const nextBuild = {
      ...latestBuild,
      ...result.build
    };
    applyBuildUpdate(nextBuild);
    return nextBuild;
  }

  async function ensureBuildThumbnailBeforePublish() {
    const latestBuild = buildRef.current;
    if (String(latestBuild.thumbnailUrl || '').trim()) {
      return latestBuild;
    }
    const capturedImageUrl = await captureThumbnailFromPreview();
    return await persistBuildThumbnailFromDataUrl(capturedImageUrl);
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
      let publishTargetBuild = latestBuild;
      if (!String(latestBuild.thumbnailUrl || '').trim()) {
        try {
          publishTargetBuild = await ensureBuildThumbnailBeforePublish();
        } catch (error: any) {
          console.error('Failed to auto-generate build thumbnail:', error);
          appendLocalRunEvent({
            kind: 'lifecycle',
            phase: 'publish',
            message:
              error?.message
                ? `${error.message} Publishing without a thumbnail instead.`
                : 'Preview thumbnail could not be generated automatically. Publishing without a thumbnail instead.'
          });
        }
      }
      const result = await publishBuild({
        buildId: publishTargetBuild.id,
        thumbnailUrl: String(publishTargetBuild.thumbnailUrl || '').trim() || undefined
      });
      if (result?.success && result?.build) {
        applyBuildUpdate({
          ...publishTargetBuild,
          isPublic: result.build.isPublic,
          publishedAt: result.build.publishedAt,
          thumbnailUrl: result.build.thumbnailUrl
        });
        if (Object.prototype.hasOwnProperty.call(result, 'copilotPolicy')) {
          copilotPolicyRef.current = result.copilotPolicy || null;
          updateCopilotPolicyRef.current(result.copilotPolicy || null);
        }
      }
    } catch (error: any) {
      console.error('Failed to publish build:', error);
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'publish',
        message: error?.message || 'Unable to publish this build right now.'
      });
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!isOwner || publishing) return;
    setPublishing(true);
    try {
      const latestBuild = buildRef.current;
      const result = await unpublishBuild(latestBuild.id);
      if (result?.success && result?.build) {
        applyBuildUpdate({
          ...latestBuild,
          isPublic: result.build.isPublic
        });
        if (Object.prototype.hasOwnProperty.call(result, 'copilotPolicy')) {
          copilotPolicyRef.current = result.copilotPolicy || null;
          updateCopilotPolicyRef.current(result.copilotPolicy || null);
        }
      }
    } catch (error: any) {
      console.error('Failed to unpublish build:', error);
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'publish',
        message: error?.message || 'Unable to unpublish this build right now.'
      });
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

  async function handlePurchaseGenerationReset() {
    if (!isOwner || !userId || purchasingGenerationReset) return;
    setPurchasingGenerationReset(true);
    setGenerationResetError('');
    try {
      const result = await purchaseBuildGenerationReset(build.id);
      if (typeof result?.newBalance === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: result.newBalance }
        });
      }
      if (Object.prototype.hasOwnProperty.call(result || {}, 'copilotPolicy')) {
        copilotPolicyRef.current = result?.copilotPolicy || null;
        updateCopilotPolicyRef.current(result?.copilotPolicy || null);
      }
    } catch (error: any) {
      console.error('Failed to purchase build generation reset:', error);
      const nextRequestLimits =
        error?.response?.data?.requestLimits || error?.requestLimits || null;
      const nextPolicy = applyRequestLimitsToCopilotPolicy(
        copilotPolicyRef.current,
        nextRequestLimits
      );
      if (nextPolicy) {
        copilotPolicyRef.current = nextPolicy;
        updateCopilotPolicyRef.current(nextPolicy);
      }
      setGenerationResetError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to purchase generation quota reset'
      );
    } finally {
      setPurchasingGenerationReset(false);
    }
  }

  const previewProjectFiles = Array.isArray(build.projectFiles)
    ? build.projectFiles
    : EMPTY_BUILD_PROJECT_FILES;

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
          <div className={headerTitleRowClass}>
            <h2 className={headerTitleClass}>{build.title}</h2>
            {isOwner && (
              <button
                type="button"
                className={headerTitleEditButtonClass}
                onClick={handleOpenDescriptionModal}
                aria-label="Edit build details"
                title="Edit build details"
              >
                <Icon icon="pencil-alt" />
              </button>
            )}
          </div>
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
              {build.description?.trim() ? 'Edit Details' : 'Add Details'}
            </GameCTAButton>
          )}
          {isOwner && (
            <GameCTAButton
              onClick={handleOpenThumbnailModal}
              disabled={savingThumbnail || publishing}
              loading={savingThumbnail}
              variant="neutral"
              size="md"
              icon="image"
            >
              Thumbnail
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
        {isOwner && (
          <div className={mobileTabBarClass}>
            <SegmentedToggle
              value={mobilePanelTab}
              options={[
                { value: 'chat' as const, label: 'Chat', icon: 'comments' },
                { value: 'preview' as const, label: 'Preview', icon: 'eye' }
              ]}
              onChange={setMobilePanelTab}
              ariaLabel="Switch between chat and preview"
              size="sm"
            />
          </div>
        )}
        <div
          className={isOwner ? workspaceWithChatClass : workspaceNoChatClass}
        >
          {isOwner && (
            <ChatPanel
              className={
                mobilePanelTab !== 'chat' ? mobilePanelHiddenClass : undefined
              }
              messages={mergedChatMessages}
              executionPlan={displayedExecutionPlan}
              scopedPlanQuestion={resolveScopedPlanQuestion(displayedExecutionPlan)}
              followUpPrompt={displayedFollowUpPrompt}
              generating={displayedGenerating}
              generatingStatus={displayedGeneratingStatus}
              assistantStatusSteps={displayedAssistantStatusSteps}
              usageMetrics={displayedUsageMetrics}
              copilotPolicy={copilotPolicy}
              projectFileChangeLogs={projectFileChangeLogs}
              projectFilePromptContextPreview={projectFilePromptContextPreview}
              projectFileChangeLogsLoading={projectFileChangeLogsLoading}
              projectFileChangeLogsError={projectFileChangeLogsError}
              projectFileChangeLogsLoadedAt={projectFileChangeLogsLoadedAt}
              runEvents={displayedRunEvents}
              activeStreamMessageIds={displayedActiveStreamMessageIds}
              isOwner={isOwner}
              chatScrollRef={chatScrollRef}
              chatEndRef={chatEndRef}
              onChatScroll={handleChatScroll}
              draftMessage={buildChatDraftMessage}
              onDraftMessageChange={setBuildChatDraftMessage}
              onSendMessage={handleSendMessage}
              onContinueScopedPlan={handleContinueScopedPlan}
              onCancelScopedPlan={handleCancelScopedPlan}
              onAcceptFollowUpPrompt={handleAcceptFollowUpPrompt}
              onDismissFollowUpPrompt={handleDismissFollowUpPrompt}
              onOpenBuildChatUpload={handleOpenBuildChatUpload}
              uploadInFlight={buildChatUploadInFlight}
              runtimeUploadsModalShown={runtimeUploadsModalShown}
              runtimeUploadAssets={runtimeUploadAssets}
              runtimeUploadsNextCursor={runtimeUploadsNextCursor}
              runtimeUploadsLoading={runtimeUploadsLoading}
              runtimeUploadsLoadingMore={runtimeUploadsLoadingMore}
              runtimeUploadsError={runtimeUploadsError}
              runtimeUploadDeletingId={runtimeUploadDeletingId}
              onOpenRuntimeUploadsManager={handleOpenRuntimeUploadsManager}
              onCloseRuntimeUploadsManager={handleCloseRuntimeUploadsManager}
              onLoadMoreRuntimeUploads={handleLoadMoreRuntimeUploads}
              onDeleteRuntimeUpload={handleDeleteRuntimeUploadManagerAsset}
              twinkleCoins={Number(twinkleCoins) || 0}
              purchasingGenerationReset={purchasingGenerationReset}
              generationResetError={generationResetError}
              onPurchaseGenerationReset={handlePurchaseGenerationReset}
              onStopGeneration={handleStopGeneration}
              onReloadProjectFileChangeLogs={handleReloadProjectFileChangeLogs}
              onDeleteMessage={handleDeleteMessage}
            />
          )}
          <PreviewPanel
            ref={previewPanelRef}
            className={
              isOwner && mobilePanelTab !== 'preview'
                ? mobilePanelHiddenClass
                : undefined
            }
            build={build}
            code={build.code}
            projectFiles={previewProjectFiles}
            streamingProjectFiles={streamingProjectFiles}
            streamingFocusFilePath={streamingFocusFilePath}
            isOwner={isOwner}
            capabilitySnapshot={build.capabilitySnapshot || null}
            runtimeExplorationPlan={runtimeExplorationPlan}
            onReplaceCode={handleReplaceCode}
            onApplyRestoredProjectFiles={handleApplyRestoredProjectFiles}
            onSaveProjectFiles={(files, options) =>
              handleSaveProjectFiles(files, {
                resumePausedQueue: true,
                ...options
              })
            }
            onEditableProjectFilesStateChange={
              handleProjectFilesDraftStateChange
            }
            onRuntimeObservationChange={handleRuntimeObservationChange}
            onRuntimeUploadsSync={handleRuntimeUploadsSyncFromPreview}
            onOpenRuntimeUploadsManager={handleOpenRuntimeUploadsManager}
            currentBuildRuntimeAssets={currentBuildRuntimeAssets}
          />
        </div>
      </div>
      {isOwner && buildChatUploadModalShown && (
        <UploadModal
          isOpen
          multiple
          allowMultipleGenericFileSelection
          onHide={() => setBuildChatUploadModalShown(false)}
          onFileSelect={(file) => {
            setBuildChatUploadModalShown(false);
            setBuildChatUploadFileObj(file);
          }}
          onFilesSelect={(files) => {
            setBuildChatUploadModalShown(false);
            setBuildChatUploadFileObj(files);
          }}
        />
      )}
      {isOwner && buildChatUploadFileObj && (
        <UploadFileModal
          initialCaption={buildChatDraftMessage}
          fileObj={buildChatUploadFileObj}
          onEmbed={() => {}}
          onScrollToBottom={() => {}}
          onCustomUploadSubmit={async ({ files, caption }) => {
            await handleBuildChatFileSelection(files, {
              messageText: caption,
              historyUserNoteText: caption
            });
          }}
          onUpload={() => {
            setBuildChatDraftMessage('');
            setBuildChatUploadFileObj(null);
          }}
          onHide={() => setBuildChatUploadFileObj(null)}
        />
      )}
      {descriptionModalShown && isOwner && (
        <BuildDescriptionModal
          initialTitle={build.title}
          initialDescription={build.description}
          loading={savingDescription}
          onHide={handleCloseDescriptionModal}
          onSubmit={handleSaveMetadata}
        />
      )}
      {thumbnailModalShown && isOwner && (
        <BuildThumbnailModal
          initialImageUrl={build.thumbnailUrl || buildRef.current?.thumbnailUrl || null}
          loading={savingThumbnail}
          saveError={thumbnailSaveError}
          onHide={handleCloseThumbnailModal}
          onSave={handleSaveThumbnail}
          onCaptureFromPreview={captureThumbnailFromPreview}
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

  function handleOpenThumbnailModal() {
    setThumbnailSaveError('');
    setThumbnailModalShown(true);
  }

  function handleCloseThumbnailModal() {
    if (savingThumbnail) return;
    setThumbnailSaveError('');
    setThumbnailModalShown(false);
  }

  async function handleSaveMetadata({
    title,
    description
  }: {
    title: string;
    description: string;
  }) {
    if (!isOwner || savingDescription) return;
    const latestBuild = buildRef.current;
    const nextTitle = title.trim();
    const nextDescription = description.trim();
    if (
      (latestBuild.title || '').trim() === nextTitle &&
      (latestBuild.description || '').trim() === nextDescription
    ) {
      setDescriptionModalShown(false);
      return;
    }
    setSavingDescription(true);
    try {
      const result = await updateBuildMetadata({
        buildId: latestBuild.id,
        title: nextTitle,
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
      console.error('Failed to update build metadata:', error);
    } finally {
      setSavingDescription(false);
    }
  }

  async function handleSaveThumbnail(croppedImageUrl: string | null) {
    if (!isOwner || savingThumbnail) return;
    const latestBuild = buildRef.current;
    const currentThumbnailUrl = String(latestBuild.thumbnailUrl || '').trim();
    if (!croppedImageUrl && !currentThumbnailUrl) {
      setThumbnailSaveError('');
      setThumbnailModalShown(false);
      return;
    }
    setSavingThumbnail(true);
    setThumbnailSaveError('');
    try {
      if (!croppedImageUrl) {
        const result = await updateBuildMetadata({
          buildId: latestBuild.id,
          thumbnailUrl: null
        });
        if (!result?.success || !result?.build) {
          throw new Error('Failed to remove build thumbnail');
        }
        applyBuildUpdate({
          ...latestBuild,
          ...result.build
        });
      } else {
        await persistBuildThumbnailFromDataUrl(croppedImageUrl);
      }
      setThumbnailModalShown(false);
    } catch (error: any) {
      console.error('Failed to save build thumbnail:', error);
      setThumbnailSaveError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save build thumbnail'
      );
    } finally {
      setSavingThumbnail(false);
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
      shouldHydrateSharedRunRef.current = false;
      setDismissedFollowUpPromptKey('');
      clearLocalFollowUpPrompt();
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
    activeRunMessageContextRef.current = null;

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
    onRegisterBuildRun({
      buildId: requestedBuildId,
      requestId,
      runMode: 'runtime-autofix',
      assistantMessage,
      baseProjectFiles: streamingProjectFilesBaseRef.current
    });
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
        options?.sourceArtifactVersionId || null,
      expectedCurrentArtifactVersionId:
        Number(buildRef.current?.currentArtifactVersionId || 0) > 0
          ? Number(buildRef.current?.currentArtifactVersionId)
          : undefined
    });
    return true;
  }

  async function startGeneration(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ): Promise<boolean> {
    if (AI_FEATURES_DISABLED) return false;
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
      const trimmedMessageContext = String(
        options?.messageContext || ''
      ).trim();
      const existingUserMessageId =
        Number(options?.existingUserMessageId || 0) || null;
      activeRunModeRef.current = 'user';
      shouldHydrateSharedRunRef.current = false;
      setDismissedFollowUpPromptKey('');
      clearLocalFollowUpPrompt();
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
      activeRunMessageContextRef.current = trimmedMessageContext || null;

      const existingUserMessage =
        existingUserMessageId && existingUserMessageId > 0
          ? chatMessagesRef.current.find(
              (entry) => entry.id === existingUserMessageId
            ) || null
          : null;
      const userMessage: ChatMessage = existingUserMessage
        ? {
            ...existingUserMessage,
            persisted: true
          }
        : {
            id: messageId,
            role: 'user',
            content: messageText,
            codeGenerated: null,
            billingState: null,
            streamCodePreview: null,
            createdAt: now,
            persisted: false
          };
      const assistantMessage: ChatMessage = {
        id: messageId + 1,
        role: 'assistant',
        content: '',
        codeGenerated: null,
        billingState: null,
        streamCodePreview: null,
        createdAt: now + 1,
        persisted: false
      };
      userMessageIdRef.current =
        (existingUserMessage && existingUserMessage.id) || userMessage.id;
      assistantMessageIdRef.current = assistantMessage.id;

      const messagesWithUser = existingUserMessage
        ? [...chatMessagesRef.current, assistantMessage]
        : [...chatMessagesRef.current, userMessage, assistantMessage];
      chatMessagesRef.current = messagesWithUser;
      updateChatMessagesRef.current(messagesWithUser);
      onRegisterBuildRun({
        buildId: activeBuild.id,
        requestId,
        runMode: 'user',
        userMessage,
        assistantMessage,
        baseProjectFiles: streamingProjectFilesBaseRef.current
      });
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('smooth', { force: true });

      socket.emit('build_generate', {
        buildId: activeBuild.id,
        message: messageText,
        requestId,
        runtimeObservationSummary: runtimeObservationSummary || undefined,
        messageContext: trimmedMessageContext || undefined,
        existingUserMessageId: existingUserMessageId || undefined,
        planAction: options?.planAction || undefined,
        expectedCurrentArtifactVersionId:
          Number(activeBuild.currentArtifactVersionId || 0) > 0
            ? Number(activeBuild.currentArtifactVersionId)
            : undefined
      });
      return true;
    } finally {
      startingGenerationRef.current = false;
    }
  }

  async function startGreetingGeneration(): Promise<boolean> {
    if (AI_FEATURES_DISABLED) return false;
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
      shouldHydrateSharedRunRef.current = false;
      setDismissedFollowUpPromptKey('');
      clearLocalFollowUpPrompt();
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
      activeRunMessageContextRef.current = null;

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
      onRegisterBuildRun({
        buildId: activeBuild.id,
        requestId,
        runMode: 'greeting',
        assistantMessage,
        baseProjectFiles: streamingProjectFilesBaseRef.current
      });
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
    if (!displayedGenerating) return false;
    return displayedActiveStreamMessageIds.includes(message.id);
  }

  function handleChatScroll() {
    shouldAutoScrollRef.current = isChatNearBottom();
  }

  function maybeAutoScrollDuringStream() {
    if (!shouldAutoScrollRef.current) return;
    scrollChatToBottom('auto');
  }

  function maybeResumeActiveBuildRun() {
    if (!buildSocketListenersReadyRef.current) return;
    if (!generatingRef.current) return;
    const requestId = String(streamRequestIdRef.current || '').trim();
    if (!requestId) return;
    const activeBuildId = Number(buildRef.current?.id || build.id);
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return;
    const now = Date.now();
    if (now - lastResumeAttemptAtRef.current < 1500) return;
    lastResumeAttemptAtRef.current = now;
    socket.emit('build_resume_run', {
      buildId: activeBuildId,
      requestId
    });
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
          followUpPrompt: buildPayload.followUpPrompt || null,
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
        copilotPolicyRef.current = buildPayload.copilotPolicy || null;
        updateCopilotPolicyRef.current(buildPayload.copilotPolicy || null);
      }
    }
    if (!Array.isArray(messages)) return;
    const localBillingStateById = new Map<number, ChatMessage['billingState']>();
    for (const message of chatMessagesRef.current) {
      if (typeof message?.id !== 'number' || message.id <= 0) continue;
      if (message.billingState == null) continue;
      localBillingStateById.set(message.id, message.billingState);
    }
    const normalized = messages.map((entry: any) => ({
      ...entry,
      billingState:
        localBillingStateById.get(Number(entry?.id || 0)) ?? null,
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
