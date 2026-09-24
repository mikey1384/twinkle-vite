import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { CHAT_ID_BASE_NUMBER } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import AssistantFace from '~/components/AssistantFace';
import AgentSuggestions from '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions';
import AssistantReplyView from '~/containers/App/AssistantDock/AssistantReplyView';
import useAssistantConversation from '~/containers/App/AssistantDock/useAssistantConversation';
import {
  getHomeAskPrefill,
  setHomeAskAssistant,
  subscribeHomeAskPrefill
} from '~/containers/App/AssistantDock/dockState';

const appear = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`;

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
  const loadWebsiteAgentStarters = useAppContext(
    (v) => v.requestHelpers.loadWebsiteAgentStarters
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const { reply, replying, sending, send, clear } = useAssistantConversation({
    assistantName,
    channelId
  });
  const [starterIdeas, setStarterIdeas] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const engaged = focused || !!text.trim() || !!reply;

  useEffect(() => {
    onEngagedChange(engaged);
  }, [engaged, onEngagedChange]);
  useEffect(() => () => onEngagedChange(false), [onEngagedChange]);
  // A question typed into the Post field lands here, ready to send.
  const prefill = useSyncExternalStore(
    subscribeHomeAskPrefill,
    getHomeAskPrefill
  );
  useEffect(() => {
    if (prefill?.text) setText(prefill.text);
  }, [prefill?.nonce, prefill?.text]);

  // The floating window steps aside on Home for the assistant shown here.
  useEffect(() => {
    setHomeAskAssistant(assistantName);
    return () => setHomeAskAssistant(null);
  }, [assistantName]);

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

  async function handleSend(idea?: string) {
    if (await send(idea ?? text)) setText('');
  }

  return (
    <div
      data-home-ask-box=""
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
        <AssistantFace assistant={assistantName} size="3rem" />
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
          disabled={!text.trim() || sending || replying}
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
          <AssistantReplyView
            assistant={assistantName}
            reply={reply}
            channelId={channelId}
            contentKey="home-quick-ask"
            onAnswer={(answer) => handleSend(answer)}
          />
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
              <button type="button" onClick={clear} className={linkButtonClass}>
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
              // Starters only before a conversation: after a reply they'd
              // be beside the point.
              reply ? reply.suggestions || [] : starterIdeas
            }
            onPick={(idea) => handleSend(idea)}
          />
        </div>
      ) : null}
    </div>
  );
}

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
