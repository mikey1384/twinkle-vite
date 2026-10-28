import { socket } from '~/constants/sockets/api';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
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
  // A reply that is a reaction to the user's message instead of words
  // (a reaction key, like 'thumb').
  reaction?: string;
  // Ended by going quiet, not by the server: a later event for the same
  // message brings it back.
  timedOut?: boolean;
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

const replies = new Map<string, AssistantReply>();
const messageTopics = new Map<number, number>();
const conversationKey = (channelId: number, topicId = 0) =>
  `${channelId}:${topicId}`;
export interface ConversationLine {
  id: number;
  userId: number;
  content: string;
}
const transcripts = new Map<string, ConversationLine[]>();
const EMPTY_TRANSCRIPT: ConversationLine[] = [];
export function getAssistantTranscript(channelId: number, topicId = 0) {
  return (
    transcripts.get(conversationKey(channelId, topicId)) || EMPTY_TRANSCRIPT
  );
}
export function resetAssistantConversations() {
  replies.clear();
  messageTopics.clear();
  transcripts.clear();
  lastHeardAt.clear();
  listeners.forEach((fn) => fn());
}
export function receiveAssistantMessage(message: any) {
  const channelId = Number(message?.channelId),
    id = Number(message?.id);
  if (!channelId || !id) return;
  const topicId = Number(message.subjectId || 0);
  // Keep only conversations actually followed by this dock, or canonical
  // messages from the two companions. Ordinary group messages stay in Chat.
  const key = conversationKey(channelId, topicId);
  if (
    !replies.has(key) &&
    !transcripts.has(key) &&
    ![ZERO_TWINKLE_ID, CIEL_TWINKLE_ID]
      .map(Number)
      .includes(Number(message.userId))
  )
    return;
  messageTopics.set(id, topicId);
  if (messageTopics.size > 2000)
    messageTopics.delete(messageTopics.keys().next().value!);
  const reply = replies.get(key);
  if (reply?.done && reply.messageId != null && id > reply.messageId)
    replies.delete(key);
  const previous = transcripts.get(key) || [];
  const line = {
    id,
    userId: Number(message.userId),
    content: String(message.content || '')
  };
  transcripts.set(
    key,
    [...previous.filter((item) => item.id !== id), line]
      .sort((a, b) => a.id - b.id)
      .slice(-30)
  );
  listeners.forEach((fn) => fn());
}
export function followAssistantConversation(channelId: number, topicId = 0) {
  const key = conversationKey(channelId, topicId);
  if (!transcripts.has(key)) transcripts.set(key, []);
}
export function seedAssistantTranscript(
  messages: any[],
  channelId?: number,
  topicId = 0,
  replaceThroughId = 0
) {
  const groups = new Map<string, any[]>();
  if (channelId) groups.set(conversationKey(channelId, topicId), []);
  for (const message of messages) {
    const channelId = Number(message.channelId),
      topicId = Number(message.subjectId || 0);
    if (!channelId || !Number(message.id)) continue;
    const key = conversationKey(channelId, topicId);
    groups.set(key, [...(groups.get(key) || []), message]);
  }
  for (const [key, rows] of groups) {
    const newest = rows.length
      ? Math.max(replaceThroughId, ...rows.map((row) => Number(row.id)))
      : replaceThroughId || Infinity;
    // Replace the confirmed snapshot (including offline deletions), retaining
    // only events newer than that read if another device spoke meanwhile.
    transcripts.set(
      key,
      (transcripts.get(key) || []).filter((line) => line.id > newest)
    );
    for (const message of rows) receiveAssistantMessage(message);
  }
  listeners.forEach((fn) => fn());
}

function updateReplyForMessage(
  channelId: number,
  messageId: unknown,
  next: (current: AssistantReply | null) => AssistantReply | null
) {
  setAssistantReply(channelId, next, messageTopics.get(Number(messageId)) || 0);
}

const listeners = new Set<() => void>();

export function subscribeAssistantReplies(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAssistantReply(channelId: number, topicId = 0) {
  return replies.get(conversationKey(channelId, topicId)) || null;
}

export function setAssistantReply(
  channelId: number,
  next:
    | AssistantReply
    | null
    | ((current: AssistantReply | null) => AssistantReply | null),
  topicId = 0
) {
  const key = conversationKey(channelId, topicId);
  const current = replies.get(key) || null;
  const value = typeof next === 'function' ? next(current) : next;
  if (value === current) return;
  if (value) replies.set(key, value);
  else replies.delete(key);
  listeners.forEach((listener) => listener());
}

function isThisReply(
  reply: AssistantReply | null,
  messageId?: unknown
): reply is AssistantReply {
  if (!reply) return false;
  if (reply.done) {
    return (
      !!reply.timedOut &&
      reply.messageId != null &&
      Number(messageId) === reply.messageId
    );
  }
  return (
    messageId == null ||
    reply.messageId == null ||
    Number(messageId) === reply.messageId
  );
}

// A reply that went quiet and speaks again is live again.
function revived(reply: AssistantReply) {
  return reply.timedOut ? { ...reply, done: false, timedOut: false } : reply;
}

function handleNewMessage({ message, channelId }: any) {
  const id = Number(message?.id);
  channelId = Number(channelId || message?.channelId);
  if (!channelId || !id) return;
  const topicId = Number(message?.subjectId || 0);
  messageTopics.set(id, topicId);
  receiveAssistantMessage({ ...message, channelId });
  // A message can arrive already written (a Lumine update, say); a reply
  // being made arrives empty and streams in.
  const text = typeof message?.content === 'string' ? message.content : '';
  setAssistantReply(
    Number(channelId),
    (current) => {
      if (current?.messageId === id) return current;
      const pending = !!current && !current.done && current.messageId == null;
      if (pending && !text) return { ...current!, messageId: id };
      // A finished message never takes the slot of the reply the user is
      // waiting for.
      if (pending) return current;
      return {
        ...EMPTY_ASSISTANT_REPLY,
        messageId: id,
        text,
        suggestions: readAgentSuggestions(message?.settings),
        card: isWebsiteAgentCardData(message?.settings?.websiteAgentCard)
          ? message.settings.websiteAgentCard
          : null
      };
    },
    topicId
  );
}

function handleDelta({ channelId, messageId, delta, startOffset }: any) {
  updateReplyForMessage(Number(channelId), messageId, (current) =>
    isThisReply(current, messageId)
      ? {
          ...revived(current),
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
  const key = conversationKey(
    Number(channelId),
    messageTopics.get(Number(messageId)) || 0
  );
  const lines = transcripts.get(key);
  if (lines?.some((line) => line.id === Number(messageId))) {
    transcripts.set(
      key,
      lines.map((line) =>
        line.id === Number(messageId)
          ? { ...line, content: editedMessage }
          : line
      )
    );
    listeners.forEach((fn) => fn());
  }
  updateReplyForMessage(Number(channelId), messageId, (current) =>
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
  updateReplyForMessage(Number(channelId), messageId, (current) =>
    isThisReply(current, messageId)
      ? {
          ...revived(current),
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
  updateReplyForMessage(Number(channelId), messageId, (current) =>
    isThisReply(current, messageId)
      ? { ...revived(current), status: String(status || '') }
      : current
  );
}

function handleDone(channelId: unknown, messageId?: unknown) {
  const topicId = messageTopics.get(Number(messageId)) || 0;
  const current = getAssistantReply(Number(channelId), topicId);
  if (
    current?.messageId &&
    current.text &&
    (!messageId || current.messageId === Number(messageId))
  ) {
    const lines = getAssistantTranscript(Number(channelId), topicId);
    const original = lines.find((line) => line.id === current.messageId);
    if (original)
      receiveAssistantMessage({
        ...original,
        content: current.text,
        channelId: Number(channelId),
        subjectId: topicId
      });
  }
  updateReplyForMessage(Number(channelId), messageId, (current) =>
    isThisReply(current, messageId)
      ? { ...current, done: true, timedOut: false, status: '' }
      : current
  );
}

// Zero or Ciel answered with a reaction on the user's message instead of
// words: the reply they were waiting for is that reaction.
function handleReaction({
  channelId,
  messageId,
  userId,
  mutation,
  reaction
}: any) {
  if (mutation !== 'add' || !reaction) return;
  if (
    ![ZERO_TWINKLE_ID, CIEL_TWINKLE_ID].map(Number).includes(Number(userId))
  ) {
    return;
  }
  updateReplyForMessage(Number(channelId), messageId, (current) =>
    current && !current.text && !current.error
      ? {
          ...current,
          reaction: String(reaction),
          done: true,
          timedOut: false,
          status: ''
        }
      : current
  );
}

// A reply that goes quiet without finishing (a failure the server never
// announced) stops holding the conversation after a while: longer than the
// longest wait for the user (a walkthrough step waits 5 minutes).
const QUIET_REPLY_MS = 6 * 60_000;
let quietTimer = 0;
function checkQuietReplies() {
  const now = Date.now();
  for (const [key, reply] of replies) {
    const [channelId, topicId] = key.split(':').map(Number);
    const lastHeard = lastHeardAt.get(channelId) || now;
    if (!reply.done && now - lastHeard > QUIET_REPLY_MS) {
      setAssistantReply(
        channelId,
        {
          ...reply,
          done: true,
          timedOut: true,
          status: ''
        },
        topicId
      );
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

function handleDelete({ channelId, messageId }: any) {
  const topicId = messageTopics.get(Number(messageId)) || 0;
  const key = conversationKey(Number(channelId), topicId);
  const previous = transcripts.get(key);
  if (previous)
    transcripts.set(
      key,
      previous.filter((line) => line.id !== Number(messageId))
    );
  if (
    getAssistantReply(Number(channelId), topicId)?.messageId ===
    Number(messageId)
  )
    setAssistantReply(Number(channelId), null, topicId);
  messageTopics.delete(Number(messageId));
  listeners.forEach((fn) => fn());
}

const EVENTS: [string, (...args: any[]) => void][] = [
  ['chat_message_deleted', handleDelete],
  [
    'new_message_received',
    ({ message }: any) => receiveAssistantMessage(message)
  ],
  ['new_ai_message_received', heard(handleNewMessage)],
  ['ai_message_delta_streamed', heard(handleDelta)],
  ['chat_message_edited', heard(handleEdit)],
  ['ai_thought_streamed', heard(handleThought)],
  ['ai_thinking_status_updated', heard(handleStatus)],
  ['ai_message_done', heard(handleDone)],
  ['chat_reaction_updated', heard(handleReaction)]
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
export function startAssistantReply(channelId: number, topicId = 0) {
  followAssistantConversation(channelId, topicId);
  lastHeardAt.set(channelId, Date.now());
  setAssistantReply(channelId, { ...EMPTY_ASSISTANT_REPLY }, topicId);
}
