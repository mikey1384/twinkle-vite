import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useInView } from 'react-intersection-observer';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useLazyLoad } from '~/helpers/hooks';
import { timeSince } from '~/helpers/timeStampHelpers';
import AssistantMessage from './AssistantMessage';
import {
  BuildCurrentActivity,
  BuildStatusStepEntry,
  ChatMessage,
  ChatPanelRunMode
} from './types';
import { isBuildAssistantPlaceholderContent } from './utils';

interface MessageRowProps {
  message: ChatMessage;
  messages: ChatMessage[];
  runMode: ChatPanelRunMode;
  index: number;
  lastAssistantIndex: number;
  generating: boolean;
  generatingStatus: string | null;
  assistantStatusSteps: string[];
  currentActivity: BuildCurrentActivity | null;
  statusStepEntries: BuildStatusStepEntry[];
  activeStreamMessageIds: number[];
  isOwner: boolean;
  onFixRuntimeObservationMessage: (message: ChatMessage) => Promise<boolean> | boolean;
  onDeleteMessage: (message: ChatMessage) => void;
}

export default function MessageRow({
  message,
  messages,
  runMode,
  index,
  lastAssistantIndex,
  generating,
  generatingStatus,
  assistantStatusSteps,
  currentActivity,
  statusStepEntries,
  activeStreamMessageIds,
  isOwner,
  onFixRuntimeObservationMessage,
  onDeleteMessage
}: MessageRowProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [componentRef, inView] = useInView({
    rootMargin: '480px 0px'
  });
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const isLastAssistant =
    message.role === 'assistant' && index === lastAssistantIndex;
  const isActiveStreamMessage = activeStreamMessageIds.includes(message.id);
  const hasMeaningfulAssistantContent =
    message.role === 'assistant' &&
    !isBuildAssistantPlaceholderContent(message.content);
  const isStreamingTarget =
    generating &&
    (isActiveStreamMessage ||
      (activeStreamMessageIds.length === 0 &&
        message.role === 'assistant' &&
        isLastAssistant &&
        (runMode === 'greeting' || !hasMeaningfulAssistantContent)));
  const shouldLazyLoad =
    messages.length > 10 && index < messages.length - 8 && !isStreamingTarget;
  const isVisible = useLazyLoad({
    id: `build-chat-message-${message.id}`,
    PanelRef: panelRef,
    inView,
    onSetPlaceholderHeight: setPlaceholderHeight,
    delay: 400
  });
  const contentShown =
    !shouldLazyLoad || isVisible || inView || placeholderHeight <= 0;

  return (
    <div
      ref={componentRef}
      className={css`
        display: flex;
        flex-direction: column;
        align-items: ${message.role === 'user' ? 'flex-end' : 'flex-start'};
        position: relative;
      `}
    >
      {contentShown ? (
        <div
          ref={panelRef}
          className={css`
            display: flex;
            flex-direction: column;
            align-items: ${message.role === 'user' ? 'flex-end' : 'flex-start'};
            position: relative;
            width: 100%;
          `}
        >
          {!isStreamingTarget ? (
            <button
              onClick={() => onDeleteMessage(message)}
              title="Delete message"
              className={`${css`
                position: absolute;
                top: -0.35rem;
                right: ${message.role === 'user' ? '-0.25rem' : 'auto'};
                left: ${message.role === 'user' ? 'auto' : '-0.25rem'};
                padding: 0;
                border: none;
                background: transparent;
                color: var(--chat-text);
                font-size: 1.05rem;
                line-height: 1;
                opacity: 0.55;
                pointer-events: auto;
                transition:
                  opacity 0.15s ease,
                  transform 0.15s ease,
                  color 0.15s ease;
                transform: translateY(0);
                cursor: pointer;
                z-index: 2;
                &:hover,
                &:focus-visible {
                  opacity: 1;
                  color: ${Color.rose()};
                  transform: translateY(-1px);
                }
              `} build-chat-delete-button`}
            >
              <Icon icon="times-circle" />
            </button>
          ) : null}
          <div
            className={css`
              max-width: 85%;
              padding: 0.85rem 1.05rem;
              border-radius: 12px;
              background: ${message.role === 'user'
                ? 'var(--theme-bg)'
                : 'var(--chat-bg)'};
              color: ${message.role === 'user'
                ? 'var(--theme-text)'
                : 'var(--chat-text)'};
              word-break: break-word;
              font-size: var(--build-workshop-message-font-size);
              line-height: 1.48;
              border: 1px solid var(--ui-border);
            `}
          >
            {message.role === 'assistant' ? (
              <AssistantMessage
                message={message}
                messages={messages}
                generating={generating}
                generatingStatus={generatingStatus}
                statusSteps={isStreamingTarget ? assistantStatusSteps : []}
                currentActivity={isStreamingTarget ? currentActivity : null}
                statusStepEntries={isStreamingTarget ? statusStepEntries : []}
                isOwner={isOwner}
                onFixRuntimeObservationMessage={onFixRuntimeObservationMessage}
                isStreamingTarget={isStreamingTarget}
              />
            ) : (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            )}
          </div>
          <span
            className={css`
              font-size: var(--build-workshop-message-meta-font-size);
              color: var(--chat-text);
              opacity: 0.5;
              margin-top: 0.25rem;
              padding: 0 0.5rem;
            `}
          >
            {timeSince(message.createdAt)}
          </span>
        </div>
      ) : (
        <div
          className={css`
            width: 100%;
            display: flex;
            justify-content: ${message.role === 'user'
              ? 'flex-end'
              : 'flex-start'};
          `}
        >
          <div
            className={css`
              width: min(85%, 42rem);
              height: ${Math.max(placeholderHeight, 56)}px;
              border-radius: 12px;
              border: 1px solid var(--ui-border);
              background: linear-gradient(
                90deg,
                rgba(236, 241, 246, 0.8) 0%,
                rgba(247, 249, 252, 0.95) 45%,
                rgba(236, 241, 246, 0.8) 100%
              );
              opacity: 0.72;
            `}
          />
        </div>
      )}
    </div>
  );
}
