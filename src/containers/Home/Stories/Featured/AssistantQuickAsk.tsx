import Icon from '~/components/Icon';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import AssistantFace from '~/components/AssistantFace';
import AgentSuggestions from '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions';
import useAssistantConversation from '~/containers/App/AssistantDock/useAssistantConversation';
import {
  readCachedStarters,
  writeCachedStarters
} from '~/containers/Chat/Body/MessagesContainer/MessageInput/agentStartersCache';
import {
  closeAssistantDock,
  getHomeAskPrefill,
  openAssistantDock,
  setHomeAskAssistant,
  subscribeHomeAskPrefill,
  type AssistantAskContext
} from '~/containers/App/AssistantDock/dockState';
import AssistantModeBar from '~/containers/App/QuickAsk/AssistantModeBar';
import {
  loadAskStarters,
  useAskSuggestions,
  type AskActivity
} from '~/containers/App/QuickAsk/askSuggestions';
import { useAssistantMode } from '~/containers/App/QuickAsk/assistantMode';
import { closeQuickAsk, openQuickAsk } from '~/containers/App/QuickAsk/state';

// Talk to the Zero or Ciel chosen beside the call button without leaving
// Home. It is the same chat room as the chat page. The reply shows in their
// shared floating window, like every other Ask on the site: Home keeps no
// conversation card of its own (Mikey 10-04: a reply left parked under the
// box after talking to them anywhere felt messy).
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
  const loadWebsiteAgentStarters = useAppContext(
    (v) => v.requestHelpers.loadWebsiteAgentStarters
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const { replying, sending, send } = useAssistantConversation({
    assistantName,
    channelId
  });
  // Today's ideas kept on this device show at once; the server's copy then
  // refreshes them in place.
  const [starterIdeas, setStarterIdeas] = useState<string[]>(() =>
    readCachedStarters(userId)
  );
  const [starterLoaded, setStarterLoaded] = useState(false);
  // what the member did lately: chips may point at it (askSuggestions.ts)
  const [activity, setActivity] = useState<AskActivity>({});
  const suggestions = useAskSuggestions({ activity, fallback: starterIdeas });
  const [text, setText] = useState('');
  // Temporary (Quick Ask) or Saved (the main chat): the member's one
  // account-wide choice, switchable right here.
  const { mode, saveMode } = useAssistantMode();
  const [modeSwitching, setModeSwitching] = useState(false);
  const [modeError, setModeError] = useState('');
  const [focused, setFocused] = useState(false);
  const engaged = focused || !!text.trim() || sending;

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

  // The same ideas the chat shows above an empty message box, so people
  // find out what they can ask for.
  useEffect(() => {
    let cancelled = false;
    setStarterIdeas(readCachedStarters(userId));
    loadAskStarters(loadWebsiteAgentStarters, Number(userId || 0))
      .then(({ ideas, activity: nextActivity }) => {
        if (cancelled) return;
        setStarterLoaded(true);
        setActivity(nextActivity);
        writeCachedStarters(userId, ideas);
        setStarterIdeas((current) =>
          current.length === ideas.length &&
          current.every((idea, index) => idea === ideas[index])
            ? current
            : ideas
        );
      })
      .catch(() => {
        if (!cancelled) setStarterLoaded(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Tells the Post box an ask box is here to take a question it reads.
  useEffect(() => {
    setHomeAskAssistant(assistantName);
    return () => setHomeAskAssistant(null);
  }, [assistantName]);

  async function handleSend(idea?: string, context?: AssistantAskContext | null) {
    if (mode === 'temporary') {
      const question = (idea ?? text).trim();
      if (!question) return;
      setText('');
      closeAssistantDock();
      openQuickAsk({ agent: assistantName, question, context: context || null });
      return;
    }
    closeQuickAsk();
    if (!(await send(idea ?? text, context))) return;
    setText('');
    openAssistantDock(assistantName, undefined, 0);
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
          placeholder={
            mode === 'temporary'
              ? `Ask ${assistantName} a quick question`
              : `Ask ${assistantName} anything, or to do something for you`
          }
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
          aria-busy={sending}
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
          {(sending) && (
            <Icon icon="spinner" pulse style={{ marginLeft: '0.7rem' }} />
          )}
        </button>
      </form>
      <div
        className={css`
          margin-top: 0.5rem;
          padding: 0 0.4rem;
        `}
      >
        <AssistantModeBar
          assistant={assistantName}
          mode={mode}
          variant="inline"
          busy={modeSwitching}
          onChange={async (next) => {
            setModeSwitching(true);
            setModeError('');
            try {
              if (!(await saveMode(next))) throw new Error('mode');
            } catch {
              setModeError('Couldn’t change that. Try again.');
            } finally {
              setModeSwitching(false);
            }
          }}
        />
        {modeError && (
          <div
            role="alert"
            className={css`
              margin-top: 0.3rem;
              font-size: 1.2rem;
              color: ${Color.rose()};
            `}
          >
            {modeError}
          </div>
        )}
      </div>
      {/* The row keeps its height from the first paint (faint stand-ins until
          the ideas arrive, hidden while typing or replying) so nothing below
          moves under a finger. */}
      <div
        className={css`
          margin-top: 0.4rem;
        `}
      >
        <AgentSuggestions
          ideas={suggestions.map((suggestion) => suggestion.text)}
          loading={!starterLoaded}
          hidden={!!text.trim() || sending || replying}
          onPick={(idea) =>
            handleSend(
              idea,
              suggestions.find((suggestion) => suggestion.text === idea)?.context
            )
          }
        />
      </div>
    </div>
  );
}
