import React, { useRef, useState } from 'react';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

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
  const generateBuildCode = useAppContext(
    (v) => v.requestHelpers.generateBuildCode
  );
  const updateBuildCode = useAppContext(
    (v) => v.requestHelpers.updateBuildCode
  );

  const [generating, setGenerating] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function handleSendMessage() {
    if (!inputMessage.trim() || generating || !isOwner) return;

    const messageText = inputMessage.trim();
    const now = Math.floor(Date.now() / 1000);
    const messageId = Date.now();
    setInputMessage('');
    setGenerating(true);

    try {
      const result = await generateBuildCode({
        buildId: build.id,
        message: messageText
      });

      if (result?.success) {
        const assistantText =
          result.assistantText ?? result.message?.content ?? '';
        const artifactCode =
          result.artifact?.content ?? result.code ?? null;
        const artifactVersionId =
          result.message?.artifactVersionId ??
          result.artifact?.versionId ??
          null;

        // Add user message
        const userMessage: ChatMessage = {
          id: messageId,
          role: 'user',
          content: messageText,
          codeGenerated: null,
          createdAt: now
        };

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: messageId + 1,
          role: 'assistant',
          content: assistantText,
          codeGenerated: artifactCode,
          artifactVersionId,
          createdAt: result.message?.createdAt ?? now
        };

        onUpdateChatMessages([...chatMessages, userMessage, assistantMessage]);
        if (artifactCode) {
          const nextBuild = {
            ...build,
            code: artifactCode,
            primaryArtifactId: result.artifact?.id ?? build.primaryArtifactId
          };
          onUpdateBuild(nextBuild);
        }

        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
    }

    setGenerating(false);
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
        </div>
      </header>

      <div className={panelShellClass}>
        <div className={workspaceShellClass}>
          <ChatPanel
            messages={chatMessages}
            inputMessage={inputMessage}
            generating={generating}
            isOwner={isOwner}
            chatEndRef={chatEndRef}
            onInputChange={setInputMessage}
            onSendMessage={handleSendMessage}
          />
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
      </div>
    </div>
  );
}
