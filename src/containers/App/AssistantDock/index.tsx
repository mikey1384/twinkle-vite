import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  CHAT_ID_BASE_NUMBER,
  ZERO_TWINKLE_ID,
  CIEL_TWINKLE_ID
} from '~/constants/defaultValues';
import { getChatReaction } from '~/constants/chatReactions';
import { useChatContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { uiScale } from '~/helpers/uiScale';
import Icon from '~/components/Icon';
import AssistantFace from '~/components/AssistantFace';
import RichText from '~/components/Texts/RichText';
import { latestThoughtLine } from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator';
import AgentSuggestions from '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import {
  aiVoiceSession,
  startAiVoiceCall,
  endAiVoiceCall,
  updateAiVoiceContext,
  AI_VOICE_RESUME_MICROPHONE
} from '~/helpers/aiVoiceCall';
import { useWebsiteAgentOverlayActive } from '../WebsiteAgentSpotlight';
import { EnergyBattery, useDraggableWindow } from './frame';
import AssistantReplyView from './AssistantReplyView';
import { askIdeasFor } from './askIdeas';
import {
  attachAssistantConversationListeners,
  getAssistantTranscript,
  subscribeAssistantReplies
} from './conversationStore';
import {
  clearAssistantAskContext,
  consumeAssistantAskContext,
  closeAssistantDock,
  openAssistantDock,
  getAssistantAskContext,
  getAssistantDockAskedFromItem,
  getAssistantDock,
  getAssistantDockTopic,
  getAssistantAccountEpoch,
  getAssistantDraft,
  setAssistantDraft,
  getAssistantWindowView,
  setAssistantWindowView,
  getAssistantScroll,
  setAssistantScroll,
  subscribeAssistantDock,
  type AssistantAskContext
} from './dockState';
import useAssistantConversation from './useAssistantConversation';

const WINDOW_WIDTH = 360;
const appear = keyframes`from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; }`;
const pulse = keyframes`0%,100% { opacity: .45; } 50% { opacity: 1; }`;

// One shell for both transports. Temporary overlays hide it without throwing
// away its input, position, transcript scroll or pending permission card.
export default function AssistantDock() {
  useEffect(() => attachAssistantConversationListeners(), []);
  const assistant = useSyncExternalStore(
    subscribeAssistantDock,
    getAssistantDock
  );
  const topicId = useSyncExternalStore(
    subscribeAssistantDock,
    getAssistantDockTopic
  );
  const askContext = useSyncExternalStore(
    subscribeAssistantDock,
    getAssistantAskContext
  );
  const askedFromItem = useSyncExternalStore(
    subscribeAssistantDock,
    getAssistantDockAskedFromItem
  );
  const voice = useSyncExternalStore(
    aiVoiceSession.subscribe,
    aiVoiceSession.getSnapshot
  );
  const zeroChannelId = useChatContext((v) => v.state.zeroChannelId);
  const cielChannelId = useChatContext((v) => v.state.cielChannelId);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const overlayActive = useWebsiteAgentOverlayActive();
  const modalOpen = useModalOpen(!!assistant);
  const location = useLocation();
  const channelId = Number(
    assistant === 'Ciel'
      ? cielChannelId
      : assistant === 'Zero'
        ? zeroChannelId
        : 0
  );
  const conversationOnScreen =
    location.pathname.startsWith('/chat') &&
    Number(selectedChannelId) === channelId;
  const hidden =
    (overlayActive && voice.phase === 'text') ||
    (voice.phase === 'text' &&
      conversationOnScreen &&
      !modalOpen &&
      !askContext &&
      !askedFromItem);
  if (!assistant || !channelId) return null;
  return createPortal(
    <DockWindow
      assistant={assistant}
      channelId={channelId}
      topicId={topicId}
      askContext={askContext}
      hidden={hidden}
      compact={overlayActive}
    />,
    document.body
  );
}

export function DockWindow({
  assistant,
  channelId,
  topicId,
  askContext,
  hidden = false,
  compact = false
}: {
  assistant: 'Zero' | 'Ciel';
  channelId: number;
  topicId: number;
  askContext: AssistantAskContext | null;
  hidden?: boolean;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [phone] = useState(() => isMobile(navigator));
  const { position, viewport, windowRef, handleStart } = useDraggableWindow(
    getAssistantWindowView().position || {
      x: Math.max(
        8,
        window.innerWidth -
          Math.min(WINDOW_WIDTH * uiScale(), window.innerWidth - 16) -
          8
      ),
      y: phone ? 8 : 70 * uiScale()
    }
  );
  const [expanded, setExpanded] = useState(
    getAssistantWindowView().expanded ?? !phone
  );
  const showExpanded = expanded && !compact;
  const text = useSyncExternalStore(subscribeAssistantDock, () =>
    getAssistantDraft(assistant, topicId)
  );
  const voice = useSyncExternalStore(
    aiVoiceSession.subscribe,
    aiVoiceSession.getSnapshot
  );
  const transcript = useSyncExternalStore(subscribeAssistantReplies, () =>
    getAssistantTranscript(channelId, topicId)
  );
  const { reply, replying, sending, send, sendError } =
    useAssistantConversation({ assistantName: assistant, channelId, topicId });
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const followBottom = useRef(true);
  const [voiceQueued, setVoiceQueued] = useState(false);
  const [contextError, setContextError] = useState('');
  const [contextSending, setContextSending] = useState(false);
  const contextRevision = useRef(0);
  const contextResumeMuted = useRef<boolean | null>(null);
  const sharedContext = useRef<AssistantAskContext | null | undefined>(
    undefined
  );
  const active = voice.phase !== 'text';
  const sameCall = voice.channelId === channelId && voice.topicId === topicId;
  const connected = voice.phase === 'voice' && sameCall;
  const transitioning =
    voice.phase === 'connecting' || voice.phase === 'ending';
  const askIdeas = askIdeasFor(askContext);
  const awaitingAnswer =
    !!reply?.card &&
    (!reply.card.status ||
      ['pending', 'processing'].includes(reply.card.status)) &&
    !reply.card.answer;
  const status =
    voice.phase === 'connecting'
      ? `Connecting to ${voice.assistant || assistant}…`
      : voice.phase === 'ending'
        ? 'Microphone off · finishing voice'
        : voice.phase === 'voice'
          ? `${voice.assistant || assistant} · ${voice.microphonePaused ? 'Microphone paused' : voice.muted ? 'Microphone muted' : voice.speaking ? 'Speaking' : 'Listening'}`
          : voiceQueued
            ? 'Voice starts after this reply or choice'
            : replying
              ? expanded
                ? `${assistant} is working on it…`
                : latestThoughtLine(reply?.thoughts || '') ||
                  `${assistant} is working on it…`
              : reply?.text
                ? plainPreview(reply.text)
                : reply?.reaction
                  ? `${assistant} reacted ${getChatReaction(reply.reaction)?.fallback || ''}`.trim()
                  : `Talk to ${assistant} here`;

  useLayoutEffect(() => {
    const node = scrollRef.current;
    const saved = getAssistantScroll(assistant, topicId);
    followBottom.current = saved?.pinned ?? true;
    if (node)
      node.scrollTop = followBottom.current
        ? node.scrollHeight
        : saved?.top || 0;
  }, [assistant, topicId, showExpanded]);
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node && followBottom.current) node.scrollTop = node.scrollHeight;
  }, [transcript, reply?.text, reply?.thoughts]);
  useEffect(() => {
    setAssistantWindowView({ position, expanded });
  }, [position, expanded]);
  useEffect(() => {
    setVoiceQueued(false);
    setContextError('');
  }, [assistant, topicId]);
  useEffect(() => {
    if (!askContext) return;
    setExpanded(true);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [askContext]);
  // The attachment follows speech too. Pause the microphone until the server
  // has verified it; typing the next message never races ahead of that context.
  useEffect(() => {
    if (!connected) {
      sharedContext.current = undefined;
      contextResumeMuted.current = null;
      setContextSending(false);
      setContextError('');
      return;
    }
    if (sharedContext.current === askContext) return;
    const revision = ++contextRevision.current;
    contextResumeMuted.current ??= aiVoiceSession.getSnapshot().muted;
    aiVoiceSession.setMuted(true);
    setContextSending(true);
    setContextError('');
    void updateAiVoiceContext(askContext)
      .then(() => {
        if (
          revision !== contextRevision.current ||
          !aiVoiceSession.matches(voice.callId || undefined)
        )
          return;
        sharedContext.current = askContext;
        aiVoiceSession.setMuted(contextResumeMuted.current ?? true);
        contextResumeMuted.current = null;
      })
      .catch((error) => {
        if (revision === contextRevision.current)
          setContextError(error.message);
      })
      .finally(() => {
        if (revision === contextRevision.current) setContextSending(false);
      });
    return () => {
      contextRevision.current = revision + 1;
    };
  }, [askContext, connected, voice.callId]);
  useEffect(() => {
    if (!voiceQueued || replying || awaitingAnswer || sending || active) return;
    setVoiceQueued(false);
    void startAiVoiceCall(channelId, topicId, {
      assistant,
      askedAbout: askContext,
      continuation: true
    }).catch(() => {});
  }, [
    voiceQueued,
    replying,
    awaitingAnswer,
    sending,
    active,
    channelId,
    topicId,
    assistant,
    askContext
  ]);

  return (
    <div
      {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}
      ref={windowRef}
      role="dialog"
      aria-label={`Chat with ${assistant}`}
      onPointerDown={handleStart}
      style={{
        top: position.y,
        left: position.x,
        display: hidden ? 'none' : 'flex'
      }}
      className={css`
        position: fixed;
        z-index: ${active && compact ? 2147483003 : 2147482999};
        width: calc(${WINDOW_WIDTH} * var(--px));
        max-width: calc(100vw - 16px);
        max-height: ${Math.max(100, viewport.top + viewport.height - position.y - 16)}px;
        flex-direction: column;
        background: #f5f7fa;
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.16);
        overflow: hidden;
        animation: ${appear} 0.2s ease-out;
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
        button:focus-visible {
          outline: 2px solid ${Color.logoBlue()};
          outline-offset: -3px;
        }
      `}
    >
      <div
        className={`draggable-area ${css`
          display: flex;
          align-items: stretch;
          height: calc(${phone ? 60 : 76} * var(--px));
          flex-shrink: 0;
          touch-action: none;
          cursor: move;
          user-select: none;
        `}`}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            padding-left: 0.8rem;
          `}
        >
          <AssistantFace
            assistant={assistant}
            size={phone ? '4.4rem' : '5.4rem'}
          />
        </div>
        <button
          type="button"
          disabled={compact}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={showExpanded}
          className={css`
            flex: 1;
            min-width: 0;
            border: none;
            background: none;
            padding: 0 0.8rem;
            text-align: left;
            cursor: inherit;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.3rem;
          `}
        >
          <span
            className={css`
              font-size: 1.45rem;
              font-weight: 700;
              color: ${Color.logoBlue()};
            `}
          >
            {assistant}{' '}
            <Icon
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              style={{ fontSize: '1rem', marginLeft: '.4rem' }}
            />
          </span>
          <span
            aria-live="polite"
            className={css`
              font-size: 1.2rem;
              color: ${Color.darkGray()};
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 100%;
            `}
          >
            {voice.phase === 'voice' && (
              <span
                className={css`
                  display: inline-block;
                  width: 0.6rem;
                  height: 0.6rem;
                  margin-right: 0.5rem;
                  border-radius: 50%;
                  background: ${voice.muted ? '#8b93a0' : '#259366'};
                  animation: ${voice.speaking ? `${pulse} 1s infinite` : 'none'};
                  @media (prefers-reduced-motion: reduce) {
                    animation: none;
                  }
                `}
              />
            )}
            {status}
          </span>
        </button>
        <EnergyBattery width={14} margin=".7rem .4rem" />
        <div
          data-no-drag=""
          className={css`
            display: flex;
            flex-direction: column;
            width: 34px;
            flex-shrink: 0;
            border-left: 1px solid var(--ui-border);
          `}
        >
          <button
            type="button"
            className={windowButtonClass}
            aria-label={
              active
                ? 'Minimize conversation'
                : `Close the chat with ${assistant}`
            }
            onClick={() => (active ? setExpanded(false) : closeAssistantDock())}
          >
            <Icon icon={active ? 'minus' : 'times'} />
          </button>
          <button
            type="button"
            className={windowButtonClass}
            aria-label={`Open the full chat with ${assistant}`}
            onClick={() => {
              if (active) setExpanded(false);
              else closeAssistantDock();
              navigate(
                `/chat/${Number(CHAT_ID_BASE_NUMBER) + channelId}${topicId ? `/topic/${topicId}` : ''}`
              );
            }}
          >
            <Icon icon="comments" />
          </button>
        </div>
      </div>
      <div
        data-no-drag=""
        className={css`
          display: flex;
          gap: 0.5rem;
          padding: 0.6rem 0.9rem 0.8rem;
          flex-shrink: 0;
        `}
      >
        <div
          role="group"
          aria-label="Conversation mode"
          className={css`
            display: flex;
            flex: 1;
            padding: 3px;
            border: 1px solid var(--ui-border);
            border-radius: 9px;
            background: #e8edf3;
          `}
        >
          <button
            type="button"
            className={modeButtonClass}
            aria-pressed={!active && !voiceQueued}
            onClick={handleText}
          >
            <Icon icon="comment" /> Text
          </button>
          <button
            type="button"
            className={modeButtonClass}
            aria-pressed={active || voiceQueued}
            disabled={active}
            onClick={handleVoice}
          >
            <Icon
              icon={transitioning || voiceQueued ? 'spinner' : 'phone-volume'}
              spin={transitioning || voiceQueued}
            />{' '}
            {voice.phase === 'connecting'
              ? 'Connecting'
              : voice.phase === 'ending'
                ? 'Finishing'
                : 'Voice'}
          </button>
        </div>
        {connected && (
          <button
            type="button"
            className={controlButtonClass}
            disabled={contextSending || !!contextError}
            aria-label={voice.muted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={voice.muted}
            onClick={() => aiVoiceSession.setMuted(!voice.muted)}
          >
            <Icon icon={voice.muted ? 'microphone-slash' : 'microphone'} />
          </button>
        )}
        {active && (
          <button
            type="button"
            className={controlButtonClass}
            aria-label="End voice and return to text"
            onClick={handleText}
          >
            <Icon icon="phone-slash" />
          </button>
        )}
      </div>
      {connected && voice.microphonePaused && (
        <div className={noticeClass}>
          <button
            type="button"
            className={linkButtonClass}
            onClick={() =>
              window.dispatchEvent(new Event(AI_VOICE_RESUME_MICROPHONE))
            }
          >
            Resume microphone
          </button>{' '}
          · You can keep typing.
        </div>
      )}
      {(voice.error || contextError || sendError) && (
        <div role="alert" className={noticeClass}>
          {contextError || sendError || voice.error}
        </div>
      )}
      {voice.phase === 'ending' && (
        <div role="status" className={noticeClass}>
          Microphone off. Saving the conversation and finishing any current
          action. Voice Energy use ends when the call closes.
          <button
            type="button"
            className={linkButtonClass}
            onClick={() => {
              void endAiVoiceCall(false).catch(() => {});
            }}
          >
            End now and cancel pending work
          </button>
        </div>
      )}
      {active && !sameCall && (
        <div className={noticeClass}>
          Voice is with {voice.assistant} in another conversation.{' '}
          <button
            type="button"
            className={linkButtonClass}
            onClick={() =>
              voice.assistant &&
              openAssistantDock(voice.assistant, undefined, voice.topicId)
            }
          >
            Return to call
          </button>
        </div>
      )}
      {showExpanded && (
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            padding: 0 0.9rem 0.9rem;
            min-height: 0;
            overflow-y: auto;
          `}
        >
          {(reply || transcript.some((line) => line.content)) && (
            <div
              ref={scrollRef}
              onScroll={(event) => {
                const node = event.currentTarget;
                followBottom.current =
                  node.scrollHeight - node.clientHeight - node.scrollTop < 40;
                setAssistantScroll(assistant, topicId, {
                  top: node.scrollTop,
                  pinned: followBottom.current
                });
              }}
              aria-label="Conversation"
              className={css`
                padding: 0.9rem 1rem;
                background: #fff;
                border: 1px solid var(--ui-border);
                border-radius: 8px;
                font-size: 1.4rem;
                overflow-y: auto;
                max-height: 38vh;
                flex-shrink: 1;
                min-height: 70px;
              `}
            >
              {transcript
                .filter((line) => line.content && line.id !== reply?.messageId)
                .map((line) => (
                  <div
                    key={line.id}
                    className={css`
                      margin-bottom: 1rem;
                    `}
                  >
                    <div
                      className={css`
                        font-size: 1.1rem;
                        color: ${Color.darkGray()};
                        font-weight: 600;
                        margin-bottom: 0.3rem;
                      `}
                    >
                      {[ZERO_TWINKLE_ID, CIEL_TWINKLE_ID]
                        .map(Number)
                        .includes(line.userId)
                        ? assistant
                        : 'You'}
                    </div>
                    <RichText
                      contentType="chat"
                      contentId={`assistant-transcript-${line.id}`}
                      maxLines={12}
                    >
                      {line.content}
                    </RichText>
                  </div>
                ))}
              {reply && (
                <AssistantReplyView
                  assistant={assistant}
                  reply={reply}
                  channelId={channelId}
                  contentKey="assistant-dock"
                  maxLines={12}
                  compactThinking
                  onAnswer={(answer) => {
                    void handleSend(answer);
                  }}
                />
              )}
            </div>
          )}
          {!replying &&
          !text.trim() &&
          !active &&
          (askIdeas.length || reply?.suggestions?.length) ? (
            <AgentSuggestions
              ideas={askIdeas.length ? askIdeas : reply?.suggestions || []}
              onPick={(idea) => {
                void handleSend(idea);
              }}
            />
          ) : null}
          {askContext && (
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.6rem;
                padding: 0.5rem 0.7rem;
                border-radius: 8px;
                background: ${Color.logoBlue(0.08)};
                font-size: 1.25rem;
                color: ${Color.darkerGray()};
              `}
            >
              <Icon
                icon={contextSending ? 'spinner' : 'paperclip'}
                spin={contextSending}
              />
              <span
                className={css`
                  flex: 1;
                  min-width: 0;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                `}
              >
                About {askContext.label}
              </span>
              <button
                type="button"
                aria-label="Don’t attach this"
                className={windowButtonClass}
                style={{ flex: '0 0 auto', padding: '.3rem' }}
                onClick={clearAssistantAskContext}
              >
                <Icon icon="times" />
              </button>
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
            className={css`
              display: flex;
              gap: 0.6rem;
              flex-shrink: 0;
            `}
          >
            <input
              ref={inputRef}
              value={text}
              onChange={(event) =>
                setAssistantDraft(assistant, topicId, event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setExpanded(false);
                }
              }}
              placeholder={
                connected
                  ? `Type while you talk to ${assistant}`
                  : askContext
                    ? `Ask ${assistant} about this`
                    : `Reply to ${assistant}`
              }
              aria-label={`Message ${assistant}`}
              maxLength={2000}
              className={css`
                flex: 1;
                min-width: 0;
                padding: 0.8rem 1rem;
                font-size: 1.4rem;
                border: 1px solid ${Color.logoBlue(0.3)};
                border-radius: 9px;
                background: #fff;
                outline: none;
                &:focus {
                  border-color: ${Color.logoBlue(0.6)};
                  box-shadow: 0 0 0 3px ${Color.logoBlue(0.12)};
                }
              `}
            />
            <button
              aria-busy={sending}
              type="submit"
              disabled={
                (!text.trim() && !askContext) ||
                sending ||
                replying ||
                transitioning ||
                contextSending ||
                !!contextError ||
                (active && !sameCall)
              }
              className={css`
                border: none;
                border-radius: 9px;
                padding: 0.7rem 1rem;
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
              {sending ? <Icon icon="spinner" spin /> : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );

  async function handleSend(content?: string) {
    const epoch = getAssistantAccountEpoch();
    const sentContext = askContext;
    const sentText = content ?? text;
    if (await send(sentText, sentContext)) {
      if (epoch !== getAssistantAccountEpoch()) return;
      if (getAssistantDraft(assistant, topicId) === text)
        setAssistantDraft(assistant, topicId, '');
      consumeAssistantAskContext(assistant, topicId, sentContext);
    }
  }
  function handleText() {
    setVoiceQueued(false);
    if (active) void endAiVoiceCall().catch(() => {});
    setExpanded(true);
  }
  function handleVoice() {
    setExpanded(true);
    if (replying || awaitingAnswer || sending) {
      setVoiceQueued(true);
      return;
    }
    void startAiVoiceCall(channelId, topicId, {
      assistant,
      askedAbout: askContext,
      continuation: true
    }).catch(() => {});
  }
}

function plainPreview(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function useModalOpen(enabled: boolean) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById('modal');
    const check = () =>
      setOpen(!!document.querySelector('[aria-modal="true"]'));
    check();
    if (!root) return;
    const observer = new MutationObserver(check);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);
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
const modeButtonClass = css`
  flex: 1;
  border: none;
  border-radius: 6px;
  background: transparent;
  padding: 0.6rem 0.7rem;
  font-size: 1.25rem;
  font-weight: 650;
  color: #536278;
  cursor: pointer;
  &[aria-pressed='true'] {
    background: #fff;
    color: ${Color.logoBlue()};
    box-shadow: 0 1px 3px #0002;
  }
  &:disabled {
    cursor: default;
  }
  svg {
    margin-right: 0.4rem;
  }
`;
const controlButtonClass = css`
  width: 35px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  color: ${Color.logoBlue()};
  font-size: 1.3rem;
  cursor: pointer;
  &[aria-pressed='true'] {
    background: #e8edf3;
  }
`;
const noticeClass = css`
  padding: 0.6rem 1rem;
  font-size: 1.2rem;
  color: #4c5767;
  background: #edf1f6;
  line-height: 1.5;
  flex-shrink: 0;
`;
const linkButtonClass = css`
  display: inline;
  border: none;
  background: none;
  padding: 0.3rem 0;
  color: ${Color.logoBlue()};
  font-size: inherit;
  text-decoration: underline;
  cursor: pointer;
`;
