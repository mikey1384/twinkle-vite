import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import SocialPanel from './SocialPanel';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { socket } from '~/constants/sockets/api';

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
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: var(--chat-bg);
  color: var(--theme-bg);
  border: 1px solid var(--ui-border);
  font-weight: 800;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
  &:hover {
    transform: translateY(-1px);
    border-color: var(--theme-border);
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
  }
`;

const panelShellClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1.2rem 1.6rem 1.6rem;
  overflow: hidden;
  min-height: 0;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem;
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
  createdAt: number;
  updatedAt: number;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'reviewer';
  content: string;
  codeGenerated: string | null;
  artifactVersionId?: number | null;
  createdAt: number;
  persisted?: boolean;
}

interface BuildEditorProps {
  build: Build;
  chatMessages: ChatMessage[];
  isOwner: boolean;
  initialPrompt?: string;
  onUpdateBuild: (build: Build) => void;
  onUpdateChatMessages: (messages: ChatMessage[]) => void;
}

export default function BuildEditor({
  build,
  chatMessages,
  isOwner,
  initialPrompt = '',
  onUpdateBuild,
  onUpdateChatMessages
}: BuildEditorProps) {
  const navigate = useNavigate();
  const { userId } = useKeyContext((v) => v.myState);
  const updateBuildCode = useAppContext(
    (v) => v.requestHelpers.updateBuildCode
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef(chatMessages);
  const buildRef = useRef(build);
  const updateBuildRef = useRef(onUpdateBuild);
  const updateChatMessagesRef = useRef(onUpdateChatMessages);
  const streamRequestIdRef = useRef<string | null>(null);
  const userMessageIdRef = useRef<number | null>(null);
  const assistantMessageIdRef = useRef<number | null>(null);
  const reviewerMessageIdRef = useRef<number | null>(null);
  const didInitialChatScrollRef = useRef(false);
  const didAutoPromptRef = useRef(false);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    updateBuildRef.current = onUpdateBuild;
  }, [onUpdateBuild]);

  useEffect(() => {
    updateChatMessagesRef.current = onUpdateChatMessages;
  }, [onUpdateChatMessages]);

  useEffect(() => {
    didInitialChatScrollRef.current = false;
    didAutoPromptRef.current = false;
  }, [build.id]);

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
    if (didInitialChatScrollRef.current) return;
    didInitialChatScrollRef.current = true;
    scrollChatToBottom('auto');
  }, [chatMessages.length, build.id]);

  useEffect(() => {
    function handleGenerateUpdate({
      requestId,
      reply
    }: {
      requestId?: string;
      reply?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      const assistantId = assistantMessageIdRef.current;
      if (!assistantId) return;
      const currentMessages = chatMessagesRef.current;
      const nextMessages = currentMessages.map((message) =>
        message.id === assistantId
          ? { ...message, content: reply || '' }
          : message
      );
      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
    }

    function handleGenerateComplete({
      requestId,
      assistantText,
      artifact,
      code,
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
      message?: {
        id?: number | null;
        userMessageId?: number | null;
        artifactVersionId?: number | null;
        createdAt?: number;
      };
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      const userMessageTempId = userMessageIdRef.current;
      const assistantId = assistantMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;
      const artifactCode = artifact?.content ?? code ?? null;
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
            artifactVersionId,
            createdAt,
            persisted: Boolean(persistedAssistantId)
          }
        ];
      }

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);

      if (artifactCode) {
        const activeBuild = buildRef.current;
        if (activeBuild) {
          updateBuildRef.current({
            ...activeBuild,
            code: artifactCode,
            primaryArtifactId: artifact?.id ?? activeBuild.primaryArtifactId
          });
        }
      }

      streamRequestIdRef.current = null;
      userMessageIdRef.current = null;
      assistantMessageIdRef.current = null;
      reviewerMessageIdRef.current = null;
      setGenerating(false);
      setReviewing(false);
      setReviewPhase(null);
      setGeneratingStatus(null);
      setReviewerStatusSteps([]);
      setAssistantStatusSteps([]);
      scrollChatToBottom();
    }

    function handleGenerateStatus({
      requestId,
      status
    }: {
      requestId?: string;
      status?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      setGeneratingStatus(status || null);
      if (status) {
        setAssistantStatusSteps((prev) =>
          prev[prev.length - 1] === status ? prev : [...prev, status]
        );
      }
    }

    function handleGenerateError({
      requestId,
      error
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      const assistantId = assistantMessageIdRef.current;
      const reviewerId = reviewerMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;
      const errorMessage = error || 'Failed to generate code.';

      // If phase 1 failed (reviewer exists but no assistant yet), show error on reviewer bubble
      const errorTargetId = assistantId || reviewerId;
      const nextMessages = errorTargetId
        ? currentMessages.map((entry) =>
            entry.id === errorTargetId
              ? { ...entry, content: errorMessage }
              : entry
          )
        : [
            ...currentMessages,
            {
              id: Date.now(),
              role: 'assistant' as const,
              content: errorMessage,
              codeGenerated: null,
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
      setGenerating(false);
      setReviewing(false);
      setReviewPhase(null);
      setGeneratingStatus(null);
      setReviewerStatusSteps([]);
      setAssistantStatusSteps([]);
      scrollChatToBottom();
    }

    async function handleGenerateStopped({
      requestId
    }: {
      requestId?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
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
      setGenerating(false);
      setReviewing(false);
      setReviewPhase(null);
      setGeneratingStatus(null);
      setReviewerStatusSteps([]);
      setAssistantStatusSteps([]);
      await syncChatMessagesFromServer(undefined, true);
      scrollChatToBottom();
    }

    function handleReviewUpdate({
      requestId,
      reviewText
    }: {
      requestId?: string;
      reviewText?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
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
    }

    function handleReviewComplete({
      requestId,
      reviewText
    }: {
      requestId?: string;
      reviewText?: string;
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
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
      setGeneratingStatus(status || null);
      if (status) {
        setReviewerStatusSteps((prev) =>
          prev[prev.length - 1] === status ? prev : [...prev, status]
        );
      }
    }

    socket.on('build_generate_update', handleGenerateUpdate);
    socket.on('build_generate_complete', handleGenerateComplete);
    socket.on('build_generate_error', handleGenerateError);
    socket.on('build_generate_stopped', handleGenerateStopped);
    socket.on('build_generate_status', handleGenerateStatus);
    socket.on('build_review_update', handleReviewUpdate);
    socket.on('build_review_complete', handleReviewComplete);
    socket.on('build_review_status', handleReviewStatus);

    return () => {
      socket.off('build_generate_update', handleGenerateUpdate);
      socket.off('build_generate_complete', handleGenerateComplete);
      socket.off('build_generate_error', handleGenerateError);
      socket.off('build_generate_stopped', handleGenerateStopped);
      socket.off('build_generate_status', handleGenerateStatus);
      socket.off('build_review_update', handleReviewUpdate);
      socket.off('build_review_complete', handleReviewComplete);
      socket.off('build_review_status', handleReviewStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendMessage() {
    if (!inputMessage.trim() || generating || reviewing || !isOwner) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    await startGeneration(messageText);
  }

  function handleReview() {
    if (!build.code || generating || reviewing || !isOwner) return;

    const now = Math.floor(Date.now() / 1000);
    const messageId = Date.now();
    const requestId = `${build.id}-review-${messageId}`;
    setGenerating(true);
    setReviewing(true);
    setReviewPhase('reviewing');
    setReviewerStatusSteps([]);
    setAssistantStatusSteps([]);
    streamRequestIdRef.current = requestId;
    userMessageIdRef.current = null;

    const reviewerMessage: ChatMessage = {
      id: messageId,
      role: 'reviewer',
      content: '',
      codeGenerated: null,
      createdAt: now,
      persisted: false
    };
    reviewerMessageIdRef.current = reviewerMessage.id;

    const messagesWithReviewer = [...chatMessagesRef.current, reviewerMessage];
    chatMessagesRef.current = messagesWithReviewer;
    updateChatMessagesRef.current(messagesWithReviewer);

    scrollChatToBottom();

    socket.emit('build_review', {
      buildId: build.id,
      requestId
    });
  }

  function handleStopGeneration() {
    const requestId = streamRequestIdRef.current;
    if (!requestId || (!generating && !reviewing) || !isOwner) return;
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

  async function handleCodeChange(newCode: string) {
    if (!isOwner) return;
    onUpdateBuild({ ...build, code: newCode });
    try {
      await updateBuildCode({ buildId: build.id, code: newCode });
    } catch (error) {
      console.error('Failed to update code:', error);
    }
  }

  function handleReplaceCode(newCode: string) {
    onUpdateBuild({ ...build, code: newCode });
  }

  async function handlePublish() {
    if (!isOwner || !build.code || publishing) return;
    setPublishing(true);
    try {
      const result = await publishBuild({ buildId: build.id });
      if (result?.success && result?.build) {
        onUpdateBuild({
          ...build,
          status: result.build.status,
          isPublic: result.build.isPublic,
          publishedAt: result.build.publishedAt,
          thumbnailUrl: result.build.thumbnailUrl
        });
      }
    } catch (error) {
      console.error('Failed to publish build:', error);
    }
    setPublishing(false);
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
          <h2
            className={css`
              margin: 0;
              font-size: 1.8rem;
              color: var(--chat-text);
            `}
          >
            {build.title}
          </h2>
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
        <div
          className={css`
            display: flex;
            gap: 0.5rem;
            align-items: center;
          `}
        >
          <span
            className={css`
              font-size: 0.75rem;
              padding: 0.35rem 0.7rem;
              border-radius: 999px;
              background: var(--chat-bg);
              color: var(--chat-text);
              border: 1px solid var(--ui-border);
              text-transform: uppercase;
              letter-spacing: 0.04em;
              font-weight: 700;
            `}
          >
            {build.status}
          </span>
          <span
            className={css`
              font-size: 0.75rem;
              padding: 0.35rem 0.7rem;
              border-radius: 999px;
              background: var(--chat-bg);
              color: ${build.isPublic ? 'var(--theme-bg)' : 'var(--chat-text)'};
              border: 1px solid var(--ui-border);
              text-transform: uppercase;
              letter-spacing: 0.04em;
              font-weight: 700;
            `}
          >
            {build.isPublic ? 'public' : 'private'}
          </span>
          {isOwner && build.code && !generating && !reviewing && (
            <button
              onClick={handleReview}
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.45rem 0.9rem;
                border-radius: 10px;
                border: 1px solid ${Color.orange(0.5)};
                background: #fff;
                color: ${Color.orange()};
                font-size: 0.85rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                &:hover {
                  background: ${Color.orange(0.07)};
                  transform: translateY(-1px);
                }
              `}
            >
              <Icon icon="magnifying-glass" />
              Review
            </button>
          )}
          {isOwner && (
            <button
              onClick={build.isPublic ? handleUnpublish : handlePublish}
              disabled={publishing || (!build.isPublic && !build.code)}
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.45rem 0.9rem;
                border-radius: 10px;
                border: 1px solid var(--ui-border);
                background: ${build.isPublic ? '#fff' : 'var(--theme-bg)'};
                color: ${build.isPublic
                  ? 'var(--chat-text)'
                  : 'var(--theme-text)'};
                font-size: 0.85rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                &:hover:not(:disabled) {
                  transform: translateY(-1px);
                }
                &:disabled {
                  opacity: 0.6;
                  cursor: not-allowed;
                }
              `}
            >
              <Icon icon={build.isPublic ? 'eye-slash' : 'globe'} />
              {publishing
                ? 'Processing...'
                : build.isPublic
                  ? 'Unpublish'
                  : 'Publish'}
            </button>
          )}
          {!isOwner && userId && build.isPublic && (
            <button
              onClick={handleFork}
              disabled={forking}
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.45rem 0.9rem;
                border-radius: 10px;
                border: 1px solid var(--ui-border);
                background: #fff;
                color: var(--chat-text);
                font-size: 0.85rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                &:hover:not(:disabled) {
                  border-color: var(--theme-border);
                  transform: translateY(-1px);
                }
                &:disabled {
                  opacity: 0.6;
                  cursor: not-allowed;
                }
              `}
            >
              <Icon icon="code-branch" />
              {forking ? 'Forking...' : 'Fork'}
            </button>
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
              activeStreamMessageIds={getActiveStreamMessageIds()}
              isOwner={isOwner}
              chatScrollRef={chatScrollRef}
              chatEndRef={chatEndRef}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              onDeleteMessage={handleDeleteMessage}
            />
          )}
          <PreviewPanel
            build={build}
            code={build.code}
            isOwner={isOwner}
            onCodeChange={handleCodeChange}
            onReplaceCode={handleReplaceCode}
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
    requestAnimationFrame(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior
        });
        return;
      }
      chatEndRef.current?.scrollIntoView({
        behavior,
        block: 'nearest',
        inline: 'nearest'
      });
    });
  }

  async function startGeneration(messageText: string) {
    if (!messageText.trim() || generating || reviewing || !isOwner) return;
    const now = Math.floor(Date.now() / 1000);
    const messageId = Date.now();
    const requestId = `${build.id}-${messageId}`;
    setGenerating(true);
    setReviewerStatusSteps([]);
    setAssistantStatusSteps([]);
    streamRequestIdRef.current = requestId;

    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: messageText,
      codeGenerated: null,
      createdAt: now,
      persisted: false
    };
    const assistantMessage: ChatMessage = {
      id: messageId + 1,
      role: 'assistant',
      content: '',
      codeGenerated: null,
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
    scrollChatToBottom();

    socket.emit('build_generate', {
      buildId: build.id,
      message: messageText,
      requestId
    });
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

  async function syncChatMessagesFromServer(
    serverMessages?: any[],
    fromWriter = false
  ) {
    const messages = Array.isArray(serverMessages)
      ? serverMessages
      : (
          await loadBuild(
            build.id,
            fromWriter ? { fromWriter: true } : undefined
          )
        )?.chatMessages;
    if (!Array.isArray(messages)) return;
    const normalized = messages.map((entry: any) => ({
      ...entry,
      persisted: true
    }));
    chatMessagesRef.current = normalized;
    updateChatMessagesRef.current(normalized);
  }
}
