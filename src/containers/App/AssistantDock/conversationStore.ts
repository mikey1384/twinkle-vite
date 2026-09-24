import { socket } from '~/constants/sockets/api';
import { applyCanonicalTextStreamUpdate } from '~/helpers/canonicalTextStream';
import { readAgentSuggestions } from '~/containers/Chat/Body/MessagesContainer/MessageInput/AgentSuggestions';
import {
  isWebsiteAgentCardData,
  type WebsiteAgentCardData
} from '~/containers/Chat/Message/MessageBody/WebsiteAgentCard';

// Zero and Ciel's latest reply in each of their chats, followed from its
// first word for as long as the app is open. The Home ask box and the
// floating dock read it here, so a reply started in one (or on the chat page)
// keeps streaming in the other after the user is taken to another screen.
export interface AssistantReply {
  messageId: number | null;
  text: string;
  // Streamed reasoning and steps, shown the way the chat shows them.
  thoughts: string;
  status: string;
  thinkingHard: boolean;
  // The reply's own next-step ideas; null while its card waits for an answer.
  suggestions: string[] | null;
  // A question or approval the reply ends on, answered right where it shows.
  card: WebsiteAgentCardData | null;
  done: boolean;
  error: string;
}

export const EMPTY_ASSISTANT_REPLY: AssistantReply = {
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

const replies = new Map<number, AssistantReply>();
const listeners = new Set<() => void>();

export function subscribeAssistantReplies(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAssistantReply(channelId: number) {
  return replies.get(channelId) || null;
}

export function setAssistantReply(
  channelId: number,
  next:
    | AssistantReply
    | null
    | ((current: AssistantReply | null) => AssistantReply | null)
) {
  const current = replies.get(channelId) || null;
  const value = typeof next === 'function' ? next(current) : next;
  if (value === current) return;
  if (value) replies.set(channelId, value);
  else replies.delete(channelId);
  listeners.forEach((listener) => listener());
}

function isThisReply(
  reply: AssistantReply | null,
  messageId?: unknown
): reply is AssistantReply {
  return (
    !!reply &&
    !reply.done &&
    (messageId == null ||
      reply.messageId == null ||
      Number(messageId) === reply.messageId)
  );
}

function handleNewMessage({ message, channelId }: any) {
  const id = Number(message?.id);
  if (!channelId || !id) return;
  setAssistantReply(Number(channelId), (current) =>
    current && !current.done && current.messageId == null
      ? { ...current, messageId: id }
      : current?.messageId === id
        ? current
        : { ...EMPTY_ASSISTANT_REPLY, messageId: id }
  );
}

function handleDelta({ channelId, messageId, delta, startOffset }: any) {
  setAssistantReply(Number(channelId), (current) =>
    isThisReply(current, messageId)
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

function handleEdit({ channelId, messageId, editedMessage, settings }: any) {
  if (typeof editedMessage !== 'string') return;
  setAssistantReply(Number(channelId), (current) =>
    // Next-step ideas can arrive a moment after the reply is done.
    current &&
    current.messageId != null &&
    Number(messageId) === current.messageId
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
  channelId,
  messageId,
  thoughtContent,
  isThinkingHard,
  isDelta,
  startOffset
}: any) {
  setAssistantReply(Number(channelId), (current) =>
    isThisReply(current, messageId)
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

function handleStatus({ channelId, messageId, status }: any) {
  setAssistantReply(Number(channelId), (current) =>
    isThisReply(current, messageId)
      ? { ...current, status: String(status || '') }
      : current
  );
}

function handleDone(channelId: unknown, messageId?: unknown) {
  setAssistantReply(Number(channelId), (current) =>
    isThisReply(current, messageId)
      ? { ...current, done: true, status: '' }
      : current
  );
}

// A reply that goes quiet without finishing (a failure the server never
// announced) stops holding the conversation after a while.
const QUIET_REPLY_MS = 90_000;
let quietTimer = 0;
function checkQuietReplies() {
  const now = Date.now();
  for (const [channelId, reply] of replies) {
    const lastHeard = lastHeardAt.get(channelId) || now;
    if (!reply.done && now - lastHeard > QUIET_REPLY_MS) {
      setAssistantReply(channelId, { ...reply, done: true, status: '' });
    }
  }
}
const lastHeardAt = new Map<number, number>();
function heard(handler: (...args: any[]) => void) {
  return (...args: any[]) => {
    const first = args[0];
    const channelId = Number(
      typeof first === 'object' && first ? first.channelId : first
    );
    if (channelId) lastHeardAt.set(channelId, Date.now());
    handler(...args);
  };
}

const EVENTS: [string, (...args: any[]) => void][] = [
  ['new_ai_message_received', heard(handleNewMessage)],
  ['ai_message_delta_streamed', heard(handleDelta)],
  ['chat_message_edited', heard(handleEdit)],
  ['ai_thought_streamed', heard(handleThought)],
  ['ai_thinking_status_updated', heard(handleStatus)],
  ['ai_message_done', heard(handleDone)]
];

let attachedCount = 0;
// The app shell attaches once; the listeners live as long as the app.
export function attachAssistantConversationListeners() {
  if (attachedCount++ === 0) {
    for (const [event, handler] of EVENTS) socket.on(event, handler);
    quietTimer = window.setInterval(checkQuietReplies, 5_000);
  }
  return () => {
    if (--attachedCount > 0) return;
    for (const [event, handler] of EVENTS) socket.off(event, handler);
    window.clearInterval(quietTimer);
  };
}

// A message the user just sent: its reply starts now, before the server
// names it.
export function startAssistantReply(channelId: number) {
  lastHeardAt.set(channelId, Date.now());
  setAssistantReply(channelId, { ...EMPTY_ASSISTANT_REPLY });
}
