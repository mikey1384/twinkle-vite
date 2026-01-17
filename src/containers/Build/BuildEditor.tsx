import React, { useRef, useState } from 'react';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

const pageClass = css`
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 60px);
  background: linear-gradient(
    180deg,
    ${Color.whiteGray()} 0%,
    ${Color.white()} 45%,
    ${Color.whiteBlueGray(0.5)} 100%
  );
  @media (max-width: ${mobileMaxWidth}) {
    height: calc(100dvh - 50px);
  }
`;

const headerClass = css`
  padding: 1.2rem 1.8rem;
  background: linear-gradient(
    135deg,
    ${Color.white()} 0%,
    ${Color.whiteBlueGray(0.85)} 50%,
    ${Color.logoBlue(0.08)} 100%
  );
  border-bottom: 1px solid ${Color.borderGray()};
  box-shadow: 0 16px 32px -30px rgba(15, 23, 42, 0.35);
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
  background: ${Color.logoBlue(0.14)};
  color: ${Color.darkOceanBlue()};
  font-weight: 800;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const panelShellClass = css`
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1.2rem 1.6rem 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem;
    flex-direction: column;
  }
`;

const workspaceShellClass = css`
  flex: 1;
  display: flex;
  overflow: hidden;
  border-radius: ${borderRadius};
  border: 1px solid ${Color.borderGray()};
  box-shadow: 0 18px 40px -34px rgba(15, 23, 42, 0.35);
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
          content: result.message?.content ?? '',
          codeGenerated: result.message?.codeGenerated ?? null,
          createdAt: result.message?.createdAt ?? now
        };

        onUpdateChatMessages([...chatMessages, userMessage, assistantMessage]);
        onUpdateBuild({ ...build, code: result.code });

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
              color: ${Color.darkBlue()};
            `}
          >
            {build.title}
          </h2>
          {build.description ? (
            <span
              className={css`
                font-size: 1.05rem;
                color: ${Color.darkGray()};
              `}
            >
              {build.description}
            </span>
          ) : (
            <span
              className={css`
                font-size: 0.95rem;
                color: ${Color.gray()};
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
              background: ${build.status === 'published'
                ? Color.green(0.15)
                : Color.gray(0.15)};
              color: ${build.status === 'published'
                ? Color.green()
                : Color.darkGray()};
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
              background: ${build.isPublic ? Color.logoBlue(0.15) : Color.gray(0.12)};
              color: ${build.isPublic ? Color.logoBlue() : Color.darkGray()};
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
          />
        </div>
      </div>
    </div>
  );
}
