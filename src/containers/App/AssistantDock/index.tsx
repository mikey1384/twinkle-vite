import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { CHAT_ID_BASE_NUMBER } from '~/constants/defaultValues';
import { useChatContext } from '~/contexts';
import { isMobile } from '~/helpers';
import Icon from '~/components/Icon';
import ZeroPic from '~/components/ZeroPic';
import { latestThoughtLine } from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator';
import AgentSuggestions from '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import { useWebsiteAgentOverlayActive } from '../WebsiteAgentSpotlight';
import { EnergyBattery, useDraggableWindow } from '../AICallWindow/frame';
import AssistantReplyView from './AssistantReplyView';
import { attachAssistantConversationListeners } from './conversationStore';
import {
  closeAssistantDock,
  getAssistantDock,
  subscribeAssistantDock
} from './dockState';
import useAssistantConversation from './useAssistantConversation';

const WINDOW_WIDTH = 360;

const appear = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
`;

// Zero or Ciel's floating window when there is no call: after they take the
// user to another screen (or open something there), the conversation comes
// along, so the user can keep talking to them while on that screen. It is
// the call window's other form (same picture, same Energy battery, same
// place), with the chat in place of the hang-up button.
export default function AssistantDock() {
  // Replies are followed from their first word, whichever screen the user
  // is on when the window comes up.
  useEffect(() => attachAssistantConversationListeners(), []);
  const assistant = useSyncExternalStore(
    subscribeAssistantDock,
    getAssistantDock
  );
  const zeroChannelId = useChatContext((v) => v.state.zeroChannelId);
  const cielChannelId = useChatContext((v) => v.state.cielChannelId);
  const aiCallChannelId = useChatContext((v) => v.state.aiCallChannelId);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const overlayActive = useWebsiteAgentOverlayActive();
  const modalOpen = useModalOpen();
  const location = useLocation();
  const channelId = Number(
    assistant === 'Ciel'
      ? cielChannelId
      : assistant === 'Zero'
        ? zeroChannelId
        : 0
  );

  // In a call the call window is this window. The chat page open on this
  // conversation shows it itself, and on Home the ask box does, unless
  // something (like Wordle) is open over them. A spotlight or prompt of
  // theirs has the stage meanwhile.
  const conversationOnScreen =
    (location.pathname.startsWith('/chat') &&
      Number(selectedChannelId) === channelId) ||
    location.pathname === '/';
  const hidden =
    !assistant ||
    !channelId ||
    !!aiCallChannelId ||
    overlayActive ||
    (conversationOnScreen && !modalOpen);
  if (hidden) return null;
  return createPortal(
    <DockWindow assistant={assistant} channelId={channelId} />,
    document.body
  );
}

function DockWindow({
  assistant,
  channelId
}: {
  assistant: 'Zero' | 'Ciel';
  channelId: number;
}) {
  const navigate = useNavigate();
  // Phones: a slim bar over the site header, clear of a game's own header
  // and keyboard, opened with a tap.
  const [phone] = useState(() => isMobile(navigator));
  const { position, windowRef, handleStart, dragLayer } = useDraggableWindow({
    x: Math.max(8, window.innerWidth - WINDOW_WIDTH - 16),
    y: phone ? 8 : 70
  });
  const [expanded, setExpanded] = useState(!phone);
  const [text, setText] = useState('');
  const { reply, replying, sending, send } = useAssistantConversation({
    assistantName: assistant,
    channelId
  });
  const step = replying ? latestThoughtLine(reply?.thoughts || '') : '';
  const status = replying
    ? step || `${assistant} is working on it…`
    : reply?.text
      ? plainPreview(reply.text)
      : `Talk to ${assistant} here`;

  async function handleSend(content?: string) {
    if (await send(content ?? text)) setText('');
  }

  return (
    <>
      {dragLayer}
      <div
        {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}
        ref={windowRef}
        role="dialog"
        aria-label={`Chat with ${assistant}`}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{ top: position.y, left: position.x }}
        className={css`
          position: fixed;
          z-index: 2147482999;
          width: ${WINDOW_WIDTH}px;
          max-width: calc(100vw - 16px);
          max-height: calc(100vh - 90px);
          display: flex;
          flex-direction: column;
          background-color: #f5f7fa;
          border: 1px solid var(--ui-border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: ${appear} 0.2s ease-out;
          @media (max-width: ${mobileMaxWidth}) {
            width: calc(100vw - 16px);
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: stretch;
            height: ${phone ? 60 : 96}px;
            flex-shrink: 0;
          `}
        >
          <div
            className={`draggable-area ${css`
              display: flex;
              align-items: center;
              padding-left: 0.8rem;
              cursor: move;
              touch-action: none;
            `}`}
          >
            <div
              className={css`
                width: ${phone ? 44 : 68}px;
                height: ${phone ? 44 : 68}px;
              `}
            >
              <ZeroPic assistant={assistant} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className={css`
              flex: 1;
              min-width: 0;
              border: none;
              background: none;
              padding: 0 0.6rem;
              text-align: left;
              cursor: pointer;
              display: flex;
              flex-direction: column;
              justify-content: center;
              gap: 0.2rem;
            `}
          >
            <span
              className={css`
                font-size: 1.45rem;
                font-weight: 700;
                color: ${Color.logoBlue()};
              `}
            >
              {assistant}
            </span>
            <span
              aria-live="polite"
              className={css`
                font-size: 1.25rem;
                color: ${Color.darkGray()};
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              `}
            >
              {expanded && !replying && reply?.text ? 'Tap to hide' : status}
            </span>
          </button>
          <EnergyBattery
            width={phone ? 14 : 20}
            margin={phone ? '0.5rem 0.3rem' : '0.9rem 0.4rem'}
          />
          <div
            className={css`
              display: flex;
              flex-direction: ${phone ? 'row' : 'column'};
              width: ${phone ? 76 : 40}px;
              flex-shrink: 0;
              border-left: 1px solid var(--ui-border);
            `}
          >
            <button
              type="button"
              aria-label={`Close the chat with ${assistant}`}
              onClick={closeAssistantDock}
              className={windowButtonClass}
            >
              <Icon icon="times" />
            </button>
            <button
              type="button"
              aria-label={`Open the full chat with ${assistant}`}
              onClick={() => {
                closeAssistantDock();
                navigate(`/chat/${Number(CHAT_ID_BASE_NUMBER) + channelId}`);
              }}
              className={windowButtonClass}
            >
              <Icon icon="comments" />
            </button>
          </div>
        </div>
        {expanded ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.6rem;
              padding: 0 0.9rem 0.9rem;
              min-height: 0;
            `}
          >
            {reply ? (
              <div
                className={css`
                  padding: 0.9rem 1rem;
                  background: #fff;
                  border: 1px solid var(--ui-border);
                  border-radius: 8px;
                  font-size: 1.4rem;
                  overflow-y: auto;
                  max-height: 38vh;
                `}
              >
                <AssistantReplyView
                  reply={reply}
                  channelId={channelId}
                  contentKey="assistant-dock"
                  maxLines={12}
                  onAnswer={(answer) => handleSend(answer)}
                />
              </div>
            ) : null}
            {!replying && !text.trim() && reply?.suggestions?.length ? (
              <AgentSuggestions
                ideas={reply.suggestions}
                onPick={(idea) => handleSend(idea)}
              />
            ) : null}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
              className={css`
                display: flex;
                gap: 0.6rem;
              `}
            >
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  // Esc hides this window, not the screen behind it.
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    setExpanded(false);
                  }
                }}
                placeholder={`Reply to ${assistant}`}
                aria-label={`Message ${assistant}`}
                maxLength={2000}
                className={css`
                  flex: 1;
                  min-width: 0;
                  padding: 0.7rem 1rem;
                  font-size: 1.4rem;
                  border: 1px solid ${Color.logoBlue(0.3)};
                  border-radius: 999px;
                  background: #fff;
                  outline: none;
                  &:focus {
                    border-color: ${Color.logoBlue(0.6)};
                    box-shadow: 0 0 0 3px ${Color.logoBlue(0.12)};
                  }
                `}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending || replying}
                className={css`
                  border: none;
                  border-radius: 999px;
                  padding: 0.6rem 1.2rem;
                  font-size: 1.3rem;
                  font-weight: 700;
                  color: #fff;
                  background: ${Color.logoBlue()};
                  cursor: pointer;
                  &:disabled {
                    opacity: 0.45;
                    cursor: default;
                  }
                `}
              >
                Send
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}

// A line of the reply to show while the window is small: text only.
function plainPreview(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Whether a window (a game, a modal) is open over the page.
function useModalOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const root = document.getElementById('modal');
    const check = () =>
      setOpen(!!document.querySelector('[aria-modal="true"]'));
    check();
    if (!root) return;
    const observer = new MutationObserver(check);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return open;
}

const windowButtonClass = css`
  flex: 1;
  border: none;
  background: none;
  color: ${Color.darkGray()};
  font-size: 1.4rem;
  cursor: pointer;
  &:hover {
    background: ${Color.logoBlue(0.08)};
    color: ${Color.logoBlue()};
  }
`;
