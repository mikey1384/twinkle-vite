import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import useBuildRunIdentity, {
  getSharedBuildRunIdentityState,
  type BuildRunMode,
  type SharedBuildRunIdentityState
} from './useBuildRunIdentity';
import useBuildProjectFileDrafts from './useBuildProjectFileDrafts';
import useBuildEditorMutableState from './useBuildEditorMutableState';
import useBuildRunOrchestration from './useBuildRunOrchestration';
import useRuntimeBuildFollowUp from './useRuntimeBuildFollowUp';
import useSharedBuildRunReconciliation from './useSharedBuildRunReconciliation';
import type {
  PreviewPanelHandle,
  PreviewRuntimeUploadsSyncPayload
} from './PreviewPanel/types';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import BuildDescriptionModal from './BuildDescriptionModal';
import BuildThumbnailModal from './BuildThumbnailModal';
import type { BuildCapabilitySnapshot } from './capabilityTypes';
import type {
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
import {
  cloudFrontURL,
  DEFAULT_PROFILE_THEME
} from '~/constants/defaultValues';
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
const DEDUPED_PROCESSING_RECOVERY_STATUS = 'Recovering live response...';
const STALLED_RUN_RECOVERY_STATUS = 'Resuming live response...';

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
  runtimeExplorationPlan?: BuildRuntimeExplorationPlan | null;
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
  uploadProgressPercent?: number | null;
  billingState?: 'charged' | 'not_charged' | 'pending' | null;
  artifactVersionId?: number | null;
  createdAt: number;
  persisted?: boolean;
  source?: 'runtime_observation';
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

type BuildPlanAction = 'continue' | 'cancel' | 'pivot';

interface BuildScopedPlanContinuePromptBinding {
  kind: 'scoped_plan_continue';
  question?: string | null;
  executionPlan: BuildExecutionPlan;
}

interface BuildFollowUpAcceptPromptBinding {
  kind: 'follow_up_accept';
  question?: string | null;
  suggestedMessage: string;
  sourceMessageId?: number | null;
}

type BuildPromptBinding =
  | BuildScopedPlanContinuePromptBinding
  | BuildFollowUpAcceptPromptBinding;

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
  promptBinding?: BuildPromptBinding | null;
  messageContext?: string | null;
  existingUserMessageId?: number | null;
  waitForStopRequestId?: string | null;
  createdAt: number;
}

interface DeferredBuildRequest {
  message: string;
  messageContext?: string | null;
  planAction?: BuildPlanAction | null;
  stopActiveRun?: boolean | null;
  stopRequestId?: string | null;
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

const BUILD_CHAT_HIDDEN_REFERENCE_CONTEXT_PREFIX = '[[[reference_context]]]';

interface ProjectFileSaveResult {
  success: boolean;
  error?: string;
}

interface ProjectFileSaveOptions {
  resumePausedQueue?: boolean;
  targetBuildId?: number | null;
  targetBuildCode?: string | null;
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
  requestLimits: BuildCopilotPolicy['requestLimits'] | null | undefined
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

interface CurrentBuildRunView {
  requestId: string | null;
  runMode: BuildLiveRunState['runMode'];
  generating: boolean;
  status: string | null;
  assistantStatusSteps: string[];
  usageMetrics: BuildLiveRunState['usageMetrics'];
  runEvents: BuildRunEvent[];
  streamingProjectFiles: Array<{ path: string; content?: string }> | null;
  streamingFocusFilePath: string | null;
  error: string | null;
  terminalState: BuildLiveRunState['terminalState'] | null;
  executionPlan: BuildExecutionPlan | null;
  followUpPrompt: BuildFollowUpPrompt | null;
  runtimeExplorationPlan: BuildRuntimeExplorationPlan | null;
  activeStreamMessageIds: number[];
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

function applyArtifactCodeToProjectFiles({
  projectFiles,
  artifactCode,
  entryPath
}: {
  projectFiles: Array<{ path: string; content?: string }>;
  artifactCode: string;
  entryPath?: string | null;
}) {
  const normalizedProjectFiles = normalizeProjectFilesForBuild(
    projectFiles,
    artifactCode
  );
  const resolvedEntryPath = resolveIndexEntryPathFromProjectFiles(
    normalizedProjectFiles,
    entryPath || '/index.html'
  );
  const entryLookupPath = normalizeProjectFilePath(resolvedEntryPath).toLowerCase();
  let updatedEntry = false;
  const nextProjectFiles = normalizedProjectFiles.map((file) => {
    if (normalizeProjectFilePath(file.path).toLowerCase() !== entryLookupPath) {
      return file;
    }
    updatedEntry = true;
    if (String(file.content || '') === artifactCode) {
      return file;
    }
    return {
      ...file,
      content: artifactCode,
      sizeBytes: artifactCode.length
    };
  });
  if (updatedEntry) {
    return nextProjectFiles;
  }
  return normalizeProjectFilesForBuild(
    [...normalizedProjectFiles, { path: resolvedEntryPath, content: artifactCode }],
    artifactCode
  );
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
    const nextLiveMessage =
      liveMessage.role === 'assistant' &&
      isBuildAssistantPlaceholderContent(liveMessage.content)
        ? {
            ...liveMessage,
            content: ''
          }
        : liveMessage;
    const existingIndex = nextMessages.findIndex((message) => {
      if (message.id === nextLiveMessage.id) return true;
      return doChatMessagesRepresentSameBuildMessage(message, nextLiveMessage);
    });
    if (existingIndex >= 0) {
      const existingMessage = nextMessages[existingIndex];
      const shouldPreserveExistingAssistantContent =
        existingMessage.role === 'assistant' &&
        nextLiveMessage.role === 'assistant' &&
        isBuildAssistantPlaceholderContent(nextLiveMessage.content);
      nextMessages[existingIndex] = {
        ...existingMessage,
        ...nextLiveMessage,
        id: existingMessage.id,
        content: shouldPreserveExistingAssistantContent
          ? existingMessage.content
          : nextLiveMessage.content,
        streamCodePreview: shouldPreserveExistingAssistantContent
          ? (existingMessage.streamCodePreview ?? null)
          : (nextLiveMessage.streamCodePreview ?? null),
        persisted:
          existingMessage.persisted ||
          nextLiveMessage.persisted ||
          false
      };
      continue;
    }
    nextMessages.push({
      ...nextLiveMessage
    });
  }

  nextMessages.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  return nextMessages;
}

function normalizeSharedBuildRunBaseProjectFiles(
  buildRun: BuildLiveRunState | null | undefined
) {
  return Array.isArray(buildRun?.baseProjectFiles)
    ? buildRun.baseProjectFiles.map((file: any) => ({
        path: normalizeProjectFilePath(file.path),
        content: typeof file.content === 'string' ? file.content : ''
      }))
    : [];
}

function mergeDisplayedChatMessages({
  baseMessages,
  supplementalMessages
}: {
  baseMessages: ChatMessage[];
  supplementalMessages: ChatMessage[];
}) {
  if (supplementalMessages.length === 0) {
    return baseMessages;
  }
  const nextMessages = [...baseMessages];
  for (const supplementalMessage of supplementalMessages) {
    if (nextMessages.some((message) => message.id === supplementalMessage.id)) {
      continue;
    }
    nextMessages.push(supplementalMessage);
  }
  nextMessages.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  return nextMessages;
}

function formatTrailingRuntimeObservationMessageContext(
  messages: ChatMessage[]
) {
  const trailingNotes: string[] = [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.source !== 'runtime_observation') {
      break;
    }
    const content = String(message.content || '').trim();
    if (!content) {
      continue;
    }
    trailingNotes.unshift(content);
  }
  if (trailingNotes.length === 0) {
    return '';
  }
  return [
    'RECENT_PREVIEW_CHAT_NOTES:',
    ...trailingNotes.map((note, index) => {
      const normalizedNote = note.replace(/\s*\n\s*/g, '\n').trim();
      return `${index + 1}. ${normalizedNote.replace(/\n/g, '\n   ')}`;
    }),
    'The user may be referring to one of these preview issue notes directly.'
  ].join('\n');
}

function mergeHiddenBuildMessageContext(
  ...parts: Array<string | null | undefined>
) {
  const seen = new Set<string>();
  return parts
    .map((part) => String(part || '').trim())
    .filter((part) => {
      if (!part || seen.has(part)) {
        return false;
      }
      seen.add(part);
      return true;
    })
    .join('\n\n');
}

function mergePersistedChatMessagesIntoLocalMessages({
  localMessages,
  persistedMessages,
  activeUserMessage,
  activeAssistantMessageId,
  preserveActiveAssistantState = false
}: {
  localMessages: ChatMessage[];
  persistedMessages: ChatMessage[];
  activeUserMessage?: ChatMessage | null;
  activeAssistantMessageId?: number | null;
  preserveActiveAssistantState?: boolean;
}) {
  const nextMessages = [...localMessages];
  for (const persistedMessage of persistedMessages) {
    const normalizedPersistedMessage =
      persistedMessage.role === 'assistant' &&
      isBuildAssistantPlaceholderContent(persistedMessage.content)
        ? {
            ...persistedMessage,
            content: ''
          }
        : persistedMessage;
    let existingIndex = nextMessages.findIndex((message) => {
      if (message.id === normalizedPersistedMessage.id) return true;
      return doChatMessagesRepresentSameBuildMessage(
        message,
        normalizedPersistedMessage as BuildLiveRunMessage
      );
    });
    if (existingIndex < 0) {
      existingIndex = nextMessages.findIndex((message) => {
        if (
          message.id !== Number(activeAssistantMessageId || 0) ||
          message.persisted
        ) {
          return false;
        }
        return doesRecoveredBuildAssistantMessageMatchTarget({
          candidateMessage: normalizedPersistedMessage,
          targetMessage: message,
          activeUserMessage
        });
      });
    }
    if (existingIndex >= 0) {
      const existingMessage = nextMessages[existingIndex];
      const isActiveAssistantMessage =
        preserveActiveAssistantState &&
        existingMessage.role === 'assistant' &&
        Number(activeAssistantMessageId || 0) > 0 &&
        (existingMessage.id === Number(activeAssistantMessageId) ||
          normalizedPersistedMessage.id === Number(activeAssistantMessageId));
      const persistedAssistantContent = String(
        normalizedPersistedMessage.content || ''
      ).trim();
      const shouldPreserveLocalAssistantState =
        isActiveAssistantMessage &&
        !String(normalizedPersistedMessage.codeGenerated || '').trim() &&
        Number(normalizedPersistedMessage.artifactVersionId || 0) <= 0 &&
        (!persistedAssistantContent ||
          isBuildAssistantPlaceholderContent(persistedAssistantContent));
      nextMessages[existingIndex] = {
        ...existingMessage,
        ...normalizedPersistedMessage,
        persisted: true,
        content:
          shouldPreserveLocalAssistantState
            ? existingMessage.content
            : normalizedPersistedMessage.content,
        streamCodePreview: shouldPreserveLocalAssistantState
          ? (existingMessage.streamCodePreview ?? null)
          : null
      };
      continue;
    }
    nextMessages.push({
      ...normalizedPersistedMessage,
      persisted: true,
      streamCodePreview: null
    });
  }
  nextMessages.sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id - b.id;
  });
  return nextMessages;
}

function isBuildAssistantPlaceholderContent(content: string) {
  const normalizedContent = String(content || '').trim();
  return (
    !normalizedContent ||
    normalizedContent === 'Would you like me to continue working on this?'
  );
}

function hasBuildAssistantStructuredOutput(
  message:
    | Pick<ChatMessage, 'codeGenerated' | 'artifactVersionId'>
    | null
    | undefined
) {
  return (
    Boolean(String(message?.codeGenerated || '').trim()) ||
    Number(message?.artifactVersionId || 0) > 0
  );
}

function doesRecoveredBuildAssistantMessageMatchTarget({
  candidateMessage,
  targetMessage,
  activeUserMessage
}: {
  candidateMessage: ChatMessage;
  targetMessage: ChatMessage;
  activeUserMessage?: ChatMessage | null;
}) {
  if (
    candidateMessage.role !== 'assistant' ||
    targetMessage.role !== 'assistant'
  ) {
    return false;
  }
  if (!candidateMessage.persisted) {
    return false;
  }
  if (hasBuildAssistantStructuredOutput(targetMessage)) {
    return false;
  }
  const candidateCreatedAt = Number(candidateMessage.createdAt || 0);
  const targetCreatedAt = Number(targetMessage.createdAt || 0);
  if (!candidateCreatedAt || !targetCreatedAt) {
    return false;
  }
  if (Math.abs(candidateCreatedAt - targetCreatedAt) > 5) {
    return false;
  }
  const activeUserCreatedAt = Number(activeUserMessage?.createdAt || 0);
  return (
    activeUserCreatedAt <= 0 || candidateCreatedAt >= activeUserCreatedAt - 5
  );
}

function mergeDuplicateAssistantMessages(
  left: ChatMessage,
  right: ChatMessage
) {
  const leftContent = String(left.content || '').trim();
  const rightContent = String(right.content || '').trim();
  const leftHasStructuredOutput = hasBuildAssistantStructuredOutput(left);
  const rightHasStructuredOutput = hasBuildAssistantStructuredOutput(right);
  const leftHasStreamPreview = Boolean(left.streamCodePreview?.trim());
  const rightHasStreamPreview = Boolean(right.streamCodePreview?.trim());
  const leftHasMeaningfulContent =
    Boolean(leftContent) && !isBuildAssistantPlaceholderContent(leftContent);
  const rightHasMeaningfulContent =
    Boolean(rightContent) && !isBuildAssistantPlaceholderContent(rightContent);
  const preferRight =
    (!leftHasStructuredOutput && rightHasStructuredOutput) ||
    (!leftHasStreamPreview && rightHasStreamPreview) ||
    (!leftHasMeaningfulContent &&
      rightHasMeaningfulContent &&
      !rightHasStructuredOutput) ||
    (leftHasMeaningfulContent === rightHasMeaningfulContent &&
      leftHasStructuredOutput === rightHasStructuredOutput &&
      leftHasStreamPreview === rightHasStreamPreview &&
      rightContent.length > leftContent.length);
  const preferred = preferRight ? right : left;
  const fallback = preferRight ? left : right;

  return {
    ...fallback,
    ...preferred,
    id: preferred.id,
    role: 'assistant' as const,
    content:
      preferred.content ||
      (!isBuildAssistantPlaceholderContent(fallback.content)
        ? fallback.content
        : preferred.content),
    codeGenerated: preferred.codeGenerated ?? fallback.codeGenerated ?? null,
    streamCodePreview:
      preferred.streamCodePreview ?? fallback.streamCodePreview ?? null,
    billingState: preferred.billingState ?? fallback.billingState ?? null,
    artifactVersionId:
      preferred.artifactVersionId ?? fallback.artifactVersionId ?? null,
    createdAt: Math.min(
      Number(left.createdAt || 0) || Number(right.createdAt || 0),
      Number(right.createdAt || 0) || Number(left.createdAt || 0)
    ),
    persisted: Boolean(left.persisted || right.persisted)
  };
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

function findMatchingBuildChatMessageId({
  messages,
  targetMessage,
  activeUserMessage
}: {
  messages: ChatMessage[];
  targetMessage: ChatMessage | null;
  activeUserMessage?: ChatMessage | null;
}) {
  if (!targetMessage) {
    return null;
  }
  const matchedMessage = messages.find((message) => {
    if (message.id === targetMessage.id) {
      return true;
    }
    return doChatMessagesRepresentSameBuildMessage(
      message,
      targetMessage as BuildLiveRunMessage
    );
  });
  if (matchedMessage) {
    return matchedMessage.id || null;
  }
  if (targetMessage.role !== 'assistant') {
    return null;
  }
  const recoveredAssistantMessage = messages.find((message) =>
    doesRecoveredBuildAssistantMessageMatchTarget({
      candidateMessage: message,
      targetMessage,
      activeUserMessage
    })
  );
  return recoveredAssistantMessage?.id || null;
}

function resolveStoppedRunAssistantMessage({
  runMode,
  userRequestedStop
}: {
  runMode: 'user' | 'greeting' | 'runtime-autofix';
  userRequestedStop: boolean;
}) {
  if (userRequestedStop) {
    return runMode === 'user'
      ? 'Stopped before finishing this run. No code changes were saved.'
      : 'Stopped before finishing this run.';
  }
  if (runMode === 'user') {
    return 'I stopped before finishing this run, so no code changes were saved. Please retry your request.';
  }
  return 'I stopped before finishing this run. Please try again.';
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
      Number(left.uploadProgressPercent ?? -1) !==
        Number(right.uploadProgressPercent ?? -1) ||
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

function resolveScopedPlanQuestion(
  plan: BuildExecutionPlan | null | undefined
) {
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

function buildScopedPlanContinuePromptBinding(
  plan: BuildExecutionPlan | null | undefined
): BuildScopedPlanContinuePromptBinding | null {
  if (!plan || plan.status !== 'awaiting_confirmation') {
    return null;
  }
  const question = resolveScopedPlanQuestion(plan);
  return {
    kind: 'scoped_plan_continue',
    question: question || null,
    executionPlan: plan
  };
}

function buildFollowUpAcceptPromptBinding(
  prompt: BuildFollowUpPrompt | null | undefined
): BuildFollowUpAcceptPromptBinding | null {
  const suggestedMessage = String(prompt?.suggestedMessage || '').trim();
  if (!suggestedMessage) {
    return null;
  }
  const question = String(prompt?.question || '').trim();
  const sourceMessageId = Number(prompt?.sourceMessageId || 0);
  return {
    kind: 'follow_up_accept',
    question: question || null,
    suggestedMessage,
    sourceMessageId: sourceMessageId > 0 ? sourceMessageId : null
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
  const getBuildRunIdentity: (
    buildId: number
  ) => SharedBuildRunIdentityState | null = useBuildContext(
    (v) => v.getBuildRunIdentity
  );
  const getLatestBuildRun: (buildId: number) => BuildLiveRunState | null =
    useBuildContext((v) => v.getLatestBuildRun);
  const sharedRuntimeVerifyResults = useBuildContext(
    (v) => v.state.runtimeVerifyResults
  );
  const onRegisterBuildRun = useBuildContext(
    (v) => v.actions.onRegisterBuildRun
  );
  const onUpdateBuildRunStatus = useBuildContext(
    (v) => v.actions.onUpdateBuildRunStatus
  );
  const onAppendBuildRunEvent = useBuildContext(
    (v) => v.actions.onAppendBuildRunEvent
  );
  const onCompleteBuildRun = useBuildContext(
    (v) => v.actions.onCompleteBuildRun
  );
  const onFailBuildRun = useBuildContext((v) => v.actions.onFailBuildRun);
  const onStopBuildRun = useBuildContext((v) => v.actions.onStopBuildRun);
  const onClearBuildRun = useBuildContext((v) => v.actions.onClearBuildRun);
  const onClearBuildRuntimeVerifyResult = useBuildContext(
    (v) => v.actions.onClearBuildRuntimeVerifyResult
  );
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
  const [publishing, setPublishing] = useState(false);
  const [forking, setForking] = useState(false);
  const [descriptionModalShown, setDescriptionModalShown] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [thumbnailModalShown, setThumbnailModalShown] = useState(false);
  const [savingThumbnail, setSavingThumbnail] = useState(false);
  const [thumbnailSaveError, setThumbnailSaveError] = useState('');
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
  const [pageFeedbackEvents, setPageFeedbackEvents] = useState<BuildRunEvent[]>(
    []
  );
  const [buildChatDraftMessage, setBuildChatDraftMessage] = useState('');
  const [buildChatUploadModalShown, setBuildChatUploadModalShown] =
    useState(false);
  const [buildChatUploadFileObj, setBuildChatUploadFileObj] = useState<
    File | File[] | null
  >(null);
  const [buildChatUploadInFlight, setBuildChatUploadInFlight] = useState(false);
  const [dismissedFollowUpPromptKey, setDismissedFollowUpPromptKey] =
    useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<PreviewPanelHandle | null>(null);
  const didInitialChatScrollRef = useRef(false);
  const didAutoPromptRef = useRef(false);
  const didAutoGreetingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior>('auto');
  const scrollRafRef = useRef<number | null>(null);
  const pendingBuildChatUploadClarificationRef = useRef<
    PendingBuildChatUploadClarification[]
  >([]);
  const buildChatUploadProgressMessageIdRef = useRef<number | null>(null);
  const handledSharedTerminalStateKeyRef = useRef('');
  const DEDUPED_PROCESSING_RECONCILE_INTERVAL_MS = 8000;
  const runOrchestration = useBuildRunOrchestration<
    QueuedBuildRequest,
    BuildRunEvent
  >();
  const runIdentity = useBuildRunIdentity();
  const projectFileDrafts = useBuildProjectFileDrafts({
    isOwner,
    normalizeProjectFilePath,
    persistProjectFilesDraft,
    onAppendFeedbackEvent: appendLocalRunEvent
  });
  const sharedRunReconciliation = useSharedBuildRunReconciliation();
  const RUNTIME_AUTOFIX_ENABLED = false;
  const RUNTIME_AUTO_FIX_WINDOW_MS = 12000;
  const RUNTIME_POST_FIX_VERIFICATION_WINDOW_MS = 18000;
  const STALLED_RUN_RESUME_AFTER_MS = 25000;
  const STALLED_RUN_RECOVER_AFTER_MS = 60000;
  const runtimeFollowUp = useRuntimeBuildFollowUp({
    buildId: build.id,
    isOwner,
    runtimeAutoFixEnabled: RUNTIME_AUTOFIX_ENABLED,
    runtimeAutoFixWindowMs: RUNTIME_AUTO_FIX_WINDOW_MS,
    runtimePostFixVerificationWindowMs:
      RUNTIME_POST_FIX_VERIFICATION_WINDOW_MS,
    sharedRuntimeVerifyResults,
    claimRuntimeVerifyResult: sharedRunReconciliation.claimRuntimeVerifyResult,
    onClearBuildRuntimeVerifyResult,
    onAppendLocalRunEvent: appendLocalRunEvent,
    onScrollChatToBottom: scrollChatToBottom,
    onMaybeStartNextQueuedRequest: maybeStartNextQueuedRequest,
    onStartRuntimeAutoFix: startRuntimeAutoFix,
    isRunActivityInFlight
  });
  const mergedPersistedAndLiveChatMessages = mergeChatMessagesWithBuildRun({
    persistedMessages: chatMessages,
    buildRun: sharedBuildRun
  });
  const {
    getLatestBuild,
    applyBuildUpdate,
    getLatestChatMessages,
    replaceChatMessages,
    getLatestCopilotPolicy,
    replaceCopilotPolicy
  } = useBuildEditorMutableState<Build, ChatMessage, BuildCopilotPolicy | null>(
    {
      build,
      chatMessages: mergedPersistedAndLiveChatMessages,
      copilotPolicy,
      onUpdateBuild,
      onUpdateChatMessages,
      onUpdateCopilotPolicy,
      areChatMessagesEqual: chatMessagesEqual
    }
  );
  const mergedChatMessages = mergeDisplayedChatMessages({
    baseMessages: mergedPersistedAndLiveChatMessages,
    supplementalMessages: runtimeFollowUp.runtimeObservationChatNotes
  });
  const sharedRunHasExecutionPlan =
    Boolean(sharedBuildRun) &&
    Object.prototype.hasOwnProperty.call(sharedBuildRun, 'executionPlan');
  const sharedRunHasFollowUpPrompt =
    Boolean(sharedBuildRun) &&
    Object.prototype.hasOwnProperty.call(sharedBuildRun, 'followUpPrompt');
  const sharedRunHasRuntimeExplorationPlan =
    Boolean(sharedBuildRun) &&
    Object.prototype.hasOwnProperty.call(sharedBuildRun, 'runtimeExplorationPlan');
  const sharedFirstExecutionPlan = sharedRunHasExecutionPlan
    ? (sharedBuildRun?.executionPlan ?? null)
    : (build.executionPlan ?? null);
  const sharedFirstFollowUpPrompt = sharedRunHasFollowUpPrompt
    ? (sharedBuildRun?.followUpPrompt ?? null)
    : (build.followUpPrompt ?? null);
  const sharedFirstRuntimeExplorationPlan = sharedRunHasRuntimeExplorationPlan
    ? (sharedBuildRun?.runtimeExplorationPlan ?? null)
    : (build.runtimeExplorationPlan ?? null);
  const currentSharedRunIdentityState =
    getSharedBuildRunIdentityState(sharedBuildRun);
  const currentBuildRunView: CurrentBuildRunView = (() => {
    const sharedGeneratingRun = sharedBuildRun?.generating ? sharedBuildRun : null;
    const activeRequestId = getCurrentActiveRunRequestId(
      currentSharedRunIdentityState
    );
    const hasLocalGeneratingRun =
      !sharedGeneratingRun &&
      runOrchestration.hasCurrentPageRunActivity() &&
      Boolean(activeRequestId);
    const followUpPromptKey = resolveBuildFollowUpPromptKey(
      sharedFirstFollowUpPrompt
    );

    return {
      requestId: activeRequestId || String(sharedBuildRun?.requestId || '').trim() || null,
      runMode:
        sharedBuildRun?.runMode ||
        (activeRequestId
          ? getCurrentRunMode(activeRequestId, currentSharedRunIdentityState)
          : 'user'),
      generating: Boolean(sharedGeneratingRun) || hasLocalGeneratingRun,
      status: sharedBuildRun?.status ?? null,
      assistantStatusSteps: sharedBuildRun?.assistantStatusSteps || [],
      usageMetrics: sharedBuildRun?.usageMetrics || {},
      runEvents: Array.isArray(sharedBuildRun?.runEvents)
        ? sharedBuildRun.runEvents
        : [],
      streamingProjectFiles: sharedGeneratingRun?.streamingProjectFiles ?? null,
      streamingFocusFilePath:
        sharedGeneratingRun?.streamingFocusFilePath ?? null,
      error:
        typeof sharedBuildRun?.error === 'string' && sharedBuildRun.error.trim()
          ? sharedBuildRun.error
          : null,
      terminalState: sharedBuildRun?.terminalState ?? null,
      executionPlan: sharedFirstExecutionPlan,
      followUpPrompt:
        followUpPromptKey && followUpPromptKey === dismissedFollowUpPromptKey
          ? null
          : sharedFirstFollowUpPrompt,
      runtimeExplorationPlan: sharedFirstRuntimeExplorationPlan,
      activeStreamMessageIds: sharedGeneratingRun
        ? [
            getCurrentActiveUserMessageId(
              sharedGeneratingRun.requestId,
              currentSharedRunIdentityState
            ),
            getCurrentActiveAssistantMessageId(
              sharedGeneratingRun.requestId,
              currentSharedRunIdentityState
            )
          ].filter((id): id is number => typeof id === 'number' && id > 0)
        : getActiveStreamMessageIds(currentSharedRunIdentityState)
    };
  })();

  useEffect(() => {
    setBuildChatDraftMessage('');
    setBuildChatUploadModalShown(false);
    setBuildChatUploadFileObj(null);
    setBuildChatUploadInFlight(false);
    setDismissedFollowUpPromptKey('');
    pendingBuildChatUploadClarificationRef.current = [];
    buildChatUploadProgressMessageIdRef.current = null;
  }, [build.id]);

  useEffect(() => {
    if (
      !currentBuildRunView.streamingProjectFiles ||
      currentBuildRunView.streamingProjectFiles.length === 0
    ) {
      return;
    }
    const isMobileWorkspace =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches;
    if (!isMobileWorkspace) {
      setMobilePanelTab('preview');
    }
  }, [currentBuildRunView.streamingProjectFiles]);

  useEffect(() => {
    didInitialChatScrollRef.current = false;
    didAutoPromptRef.current = false;
    didAutoGreetingRef.current = false;
    shouldAutoScrollRef.current = true;
    runOrchestration.reset();
    setDescriptionModalShown(false);
    setThumbnailModalShown(false);
    setSavingThumbnail(false);
    setThumbnailSaveError('');
    setPageFeedbackEvents([]);
    runtimeFollowUp.reset();
    runIdentity.resetRunMode();
    sharedRunReconciliation.reset();
    handledSharedTerminalStateKeyRef.current = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, runOrchestration, sharedRunReconciliation]);

  useEffect(() => {
    if (!sharedBuildRun || sharedBuildRun.generating || !sharedBuildRun.terminalState) {
      return;
    }

    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const activeCurrentPageRequestId = getCurrentActiveRunRequestId(
      currentSharedRunIdentityState
    );
    if (!sharedRequestId || sharedRequestId !== activeCurrentPageRequestId) {
      if (
        sharedRequestId &&
        sharedBuildRun.terminalState &&
        releaseQueuedRequestsWaitingForStop(sharedRequestId)
      ) {
        void Promise.resolve().then(() => maybeStartNextQueuedRequest());
      }
      return;
    }

    const sharedTerminalStateKey = [
      sharedRequestId,
      sharedBuildRun.terminalState
    ].join(':');
    if (handledSharedTerminalStateKeyRef.current === sharedTerminalStateKey) {
      return;
    }
    handledSharedTerminalStateKeyRef.current = sharedTerminalStateKey;

    const normalizedBaseProjectFiles =
      normalizeSharedBuildRunBaseProjectFiles(sharedBuildRun);
    const sharedUserMessage = sharedBuildRun.userMessage;
    const sharedAssistantMessage = sharedBuildRun.assistantMessage;
    const sharedAssistantText = String(sharedAssistantMessage?.content || '').trim();

    if (sharedBuildRun.terminalState === 'complete') {
      const currentBuild = getLatestBuild();
      const shouldApplySharedProjectFiles =
        normalizedBaseProjectFiles.length > 0 &&
        (!currentBuild ||
          !projectFilesEqual(currentBuild.projectFiles, normalizedBaseProjectFiles));
      void applyGenerateComplete({
        requestId: sharedRequestId,
        assistantText: sharedAssistantText || undefined,
        code: sharedAssistantMessage?.codeGenerated ?? null,
        projectFiles: shouldApplySharedProjectFiles
          ? normalizedBaseProjectFiles
          : null,
        interruptionReason: sharedBuildRun.interruptionReason ?? null,
        executionPlan: sharedBuildRun.executionPlan ?? null,
        followUpPrompt: sharedBuildRun.followUpPrompt ?? null,
        deferredBuildRequest: sharedBuildRun.deferredBuildRequest ?? null,
        runtimeExplorationPlan: sharedBuildRun.runtimeExplorationPlan ?? null,
        runtimePlanRefined: Boolean(sharedBuildRun.runtimePlanRefined),
        billingState:
          sharedAssistantMessage?.billingState ?? sharedBuildRun.billingState ?? null,
        message: {
          id: sharedAssistantMessage?.id,
          userMessageId: sharedUserMessage?.id,
          artifactVersionId: sharedAssistantMessage?.artifactVersionId,
          createdAt: sharedAssistantMessage?.createdAt
        }
      });
      return;
    }

    if (sharedBuildRun.terminalState === 'error') {
      void applyGenerateError({
        requestId: sharedRequestId,
        error:
          sharedBuildRun.error ||
          sharedAssistantText ||
          'Failed to generate code.'
      });
      return;
    }

    void applyGenerateStopped({
      requestId: sharedRequestId,
      runMode: sharedBuildRun.runMode,
      assistantText:
        sharedAssistantText &&
        !isBuildAssistantPlaceholderContent(sharedAssistantText)
          ? sharedAssistantMessage?.content
          : undefined
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);

  useEffect(() => {
    if (
      !sharedBuildRun ||
      sharedBuildRun.generating ||
      sharedBuildRun.terminalState !== 'complete'
    ) {
      return;
    }

    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const activeCurrentPageRequestId = getCurrentActiveRunRequestId(
      currentSharedRunIdentityState
    );
    if (
      sharedRequestId &&
      sharedRequestId === activeCurrentPageRequestId
    ) {
      return;
    }

    const currentBuild = getLatestBuild();
    if (!currentBuild) {
      return;
    }

    const normalizedBaseProjectFiles =
      normalizeSharedBuildRunBaseProjectFiles(sharedBuildRun);
    const sharedArtifactCode =
      typeof sharedBuildRun.assistantMessage?.codeGenerated === 'string'
        ? sharedBuildRun.assistantMessage.codeGenerated
        : null;
    const sharedArtifactVersionId =
      Number(sharedBuildRun.assistantMessage?.artifactVersionId || 0) > 0
        ? Number(sharedBuildRun.assistantMessage?.artifactVersionId)
        : null;
    const sharedHasFollowUpPrompt = Object.prototype.hasOwnProperty.call(
      sharedBuildRun,
      'followUpPrompt'
    );
    const nextFollowUpPrompt = sharedHasFollowUpPrompt
      ? (sharedBuildRun.followUpPrompt ?? null)
      : currentBuild.followUpPrompt ?? null;
    const shouldUpdateFollowUpPrompt =
      sharedHasFollowUpPrompt &&
      serializedComparableValue(currentBuild.followUpPrompt ?? null) !==
        serializedComparableValue(nextFollowUpPrompt);
    const sharedHasRuntimeExplorationPlan = Object.prototype.hasOwnProperty.call(
      sharedBuildRun,
      'runtimeExplorationPlan'
    );
    const nextRuntimeExplorationPlan = sharedHasRuntimeExplorationPlan
      ? (sharedBuildRun.runtimeExplorationPlan ?? null)
      : currentBuild.runtimeExplorationPlan ?? null;
    const shouldUpdateRuntimeExplorationPlan =
      sharedHasRuntimeExplorationPlan &&
      serializedComparableValue(currentBuild.runtimeExplorationPlan ?? null) !==
        serializedComparableValue(nextRuntimeExplorationPlan);

    const hasSharedTerminalWorkspaceSnapshot =
      (normalizedBaseProjectFiles.length > 0 ||
        sharedArtifactCode !== null ||
        sharedArtifactVersionId !== null);
    let nextProjectFiles =
      hasSharedTerminalWorkspaceSnapshot &&
      normalizedBaseProjectFiles.length > 0
        ? normalizeProjectFilesForBuild(
            normalizedBaseProjectFiles,
            currentBuild.code || ''
          )
        : currentBuild.projectFiles || [];
    let shouldUpdateProjectFiles =
      hasSharedTerminalWorkspaceSnapshot &&
      normalizedBaseProjectFiles.length > 0 &&
      !projectFilesEqual(currentBuild.projectFiles, nextProjectFiles);

    if (hasSharedTerminalWorkspaceSnapshot && sharedArtifactCode !== null) {
      const nextProjectFilesWithArtifactCode = applyArtifactCodeToProjectFiles({
        projectFiles: nextProjectFiles,
        artifactCode: sharedArtifactCode,
        entryPath: currentBuild.projectManifest?.entryPath || '/index.html'
      });
      if (!projectFilesEqual(nextProjectFiles, nextProjectFilesWithArtifactCode)) {
        shouldUpdateProjectFiles = true;
        nextProjectFiles = nextProjectFilesWithArtifactCode;
      }
    }

    const nextCode =
      hasSharedTerminalWorkspaceSnapshot && sharedArtifactCode !== null
        ? sharedArtifactCode
        : hasSharedTerminalWorkspaceSnapshot &&
            normalizedBaseProjectFiles.length > 0
          ? resolveIndexHtmlFromProjectFiles(
              nextProjectFiles,
              currentBuild.code || ''
            )
          : currentBuild.code || null;
    const nextArtifactVersionId =
      hasSharedTerminalWorkspaceSnapshot
        ? sharedArtifactVersionId ?? currentBuild.currentArtifactVersionId ?? null
        : currentBuild.currentArtifactVersionId ?? null;

    if (
      !shouldUpdateProjectFiles &&
      !shouldUpdateRuntimeExplorationPlan &&
      !shouldUpdateFollowUpPrompt &&
      String(currentBuild.code || '') === String(nextCode || '') &&
      Number(currentBuild.currentArtifactVersionId || 0) ===
        Number(nextArtifactVersionId || 0)
    ) {
      return;
    }

    const nextBuild = {
      ...currentBuild,
      code: nextCode,
      currentArtifactVersionId: nextArtifactVersionId,
      followUpPrompt: nextFollowUpPrompt,
      runtimeExplorationPlan: nextRuntimeExplorationPlan,
      projectManifest: shouldUpdateProjectFiles
        ? {
            entryPath: resolveIndexEntryPathFromProjectFiles(
              nextProjectFiles,
              currentBuild.projectManifest?.entryPath || '/index.html'
            ),
            storageMode: 'project-files',
            fileCount: nextProjectFiles.length
          }
        : currentBuild.projectManifest || null,
      projectFiles: shouldUpdateProjectFiles
        ? nextProjectFiles
        : currentBuild.projectFiles
    };
    applyBuildUpdate(nextBuild);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);

  useEffect(() => {
    if (!sharedBuildRun?.generating) return;
    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const currentRequestId = getCurrentRunRequestId(
      sharedRequestId,
      currentSharedRunIdentityState
    );
    if (!sharedRequestId || !currentRequestId) return;

    adoptPersistedBuildRunMessages({
      userMessageId: sharedBuildRun.userMessage?.id,
      assistantMessageId: sharedBuildRun.assistantMessage?.id,
      assistantMessageCreatedAt: sharedBuildRun.assistantMessage?.createdAt
    });

    const nextMessages = mergeChatMessagesWithBuildRun({
      persistedMessages: getLatestChatMessages(),
      buildRun: sharedBuildRun
    });
    if (!chatMessagesEqual(getLatestChatMessages(), nextMessages)) {
      replaceChatMessages(nextMessages);
    }

    const nextStreamSyncKey = serializedComparableValue({
      requestId: sharedRequestId,
      userMessage: sharedBuildRun.userMessage
        ? {
            id: sharedBuildRun.userMessage.id,
            role: sharedBuildRun.userMessage.role,
            content: sharedBuildRun.userMessage.content,
            codeGenerated: sharedBuildRun.userMessage.codeGenerated,
            streamCodePreview: sharedBuildRun.userMessage.streamCodePreview ?? null,
            createdAt: sharedBuildRun.userMessage.createdAt,
            persisted: Boolean(sharedBuildRun.userMessage.persisted)
          }
        : null,
      assistantMessage: sharedBuildRun.assistantMessage
        ? {
            id: sharedBuildRun.assistantMessage.id,
            role: sharedBuildRun.assistantMessage.role,
            content: sharedBuildRun.assistantMessage.content,
            codeGenerated: sharedBuildRun.assistantMessage.codeGenerated,
            streamCodePreview:
              sharedBuildRun.assistantMessage.streamCodePreview ?? null,
            artifactVersionId:
              sharedBuildRun.assistantMessage.artifactVersionId ?? null,
            createdAt: sharedBuildRun.assistantMessage.createdAt,
            persisted: Boolean(sharedBuildRun.assistantMessage.persisted)
          }
        : null,
      baseProjectFiles: normalizeSharedBuildRunBaseProjectFiles(sharedBuildRun),
      streamingProjectFiles: sharedBuildRun.streamingProjectFiles || null,
      streamingFocusFilePath: sharedBuildRun.streamingFocusFilePath || null
    });
    const {
      isInitialSync: isInitialStreamSync,
      didChange: didStreamSyncChange
    } = sharedRunReconciliation.recordSharedRunStreamSync(nextStreamSyncKey);

    if (!currentRequestId || sharedRequestId !== currentRequestId) {
      return;
    }

    if (isInitialStreamSync) {
      if (!runOrchestration.hasCurrentPageRunActivity()) {
        runIdentity.beginRun({
          requestId: sharedRequestId,
          runMode: sharedBuildRun.runMode || 'user',
          userMessageId: sharedBuildRun.userMessage?.id,
          assistantMessageId: sharedBuildRun.assistantMessage?.id
        });
      }
      markCurrentPageRunActivityActive();
      runOrchestration.clearPendingRunStartEvents();
      markActiveBuildRunActivity(sharedBuildRun.updatedAt);
      return;
    }

    if (!didStreamSyncChange) {
      return;
    }

    markActiveBuildRunActivity(sharedBuildRun.updatedAt);
    resetDedupedProcessingReconcileState();
    maybeAutoScrollDuringStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);

  useEffect(() => {
    if (!sharedBuildRun?.generating) return;
    const sharedRequestId = String(sharedBuildRun.requestId || '').trim();
    const currentRequestId = getCurrentRunRequestId(
      sharedRequestId,
      currentSharedRunIdentityState
    );
    if (!sharedRequestId || sharedRequestId !== currentRequestId) return;
    const nextStatus = String(sharedBuildRun.status || '').trim();
    if (!nextStatus) return;
    if (
      !sharedRunReconciliation.claimSharedRunStatusSync({
        requestId: sharedRequestId,
        status: nextStatus,
        assistantStatusStepCount: sharedBuildRun.assistantStatusSteps.length
      })
    ) {
      return;
    }
    if (nextStatus === DEDUPED_PROCESSING_RECOVERY_STATUS) {
      maybeStartSharedDedupedProcessingRecovery(sharedRequestId);
    } else if (
      !(
        nextStatus === 'Stopping...' &&
        runOrchestration.isDedupedProcessingInFlight(sharedRequestId)
      )
    ) {
      resetDedupedProcessingReconcileState();
    }
    maybeAutoScrollDuringStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedBuildRun]);

  useEffect(() => {
    if (!sharedBuildRun || sharedBuildRun.generating) return;
    if (runOrchestration.isPostCompleteSyncInFlight()) {
      return;
    }
    if (runtimeFollowUp.shouldHoldTerminalSharedBuildRun(sharedBuildRun.requestId)) {
      return;
    }
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
    const sharedHasRuntimeExplorationPlan = Object.prototype.hasOwnProperty.call(
      sharedBuildRun,
      'runtimeExplorationPlan'
    );
    if (
      !sharedRunReconciliation.claimSharedRunReplicaCheck({
        buildId: build.id,
        updatedAt: sharedBuildRun.updatedAt
      })
    ) {
      return;
    }
    let cancelled = false;

    async function maybeClearSharedBuildRun() {
      const sharedHasFollowUpPrompt = Object.prototype.hasOwnProperty.call(
        sharedBuildRun,
        'followUpPrompt'
      );
      const shouldVerifyReplica =
        sharedBuildRun.baseProjectFiles.length > 0 ||
        Object.prototype.hasOwnProperty.call(sharedBuildRun, 'executionPlan') ||
        Number(sharedBuildRun.assistantMessage?.artifactVersionId || 0) > 0 ||
        sharedHasFollowUpPrompt ||
        sharedHasRuntimeExplorationPlan;

      if (shouldVerifyReplica) {
        const buildPayload = await loadBuild(build.id, { fromWriter: true });
        if (cancelled) return;
        if (!buildPayload?.build) {
          sharedRunReconciliation.resetSharedRunReplicaCheck();
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
        const replicaFollowUpPrompt = buildPayload.followUpPrompt || null;
        const replicaRuntimeExplorationPlan =
          buildPayload.runtimeExplorationPlan || null;

        if (
          (hasExpectedProjectFiles &&
            !projectFilesEqual(replicaProjectFiles, expectedProjectFiles)) ||
          (expectedArtifactVersionId !== null &&
            replicaArtifactVersionId !== expectedArtifactVersionId) ||
          (hasExpectedExecutionPlan &&
            serializedComparableValue(replicaExecutionPlan) !==
              serializedComparableValue(sharedBuildRun.executionPlan ?? null)) ||
          (sharedHasFollowUpPrompt &&
            serializedComparableValue(replicaFollowUpPrompt) !==
              serializedComparableValue(sharedBuildRun.followUpPrompt ?? null)) ||
          (sharedHasRuntimeExplorationPlan &&
            serializedComparableValue(replicaRuntimeExplorationPlan) !==
              serializedComparableValue(
                sharedBuildRun.runtimeExplorationPlan ?? null
              ))
        ) {
          sharedRunReconciliation.resetSharedRunReplicaCheck();
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
  }, [
    build.id,
    chatMessages,
    runtimeFollowUp.runtimeFollowUpRevision,
    sharedBuildRun
  ]);

  useEffect(() => {
    const normalizedFiles = normalizeProjectFilesForBuild(
      build.projectFiles || [],
      build.code || ''
    );
    projectFileDrafts.resetDraftState(normalizedFiles);
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
    if (!sharedBuildRun?.generating) return;

    const interval = window.setInterval(() => {
      const requestId = getCurrentPageRunActivityRequestId(
        getBuildRunIdentity(Number(getLatestBuild()?.id || build.id))
      );
      if (!requestId) return;
      const inactivityMs = runOrchestration.getRunInactivityMs();
      if (inactivityMs >= STALLED_RUN_RESUME_AFTER_MS) {
        maybeResumeActiveBuildRun();
      }
      if (inactivityMs >= STALLED_RUN_RECOVER_AFTER_MS) {
        recoverStalledActiveBuildRun(requestId);
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.id,
    sharedBuildRun?.generating,
    sharedBuildRun?.requestId
  ]);

  useEffect(() => {
    if (didAutoPromptRef.current) return;
    if (AI_FEATURES_DISABLED) return;
    if (!isOwner) return;
    const prompt = initialPrompt.trim();
    if (!prompt) return;
    if (getLatestChatMessages().length > 0) return;
    didAutoPromptRef.current = true;
    void startGeneration(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, isOwner, initialPrompt]);

  useEffect(() => {
    if (didAutoGreetingRef.current) return;
    if (AI_FEATURES_DISABLED) return;
    if (!isOwner) return;
    if (!seedGreeting) return;
    if (initialPrompt.trim()) return;
    if (getLatestChatMessages().length > 0) return;
    didAutoGreetingRef.current = true;
    void startGreetingGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.id,
    initialPrompt,
    isOwner,
    seedGreeting
  ]);

  useEffect(() => {
    if (didInitialChatScrollRef.current) return;
    didInitialChatScrollRef.current = true;
    scrollChatToBottom('auto', { force: true });
  }, [mergedChatMessages.length, build.id]);

  async function applyGenerateComplete({
    requestId,
    assistantText,
    artifact,
    code,
    projectFiles,
    interruptionReason,
    executionPlan,
    followUpPrompt,
    deferredBuildRequest,
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
    interruptionReason?: 'tool_limit' | null;
    executionPlan?: BuildExecutionPlan | null;
    followUpPrompt?: BuildFollowUpPrompt | null;
    deferredBuildRequest?: DeferredBuildRequest | null;
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
    const latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    const currentRequestId = getCurrentRunRequestId(
      requestId,
      latestSharedRunIdentityState
    );
    if (!requestId || requestId !== currentRequestId) return;
    markActiveBuildRunActivity();
    resetDedupedProcessingReconcileState();
    const completedRunMode = getCurrentRunMode(
      requestId,
      latestSharedRunIdentityState
    );
    const userMessageTempId = getCurrentActiveUserMessageId(
      requestId,
      latestSharedRunIdentityState
    );
    const assistantId = getCurrentActiveAssistantMessageId(
      requestId,
      latestSharedRunIdentityState
    );
    const currentMessages = getLatestChatMessages();
    const artifactCode = artifact?.content ?? code ?? null;
    const payloadProjectFiles = Array.isArray(projectFiles)
      ? normalizeProjectFilesForBuild(
          projectFiles,
          artifactCode ?? getLatestBuild()?.code ?? ''
        )
      : null;
    const artifactVersionId =
      message?.artifactVersionId ?? artifact?.versionId ?? null;
    const createdAt = message?.createdAt ?? Math.floor(Date.now() / 1000);
    const hasFollowUpPromptField = Object.prototype.hasOwnProperty.call(
      arguments[0] || {},
      'followUpPrompt'
    );
    const hasRuntimeExplorationPlanField = Object.prototype.hasOwnProperty.call(
      arguments[0] || {},
      'runtimeExplorationPlan'
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
      followUpPrompt: hasFollowUpPromptField
        ? (followUpPrompt ?? null)
        : undefined,
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

    replaceChatMessages(nextMessages);

    if (artifactCode !== null || payloadProjectFiles) {
      const activeBuild = getLatestBuild();
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
              [...nextProjectFiles, { path: entryPath, content: artifactCode }],
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
          runtimeExplorationPlan: hasRuntimeExplorationPlanField
            ? runtimeExplorationPlan || null
            : activeBuild.runtimeExplorationPlan || null,
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
        applyBuildUpdate(nextBuild);
        if (payloadProjectFiles) {
          runOrchestration.setRequiresProjectFilesResyncBeforeSave(false);
        } else if (completionUsedFallbackProjectFiles) {
          runOrchestration.setRequiresProjectFilesResyncBeforeSave(true);
        }
      }
    } else if (
      getLatestBuild() &&
      ((executionPlan !== undefined &&
        getLatestBuild().executionPlan !== (executionPlan || null)) ||
        (hasFollowUpPromptField &&
          getLatestBuild().followUpPrompt !== (followUpPrompt || null)) ||
        (hasRuntimeExplorationPlanField &&
          serializedComparableValue(
            getLatestBuild().runtimeExplorationPlan ?? null
          ) !== serializedComparableValue(runtimeExplorationPlan || null)))
    ) {
      const nextBuild = {
        ...getLatestBuild(),
        executionPlan:
          executionPlan !== undefined
            ? executionPlan || null
            : getLatestBuild().executionPlan || null,
        followUpPrompt: hasFollowUpPromptField
          ? followUpPrompt || null
          : getLatestBuild().followUpPrompt || null,
        runtimeExplorationPlan: hasRuntimeExplorationPlanField
          ? runtimeExplorationPlan || null
          : getLatestBuild().runtimeExplorationPlan || null
      };
      applyBuildUpdate(nextBuild);
    }
    const generatedCodeSuccessfully =
      artifactCode !== null ||
      (Array.isArray(payloadProjectFiles) && payloadProjectFiles.length > 0);
    const pausedForToolLimit = interruptionReason === 'tool_limit';
    const planWasRefined = Boolean(runtimePlanRefined && runtimeExplorationPlan);
    if (generatedCodeSuccessfully || planWasRefined) {
      setMobilePanelTab('preview');
    } else {
      setMobilePanelTab('chat');
    }
    const shouldDelayQueuedRequestsForRuntimeFollowUp =
      runtimeFollowUp.handleCompletedRunFollowUp({
        completedRunMode,
        requestId: requestId || null,
        artifactVersionId,
        generatedCodeSuccessfully,
        pausedForToolLimit,
        planWasRefined
      });

    runIdentity.clearRunOwnership();
    runOrchestration.setUserRequestedStop(false);
    clearCurrentPageRunActivity();
    runIdentity.resetRunMode();
    scrollChatToBottom();
    runOrchestration.setPostCompleteSyncInFlight(true);
    runtimeFollowUp.bumpRuntimeFollowUpRevision();
    try {
      await syncChatMessagesFromServer(undefined, true);
      runOrchestration.setRequiresProjectFilesResyncBeforeSave(false);
    } catch (error) {
      console.error('Failed to sync chat messages after completion:', error);
      if (runOrchestration.requiresProjectFilesResyncBeforeSave()) {
        appendLocalRunEvent({
          kind: 'status',
          phase: 'completed',
          message:
            'Build completed, but project file sync is pending. Save is temporarily blocked until a refresh succeeds.',
          targetRequestId: requestId || null
        });
      }
    } finally {
      runOrchestration.setPostCompleteSyncInFlight(false);
      runtimeFollowUp.bumpRuntimeFollowUpRevision();
    }
    if (runtimeFollowUp.processPendingRuntimeFollowUp()) {
      return;
    }
    let shouldHoldQueuedRequestForDeferredStop = false;
    if (deferredBuildRequest?.message?.trim()) {
      const deferredStopRequestId =
        String(deferredBuildRequest.stopRequestId || '').trim() || null;
      shouldHoldQueuedRequestForDeferredStop = Boolean(
        deferredBuildRequest.stopActiveRun === true && deferredStopRequestId
      );
      enqueueLatestBuildRequest(deferredBuildRequest.message, {
        messageContext: deferredBuildRequest.messageContext || null,
        planAction: deferredBuildRequest.planAction || null,
        stopActiveRun: deferredBuildRequest.stopActiveRun === true,
        stopRequestId: deferredStopRequestId
      });
      if (
        shouldHoldQueuedRequestForDeferredStop &&
        deferredStopRequestId &&
        releaseQueuedRequestsIfStopTargetAlreadySettled(deferredStopRequestId)
      ) {
        shouldHoldQueuedRequestForDeferredStop = false;
      }
    }
    if (
      !shouldDelayQueuedRequestsForRuntimeFollowUp &&
      !shouldHoldQueuedRequestForDeferredStop
    ) {
      await maybeStartNextQueuedRequest();
    }
  }

  async function applyGenerateError({
    requestId,
    error,
    requestLimits
  }: {
    requestId?: string;
    error?: string;
    requestLimits?: BuildCopilotPolicy['requestLimits'] | null;
  }) {
    const latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    const currentRequestId = getCurrentRunRequestId(
      requestId,
      latestSharedRunIdentityState
    );
    if (!requestId || requestId !== currentRequestId) return;
    markActiveBuildRunActivity();
    resetDedupedProcessingReconcileState();
    runtimeFollowUp.resetRuntimeHealthFollowUpState();
    const assistantId = getCurrentActiveAssistantMessageId(
      requestId,
      latestSharedRunIdentityState
    );
    const errorMessage = error || 'Failed to generate code.';
    const shouldPreserveAssistantArtifacts = Boolean(
      assistantId &&
        getLatestChatMessages().some(
          (entry) =>
            entry.id === assistantId &&
            entry.role === 'assistant' &&
            (Number(entry.artifactVersionId || 0) > 0 ||
              (typeof entry.codeGenerated === 'string' &&
                entry.codeGenerated.trim().length > 0))
        )
    );
    const nextPolicy = applyRequestLimitsToCopilotPolicy(
      getLatestCopilotPolicy(),
      requestLimits
    );
    if (nextPolicy) {
      replaceCopilotPolicy(nextPolicy);
    }
    if (!shouldPreserveAssistantArtifacts) {
      const nextAssistantId = upsertLocalBuildChatAssistantMessage(
        assistantId,
        errorMessage
      );
      if (nextAssistantId) {
        runIdentity.setAssistantMessageId(nextAssistantId);
      }
    }
    onFailBuildRun({
      requestId,
      error: errorMessage,
      assistantText: errorMessage,
      preserveAssistantArtifactsOnError: shouldPreserveAssistantArtifacts,
      preserveTransientUserMessage: true,
      preserveTransientAssistantMessage: true
    });
    setMobilePanelTab('chat');
    clearCurrentPageRunActivity();
    runOrchestration.setPostCompleteSyncInFlight(true);
    runtimeFollowUp.bumpRuntimeFollowUpRevision();
    try {
      await syncChatMessagesFromServer(undefined, true, {
        preserveLocalMessages: true
      });
    } catch (syncError) {
      console.error('Failed to sync chat messages after error:', syncError);
    } finally {
      runOrchestration.setPostCompleteSyncInFlight(false);
      runtimeFollowUp.bumpRuntimeFollowUpRevision();
    }
    runIdentity.clearRunOwnership();
    runOrchestration.setUserRequestedStop(false);
    runIdentity.resetRunMode();
    scrollChatToBottom();
    void Promise.resolve().then(() => maybeStartNextQueuedRequest());
  }

  async function applyGenerateStopped({
    requestId,
    deduped,
    guardStatus,
    runMode,
    assistantText
  }: {
    requestId?: string;
    deduped?: boolean;
    guardStatus?: 'processing' | 'completed' | 'conflict';
    runMode?: BuildRunMode;
    assistantText?: string;
  }) {
    const normalizedRequestId = String(requestId || '').trim();
    const releasedQueuedStop =
      guardStatus !== 'processing'
        ? releaseQueuedRequestsWaitingForStop(normalizedRequestId)
        : false;
    const latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    const currentRequestId = getCurrentRunRequestId(
      normalizedRequestId,
      latestSharedRunIdentityState
    );
    if (!normalizedRequestId || normalizedRequestId !== currentRequestId) {
      if (releasedQueuedStop) {
        await maybeStartNextQueuedRequest();
      }
      return;
    }
    markActiveBuildRunActivity();
    const stoppedRunMode =
      runMode ||
      getCurrentRunMode(normalizedRequestId, latestSharedRunIdentityState);
    const userRequestedStop = runOrchestration.didUserRequestStop();
    if (deduped) {
      resetDedupedProcessingReconcileState();
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      let shouldStartQueuedRequest = true;
      if (guardStatus === 'completed') {
        runOrchestration.setUserRequestedStop(false);
        try {
          await syncChatMessagesFromServer(undefined, true);
        } catch (error) {
          console.error(
            'Failed to sync chat messages after deduped completed stop:',
            error
          );
        } finally {
          runIdentity.clearRunOwnership();
        }
      } else if (guardStatus === 'processing') {
        runOrchestration.setUserRequestedStop(userRequestedStop);
        // Keep request refs live and recover through canonical shared replay.
        shouldStartQueuedRequest = false;
        if (!userRequestedStop) {
          const nextAssistantId = upsertLocalBuildChatAssistantMessage(
            getCurrentActiveAssistantMessageId(
              normalizedRequestId,
              latestSharedRunIdentityState
            ),
            'I lost the live response for this run, but another Lumine worker still reports it in progress. I am trying to recover the latest result.'
          );
          if (nextAssistantId) {
            runIdentity.setAssistantMessageId(nextAssistantId);
          }
        }
        markCurrentPageRunActivityActive();
        onUpdateBuildRunStatus({
          requestId: normalizedRequestId,
          status: userRequestedStop
            ? 'Stopping...'
            : DEDUPED_PROCESSING_RECOVERY_STATUS
        });
        setMobilePanelTab('chat');
        scrollChatToBottom();
        beginDedupedProcessingRecovery(normalizedRequestId);
        return;
      } else {
        runOrchestration.setUserRequestedStop(false);
        try {
          await syncChatMessagesFromServer(undefined, true);
        } catch (error) {
          console.error(
            'Failed to sync chat messages after deduped stop:',
            error
          );
        } finally {
          runIdentity.clearRunOwnership();
        }
      }
      clearCurrentPageRunActivity();
      onStopBuildRun({
        requestId: normalizedRequestId,
        preserveTransientUserMessage: true,
        preserveTransientAssistantMessage: true
      });
      setMobilePanelTab('chat');
      runIdentity.resetRunMode();
      scrollChatToBottom();
      if (shouldStartQueuedRequest) {
        await maybeStartNextQueuedRequest();
      }
      return;
    }
    runOrchestration.setUserRequestedStop(false);
    resetDedupedProcessingReconcileState();
    runtimeFollowUp.resetRuntimeHealthFollowUpState();
    const stopMessage =
      typeof assistantText === 'string' && assistantText.trim().length > 0
        ? assistantText
        : resolveStoppedRunAssistantMessage({
            runMode: stoppedRunMode,
            userRequestedStop
          });
    const nextAssistantId = upsertLocalBuildChatAssistantMessage(
      getCurrentActiveAssistantMessageId(
        normalizedRequestId,
        latestSharedRunIdentityState
      ),
      stopMessage
    );
    if (nextAssistantId) {
      runIdentity.setAssistantMessageId(nextAssistantId);
    }
    onStopBuildRun({
      requestId: normalizedRequestId,
      assistantText: stopMessage,
      preserveTransientUserMessage: true,
      preserveTransientAssistantMessage: true
    });
    setMobilePanelTab('chat');
    clearCurrentPageRunActivity();
    runIdentity.resetRunMode();
    runOrchestration.setPostCompleteSyncInFlight(true);
    runtimeFollowUp.bumpRuntimeFollowUpRevision();
    try {
      await syncChatMessagesFromServer(undefined, true, {
        preserveLocalMessages: true
      });
    } catch (error) {
      console.error('Failed to sync chat messages after stop:', error);
    } finally {
      runOrchestration.setPostCompleteSyncInFlight(false);
      runtimeFollowUp.bumpRuntimeFollowUpRevision();
    }
    runIdentity.clearRunOwnership();
    scrollChatToBottom();
    await maybeStartNextQueuedRequest();
  }

  function clearBufferedRunStartEvents() {
    runOrchestration.clearPendingRunStartEvents();
  }

  function flushBufferedRunStartEvents(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    const buildId = Number(getLatestBuild()?.id || build.id);
    const bufferedEvents = runOrchestration.consumePendingRunStartEvents();
    if (!normalizedRequestId || !Number.isFinite(buildId) || buildId <= 0) {
      return;
    }
    for (const event of bufferedEvents) {
      onAppendBuildRunEvent({
        buildId,
        requestId: normalizedRequestId,
        event
      });
    }
  }

  function flushBufferedRunStartEventsToPageFeedback() {
    const bufferedEvents = runOrchestration.consumePendingRunStartEvents();
    if (!bufferedEvents.length) {
      return;
    }
    setPageFeedbackEvents((prev) => {
      let nextEvents = prev;
      for (const event of bufferedEvents) {
        const lastEvent = nextEvents[nextEvents.length - 1];
        if (
          lastEvent &&
          lastEvent.kind === event.kind &&
          lastEvent.phase === event.phase &&
          lastEvent.message === event.message
        ) {
          nextEvents = [...nextEvents.slice(0, -1), event];
          continue;
        }
        nextEvents = [...nextEvents, event].slice(-8);
      }
      return nextEvents;
    });
  }

  function resolveBuildRunEventTargetRequestId(
    sharedRunState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    )
  ) {
    const activeRequestId = getCurrentActiveRunRequestId(sharedRunState);
    if (activeRequestId) {
      return activeRequestId;
    }
    const sharedRequestId = String(sharedRunState?.requestId || '').trim();
    if (!sharedRequestId) {
      return '';
    }
    if (
      sharedRunState?.generating ||
      runOrchestration.isPostCompleteSyncInFlight() ||
      runtimeFollowUp.shouldHoldTerminalSharedBuildRun(sharedRequestId)
    ) {
      return sharedRequestId;
    }
    return '';
  }

  function normalizeQueuedMessage(message: string) {
    return message.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function appendPageFeedbackEvent(event: BuildRunEvent) {
    setPageFeedbackEvents((prev) => {
      const lastEvent = prev[prev.length - 1];
      if (
        lastEvent &&
        lastEvent.kind === event.kind &&
        lastEvent.phase === event.phase &&
        lastEvent.message === event.message
      ) {
        return [...prev.slice(0, -1), event];
      }
      return [...prev, event].slice(-8);
    });
  }

  function appendLocalRunEvent({
    kind,
    phase,
    message,
    targetRequestId = null,
    pageFeedbackOnMissingRequestId = false
  }: {
    kind: BuildRunEvent['kind'];
    phase: string | null;
    message: string;
    targetRequestId?: string | null;
    pageFeedbackOnMissingRequestId?: boolean;
  }) {
    const createdAt = Date.now();
    const explicitRequestId = String(targetRequestId || '').trim();
    const nextEvent: BuildRunEvent = {
      id: `${createdAt}-${kind}-${message}`,
      kind,
      phase,
      message,
      createdAt
    };
    if (explicitRequestId) {
      onAppendBuildRunEvent({
        buildId: Number(getLatestBuild()?.id || build.id),
        requestId: explicitRequestId,
        event: nextEvent
      });
      return;
    }
    if (pageFeedbackOnMissingRequestId) {
      appendPageFeedbackEvent(nextEvent);
      return;
    }
    const requestId = resolveBuildRunEventTargetRequestId();
    if (requestId) {
      onAppendBuildRunEvent({
        buildId: Number(getLatestBuild()?.id || build.id),
        requestId,
        event: nextEvent
      });
      return;
    }
    if (runOrchestration.isStartingGeneration()) {
      runOrchestration.bufferPendingRunStartEvent(nextEvent);
    }
  }

  function updateQueuedRequests(next: QueuedBuildRequest[]) {
    runOrchestration.setQueuedRequests(next);
  }

  function releaseQueuedRequestsWaitingForStop(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return false;

    const existing = runOrchestration.getQueuedRequests();
    let changed = false;
    const next = existing.map((entry) => {
      if (
        String(entry.waitForStopRequestId || '').trim() !== normalizedRequestId
      ) {
        return entry;
      }
      changed = true;
      return {
        ...entry,
        waitForStopRequestId: null
      };
    });

    if (changed) {
      updateQueuedRequests(next);
    }
    return changed;
  }

  function releaseQueuedRequestsIfStopTargetAlreadySettled(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return false;
    const activeBuildId = Number(getLatestBuild()?.id || build.id);
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return false;
    const latestBuildRun = getLatestBuildRun(activeBuildId);
    if (
      String(latestBuildRun?.requestId || '').trim() !== normalizedRequestId ||
      latestBuildRun?.generating ||
      !latestBuildRun?.terminalState
    ) {
      return false;
    }
    return releaseQueuedRequestsWaitingForStop(normalizedRequestId);
  }

  function getCurrentActiveRunRequestId(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentActiveRunRequestId(
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function getCurrentRunRequestId(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentRunRequestId(
      requestId,
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function getCurrentRunMode(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ): BuildRunMode {
    return runIdentity.getCurrentRunMode(requestId, sharedRunState);
  }

  function getCurrentActiveUserMessageId(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentActiveUserMessageId(
      requestId,
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function getCurrentActiveAssistantMessageId(
    requestId?: string | null,
    sharedRunState = currentSharedRunIdentityState
  ) {
    return runIdentity.getCurrentActiveAssistantMessageId(
      requestId,
      sharedRunState,
      runOrchestration.hasCurrentPageRunActivity()
    );
  }

  function markCurrentPageRunActivityActive() {
    runOrchestration.markCurrentPageRunActive();
  }

  function clearCurrentPageRunActivity() {
    runOrchestration.clearCurrentPageRunActive();
  }

  function getCurrentPageRunActivityRequestId(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return getCurrentActiveRunRequestId(sharedRunState);
  }

  function hasCurrentPageRunActivity(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return Boolean(getCurrentPageRunActivityRequestId(sharedRunState));
  }

  function hasSharedGeneratingRun(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return Boolean(sharedRunState?.generating);
  }

  function isRunActivityInFlight({
    includeBootstrap = true,
    sharedRunState = currentSharedRunIdentityState
  }: {
    includeBootstrap?: boolean;
    sharedRunState?: SharedBuildRunIdentityState | null;
  } = {}) {
    return (
      (includeBootstrap && runOrchestration.isStartingGeneration()) ||
      hasSharedGeneratingRun(sharedRunState) ||
      runOrchestration.isDedupedProcessingInFlight() ||
      hasCurrentPageRunActivity(sharedRunState) ||
      runOrchestration.isPostCompleteSyncInFlight()
    );
  }

  function enqueueLatestBuildRequest(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
      stopActiveRun?: boolean;
      stopRequestId?: string | null;
    }
  ) {
    const trimmed = String(messageText || '').trim();
    const trimmedMessageContext = String(options?.messageContext || '').trim();
    const stopRequestId = String(options?.stopRequestId || '').trim() || null;
    if (!trimmed) return;
    const normalized = normalizeQueuedMessage(trimmed);
    const activeMessage = normalizeQueuedMessage(
      String(
        getLatestChatMessages().find(
          (entry) =>
            entry.id ===
            getCurrentActiveUserMessageId(
              undefined,
              currentSharedRunIdentityState
            )
        )?.content || ''
      )
    );
    const activeMessageContext = normalizeQueuedMessage(
      String(runIdentity.getMessageContext() || '')
    );
    const normalizedMessageContext = normalizeQueuedMessage(
      trimmedMessageContext
    );
    const existing = runOrchestration.getQueuedRequests();
    const shouldStopActiveRun = options?.stopActiveRun !== false;
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
        promptBinding: options?.promptBinding || null,
        messageContext: trimmedMessageContext || null,
        existingUserMessageId:
          Number(options?.existingUserMessageId || 0) || null,
        waitForStopRequestId: shouldStopActiveRun ? stopRequestId : null
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
        promptBinding: options?.promptBinding || null,
        messageContext: trimmedMessageContext || null,
        existingUserMessageId:
          Number(options?.existingUserMessageId || 0) || null,
        waitForStopRequestId: shouldStopActiveRun ? stopRequestId : null,
        createdAt: Date.now()
      }
    ]);
    appendLocalRunEvent({
      kind: 'action',
      phase: shouldStopActiveRun ? 'stopping' : 'queued',
      message: shouldStopActiveRun
        ? 'Switching to your latest request...'
        : 'Queued your next request.'
    });
    if (shouldStopActiveRun) {
      if (stopRequestId) {
        requestStopForRecoveredBuildRun(stopRequestId);
      } else if (
        hasCurrentPageRunActivity(
          getBuildRunIdentity(Number(getLatestBuild()?.id || build.id))
        )
      ) {
        handleStopGeneration();
      }
    }
  }

  async function maybeStartNextQueuedRequest() {
    if (runtimeFollowUp.hasPendingRuntimeFollowUp()) {
      return;
    }
    const latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    if (isRunActivityInFlight({ sharedRunState: latestSharedRunIdentityState })) {
      return;
    }
    const [nextRequest, ...rest] = runOrchestration.getQueuedRequests();
    if (!nextRequest) return;
    const waitForStopRequestId = String(
      nextRequest.waitForStopRequestId || ''
    ).trim();
    if (
      waitForStopRequestId &&
      (String(latestSharedRunIdentityState?.requestId || '').trim() !==
        waitForStopRequestId ||
        latestSharedRunIdentityState?.generating)
    ) {
      return;
    }
    updateQueuedRequests(rest);
    appendLocalRunEvent({
      kind: 'status',
      phase: 'queued',
      message: 'Starting your latest request.'
    });
    const started = await startGeneration(nextRequest.message, {
      planAction: nextRequest.planAction || null,
      promptBinding: nextRequest.promptBinding || null,
      messageContext: nextRequest.messageContext || null,
      existingUserMessageId: nextRequest.existingUserMessageId || null
    });
    if (!started) {
      runOrchestration.setQueuePausedForSave(true);
      updateQueuedRequests([nextRequest, ...runOrchestration.getQueuedRequests()]);
      appendLocalRunEvent({
        kind: 'status',
        phase: 'queued',
        message: 'Waiting for file edits to save before continuing.'
      });
      return;
    }
    runOrchestration.setQueuePausedForSave(false);
  }

  function maybeResumePausedQueueAfterSave() {
    if (!runOrchestration.isQueuePausedForSave()) return;
    if (
      isRunActivityInFlight({
        sharedRunState: getBuildRunIdentity(
          Number(getLatestBuild()?.id || build.id)
        )
      })
    ) {
      return;
    }
    runOrchestration.setQueuePausedForSave(false);
    void Promise.resolve().then(() => maybeStartNextQueuedRequest());
  }

  async function handleSendMessage(messageText: string) {
    return await sendBuildMessageText(messageText);
  }

  async function handleContinueScopedPlan() {
    if (!isOwner) return;
    const promptBinding = buildScopedPlanContinuePromptBinding(
      currentBuildRunView.executionPlan
    );
    if (!promptBinding) return;
    await sendBuildMessageText('Continue current plan.', {
      planAction: 'continue',
      promptBinding
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
    const promptBinding = buildFollowUpAcceptPromptBinding(
      currentBuildRunView.followUpPrompt
    );
    if (!promptBinding) return;
    await sendBuildMessageText(promptBinding.suggestedMessage, {
      promptBinding
    });
  }

  function handleDismissFollowUpPrompt() {
    const nextKey = resolveBuildFollowUpPromptKey(
      currentBuildRunView.followUpPrompt
    );
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
    if (
      targetBuildId > 0 &&
      Number(getLatestBuild()?.id || 0) !== targetBuildId
    ) {
      return;
    }
    const existingIds = new Set(
      getLatestChatMessages().map((entry) => entry.id)
    );
    if (existingIds.has(persistedMessage.id)) {
      return;
    }
    const nextMessages = [...getLatestChatMessages(), persistedMessage].sort(
      (a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt - b.createdAt;
        }
        return a.id - b.id;
      }
    );
    replaceChatMessages(nextMessages);
    shouldAutoScrollRef.current = true;
    scrollChatToBottom('smooth', { force: true });
  }

  function appendLocalBuildChatAssistantMessage(text: string) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return null;
    }
    const messageId = Date.now() + Math.floor(Math.random() * 1000);
    const nextMessage: ChatMessage = {
      id: messageId,
      role: 'assistant',
      content: trimmedText,
      codeGenerated: null,
      billingState: null,
      streamCodePreview: null,
      uploadProgressPercent: 6,
      createdAt: Math.floor(Date.now() / 1000),
      persisted: false
    };
    const nextMessages = [...getLatestChatMessages(), nextMessage].sort(
      (a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt - b.createdAt;
        }
        return a.id - b.id;
      }
    );
    replaceChatMessages(nextMessages);
    shouldAutoScrollRef.current = true;
    scrollChatToBottom('smooth', { force: true });
    return messageId;
  }

  function clampBuildChatUploadProgressPercent(
    value: number | null | undefined
  ) {
    if (!Number.isFinite(Number(value))) {
      return null;
    }
    return Math.max(0, Math.min(100, Math.round(Number(value))));
  }

  function updateLocalBuildChatMessage(
    messageId: number | null,
    options: {
      text?: string;
      uploadProgressPercent?: number | null;
    }
  ) {
    if (!messageId) return;
    const nextText = Object.prototype.hasOwnProperty.call(options, 'text')
      ? String(options.text || '').trim()
      : null;
    const nextProgress = Object.prototype.hasOwnProperty.call(
      options,
      'uploadProgressPercent'
    )
      ? clampBuildChatUploadProgressPercent(options.uploadProgressPercent)
      : null;
    const nextMessages = getLatestChatMessages().map((entry) =>
      entry.id === messageId
        ? {
            ...entry,
            ...(nextText !== null ? { content: nextText } : null),
            ...(Object.prototype.hasOwnProperty.call(
              options,
              'uploadProgressPercent'
            )
              ? { uploadProgressPercent: nextProgress }
              : null)
          }
        : entry
    );
    replaceChatMessages(nextMessages);
  }

  function upsertLocalBuildChatAssistantMessage(
    messageId: number | null,
    text: string
  ) {
    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      return messageId;
    }
    if (
      messageId &&
      getLatestChatMessages().some((entry) => entry.id === messageId)
    ) {
      const nextMessages = getLatestChatMessages().map((entry) =>
        entry.id === messageId
          ? {
              ...entry,
              role: 'assistant' as const,
              content: trimmedText,
              codeGenerated: null,
              streamCodePreview: null,
              artifactVersionId: null
            }
          : entry
      );
      replaceChatMessages(nextMessages);
      return messageId;
    }
    return appendLocalBuildChatAssistantMessage(trimmedText);
  }

  function adoptPersistedBuildRunMessages({
    userMessageId,
    assistantMessageId,
    assistantMessageCreatedAt
  }: {
    userMessageId?: number | null;
    assistantMessageId?: number | null;
    assistantMessageCreatedAt?: number | null;
  }) {
    const normalizedUserMessageId =
      Number(userMessageId || 0) > 0 ? Number(userMessageId) : null;
    const normalizedAssistantMessageId =
      Number(assistantMessageId || 0) > 0 ? Number(assistantMessageId) : null;
    const normalizedAssistantCreatedAt =
      Number(assistantMessageCreatedAt || 0) > 0
        ? Number(assistantMessageCreatedAt)
        : null;
    let nextMessages = getLatestChatMessages();
    let changed = false;
    const currentUserMessageId = getCurrentActiveUserMessageId(
      undefined,
      currentSharedRunIdentityState
    );
    const localCurrentUserMessageId = runIdentity.getCurrentActiveUserMessageId(
      undefined,
      null,
      runOrchestration.hasCurrentPageRunActivity()
    );
    const currentAssistantMessageId = getCurrentActiveAssistantMessageId(
      undefined,
      currentSharedRunIdentityState
    );
    const localCurrentAssistantMessageId =
      runIdentity.getCurrentActiveAssistantMessageId(
        undefined,
        null,
        runOrchestration.hasCurrentPageRunActivity()
      );

    if (normalizedUserMessageId) {
      nextMessages = nextMessages.map((entry) => {
        if (
          entry.id !== normalizedUserMessageId &&
          entry.id !== currentUserMessageId &&
          entry.id !== localCurrentUserMessageId
        ) {
          return entry;
        }
        const nextEntry = {
          ...entry,
          id: normalizedUserMessageId,
          persisted: true
        };
        if (
          nextEntry.id !== entry.id ||
          Boolean(nextEntry.persisted) !== Boolean(entry.persisted)
        ) {
          changed = true;
        }
        return nextEntry;
      });
    }

    if (normalizedAssistantMessageId) {
      let matchedAssistant = false;
      nextMessages = nextMessages.map((entry) => {
        if (
          entry.id !== normalizedAssistantMessageId &&
          entry.id !== currentAssistantMessageId &&
          entry.id !== localCurrentAssistantMessageId
        ) {
          return entry;
        }
        matchedAssistant = true;
        const nextEntry = {
          ...entry,
          id: normalizedAssistantMessageId,
          persisted: true,
          createdAt: normalizedAssistantCreatedAt || entry.createdAt
        };
        if (
          nextEntry.id !== entry.id ||
          nextEntry.createdAt !== entry.createdAt ||
          Boolean(nextEntry.persisted) !== Boolean(entry.persisted)
        ) {
          changed = true;
        }
        return nextEntry;
      });
      if (!matchedAssistant) {
        nextMessages = [
          ...nextMessages,
          {
            id: normalizedAssistantMessageId,
            role: 'assistant' as const,
            content: '',
            codeGenerated: null,
            billingState: null,
            streamCodePreview: null,
            createdAt:
              normalizedAssistantCreatedAt || Math.floor(Date.now() / 1000),
            persisted: true
          }
        ];
        changed = true;
      }
      const assistantEntries = nextMessages
        .map((entry, index) => ({ entry, index }))
        .filter(
          ({ entry }: { entry: ChatMessage; index: number }) =>
            entry.role === 'assistant' &&
            entry.id === normalizedAssistantMessageId
        );
      if (assistantEntries.length > 1) {
        const mergedAssistant = assistantEntries
          .map(({ entry }) => entry)
          .reduce((result, entry) =>
            mergeDuplicateAssistantMessages(result, entry)
          );
        const primaryAssistantIndex = assistantEntries[0].index;
        nextMessages = nextMessages.filter((entry, index) => {
          if (
            entry.role !== 'assistant' ||
            entry.id !== normalizedAssistantMessageId
          ) {
            return true;
          }
          return index === primaryAssistantIndex;
        });
        nextMessages[primaryAssistantIndex] = mergedAssistant;
        changed = true;
      }
    }

    if (!changed) {
      return;
    }
    const sortedMessages = [...nextMessages].sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
        return a.createdAt - b.createdAt;
      }
      return a.id - b.id;
    });
    replaceChatMessages(sortedMessages);
  }

  function removeLocalBuildChatMessage(messageId: number | null) {
    if (!messageId) return;
    const nextMessages = getLatestChatMessages().filter(
      (entry) => entry.id !== messageId
    );
    if (nextMessages.length === getLatestChatMessages().length) {
      return;
    }
    replaceChatMessages(nextMessages);
  }

  function buildBuildChatUploadPendingMessage(files: File[]) {
    const normalizedFiles = Array.isArray(files)
      ? files.filter((file) => file instanceof File)
      : [];
    const imageFiles = normalizedFiles.filter(isImageChatReferenceFile);
    if (normalizedFiles.length === 1 && imageFiles.length === 1) {
      return 'Checking your image...';
    }
    if (
      normalizedFiles.length > 1 &&
      imageFiles.length === normalizedFiles.length
    ) {
      return 'Checking your images...';
    }
    return 'Checking your upload...';
  }

  function buildBuildChatUploadRouteProgressMessage(
    route: BuildChatUploadRoute,
    files: File[]
  ) {
    const normalizedFiles = Array.isArray(files)
      ? files.filter((file) => file instanceof File)
      : [];
    const imageFiles = normalizedFiles.filter(isImageChatReferenceFile);
    if (route === 'project_files_import') {
      return normalizedFiles.length > 1
        ? 'Importing your files...'
        : 'Importing your file...';
    }
    if (route === 'runtime_asset_upload') {
      return imageFiles.length === normalizedFiles.length &&
        normalizedFiles.length > 0
        ? normalizedFiles.length === 1
          ? 'Uploading your image asset...'
          : 'Uploading your image assets...'
        : normalizedFiles.length > 1
          ? 'Uploading your assets...'
          : 'Uploading your asset...';
    }
    if (route === 'chat_reference') {
      if (
        imageFiles.length === normalizedFiles.length &&
        normalizedFiles.length > 0
      ) {
        return normalizedFiles.length === 1
          ? 'Using your image...'
          : 'Using your images...';
      }
      return 'Using your upload as reference...';
    }
    return 'Checking your upload...';
  }

  function buildBuildChatUploadRouteProgressPercent(
    route: BuildChatUploadRoute
  ) {
    if (route === 'project_files_import') {
      return 28;
    }
    if (route === 'runtime_asset_upload') {
      return 26;
    }
    if (route === 'chat_reference') {
      return 20;
    }
    return 14;
  }

  async function maybeContinueBuildChatRequestAfterMutationUpload({
    routingMessageText,
    existingUserMessageId
  }: {
    routingMessageText: string;
    existingUserMessageId?: number | null;
  }) {
    const trimmedMessage = String(routingMessageText || '').trim();
    if (!trimmedMessage) {
      return false;
    }
    setBuildChatUploadInFlight(false);
    return await sendBuildMessageText(trimmedMessage, {
      existingUserMessageId: Number(existingUserMessageId || 0) || null,
      ignoreUploadInFlight: true
    });
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
    targetBuildId: number,
    options?: {
      onProgress?: (progressPercent: number) => void;
    }
  ) {
    const uploadedReferences: Array<{
      fileName: string;
      url: string;
      mimeType?: string | null;
      filePath: string;
      storedFileName: string;
    }> = [];

    try {
      const totalBytes = files.reduce((sum, file) => {
        const size = Number(file?.size || 0);
        return sum + (Number.isFinite(size) && size > 0 ? size : 0);
      }, 0);
      let completedBytes = 0;
      const fallbackTotalFiles = Math.max(files.length, 1);
      for (const file of files) {
        const filePath = buildBuildChatReferenceUploadPath(targetBuildId);
        const appliedFileName = generateFileName(file.name || 'reference.png');
        await uploadFile({
          filePath,
          fileName: appliedFileName,
          file,
          context: 'embed',
          onUploadProgress: (progressEvent: any) => {
            const loadedBytes = Number(progressEvent?.loaded || 0);
            const effectiveTotalBytes =
              totalBytes > 0 ? totalBytes : fallbackTotalFiles;
            const currentFileProgress =
              totalBytes > 0
                ? Math.max(
                    0,
                    Math.min(Number(file.size || 0), loadedBytes || 0)
                  )
                : Math.max(
                    0,
                    Math.min(1, Number(progressEvent?.progress || 0) || 0)
                  );
            const overallRatio =
              totalBytes > 0
                ? (completedBytes + currentFileProgress) / effectiveTotalBytes
                : Math.min(
                    1,
                    files.findIndex((entry) => entry === file) /
                      fallbackTotalFiles +
                      currentFileProgress / fallbackTotalFiles
                  );
            options?.onProgress?.(24 + overallRatio * 54);
          }
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
        completedBytes += Math.max(0, Number(file?.size || 0));
        const completedFileCount = uploadedReferences.length;
        const overallRatio =
          totalBytes > 0
            ? Math.max(0, Math.min(1, completedBytes / totalBytes))
            : Math.max(0, Math.min(1, completedFileCount / fallbackTotalFiles));
        options?.onProgress?.(24 + overallRatio * 54);
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

  function buildBuildChatUploadRoutingMessage(
    ...parts: Array<string | undefined>
  ) {
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
      'The user uploaded images or mockups for this request.',
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
      localProgressMessageId?: number | null;
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
      options &&
      Object.prototype.hasOwnProperty.call(options, 'historyUserNoteText')
        ? options.historyUserNoteText
        : buildChatDraftMessage;
    const resolvingPendingClarification = Boolean(
      options?.resolvingPendingClarification
    );
    const localProgressMessageId =
      Number(options?.localProgressMessageId || 0) || null;
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
      !options || !Object.prototype.hasOwnProperty.call(options, 'messageText');

    function didBuildChatUploadTargetChange() {
      return Number(getLatestBuild()?.id || 0) !== uploadBuildId;
    }

    function clearConsumedBuildChatUploadDraft() {
      if (!consumedComposerDraft) return;
      setBuildChatDraftMessage('');
    }

    function clearLocalProgressMessage() {
      removeLocalBuildChatMessage(localProgressMessageId);
      if (
        buildChatUploadProgressMessageIdRef.current === localProgressMessageId
      ) {
        buildChatUploadProgressMessageIdRef.current = null;
      }
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
        pendingBuildChatUploadClarificationRef.current = [pendingClarification];
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
      const trimmedHistoryUserNoteText = String(
        historyUserNoteText || ''
      ).trim();
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

      const route = String(
        decision?.route || ''
      ).trim() as BuildChatUploadRoute;
      if (!route) {
        throw new Error('Failed to determine what to do with these files.');
      }

      updateLocalBuildChatMessage(localProgressMessageId, {
        text: buildBuildChatUploadRouteProgressMessage(route, files),
        uploadProgressPercent: buildBuildChatUploadRouteProgressPercent(route)
      });

      if (route === 'clarify') {
        clearLocalProgressMessage();
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
        const result =
          await previewPanel.importProjectFilesFromChatUpload(files);
        if (didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        updateLocalBuildChatMessage(localProgressMessageId, {
          uploadProgressPercent: 86
        });
        clearLocalProgressMessage();
        if (!result?.success) {
          await persistBuildChatAssistantNote(
            result?.error || 'I could not import those project files.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const persistedUserNote = await persistBuildChatUploadIntentNote(
          historyUserNoteText,
          {
            buildId: uploadBuildId
          }
        );
        const continued =
          await maybeContinueBuildChatRequestAfterMutationUpload({
            routingMessageText,
            existingUserMessageId: persistedUserNote?.id || null
          });
        if (continued) {
          clearConsumedBuildChatUploadDraft();
          return { handled: true };
        }
        await persistBuildChatAssistantNote(
          buildImportedProjectFilesNote(result),
          { buildId: uploadBuildId }
        );
        if (String(routingMessageText || '').trim()) {
          await persistBuildChatAssistantNote(
            'I imported the files, but the run did not start. Retry your message when ready.',
            { buildId: uploadBuildId }
          );
        }
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      if (route === 'runtime_asset_upload') {
        const previewPanel = previewPanelRef.current;
        if (!previewPanel || didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        const result =
          await previewPanel.uploadProjectAssetsFromChatUpload(files);
        if (didBuildChatUploadTargetChange()) {
          return { handled: true };
        }
        updateLocalBuildChatMessage(localProgressMessageId, {
          uploadProgressPercent: 86
        });
        clearLocalProgressMessage();
        if (!result?.success) {
          await persistBuildChatAssistantNote(
            result?.error || 'I could not upload those build assets.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const persistedUserNote = await persistBuildChatUploadIntentNote(
          historyUserNoteText,
          {
            buildId: uploadBuildId
          }
        );
        const continued =
          await maybeContinueBuildChatRequestAfterMutationUpload({
            routingMessageText,
            existingUserMessageId: persistedUserNote?.id || null
          });
        if (continued) {
          clearConsumedBuildChatUploadDraft();
          return { handled: true };
        }
        await persistBuildChatAssistantNote(
          buildUploadedRuntimeAssetsNote(result),
          { buildId: uploadBuildId }
        );
        if (String(routingMessageText || '').trim()) {
          await persistBuildChatAssistantNote(
            'I uploaded the asset, but the run did not start. Retry your message when ready.',
            { buildId: uploadBuildId }
          );
        }
        clearConsumedBuildChatUploadDraft();
        return { handled: true };
      }

      if (route === 'chat_reference') {
        const referenceFiles = files.filter(isImageChatReferenceFile);
        if (referenceFiles.length === 0) {
          clearLocalProgressMessage();
          await persistBuildChatAssistantNote(
            'I can only use image uploads as chat reference right now.',
            { buildId: uploadBuildId }
          );
          return { handled: true };
        }
        const references = await uploadBuildChatReferenceFiles(
          referenceFiles,
          uploadBuildId,
          {
            onProgress: (progressPercent) => {
              updateLocalBuildChatMessage(localProgressMessageId, {
                uploadProgressPercent: progressPercent
              });
            }
          }
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
          updateLocalBuildChatMessage(localProgressMessageId, {
            uploadProgressPercent: 92
          });
          clearLocalProgressMessage();
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
            'I saved the image reference, but the run did not start. Retry your message when ready.',
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
        updateLocalBuildChatMessage(localProgressMessageId, {
          uploadProgressPercent: 92
        });
        clearLocalProgressMessage();
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

      const fallbackIntentPersisted =
        await persistClarificationIntentIfNeeded();
      const pendingClarification = {
        files: [...files],
        messageText: routingMessageText,
        intentPersisted: fallbackIntentPersisted
      };
      clearLocalProgressMessage();
      if (resolvingPendingClarification) {
        replaceCurrentPendingBuildChatUploadClarification(pendingClarification);
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
      clearLocalProgressMessage();
      await persistBuildChatAssistantNote(
        error?.message || 'I could not process those uploaded files.',
        { buildId: uploadBuildId }
      );
      return { handled: true };
    } finally {
      clearLocalProgressMessage();
      setBuildChatUploadInFlight(false);
    }
  }

  function startBuildChatUploadProcessing(
    selectedFiles: File[],
    options?: {
      messageText?: string;
      historyUserNoteText?: string | null;
      resolvingPendingClarification?: boolean;
    }
  ) {
    if (!isOwner || isRunActivityInFlight() || buildChatUploadInFlight) {
      return false;
    }
    const files = Array.isArray(selectedFiles)
      ? selectedFiles.filter((file) => file instanceof File)
      : [];
    if (files.length === 0) {
      return false;
    }
    const progressMessageId = appendLocalBuildChatAssistantMessage(
      buildBuildChatUploadPendingMessage(files)
    );
    buildChatUploadProgressMessageIdRef.current = progressMessageId;
    void handleBuildChatFileSelection(files, {
      ...options,
      localProgressMessageId: progressMessageId
    });
    return true;
  }

  function handleOpenBuildChatUpload() {
    if (!isOwner || isRunActivityInFlight() || buildChatUploadInFlight) return;
    setBuildChatUploadModalShown(true);
  }

  async function sendBuildMessageText(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
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
    const trailingRuntimeObservationMessageContext =
      formatTrailingRuntimeObservationMessageContext(mergedChatMessages);
    const enrichedMessageContext = mergeHiddenBuildMessageContext(
      options?.messageContext,
      trailingRuntimeObservationMessageContext
    );
    const requestOptions =
      enrichedMessageContext || options
        ? {
            ...options,
            messageContext: enrichedMessageContext || null
          }
        : undefined;
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
          historyUserNoteText:
            pendingBuildChatUploadClarification.intentPersisted
              ? null
              : pendingBuildChatUploadClarification.messageText,
          resolvingPendingClarification: true
        }
      );
      return result.handled;
    }

    if (
      isRunActivityInFlight() ||
      runtimeFollowUp.hasPendingRuntimeFollowUp()
    ) {
      enqueueLatestBuildRequest(trimmedMessage, requestOptions);
      return true;
    }

    const started = await startGeneration(trimmedMessage, requestOptions);
    if (!started) {
      if (
        isRunActivityInFlight({
          sharedRunState: getBuildRunIdentity(
            Number(getLatestBuild()?.id || build.id)
          )
        })
      ) {
        enqueueLatestBuildRequest(trimmedMessage, requestOptions);
        return true;
      }
      return false;
    }
    return true;
  }

  function handleStopGeneration() {
    const requestId = getCurrentPageRunActivityRequestId(
      getBuildRunIdentity(Number(getLatestBuild()?.id || build.id))
    );
    if (!requestId || !isOwner) {
      return;
    }
    if (runOrchestration.isDedupedProcessingInFlight()) {
      runOrchestration.setUserRequestedStop(true);
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      onUpdateBuildRunStatus({
        requestId,
        status: 'Stopping...'
      });
      setMobilePanelTab('chat');
      scrollChatToBottom();
      requestStopForRecoveredBuildRun(requestId);
      scheduleDedupedProcessingReconcile(requestId);
      return;
    }
    runOrchestration.setUserRequestedStop(true);
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
    if (message.source === 'runtime_observation') {
      runtimeFollowUp.removeRuntimeObservationChatNote(message.id);
      return;
    }
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

  async function handleFixRuntimeObservationMessage(message: ChatMessage) {
    if (!isOwner || message.source !== 'runtime_observation') {
      return false;
    }
    const accepted = await sendBuildMessageText('Fix this preview issue.', {
      messageContext: String(message.content || '').trim() || null
    });
    if (accepted) {
      runtimeFollowUp.removeRuntimeObservationChatNote(message.id);
    }
    return accepted;
  }

  function handleReplaceCode(newCode: string) {
    const activeBuild = getLatestBuild();
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
    const activeBuild = getLatestBuild();
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
    applyBuildUpdate(nextBuild);
  }

  function handleProjectFilesChange(
    nextFilesInput: Array<{ path: string; content?: string }>
  ) {
    const activeBuild = getLatestBuild();
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
    applyBuildUpdate(nextBuild);
  }

  async function handleSaveProjectFiles(
    nextFilesInput: Array<{ path: string; content?: string }>,
    options?: ProjectFileSaveOptions
  ): Promise<ProjectFileSaveResult> {
    if (!isOwner) {
      return { success: false, error: 'Not authorized' };
    }
    const activeBuild = getLatestBuild();
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
    if (runOrchestration.requiresProjectFilesResyncBeforeSave()) {
      try {
        await syncChatMessagesFromServer(undefined, true);
        runOrchestration.setRequiresProjectFilesResyncBeforeSave(false);
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
      const latestBuild = getLatestBuild();
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
      applyBuildUpdate(nextBuild);
      if (Object.prototype.hasOwnProperty.call(result || {}, 'copilotPolicy')) {
        replaceCopilotPolicy(result?.copilotPolicy || null);
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

  async function persistProjectFilesDraft(
    files: Array<{ path: string; content?: string }>
  ): Promise<ProjectFileSaveResult> {
    return await handleSaveProjectFiles(files, {
      resumePausedQueue: false
    });
  }

  function updateRuntimeUploadQuotaUsage(
    usage: BuildRuntimeUploadUsage | null | undefined
  ) {
    const nextPolicy = applyRuntimeUploadUsageToCopilotPolicy(
      getLatestCopilotPolicy(),
      usage
    );
    if (!nextPolicy) {
      return;
    }
    replaceCopilotPolicy(nextPolicy);
  }

  function handleRuntimeUploadsSyncFromPreview(
    payload: PreviewRuntimeUploadsSyncPayload | null
  ) {
    if (!payload) {
      return;
    }
    setRuntimeUploadsError('');
    updateRuntimeUploadQuotaUsage(payload.usage || null);
    const currentBuildTitle = String(
      getLatestBuild()?.title || build.title || ''
    );
    const currentBuildIsPublic = Boolean(getLatestBuild()?.isPublic);
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

  function setBuildRuntimeExplorationPlanValue(
    nextRuntimeExplorationPlan: BuildRuntimeExplorationPlan | null
  ) {
    const activeBuild = getLatestBuild();
    if (!activeBuild) return;
    if (
      serializedComparableValue(activeBuild.runtimeExplorationPlan ?? null) ===
      serializedComparableValue(nextRuntimeExplorationPlan)
    ) {
      return;
    }
    applyBuildUpdate({
      ...activeBuild,
      runtimeExplorationPlan: nextRuntimeExplorationPlan
    });
  }

  function clearLocalFollowUpPrompt() {
    const activeBuild = getLatestBuild();
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
    const latestBuild = getLatestBuild();
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
    const latestBuild = getLatestBuild();
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
      const requestedBuildId = Number(getLatestBuild()?.id || build.id);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: 'Unable to publish: build not found.',
          pageFeedbackOnMissingRequestId: true
        });
        return;
      }
      const projectFilesReady =
        await projectFileDrafts.ensureProjectFilesPersistedBeforePublish();
      if (!projectFilesReady) {
        return;
      }
      const latestBuild = getLatestBuild();
      if (!latestBuild || Number(latestBuild.id) !== requestedBuildId) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message:
            'Build changed before publish. Please retry on the active build.',
          pageFeedbackOnMissingRequestId: true
        });
        return;
      }
      if (!latestBuild.code) {
        appendLocalRunEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: 'Add code before publishing your build.',
          pageFeedbackOnMissingRequestId: true
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
            message: error?.message
              ? `${error.message} Publishing without a thumbnail instead.`
              : 'Preview thumbnail could not be generated automatically. Publishing without a thumbnail instead.',
            pageFeedbackOnMissingRequestId: true
          });
        }
      }
      const result = await publishBuild({
        buildId: publishTargetBuild.id,
        thumbnailUrl:
          String(publishTargetBuild.thumbnailUrl || '').trim() || undefined
      });
      if (result?.success && result?.build) {
        applyBuildUpdate({
          ...publishTargetBuild,
          isPublic: result.build.isPublic,
          publishedAt: result.build.publishedAt,
          thumbnailUrl: result.build.thumbnailUrl
        });
        if (Object.prototype.hasOwnProperty.call(result, 'copilotPolicy')) {
          replaceCopilotPolicy(result.copilotPolicy || null);
        }
      }
    } catch (error: any) {
      console.error('Failed to publish build:', error);
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'publish',
        message: error?.message || 'Unable to publish this build right now.',
        pageFeedbackOnMissingRequestId: true
      });
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!isOwner || publishing) return;
    setPublishing(true);
    try {
      const latestBuild = getLatestBuild();
      const result = await unpublishBuild(latestBuild.id);
      if (result?.success && result?.build) {
        applyBuildUpdate({
          ...latestBuild,
          isPublic: result.build.isPublic
        });
        if (Object.prototype.hasOwnProperty.call(result, 'copilotPolicy')) {
          replaceCopilotPolicy(result.copilotPolicy || null);
        }
      }
    } catch (error: any) {
      console.error('Failed to unpublish build:', error);
      appendLocalRunEvent({
        kind: 'lifecycle',
        phase: 'publish',
        message: error?.message || 'Unable to unpublish this build right now.',
        pageFeedbackOnMissingRequestId: true
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
        replaceCopilotPolicy(result?.copilotPolicy || null);
      }
    } catch (error: any) {
      console.error('Failed to purchase build generation reset:', error);
      const nextRequestLimits =
        error?.response?.data?.requestLimits || error?.requestLimits || null;
      const nextPolicy = applyRequestLimitsToCopilotPolicy(
        getLatestCopilotPolicy(),
        nextRequestLimits
      );
      if (nextPolicy) {
        replaceCopilotPolicy(nextPolicy);
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
              executionPlan={currentBuildRunView.executionPlan}
              scopedPlanQuestion={resolveScopedPlanQuestion(
                currentBuildRunView.executionPlan
              )}
              followUpPrompt={currentBuildRunView.followUpPrompt}
              runMode={currentBuildRunView.runMode}
              generating={currentBuildRunView.generating}
              generatingStatus={currentBuildRunView.status}
              assistantStatusSteps={currentBuildRunView.assistantStatusSteps}
              copilotPolicy={copilotPolicy}
              pageFeedbackEvents={pageFeedbackEvents}
              runEvents={currentBuildRunView.runEvents}
              runError={currentBuildRunView.error}
              activeStreamMessageIds={currentBuildRunView.activeStreamMessageIds}
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
              onFixRuntimeObservationMessage={
                handleFixRuntimeObservationMessage
              }
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
            streamingProjectFiles={currentBuildRunView.streamingProjectFiles}
            streamingFocusFilePath={currentBuildRunView.streamingFocusFilePath}
            isOwner={isOwner}
            capabilitySnapshot={build.capabilitySnapshot || null}
            runtimeExplorationPlan={currentBuildRunView.runtimeExplorationPlan}
            onReplaceCode={handleReplaceCode}
            onApplyRestoredProjectFiles={handleApplyRestoredProjectFiles}
            onSaveProjectFiles={(files, options) =>
              handleSaveProjectFiles(files, {
                resumePausedQueue: true,
                ...options
              })
            }
            onEditableProjectFilesStateChange={
              projectFileDrafts.handleProjectFilesDraftStateChange
            }
            onRuntimeObservationChange={runtimeFollowUp.handleRuntimeObservationChange}
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
          onCustomUploadSubmit={({ files, caption }) => {
            return startBuildChatUploadProcessing(files, {
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
          initialImageUrl={
            build.thumbnailUrl || getLatestBuild()?.thumbnailUrl || null
          }
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
    const latestBuild = getLatestBuild();
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
        applyBuildUpdate(nextBuild);
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
    const latestBuild = getLatestBuild();
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
      runtimeFollowUp.getCurrentRuntimeObservationSummary(observationState);
    if (!runtimeObservationSummary) {
      return false;
    }
    const activeBuild = getLatestBuild();
    const requestedBuildId = Number(activeBuild?.id || build.id);
    if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
      return false;
    }

    resetDedupedProcessingReconcileState();
    runOrchestration.setUserRequestedStop(false);
    runtimeFollowUp.prepareRuntimeAutoFixRun(observationState, {
      remainingRepairsAfterVerification:
        options?.remainingRepairsAfterVerification
    });
    setBuildRuntimeExplorationPlanValue(null);
    const now = Math.floor(Date.now() / 1000);
    const assistantMessageId = Date.now();
    const requestId = `${requestedBuildId}-runtime-fix-${assistantMessageId}`;
    const baseProjectFiles = normalizeProjectFilesForBuild(
      activeBuild?.projectFiles || [],
      activeBuild?.code || ''
    );
    setDismissedFollowUpPromptKey('');
    clearLocalFollowUpPrompt();

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      codeGenerated: null,
      streamCodePreview: null,
      createdAt: now,
      persisted: false
    };

    const nextMessages = [...getLatestChatMessages(), assistantMessage];
    replaceChatMessages(nextMessages);
    runIdentity.beginRun({
      requestId,
      runMode: 'runtime-autofix',
      assistantMessageId
    });
    markCurrentPageRunActivityActive();
    clearBufferedRunStartEvents();
    markActiveBuildRunActivity();
    runOrchestration.resetStalledRunRecovery();
    onRegisterBuildRun({
      buildId: requestedBuildId,
      requestId,
      runMode: 'runtime-autofix',
      assistantMessage,
      baseProjectFiles
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
      runtimeExplorationPlan: currentBuildRunView.runtimeExplorationPlan,
      autoFixRuntimeObservation: true,
      runtimeAutoFixSourceRequestId: options?.sourceRequestId || null,
      runtimeAutoFixSourceArtifactVersionId:
        options?.sourceArtifactVersionId || null,
      expectedCurrentArtifactVersionId:
        Number(getLatestBuild()?.currentArtifactVersionId || 0) > 0
          ? Number(getLatestBuild()?.currentArtifactVersionId)
          : undefined
    });
    return true;
  }

  async function startGeneration(
    messageText: string,
    options?: {
      planAction?: BuildPlanAction | null;
      promptBinding?: BuildPromptBinding | null;
      messageContext?: string | null;
      existingUserMessageId?: number | null;
    }
  ): Promise<boolean> {
    if (AI_FEATURES_DISABLED) return false;
    if (!messageText.trim() || isRunActivityInFlight() || !isOwner) {
      return false;
    }
    runOrchestration.setStartingGeneration(true);
    let didRegisterRun = false;
    try {
      const requestedBuildId = Number(getLatestBuild()?.id || build.id);
      if (!Number.isFinite(requestedBuildId) || requestedBuildId <= 0) {
        return false;
      }
      const projectFilesReady =
        await projectFileDrafts.ensureProjectFilesPersistedBeforeRun({
          runType: 'copilot'
        });
      if (!projectFilesReady) {
        return false;
      }
      const activeBuild = getLatestBuild();
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
      runOrchestration.setUserRequestedStop(false);
      const now = Math.floor(Date.now() / 1000);
      const messageId = Date.now();
      const requestId = `${activeBuild.id}-${messageId}`;
      const runtimeObservationSummary =
        runtimeFollowUp.getCurrentRuntimeObservationSummary();
      const trimmedMessageContext = String(
        options?.messageContext || ''
      ).trim();
      const existingUserMessageId =
        Number(options?.existingUserMessageId || 0) || null;
      const baseProjectFiles = normalizeProjectFilesForBuild(
        activeBuild.projectFiles || [],
        activeBuild.code || ''
      );
      setDismissedFollowUpPromptKey('');
      clearLocalFollowUpPrompt();
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      setBuildRuntimeExplorationPlanValue(null);

      const existingUserMessage =
        existingUserMessageId && existingUserMessageId > 0
          ? getLatestChatMessages().find(
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
      runIdentity.beginRun({
        requestId,
        runMode: 'user',
        userMessageId:
          (existingUserMessage && existingUserMessage.id) || userMessage.id,
        assistantMessageId: assistantMessage.id,
        messageContext: trimmedMessageContext || null
      });
      markCurrentPageRunActivityActive();
      markActiveBuildRunActivity();
      runOrchestration.resetStalledRunRecovery();

      const messagesWithUser = existingUserMessage
        ? [...getLatestChatMessages(), assistantMessage]
        : [...getLatestChatMessages(), userMessage, assistantMessage];
      replaceChatMessages(messagesWithUser);
      onRegisterBuildRun({
        buildId: activeBuild.id,
        requestId,
        runMode: 'user',
        userMessage,
        assistantMessage,
        baseProjectFiles
      });
      didRegisterRun = true;
      flushBufferedRunStartEvents(requestId);
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
        promptBinding: options?.promptBinding || undefined,
        expectedCurrentArtifactVersionId:
          Number(activeBuild.currentArtifactVersionId || 0) > 0
            ? Number(activeBuild.currentArtifactVersionId)
            : undefined
      });
      return true;
    } finally {
      runOrchestration.setStartingGeneration(false);
      if (!didRegisterRun) {
        flushBufferedRunStartEventsToPageFeedback();
      }
    }
  }

  async function startGreetingGeneration(): Promise<boolean> {
    if (AI_FEATURES_DISABLED) return false;
    if (isRunActivityInFlight() || !isOwner) {
      return false;
    }
    runOrchestration.setStartingGeneration(true);
    let didRegisterRun = false;
    try {
      const activeBuild = getLatestBuild();
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
      runOrchestration.setUserRequestedStop(false);
      const now = Math.floor(Date.now() / 1000);
      const assistantMessageId = Date.now();
      const requestId = `${activeBuild.id}-greeting-${assistantMessageId}`;
      const baseProjectFiles = normalizeProjectFilesForBuild(
        activeBuild.projectFiles || [],
        activeBuild.code || ''
      );
      setDismissedFollowUpPromptKey('');
      clearLocalFollowUpPrompt();
      runtimeFollowUp.resetRuntimeHealthFollowUpState();
      setBuildRuntimeExplorationPlanValue(null);

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        codeGenerated: null,
        streamCodePreview: null,
        createdAt: now,
        persisted: false
      };

      const nextMessages = [...getLatestChatMessages(), assistantMessage];
      replaceChatMessages(nextMessages);
      runIdentity.beginRun({
        requestId,
        runMode: 'greeting',
        assistantMessageId
      });
      markCurrentPageRunActivityActive();
      markActiveBuildRunActivity();
      runOrchestration.resetStalledRunRecovery();
      onRegisterBuildRun({
        buildId: activeBuild.id,
        requestId,
        runMode: 'greeting',
        assistantMessage,
        baseProjectFiles
      });
      didRegisterRun = true;
      flushBufferedRunStartEvents(requestId);
      shouldAutoScrollRef.current = true;
      scrollChatToBottom('smooth', { force: true });

      socket.emit('build_generate_greeting', {
        buildId: activeBuild.id,
        requestId
      });
      return true;
    } finally {
      runOrchestration.setStartingGeneration(false);
      if (!didRegisterRun) {
        flushBufferedRunStartEventsToPageFeedback();
      }
    }
  }

  function removeLocalMessageByIds(ids: number[]) {
    const idSet = new Set(ids);
    const nextMessages = getLatestChatMessages().filter(
      (entry) => !idSet.has(entry.id)
    );
    replaceChatMessages(nextMessages);
  }

  function getActiveStreamMessageIds(
    sharedRunState = currentSharedRunIdentityState
  ) {
    return [
      getCurrentActiveUserMessageId(undefined, sharedRunState),
      getCurrentActiveAssistantMessageId(undefined, sharedRunState)
    ].filter((id): id is number => typeof id === 'number' && id > 0);
  }

  function isMessageLockedForActiveRequest(message: ChatMessage) {
    if (!currentBuildRunView.generating) return false;
    return currentBuildRunView.activeStreamMessageIds.includes(message.id);
  }

  function handleChatScroll() {
    shouldAutoScrollRef.current = isChatNearBottom();
  }

  function maybeAutoScrollDuringStream() {
    if (!shouldAutoScrollRef.current) return;
    scrollChatToBottom('auto');
  }

  function markActiveBuildRunActivity(activityAt?: number | null) {
    runOrchestration.markRunActivity(activityAt);
  }

  function maybeResumeActiveBuildRun() {
    const requestId = getCurrentPageRunActivityRequestId(
      getBuildRunIdentity(Number(getLatestBuild()?.id || build.id))
    );
    if (!requestId) return;
    const activeBuildId = Number(getLatestBuild()?.id || build.id);
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return;
    const now = Date.now();
    if (!runOrchestration.claimResumeAttempt(now, 1500)) return;
    socket.emit('build_resume_run', {
      buildId: activeBuildId,
      requestId
    });
  }

  function updateSharedStalledRunRecoveryStatus(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return;
    const activeBuildId = Number(getLatestBuild()?.id || build.id);
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return;
    const nextStatus = runOrchestration.didUserRequestStop()
      ? 'Stopping...'
      : runOrchestration.isDedupedProcessingInFlight(normalizedRequestId)
        ? DEDUPED_PROCESSING_RECOVERY_STATUS
        : STALLED_RUN_RECOVERY_STATUS;
    if (
      String(sharedBuildRun?.requestId || '').trim() === normalizedRequestId &&
      String(sharedBuildRun?.status || '').trim() === nextStatus
    ) {
      return;
    }
    onUpdateBuildRunStatus({
      buildId: activeBuildId,
      requestId: normalizedRequestId,
      status: nextStatus
    });
  }

  function requestStopForRecoveredBuildRun(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return;
    const activeBuildId = Number(getLatestBuild()?.id || build.id);
    if (!Number.isFinite(activeBuildId) || activeBuildId <= 0) return;
    socket.emit('build_stop', {
      buildId: activeBuildId,
      requestId: normalizedRequestId
    });
  }

  function resetDedupedProcessingReconcileState() {
    runOrchestration.resetDedupedProcessingReconcileState();
  }

  function beginDedupedProcessingRecovery(requestId: string) {
    const normalizedRequestId = runOrchestration.beginDedupedProcessingRecovery(
      requestId
    );
    if (!normalizedRequestId) return;
    reconcileDedupedProcessingRequest(normalizedRequestId);
  }

  function maybeStartSharedDedupedProcessingRecovery(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return;
    if (
      getCurrentRunRequestId(
        normalizedRequestId,
        getBuildRunIdentity(Number(getLatestBuild()?.id || build.id))
      ) !== normalizedRequestId
    ) {
      return;
    }
    if (runOrchestration.isDedupedProcessingInFlight(normalizedRequestId)) {
      return;
    }
    setMobilePanelTab('chat');
    scrollChatToBottom();
    beginDedupedProcessingRecovery(normalizedRequestId);
  }

  function scheduleDedupedProcessingReconcile(requestId: string) {
    runOrchestration.scheduleDedupedProcessingReconcile({
      requestId,
      delayMs: DEDUPED_PROCESSING_RECONCILE_INTERVAL_MS,
      onReconcile(nextRequestId) {
        reconcileDedupedProcessingRequest(nextRequestId);
      }
    });
  }

  function reconcileDedupedProcessingRequest(requestId: string) {
    let latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    if (
      getCurrentRunRequestId(requestId, latestSharedRunIdentityState) !==
        requestId ||
      runOrchestration.getDedupedProcessingRequestId() !== requestId
    ) {
      resetDedupedProcessingReconcileState();
      return;
    }
    // During deduped recovery, the page only re-requests canonical shared run
    // state. Terminal outcomes come from shared replay or terminal socket events.
    maybeResumeActiveBuildRun();
    latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    if (
      getCurrentRunRequestId(requestId, latestSharedRunIdentityState) !==
        requestId ||
      runOrchestration.getDedupedProcessingRequestId() !== requestId
    ) {
      resetDedupedProcessingReconcileState();
      return;
    }
    scheduleDedupedProcessingReconcile(requestId);
  }

  function recoverStalledActiveBuildRun(requestId: string) {
    const normalizedRequestId = String(requestId || '').trim();
    if (!normalizedRequestId) return;
    const latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    if (
      runOrchestration.isStalledRunRecoveryInFlight() ||
      !hasCurrentPageRunActivity(latestSharedRunIdentityState) ||
      getCurrentRunRequestId(
        normalizedRequestId,
        latestSharedRunIdentityState
      ) !== normalizedRequestId ||
      runOrchestration.isPostCompleteSyncInFlight()
    ) {
      return;
    }
    const now = Date.now();
    if (
      now - runOrchestration.getLastStalledRunSyncAt() <
      STALLED_RUN_RESUME_AFTER_MS
    ) {
      maybeResumeActiveBuildRun();
      return;
    }
    runOrchestration.beginStalledRunRecovery(now);
    try {
      updateSharedStalledRunRecoveryStatus(normalizedRequestId);
      setMobilePanelTab('chat');
      scrollChatToBottom();
      maybeResumeActiveBuildRun();
    } finally {
      runOrchestration.finishStalledRunRecovery();
    }
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
    options?: {
      preserveLocalMessages?: boolean;
      preserveActiveAssistantState?: boolean;
    }
  ) {
    let messages = Array.isArray(serverMessages) ? serverMessages : null;
    if (!messages) {
      const buildPayload = await loadBuild(
        build.id,
        fromWriter ? { fromWriter: true } : undefined
      );
      const latestSharedRunIdentityState = getBuildRunIdentity(
        Number(getLatestBuild()?.id || build.id)
      );
      if (buildPayload?.build) {
        const nextBuild = {
          ...buildPayload.build,
          executionPlan: buildPayload.executionPlan || null,
          followUpPrompt: buildPayload.followUpPrompt || null,
          runtimeExplorationPlan: buildPayload.runtimeExplorationPlan || null,
          projectManifest: buildPayload.projectManifest || null,
          projectFiles: Array.isArray(buildPayload.projectFiles)
            ? buildPayload.projectFiles
            : []
        };
        applyBuildUpdate(nextBuild);
        if (fromWriter) {
          runOrchestration.setRequiresProjectFilesResyncBeforeSave(false);
        }
      }
      if (
        buildPayload?.activeRun?.requestId &&
        buildPayload.activeRun.requestId ===
          getCurrentRunRequestId(
            buildPayload.activeRun.requestId,
            latestSharedRunIdentityState
          ) &&
        Number(buildPayload.activeRun.lastActivityAt || 0) > 0
      ) {
        markActiveBuildRunActivity(Number(buildPayload.activeRun.lastActivityAt));
      }
      messages = buildPayload?.chatMessages;
      if (
        buildPayload &&
        Object.prototype.hasOwnProperty.call(buildPayload, 'copilotPolicy')
      ) {
        replaceCopilotPolicy(buildPayload.copilotPolicy || null);
      }
    }
    if (!Array.isArray(messages)) return;
    // Re-read local chat state after any async writer fetch so streamed assistant
    // updates that arrived mid-sync are merged against the freshest local row.
    const currentMessages = getLatestChatMessages();
    const latestSharedRunIdentityState = getBuildRunIdentity(
      Number(getLatestBuild()?.id || build.id)
    );
    const activeRequestId = getCurrentActiveRunRequestId(
      latestSharedRunIdentityState
    );
    const activeUserMessageId = getCurrentActiveUserMessageId(
      activeRequestId,
      latestSharedRunIdentityState
    );
    const activeAssistantMessageId =
      getCurrentActiveAssistantMessageId(
        activeRequestId,
        latestSharedRunIdentityState
      );
    const activeUserMessage =
      typeof activeUserMessageId === 'number' && activeUserMessageId > 0
        ? currentMessages.find(
            (message) => message.id === activeUserMessageId
          ) || null
        : null;
    const activeAssistantMessage =
      typeof activeAssistantMessageId === 'number' &&
      activeAssistantMessageId > 0
        ? currentMessages.find(
            (message) => message.id === activeAssistantMessageId
          ) || null
        : null;
    const localBillingStateById = new Map<
      number,
      ChatMessage['billingState']
    >();
    for (const message of currentMessages) {
      if (typeof message?.id !== 'number' || message.id <= 0) continue;
      if (message.billingState == null) continue;
      localBillingStateById.set(message.id, message.billingState);
    }
    const normalized = messages.map((entry: any) => ({
      ...entry,
      billingState: localBillingStateById.get(Number(entry?.id || 0)) ?? null,
      persisted: true,
      streamCodePreview: null
    }));
    const nextMessages = options?.preserveLocalMessages
      ? mergePersistedChatMessagesIntoLocalMessages({
          localMessages: currentMessages,
          persistedMessages: normalized,
          activeUserMessage,
          activeAssistantMessageId: activeAssistantMessage?.id || null,
          preserveActiveAssistantState:
            options?.preserveActiveAssistantState === true
        })
      : normalized;
    runIdentity.adoptMessageIds({
      userMessageId: findMatchingBuildChatMessageId({
        messages: nextMessages,
        targetMessage: activeUserMessage
      }),
      assistantMessageId: findMatchingBuildChatMessageId({
        messages: nextMessages,
        targetMessage: activeAssistantMessage,
        activeUserMessage
      })
    });
    replaceChatMessages(nextMessages);
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
