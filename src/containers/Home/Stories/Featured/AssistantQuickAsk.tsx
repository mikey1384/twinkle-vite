import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import {
  CHAT_ID_BASE_NUMBER,
  CIEL_PFP_URL,
  ZERO_PFP_URL,
  cloudFrontURL
} from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import RichText from '~/components/Texts/RichText';
import ThinkingIndicator, {
  AI_WORKING_STATUSES,
  latestThoughtLine
} from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator';
import { applyCanonicalTextStreamUpdate } from '~/helpers/canonicalTextStream';
import AgentSuggestions, {
  readAgentSuggestions
} from '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions';
import WebsiteAgentCard, {
  isWebsiteAgentCardData,
  type WebsiteAgentCardData
} from '~/containers/Chat/Message/MessageBody/WebsiteAgentCard';

const appear = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`;

interface Reply {
  messageId: number | null;
  text: string;
  // Streamed reasoning and steps, shown the way the chat shows them.
  thoughts: string;
  status: string;
  thinkingHard: boolean;
  // The reply's own next-step ideas; null while its card waits for an answer.
  suggestions: string[] | null;
  // A question or approval the reply ends on, answered right here.
  card: WebsiteAgentCardData | null;
  done: boolean;
  error: string;
}

// Talk to the Zero or Ciel chosen beside the call button without leaving
// Home. It is the same chat room as the chat page; the reply streams here,
// and whatever they do on the website happens on the page you are on.
export default function AssistantQuickAsk({
  assistantName,
  channelId,
  onEngagedChange
}: {
  assistantName: 'Zero' | 'Ciel';
  channelId: number;
  // True while the box is in use, so Home stops switching between Zero and
  // Ciel under the user (the reply listens to this assistant's room).
  onEngagedChange: (engaged: boolean) => void;
}) {
  const navigate = useNavigate();
  const saveChatMessage = useAppContext(
    (v) => v.requestHelpers.saveChatMessage
  );
  const loadWebsiteAgentStarters = useAppContext(
    (v) => v.requestHelpers.loadWebsiteAgentStarters
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [starterIdeas, setStarterIdeas] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const [focused, setFocused] = useState(false);
  const replyRef = useRef<Reply | null>(null);
  replyRef.current = reply;
  const engaged = focused || !!text.trim() || !!reply;

  useEffect(() => {
    onEngagedChange(engaged);
  }, [engaged, onEngagedChange]);
  useEffect(() => () => onEngagedChange(false), [onEngagedChange]);

  // A reply that goes quiet without finishing (a failure the server never
  // announced) stops holding the box after a while.
  useEffect(() => {
    if (!reply || reply.done) return;
    const timer = window.setTimeout(() => {
      setReply((current) =>
        current && !current.done ? { ...current, done: true } : current
      );
    }, 90_000);
    return () => window.clearTimeout(timer);
  }, [reply, reply?.text, reply?.thoughts, reply?.done]);

  // The same ideas the chat shows above an empty message box, so people
  // find out what they can ask for.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(loadWebsiteAgentStarters?.())
      .then((ideas) => {
        if (!cancelled && Array.isArray(ideas)) setStarterIdeas(ideas);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    function isThisReply(eventChannelId: unknown, messageId?: unknown) {
      const current = replyRef.current;
      return (
        !!current &&
        !current.done &&
        Number(eventChannelId) === channelId &&
        (messageId == null ||
          current.messageId == null ||
          Number(messageId) === current.messageId)
      );
    }
    function handleNewMessage({ message, channelId: eventChannelId }: any) {
      if (!isThisReply(eventChannelId) || replyRef.current?.messageId) return;
      setReply((current) =>
        current ? { ...current, messageId: Number(message?.id) } : current
      );
    }
    function handleDelta({
      channelId: eventChannelId,
      messageId,
      delta,
      startOffset
    }: any) {
      if (!isThisReply(eventChannelId, messageId)) return;
      setReply((current) =>
        current
          ? {
              ...current,
              text:
                typeof startOffset === 'number'
                  ? current.text.slice(0, startOffset) + delta
                  : current.text + delta
            }
          : current
      );
    }
    function handleEdit({
      channelId: eventChannelId,
      messageId,
      editedMessage,
      settings
    }: any) {
      // Next-step ideas can arrive a moment after the reply is done.
      const current = replyRef.current;
      const laterUpdate =
        !!current?.done &&
        Number(eventChannelId) === channelId &&
        current.messageId != null &&
        Number(messageId) === current.messageId;
      if (!laterUpdate && !isThisReply(eventChannelId, messageId)) return;
      if (typeof editedMessage !== 'string') return;
      setReply((current) =>
        current
          ? {
              ...current,
              text: editedMessage,
              suggestions: readAgentSuggestions(settings),
              card: isWebsiteAgentCardData(settings?.websiteAgentCard)
                ? settings.websiteAgentCard
                : null
            }
          : current
      );
    }
    function handleThought({
      channelId: eventChannelId,
      messageId,
      thoughtContent,
      isThinkingHard,
      isDelta,
      startOffset
    }: any) {
      if (!isThisReply(eventChannelId, messageId)) return;
      setReply((current) =>
        current
          ? {
              ...current,
              thinkingHard: !!isThinkingHard,
              thoughts: applyCanonicalTextStreamUpdate({
                currentText: current.thoughts,
                ...(isDelta
                  ? { delta: thoughtContent, startOffset }
                  : { snapshot: String(thoughtContent || '') })
              })
            }
          : current
      );
    }
    function handleStatus({
      channelId: eventChannelId,
      messageId,
      status
    }: any) {
      if (!isThisReply(eventChannelId, messageId)) return;
      setReply((current) =>
        current ? { ...current, status: String(status || '') } : current
      );
    }
    function handleDone(eventChannelId: unknown, messageId?: unknown) {
      if (!isThisReply(eventChannelId, messageId)) return;
      setReply((current) =>
        current ? { ...current, done: true, status: '' } : current
      );
    }
    socket.on('new_ai_message_received', handleNewMessage);
    socket.on('ai_message_delta_streamed', handleDelta);
    socket.on('chat_message_edited', handleEdit);
    socket.on('ai_thought_streamed', handleThought);
    socket.on('ai_thinking_status_updated', handleStatus);
    socket.on('ai_message_done', handleDone);
    return () => {
      socket.off('new_ai_message_received', handleNewMessage);
      socket.off('ai_message_delta_streamed', handleDelta);
      socket.off('chat_message_edited', handleEdit);
      socket.off('ai_thought_streamed', handleThought);
      socket.off('ai_thinking_status_updated', handleStatus);
      socket.off('ai_message_done', handleDone);
    };
  }, [channelId]);

  async function handleSend(idea?: string) {
    const content = (idea ?? text).trim();
    // One question at a time: a new one mid-reply would mix the two replies.
    const replying = Boolean(replyRef.current && !replyRef.current.done);
    if (!content || sending || replying) return;
    setSending(true);
    setReply({ ...EMPTY_REPLY });
    try {
      await saveChatMessage({
        // The same fields the chat page sends.
        message: {
          userId,
          content,
          channelId,
          isNotification: false,
          subjectId: 0
        },
        targetMessageId: null,
        targetSubject: null,
        isCielChat: assistantName === 'Ciel',
        isZeroChat: assistantName === 'Zero',
        thinkHard: false
      });
      setText('');
    } catch (error: any) {
      setReply({
        ...EMPTY_REPLY,
        done: true,
        error: error?.message || 'That didn’t send. Try again?'
      });
    } finally {
      setSending(false);
    }
  }

  const storedPicture = assistantName === 'Ciel' ? CIEL_PFP_URL : ZERO_PFP_URL;
  const picture = storedPicture?.startsWith('/')
    ? `${cloudFrontURL}${storedPicture}`
    : storedPicture;

  return (
    <div
      className={css`
        margin-bottom: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 0.8rem;
        }
      `}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.5rem 0.6rem 0.5rem 0.7rem;
          background: #fff;
          border: 1px solid ${Color.logoBlue(0.3)};
          border-radius: 999px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
          &:focus-within {
            border-color: ${Color.logoBlue(0.6)};
            box-shadow: 0 0 0 3px ${Color.logoBlue(0.12)};
          }
        `}
      >
        {picture ? (
          <img
            src={picture}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
            className={css`
              width: 3rem;
              height: 3rem;
              border-radius: 50%;
              flex-shrink: 0;
            `}
          />
        ) : null}
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`Ask ${assistantName} anything, or to do something for you`}
          aria-label={`Message ${assistantName}`}
          maxLength={2000}
          className={css`
            flex: 1;
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            font-size: 1.5rem;
            color: ${Color.black()};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.4rem;
            }
          `}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending || Boolean(reply && !reply.done)}
          className={css`
            border: none;
            border-radius: 999px;
            padding: 0.55rem 1.3rem;
            font-size: 1.35rem;
            font-weight: 700;
            color: #fff;
            background: ${Color.logoBlue()};
            cursor: pointer;
            flex-shrink: 0;
            &:disabled {
              opacity: 0.45;
              cursor: default;
            }
          `}
        >
          Ask
        </button>
      </form>
      {reply ? (
        <div
          className={css`
            margin-top: 0.7rem;
            padding: 1rem 1.2rem;
            border-radius: ${borderRadius};
            background: #fff;
            border: 1px solid var(--ui-border);
            animation: ${appear} 0.2s ease-out;
            font-size: 1.45rem;
          `}
        >
          {reply.error ? (
            <div style={{ color: Color.red() }}>{reply.error}</div>
          ) : reply.text ? (
            <RichText
              isAIMessage
              isStreaming={!reply.done}
              contentType="chat"
              contentId={`home-quick-ask-${reply.messageId || 'new'}`}
              maxLines={8}
            >
              {reply.text.trimEnd()}
            </RichText>
          ) : (
            <ThinkingIndicator
              status={reply.status || 'thinking'}
              thoughtContent={reply.thoughts}
              isStreamingThoughts={!!reply.thoughts || reply.thinkingHard}
              isThinkingHard={reply.thinkingHard}
            />
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
            <WebsiteAgentCard
              card={reply.card}
              channelId={channelId}
              messageId={reply.messageId}
              messageText={reply.text}
              onAnswered={(answer) => handleSend(answer)}
            />
          ) : null}
          <div
            className={css`
              display: flex;
              justify-content: flex-end;
              gap: 1rem;
              margin-top: 0.6rem;
              font-size: 1.25rem;
            `}
          >
            {reply.done ? (
              <button
                type="button"
                onClick={() => setReply(null)}
                className={linkButtonClass}
              >
                Close
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                navigate(`/chat/${Number(CHAT_ID_BASE_NUMBER) + channelId}`)
              }
              className={linkButtonClass}
            >
              Open chat
            </button>
          </div>
        </div>
      ) : null}
      {!text.trim() &&
      !sending &&
      (!reply || (reply.done && reply.suggestions !== null)) ? (
        <div
          className={css`
            margin-top: 0.4rem;
          `}
        >
          <AgentSuggestions
            ideas={
              reply?.suggestions?.length ? reply.suggestions : starterIdeas
            }
            onPick={(idea) => handleSend(idea)}
          />
        </div>
      ) : null}
    </div>
  );
}

const EMPTY_REPLY: Reply = {
  messageId: null,
  text: '',
  thoughts: '',
  status: '',
  thinkingHard: false,
  suggestions: [],
  card: null,
  done: false,
  error: ''
};

const linkButtonClass = css`
  border: none;
  background: none;
  padding: 0;
  color: ${Color.logoBlue()};
  font-weight: 700;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
