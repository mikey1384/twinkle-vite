import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { dismissWebsiteAgentPrompts } from '../WebsiteAgentSpotlight';
import type { AssistantAskContext } from './dockState';
import {
  EMPTY_ASSISTANT_REPLY,
  attachAssistantConversationListeners,
  getAssistantReply,
  setAssistantReply,
  startAssistantReply,
  subscribeAssistantReplies
} from './conversationStore';

// Talking with Zero or Ciel outside the chat page (the Home ask box, the
// floating dock): the same chat room, the same message the chat page sends,
// and the latest reply as it streams.
export default function useAssistantConversation({
  assistantName,
  channelId
}: {
  assistantName: 'Zero' | 'Ciel';
  channelId: number;
}) {
  const saveChatMessage = useAppContext(
    (v) => v.requestHelpers.saveChatMessage
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [sending, setSending] = useState(false);
  useEffect(() => attachAssistantConversationListeners(), []);
  const reply = useSyncExternalStore(subscribeAssistantReplies, () =>
    getAssistantReply(channelId)
  );
  const replying = !!reply && !reply.done;

  const send = useCallback(
    async (content: string, askContext?: AssistantAskContext | null) => {
      const message = content.trim();
      // One question at a time: a new one mid-reply would mix the two replies.
      const current = getAssistantReply(channelId);
      // with something attached the attachment is the question; text is optional
      if ((!message && !askContext) || !channelId || sending || (current && !current.done)) {
        return false;
      }
      setSending(true);
      // Like sending from the chat page: whatever they were waiting on ends.
      dismissWebsiteAgentPrompts();
      startAssistantReply(channelId);
      try {
        await saveChatMessage({
          // The same fields the chat page sends.
          message: {
            userId,
            content: message,
            channelId,
            isNotification: false,
            subjectId: 0,
            // what the member pressed "Ask" on; the server re-reads it as them
            // and keeps only what it can verify
            ...(askContext
              ? {
                  settings: {
                    askedAbout: {
                      kind: askContext.kind,
                      id: askContext.id,
                      rootType: askContext.rootType,
                      label: askContext.label,
                      path: askContext.path,
                      excerpt: askContext.excerpt
                    }
                  }
                }
              : {})
          },
          targetMessageId: null,
          targetSubject: null,
          isCielChat: assistantName === 'Ciel',
          isZeroChat: assistantName === 'Zero',
          thinkHard: false
        });
        return true;
      } catch (error: any) {
        setAssistantReply(channelId, {
          ...EMPTY_ASSISTANT_REPLY,
          done: true,
          error: error?.message || 'That didn’t send. Try again?'
        });
        return false;
      } finally {
        setSending(false);
      }
    },
    [assistantName, channelId, saveChatMessage, sending, userId]
  );

  const clear = useCallback(() => {
    const current = getAssistantReply(channelId);
    if (!current || current.done) setAssistantReply(channelId, null);
  }, [channelId]);

  return { reply, replying, sending, send, clear };
}
