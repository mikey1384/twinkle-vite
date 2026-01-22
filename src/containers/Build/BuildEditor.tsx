import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import SocialPanel from './SocialPanel';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { socket } from '~/constants/sockets/api';

const pageClass = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
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
`;

const panelShellClass = css`
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 1rem;
  padding: 1.2rem 1.6rem 1.6rem;
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem;
    flex-direction: column;
  }
`;

const workspaceShellClass = css`
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
  border-radius: ${borderRadius};
  border: 1px solid var(--ui-border);
  background: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
  }
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
  role: 'user' | 'assistant';
  content: string;
  codeGenerated: string | null;
  artifactVersionId?: number | null;
  createdAt: number;
}

interface BuildEditorProps {
  build: Build;
  chatMessages: ChatMessage[];
  isOwner: boolean;
  onUpdateBuild: (build: Build) => void;
  onUpdateChatMessages: (messages: ChatMessage[]) => void;
}

export default function BuildEditor({
  build,
  chatMessages,
  isOwner,
  onUpdateBuild,
  onUpdateChatMessages
}: BuildEditorProps) {
  const navigate = useNavigate();
  const { userId } = useKeyContext((v) => v.myState);
  const updateBuildCode = useAppContext(
    (v) => v.requestHelpers.updateBuildCode
  );
  const publishBuild = useAppContext((v) => v.requestHelpers.publishBuild);
  const unpublishBuild = useAppContext((v) => v.requestHelpers.unpublishBuild);
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);

  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);
  const [savingVersion, setSavingVersion] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [forking, setForking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef(chatMessages);
  const buildRef = useRef(build);
  const updateBuildRef = useRef(onUpdateBuild);
  const updateChatMessagesRef = useRef(onUpdateChatMessages);
  const streamRequestIdRef = useRef<string | null>(null);
  const assistantMessageIdRef = useRef<number | null>(null);

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
      artifact?: { content?: string; id?: number | null; versionId?: number | null };
      code?: string | null;
      message?: { artifactVersionId?: number | null; createdAt?: number };
    }) {
      if (!requestId || requestId !== streamRequestIdRef.current) return;
      const assistantId = assistantMessageIdRef.current;
      const currentMessages = chatMessagesRef.current;
      const artifactCode = artifact?.content ?? code ?? null;
      const artifactVersionId =
        message?.artifactVersionId ?? artifact?.versionId ?? null;
      const createdAt = message?.createdAt ?? Math.floor(Date.now() / 1000);

      let nextMessages = currentMessages;
      if (assistantId) {
        nextMessages = currentMessages.map((entry) =>
          entry.id === assistantId
            ? {
                ...entry,
                content: assistantText || entry.content,
                codeGenerated: artifactCode,
                artifactVersionId,
                createdAt
              }
            : entry
        );
      } else {
        nextMessages = [
          ...currentMessages,
          {
            id: Date.now(),
            role: 'assistant' as const,
            content: assistantText || '',
            codeGenerated: artifactCode,
            artifactVersionId,
            createdAt
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
      assistantMessageIdRef.current = null;
      setGenerating(false);
      setGeneratingStatus(null);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
      const currentMessages = chatMessagesRef.current;
      const errorMessage = error || 'Failed to generate code.';
      const nextMessages = assistantId
        ? currentMessages.map((entry) =>
            entry.id === assistantId
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
              createdAt: Math.floor(Date.now() / 1000)
            }
          ];

      chatMessagesRef.current = nextMessages;
      updateChatMessagesRef.current(nextMessages);
      streamRequestIdRef.current = null;
      assistantMessageIdRef.current = null;
      setGenerating(false);
      setGeneratingStatus(null);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    socket.on('build_generate_update', handleGenerateUpdate);
    socket.on('build_generate_complete', handleGenerateComplete);
    socket.on('build_generate_error', handleGenerateError);
    socket.on('build_generate_status', handleGenerateStatus);

    return () => {
      socket.off('build_generate_update', handleGenerateUpdate);
      socket.off('build_generate_complete', handleGenerateComplete);
      socket.off('build_generate_error', handleGenerateError);
      socket.off('build_generate_status', handleGenerateStatus);
    };
  }, []);

  async function handleSendMessage() {
    if (!inputMessage.trim() || generating || !isOwner) return;

    const messageText = inputMessage.trim();
    const now = Math.floor(Date.now() / 1000);
    const messageId = Date.now();
    const requestId = `${build.id}-${messageId}`;
    setInputMessage('');
    setGenerating(true);
    streamRequestIdRef.current = requestId;

    // Add user message immediately (optimistic update)
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: messageText,
      codeGenerated: null,
      createdAt: now
    };
    const assistantMessage: ChatMessage = {
      id: messageId + 1,
      role: 'assistant',
      content: '',
      codeGenerated: null,
      createdAt: now + 1
    };
    assistantMessageIdRef.current = assistantMessage.id;

    const messagesWithUser = [...chatMessagesRef.current, userMessage, assistantMessage];
    chatMessagesRef.current = messagesWithUser;
    updateChatMessagesRef.current(messagesWithUser);

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    socket.emit('build_generate', {
      buildId: build.id,
      message: messageText,
      requestId
    });
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

  async function handleSaveVersion(summary?: string) {
    if (!isOwner || !build.code || savingVersion) return;
    setSavingVersion(true);
    try {
      const result = await updateBuildCode({
        buildId: build.id,
        code: build.code,
        createVersion: true,
        summary
      });
      if (result?.artifactVersion?.artifactId) {
        onUpdateBuild({
          ...build,
          primaryArtifactId: result.artifactVersion.artifactId
        });
      }
    } catch (error) {
      console.error('Failed to save version:', error);
    }
    setSavingVersion(false);
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
          <span className={badgeClass}>
            <Icon icon="rocket-launch" />
            Build Studio
          </span>
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
              {isOwner ? 'Your AI-powered build workspace' : `by ${build.username}`}
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
                color: ${build.isPublic ? 'var(--chat-text)' : 'var(--theme-text)'};
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

      <div className={panelShellClass}>
        <div className={workspaceShellClass}>
          {isOwner && (
            <ChatPanel
              messages={chatMessages}
              inputMessage={inputMessage}
              generating={generating}
              generatingStatus={generatingStatus}
              isOwner={isOwner}
              chatEndRef={chatEndRef}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
            />
          )}
          <PreviewPanel
            build={build}
            code={build.code}
            isOwner={isOwner}
            onCodeChange={handleCodeChange}
            onReplaceCode={handleReplaceCode}
            onSaveVersion={handleSaveVersion}
            savingVersion={savingVersion}
          />
        </div>
        {build.isPublic && (
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
}
