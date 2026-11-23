import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE } from '~/constants/appShell';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import {
  CHAT_ID_BASE_NUMBER,
  CIEL_PFP_URL,
  CIEL_TWINKLE_ID,
  ZERO_PFP_URL,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { uiScale } from '~/helpers/uiScale';
import Icon from '~/components/Icon';
import AssistantFace from '~/components/AssistantFace';
import RichText from '~/components/Texts/RichText';
import AgentSuggestions from '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import { EnergyChip, useDraggableWindow } from '../AssistantDock/frame';
import { askIdeasFor } from '../AssistantDock/askIdeas';
import {
  useAskStarters,
  useAskSuggestions,
  type AskSuggestion
} from './askSuggestions';
import {
  getAssistantWindowView,
  openAssistantDock,
  setAssistantWindowView,
  type AssistantAskContext
} from '../AssistantDock/dockState';
import AssistantModeBar from './AssistantModeBar';
import { useAssistantMode } from './assistantMode';
import AssistantReplyView from '../AssistantDock/AssistantReplyView';
import {
  EMPTY_ASSISTANT_REPLY,
  type AssistantReply
} from '../AssistantDock/conversationStore';
import {
  closeQuickAsk,
  quickAskShortcutLabel,
  subscribeQuickAskFocus,
  type QuickAskRequest
} from './state';

// Zero or Ciel in temporary mode (Quick Ask): small questions kept out of
// the member's main chat so it stays easy to scroll (twinkle-api
// helpers/ai/quickAsk.ts). It is the same floating box as the saved chat
// (same place on screen), with the Temporary / Saved switch in its header.
// The conversation lives only in this window's state; closing it, a reload
// or signing out ends it. Save to chat keeps one answer in their chat with
// that assistant. The server keeps its usual safety record, so the copy
// never promises secrecy.

const WINDOW_WIDTH = 360;
const appear = keyframes`from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; }`;
const rise = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; }`;
const QUICK_IDEAS = [
  'What does “brilliant” mean?',
  'How do I say “배고파” in English?',
  'Is “I am agree” correct?'
];

type SaveState = 'saving' | 'saved' | 'error';

interface Turn {
  key: number;
  question: string;
  reply: AssistantReply;
  save?: SaveState;
  savedChannelId?: number;
  // the item they pressed Ask on, shown above this question
  contextLabel?: string;
}

export default function QuickAskWindow({
  request
}: {
  request: QuickAskRequest;
}) {
  const agent = request.agent;
  const streamQuickAsk = useAppContext(
    (v) => v.requestHelpers.streamQuickAsk
  );
  const recordQuickAskOpen = useAppContext(
    (v) => v.requestHelpers.recordQuickAskOpen
  );
  const saveQuickAskTurn = useAppContext(
    (v) => v.requestHelpers.saveQuickAskTurn
  );
  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const agentChannelId = useChatContext((v) =>
    Number(
      (agent === 'Ciel' ? v.state.cielChannelId : v.state.zeroChannelId) || 0
    )
  );
  // Saved messages join that chat on screen only when it is already loaded;
  // otherwise the chat loads them itself when opened.
  const agentChatLoaded = useChatContext(
    (v) =>
      !!v.state.channelsObj?.[
        Number(
          (agent === 'Ciel' ? v.state.cielChannelId : v.state.zeroChannelId) ||
            0
        )
      ]?.messageIds
  );
  const { mode, saveMode } = useAssistantMode();
  // set while this window itself is switching, so the mode watcher below
  // doesn't react to its own change
  const selfSwitchRef = useRef(false);
  const handledRequestRef = useRef(request.nonce);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const navigate = useNavigate();
  const [phone] = useState(() => isMobile(navigator));
  // the same spot as the saved chat's window: one box, two modes
  const { position, viewport, windowRef, handleStart } = useDraggableWindow(
    getAssistantWindowView().position || {
      x: Math.max(
        8,
        window.innerWidth -
          Math.min(WINDOW_WIDTH * uiScale(), window.innerWidth - 16) -
          8
      ),
      y: 70 * uiScale()
    }
  );
  const [turns, setTurns] = useState<Turn[]>([]);
  const [context, setContext] = useState<AssistantAskContext | null>(
    request.context
  );
  // Switching to Saved with answers here: offer to keep them first.
  const [carryOver, setCarryOver] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [text, setText] = useState('');
  const [sessionError, setSessionError] = useState('');
  const sessionKeyRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const turnKeyRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followBottom = useRef(true);
  const last = turns[turns.length - 1];
  const replying = !!last && !last.reply.done;
  const unsavedTurns = turns.filter(
    (turn) =>
      turn.reply.done &&
      !!turn.reply.text &&
      !turn.reply.error &&
      !turn.reply.notice &&
      !!turn.reply.messageId &&
      turn.save !== 'saved'
  );
  // with an item attached, the questions for that kind of item; otherwise
  // chips about this page and what they did lately (askSuggestions.ts)
  const { activity } = useAskStarters();
  const pageSuggestions = useAskSuggestions({ activity, fallback: QUICK_IDEAS });
  const suggestions: AskSuggestion[] = context
    ? askIdeasFor(context).map((idea) => ({ text: idea }))
    : pageSuggestions;
  const ideas = suggestions.map((suggestion) => suggestion.text);

  useEffect(() => {
    void recordQuickAskOpen?.();
    inputRef.current?.focus();
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const stopFocus = subscribeQuickAskFocus(() => inputRef.current?.focus());
    if (request.question.trim()) void handleSend(request.question);
    return () => {
      window.clearTimeout(timer);
      stopFocus();
      // Closing mid-reply stops it; nothing of this conversation is kept here.
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (node && followBottom.current) node.scrollTop = node.scrollHeight;
  }, [turns]);
  useEffect(() => {
    if (!phone) setAssistantWindowView({ position });
  }, [phone, position]);
  // The switch flipped to Saved somewhere else (the Home box, another tab):
  // offer to keep these answers, or become the saved chat right away.
  // Only a change counts (this box opens only in Temporary mode).
  const prevModeRef = useRef(mode);
  useEffect(() => {
    const changed = prevModeRef.current !== mode;
    prevModeRef.current = mode;
    if (!changed || mode !== 'saved' || selfSwitchRef.current) return;
    if (unsavedTurns.length) setCarryOver(true);
    else {
      closeQuickAsk();
      openAssistantDock(agent, context);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  // A new Ask (a button or the Home box) for the same assistant joins this
  // conversation instead of replacing it: its item and question come here.
  useEffect(() => {
    if (handledRequestRef.current === request.nonce) return;
    handledRequestRef.current = request.nonce;
    if (request.context) setContext(request.context);
    if (request.question.trim()) {
      // still answering: the new question waits in the box
      if (replying) setText(request.question);
      else void handleSend(request.question, request.context);
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.nonce]);

  return createPortal(
    <div
      {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }}
      ref={windowRef}
      role="dialog"
      aria-label={`Quick Ask ${agent}`}
      onPointerDown={phone ? undefined : handleStart}
      onKeyDown={(event) => {
        // Escape closes only an idle, empty window, so a stray key never
        // throws away a reply or a half-typed question.
        if (event.key === 'Escape' && !replying && !text.trim()) {
          event.stopPropagation();
          closeQuickAsk();
        }
      }}
      style={
        phone
          ? undefined
          : {
              top: position.y,
              left: position.x,
              maxHeight: Math.max(
                160,
                viewport.top + viewport.height - position.y - 16
              )
            }
      }
      className={css`
        position: fixed;
        z-index: 2147482999;
        width: calc(${WINDOW_WIDTH} * var(--px));
        max-width: calc(100vw - 16px);
        display: flex;
        flex-direction: column;
        background: #f5f7fa;
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.16);
        overflow: hidden;
        animation: ${appear} 0.2s ease-out;
        button:focus-visible {
          outline: 2px solid ${Color.logoBlue()};
          outline-offset: -3px;
        }
        ${phone
          ? `
          left: 8px;
          right: 8px;
          width: auto;
          max-width: none;
          bottom: calc(${APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE} + 8px);
          max-height: calc(100dvh - ${APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE} - 24px);
          animation: ${rise} 0.22s ease-out;
        `
          : ''}
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `}
    >
      <div
        className={`${phone ? '' : 'draggable-area'} ${css`
          display: flex;
          align-items: stretch;
          height: calc(${phone ? 60 : 72} * var(--px));
          flex-shrink: 0;
          touch-action: ${phone ? 'auto' : 'none'};
          cursor: ${phone ? 'default' : 'move'};
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
          <AssistantFace assistant={agent} size={phone ? '4.4rem' : '5rem'} />
        </div>
        <div
          className={css`
            flex: 1;
            min-width: 0;
            padding: 0 0.8rem;
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
            {agent}
          </span>
          <span
            aria-live="polite"
            className={css`
              font-size: 1.2rem;
              color: ${Color.darkGray()};
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `}
          >
            {replying ? (
              `${agent} is answering…`
            ) : (
              <>
                <Icon icon="bolt" /> Quick Ask
              </>
            )}
          </span>
        </div>
        <div className={css`display: flex; align-items: center;`}>
          <EnergyChip />
        </div>
        <button
          type="button"
          data-no-drag=""
          aria-label="Close Quick Ask"
          onClick={closeQuickAsk}
          className={css`
            width: 40px;
            flex-shrink: 0;
            border: none;
            border-left: 1px solid var(--ui-border);
            background: none;
            color: ${Color.darkGray()};
            font-size: 1.5rem;
            cursor: pointer;
            &:hover {
              background: ${Color.logoBlue(0.08)};
              color: ${Color.logoBlue()};
            }
          `}
        >
          <Icon icon="times" />
        </button>
      </div>
      <AssistantModeBar
        assistant={agent}
        mode="temporary"
        busy={switching || replying}
        onChange={() => {
          if (unsavedTurns.length) setCarryOver(true);
          else void handleSwitchToSaved(false);
        }}
      />
      {(carryOver || switchError) && (
        <div role="alert" data-no-drag="" className={carryClass}>
          {switchError || (
            <>
              <span>
                Switch to Saved. Keep{' '}
                {unsavedTurns.length === 1
                  ? 'this answer'
                  : `these ${unsavedTurns.length} answers`}{' '}
                in your chat with {agent}?
              </span>
              <span className={carryButtonsClass}>
                <button
                  type="button"
                  className={saveButtonClass}
                  disabled={switching}
                  onClick={() => handleSwitchToSaved(true)}
                >
                  {switching ? <Icon icon="spinner" spin /> : <Icon icon="thumbtack" />}{' '}
                  Save {unsavedTurns.length === 1 ? 'it' : 'them'} to chat
                </button>
                <button
                  type="button"
                  className={linkClass}
                  disabled={switching}
                  onClick={() => handleSwitchToSaved(false)}
                >
                  Switch without saving
                </button>
                <button
                  type="button"
                  className={linkClass}
                  disabled={switching}
                  onClick={() => setCarryOver(false)}
                >
                  Stay
                </button>
              </span>
            </>
          )}
        </div>
      )}
      <div
        data-no-drag=""
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          padding: 0.8rem 0.9rem 0.9rem;
          min-height: 0;
        `}
      >
        {turns.length > 0 && (
          <div
            ref={scrollRef}
            aria-label="Conversation"
            onScroll={(event) => {
              const node = event.currentTarget;
              followBottom.current =
                node.scrollHeight - node.clientHeight - node.scrollTop < 40;
            }}
            className={css`
              padding: 0.9rem 1rem;
              background: #fff;
              border: 1px solid var(--ui-border);
              border-radius: 8px;
              font-size: 1.4rem;
              overflow-y: auto;
              max-height: ${phone ? '46dvh' : '42vh'};
              min-height: 70px;
              flex-shrink: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.35rem;
              }
            `}
          >
            {turns.map((turn) => (
              <div
                key={turn.key}
                className={css`
                  & + & {
                    margin-top: 1.1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--ui-border);
                  }
                `}
              >
                <div className={speakerClass}>
                  You
                  {turn.contextLabel ? ` · about ${turn.contextLabel}` : ''}
                </div>
                <RichText
                  contentType="chat"
                  contentId={`quick-ask-question-${turn.key}`}
                  maxLines={6}
                >
                  {turn.question}
                </RichText>
                <div className={speakerClass} style={{ marginTop: '.7rem' }}>
                  {agent}
                </div>
                <AssistantReplyView
                  assistant={agent}
                  reply={turn.reply}
                  channelId={0}
                  contentKey={`quick-ask-${turn.key}`}
                  maxLines={14}
                  compactThinking
                  onAnswer={() => {}}
                />
                {turn.reply.done &&
                  !!turn.reply.text &&
                  !turn.reply.error &&
                  !turn.reply.notice &&
                  !!turn.reply.messageId && (
                    <div className={saveRowClass}>
                      {turn.save === 'saved' ? (
                        <span role="status">
                          <Icon icon="check" /> Saved to your chat with {agent}
                          {turn.savedChannelId ? (
                            <>
                              {' · '}
                              <button
                                type="button"
                                className={linkClass}
                                onClick={() => handleOpenChat(turn.savedChannelId!)}
                              >
                                Open
                              </button>
                            </>
                          ) : null}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={saveButtonClass}
                          disabled={turn.save === 'saving'}
                          onClick={() => handleSave(turn)}
                        >
                          <Icon
                            icon={turn.save === 'saving' ? 'spinner' : 'thumbtack'}
                            spin={turn.save === 'saving'}
                          />{' '}
                          {turn.save === 'error' ? 'Couldn’t save. Try again' : 'Save to chat'}
                        </button>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
        {sessionError && (
          <div
            role="alert"
            className={css`
              font-size: 1.25rem;
              color: ${Color.darkGray()};
              line-height: 1.5;
            `}
          >
            {sessionError}{' '}
            <button
              type="button"
              onClick={handleStartOver}
              className={css`
                border: none;
                background: none;
                padding: 0;
                color: ${Color.logoBlue()};
                font-size: inherit;
                text-decoration: underline;
                cursor: pointer;
              `}
            >
              Start over
            </button>
          </div>
        )}
        {turns.length === 0 && !text.trim() && (
          <AgentSuggestions
            ideas={ideas}
            onPick={(idea) => {
              const picked = suggestions.find(
                (suggestion) => suggestion.text === idea
              );
              void handleSend(idea, picked?.context ?? undefined);
            }}
          />
        )}
        {context && (
          <div className={contextClass}>
            <Icon icon="paperclip" />
            <span
              className={css`
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              `}
            >
              About {context.label}
            </span>
            <button
              type="button"
              aria-label="Don’t attach this"
              className={linkClass}
              onClick={() => setContext(null)}
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
            onChange={(event) => setText(event.target.value)}
            placeholder={
              context
                ? `Ask ${agent} about this`
                : turns.length
                  ? 'Ask a follow-up'
                  : phone
                    ? `Ask ${agent} a quick question`
                    : `Ask ${agent} a quick question (${quickAskShortcutLabel()})`
            }
            aria-label={`Ask ${agent} a quick question`}
            maxLength={2000}
            enterKeyHint="send"
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
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 16px;
              }
            `}
          />
          <button
            type="submit"
            aria-busy={replying}
            disabled={(!text.trim() && !context) || replying || !!sessionError}
            className={css`
              border: none;
              border-radius: 9px;
              padding: 0.7rem 1.1rem;
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
            {replying ? <Icon icon="spinner" spin /> : 'Send'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );

  async function handleSend(
    content?: string,
    contextOverride?: AssistantAskContext | null
  ) {
    const question = (content ?? text).trim();
    const sentContext =
      contextOverride !== undefined ? contextOverride : context;
    if ((!question && !sentContext) || replying || sessionError) return;
    const key = ++turnKeyRef.current;
    // the item rides with this question only; follow-ups still see it
    setContext(null);
    const controller = new AbortController();
    abortRef.current = controller;
    followBottom.current = true;
    setText('');
    setTurns((current) => [
      ...current,
      {
        key,
        question,
        contextLabel: sentContext?.label,
        reply: { ...EMPTY_ASSISTANT_REPLY, suggestions: null, status: 'thinking' }
      }
    ]);
    const update = (patch: (reply: AssistantReply) => Partial<AssistantReply>) =>
      setTurns((current) =>
        current.map((turn) =>
          turn.key === key
            ? { ...turn, reply: { ...turn.reply, ...patch(turn.reply) } }
            : turn
        )
      );
    try {
      const done: any = await streamQuickAsk({
        agent,
        sessionKey: sessionKeyRef.current,
        message: question,
        askedAbout: sentContext,
        signal: controller.signal,
        onEvent: (event: any) => {
          if (event.type === 'session') {
            sessionKeyRef.current = String(event.sessionKey || '');
            update(() => ({ messageId: Number(event.turnId) || null }));
            // the item could not be read any more: don't label it
            if (event.askedDropped) {
              setTurns((current) =>
                current.map((item) =>
                  item.key === key ? { ...item, contextLabel: undefined } : item
                )
              );
            }
          } else if (event.type === 'status' && event.status) {
            update(() => ({ status: String(event.status) }));
          } else if (event.type === 'reset') {
            update(() => ({ text: '' }));
          } else if (event.type === 'text') {
            update((reply) =>
              typeof event.text === 'string'
                ? { text: event.text }
                : Number(event.startOffset) === reply.text.length
                  ? { text: reply.text + String(event.delta || '') }
                  : {}
            );
          }
        }
      });
      if (controller.signal.aborted) return;
      update(() => ({
        text: String(done?.text || ''),
        done: true,
        notice: done?.notice === 'declined' ? 'declined' : undefined
      }));
    } catch (error: any) {
      if (controller.signal.aborted) return;
      if (error?.code === 'quick_ask_ended' || error?.code === 'quick_ask_full') {
        setSessionError(error.message);
        setTurns((current) => current.filter((turn) => turn.key !== key));
        setText(question);
        setContext(sentContext);
        return;
      }
      update(() => ({
        done: true,
        error: error?.message || `${agent} couldn’t answer just now. Try again.`
      }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  async function handleSave(turn: Turn) {
    const turnId = Number(turn.reply.messageId);
    if (!turnId || turn.save === 'saving' || turn.save === 'saved') return true;
    const setSave = (patch: Partial<Turn>) =>
      setTurns((current) =>
        current.map((item) => (item.key === turn.key ? { ...item, ...patch } : item))
      );
    setSave({ save: 'saving' });
    try {
      const result = await saveQuickAskTurn(turnId);
      const channelId = Number(result?.channelId || 0);
      const agentUserId = Number(agent === 'Ciel' ? CIEL_TWINKLE_ID : ZERO_TWINKLE_ID);
      // The server's own rows, added to that chat only if it is loaded.
      if (channelId && channelId === agentChannelId && agentChatLoaded) {
        for (const message of result?.messages || []) {
          const fromAgent = Number(message.userId) === agentUserId;
          onReceiveMessage({
            message: {
              ...message,
              username: fromAgent ? agent : username,
              profilePicUrl: fromAgent
                ? agent === 'Ciel'
                  ? CIEL_PFP_URL
                  : ZERO_PFP_URL
                : profilePicUrl
            },
            pageVisible: true,
            usingChat: false,
            isMyMessage: true,
            newMembers: []
          });
        }
      }
      setSave({ save: 'saved', savedChannelId: channelId });
      return true;
    } catch {
      setSave({ save: 'error' });
      return false;
    }
  }

  // Temporary -> Saved: the account's choice changes, this box becomes the
  // saved chat; with keep=true the answers here are saved first, one by one.
  async function handleSwitchToSaved(keep: boolean) {
    if (switching) return;
    setSwitching(true);
    setSwitchError('');
    try {
      if (keep) {
        for (const turn of unsavedTurns) {
          if (!(await handleSave(turn))) {
            setSwitchError('Couldn’t save every answer. Try again, or save them one by one.');
            return;
          }
        }
      }
      selfSwitchRef.current = true;
      if (!(await saveMode('saved'))) {
        selfSwitchRef.current = false;
        throw new Error('mode');
      }
      closeQuickAsk();
      openAssistantDock(agent, context);
    } catch {
      setSwitchError('Couldn’t switch to Saved. Try again.');
    } finally {
      setSwitching(false);
    }
  }

  function handleOpenChat(channelId: number) {
    closeQuickAsk();
    navigate(`/chat/${Number(CHAT_ID_BASE_NUMBER) + channelId}`);
  }

  function handleStartOver() {
    abortRef.current?.abort();
    sessionKeyRef.current = '';
    setSessionError('');
    setTurns([]);
    inputRef.current?.focus();
  }
}

const speakerClass = css`
  font-size: 1.1rem;
  color: ${Color.darkGray()};
  font-weight: 600;
  margin-bottom: 0.3rem;
`;

const saveRowClass = css`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.3rem;
  font-size: 1.2rem;
  color: ${Color.darkGray()};
`;
const saveButtonClass = css`
  border: 1px solid ${Color.logoBlue(0.3)};
  border-radius: 999px;
  background: #fff;
  color: ${Color.logoBlue()};
  font-size: 1.2rem;
  font-weight: 650;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${Color.logoBlue(0.08)};
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
const linkClass = css`
  border: none;
  background: none;
  padding: 0;
  color: ${Color.logoBlue()};
  font-size: inherit;
  text-decoration: underline;
  cursor: pointer;
`;
const carryClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  font-size: 1.2rem;
  line-height: 1.45;
  color: #3d4a5c;
  background: #fff8e6;
  border-bottom: 1px solid var(--ui-border);
  flex-shrink: 0;
`;
const carryButtonsClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem;
`;
const contextClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  background: ${Color.logoBlue(0.08)};
  font-size: 1.25rem;
  color: ${Color.darkerGray()};
  flex-shrink: 0;
`;
