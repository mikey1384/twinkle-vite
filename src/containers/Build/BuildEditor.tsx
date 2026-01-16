import React, { useRef, useState } from 'react';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

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
          id: Date.now(),
          role: 'user',
          content: messageText,
          codeGenerated: null,
          createdAt: Math.floor(Date.now() / 1000)
        };

        // Add assistant message
        const assistantMessage = result.message;

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
    try {
      await updateBuildCode({ buildId: build.id, code: newCode });
      onUpdateBuild({ ...build, code: newCode });
    } catch (error) {
      console.error('Failed to update code:', error);
    }
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        height: calc(100vh - 60px);
        @media (max-width: ${mobileMaxWidth}) {
          height: calc(100vh - 50px);
        }
      `}
    >
      <div
        className={css`
          padding: 0.75rem 1rem;
          background: ${Color.wellGray()};
          border-bottom: 1px solid ${Color.borderGray()};
          display: flex;
          align-items: center;
          justify-content: space-between;
        `}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{build.title}</h2>
          {!isOwner && (
            <span
              style={{
                fontSize: '0.8rem',
                color: Color.darkGray()
              }}
            >
              by {build.username}
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
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              background: ${build.status === 'published'
                ? Color.green(0.15)
                : Color.gray(0.15)};
              color: ${build.status === 'published'
                ? Color.green()
                : Color.darkGray()};
            `}
          >
            {build.status}
          </span>
        </div>
      </div>

      <div
        className={css`
          display: flex;
          flex: 1;
          overflow: hidden;
          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
          }
        `}
      >
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
  );
}
