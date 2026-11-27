import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import RichText from '~/components/Texts/RichText';
import ThinkingIndicator, {
  AI_WORKING_STATUSES,
  latestThoughtLine
} from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator';
import WebsiteAgentCard from '~/containers/Chat/Message/MessageBody/WebsiteAgentCard';
import {
  updateAssistantReplyCard,
  type AssistantNotice,
  type AssistantReply
} from './conversationStore';
import ChatReactionEmoji from '~/components/ChatReactionEmoji';
import { assistantVoice } from '~/helpers/assistantVoice';

// Zero or Ciel's latest reply outside the chat page: the text as it streams,
// what they are doing meanwhile, and a card it ends on, answered right here.
export default function AssistantReplyView({
  assistant,
  reply,
  channelId,
  contentKey,
  maxLines = 8,
  compactThinking = false,
  onAnswer
}: {
  assistant: 'Zero' | 'Ciel';
  reply: AssistantReply;
  channelId: number;
  // Distinguishes this surface's copy of the reply (Home box, dock).
  contentKey: string;
  maxLines?: number;
  // One steady line (the latest step) instead of the streaming thoughts,
  // for a small window where a growing box would jump about.
  compactThinking?: boolean;
  onAnswer: (answer: string) => void;
}) {
  return (
    <>
      {reply.error ? (
        <div style={{ color: Color.red() }}>{reply.error}</div>
      ) : reply.notice === 'declined' ? (
        <AssistantReplyNotice assistant={assistant} notice={reply.notice} />
      ) : reply.text ? (
        <RichText
          isAIMessage
          isStreaming={!reply.done}
          contentType="chat"
          contentId={`${contentKey}-${reply.messageId || 'new'}`}
          maxLines={maxLines}
          voice={assistantVoice(assistant)}
        >
          {reply.text.trimEnd()}
        </RichText>
      ) : reply.reaction ? (
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.8rem;
            color: ${Color.darkGray()};
          `}
        >
          <ChatReactionEmoji reaction={reply.reaction} size={30} />
          <span>{assistant} reacted to your message</span>
        </div>
      ) : reply.done || reply.notice ? null : compactThinking ? (
        <ThinkingIndicator
          status={reply.status || 'thinking'}
          activity={latestThoughtLine(reply.thoughts)}
          compact
        />
      ) : (
        <ThinkingIndicator
          status={reply.status || 'thinking'}
          thoughtContent={reply.thoughts}
          isStreamingThoughts={!!reply.thoughts || reply.thinkingHard}
          isThinkingHard={reply.thinkingHard}
        />
      )}
      {reply.notice === 'unfinished' && (
        <AssistantReplyNotice assistant={assistant} notice={reply.notice} />
      )}
      {reply.text &&
      !reply.done &&
      AI_WORKING_STATUSES.includes(reply.status) ? (
        <ThinkingIndicator
          status={reply.status}
          activity={latestThoughtLine(reply.thoughts)}
          compact
        />
      ) : null}
      {reply.done && reply.card && reply.messageId ? (
        <div
          className={css`
            margin-top: 0.4rem;
          `}
        >
          <WebsiteAgentCard
            card={reply.card}
            channelId={channelId}
            messageId={reply.messageId}
            messageText={reply.text}
            onAnswered={onAnswer}
            onCardUpdated={(nextCard) => {
              if (reply.messageId) {
                updateAssistantReplyCard(channelId, reply.messageId, nextCard);
              }
            }}
          />
        </div>
      ) : null}
    </>
  );
}


export function AssistantReplyNotice({
  assistant,
  notice
}: {
  assistant: 'Zero' | 'Ciel';
  notice: AssistantNotice;
}) {
  return (
    <div
      role="note"
      className={css`
        color: ${Color.darkGray()};
        font-size: 1.25rem;
      `}
    >
      {notice === 'declined'
        ? `${assistant} couldn’t answer this one. Try asking another way.`
        : `${assistant} couldn’t finish this reply.`}
    </div>
  );
}
