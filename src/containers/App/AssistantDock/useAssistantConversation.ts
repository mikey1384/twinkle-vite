import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import {
  aiVoiceSession,
  submitAiVoiceText,
  getVoiceDelivery
} from '~/helpers/aiVoiceCall';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import { generateFileName } from '~/helpers/stringHelpers';
import { socket } from '~/constants/sockets/api';
import { relayChatMessage } from '~/helpers/chatMessageSend';
import { dismissWebsiteAgentPrompts } from '../WebsiteAgentSpotlight';
import {
  getAssistantAccountEpoch,
  type AssistantAskContext
} from './dockState';
import {
  EMPTY_ASSISTANT_REPLY,
  attachAssistantConversationListeners,
  getAssistantReply,
  setAssistantReply,
  startAssistantReply,
  followAssistantConversation,
  receiveAssistantMessage,
  subscribeAssistantReplies
} from './conversationStore';

// Talking with Zero or Ciel outside the chat page (the Home ask box, the
// floating dock): the same chat room, the same message the chat page sends,
// and the latest reply as it streams.
export default function useAssistantConversation({
  assistantName,
  channelId,
  topicId = 0
}: {
  assistantName: 'Zero' | 'Ciel';
  channelId: number;
  topicId?: number;
}) {
  const saveChatMessage = useAppContext(
    (v) => v.requestHelpers.saveChatMessage
  );
  const checkIfAIFileSupported = useAppContext(
    (v) => v.requestHelpers.checkIfAIFileSupported
  );
  const uploadFileOnChat = useAppContext(
    (v) => v.requestHelpers.uploadFileOnChat
  );
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const saveChatMessageWithFileAttachment = useAppContext(
    (v) => v.requestHelpers.saveChatMessageWithFileAttachment
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const sendLock = useRef(false);
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => attachAssistantConversationListeners(), []);
  useEffect(() => {
    followAssistantConversation(channelId, topicId);
    setSendError('');
  }, [channelId, topicId]);
  const reply = useSyncExternalStore(subscribeAssistantReplies, () =>
    getAssistantReply(channelId, topicId)
  );
  const replying = !!reply && !reply.done;

  const send = useCallback(
    async (content: string, askContext?: AssistantAskContext | null) => {
      const epoch = getAssistantAccountEpoch();
      const message = content.trim();
      const voiceMessage = message || 'Please explain the attached item.';
      // One question at a time: a new one mid-reply would mix the two replies.
      const current = getAssistantReply(channelId, topicId);
      // with something attached the attachment is the question; text is optional
      if (
        (!message && !askContext) ||
        !channelId ||
        sendLock.current ||
        (current && !current.done)
      ) {
        return false;
      }
      const call = aiVoiceSession.getSnapshot();
      if (call.phase === 'connecting' || call.phase === 'ending') {
        setSendError(
          'Wait for the voice handoff to finish. Your draft is kept.'
        );
        return false;
      }
      sendLock.current = true;
      setSending(true);
      setSendError('');
      if (
        call.phase === 'voice' ||
        getVoiceDelivery(voiceMessage, channelId, topicId, askContext)
      ) {
        try {
          return await submitAiVoiceText(
            voiceMessage,
            channelId,
            topicId,
            askContext
          );
        } catch (error) {
          if (epoch !== getAssistantAccountEpoch()) return false;
          setSendError(
            error instanceof Error
              ? error.message
              : 'Unable to send. Your draft is kept.'
          );
          return false;
        } finally {
          sendLock.current = false;
          setSending(false);
        }
      }
      // Like sending from the chat page: whatever they were waiting on ends.
      dismissWebsiteAgentPrompts();
      startAssistantReply(channelId, topicId);
      try {
        await saveChatMessage({
          // The same fields the chat page sends.
          message: {
            userId,
            content: message,
            channelId,
            isNotification: false,
            subjectId: topicId,
            // what the member pressed "Ask" on; the server re-reads it as them
            // and keeps only what it can verify
            ...(askContext
              ? {
                  settings: {
                    askedAbout: {
                      kind: askContext.kind,
                      id: askContext.id,
                      rootType: askContext.rootType,
                      focus: askContext.focus,
                      no: askContext.no,
                      version: askContext.version,
                      step: askContext.step,
                      reviewLang: askContext.reviewLang,
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
        if (epoch !== getAssistantAccountEpoch()) return false;
        setAssistantReply(
          channelId,
          {
            ...EMPTY_ASSISTANT_REPLY,
            done: true,
            error: error?.message || 'That didn’t send. Try again?'
          },
          topicId
        );
        return false;
      } finally {
        sendLock.current = false;
        setSending(false);
      }
    },
    // Request helpers are stable context actions, not reactive dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assistantName, channelId, topicId, userId]
  );

  // A photo from the window's photo button: the same three steps as the
  // chat page's upload (signed upload, file record, file message), so the
  // assistant gets it exactly as if it were sent from Chat.
  const sendPhoto = useCallback(
    async (file: File, caption: string) => {
      const epoch = getAssistantAccountEpoch();
      const current = getAssistantReply(channelId, topicId);
      if (!channelId || sendLock.current || (current && !current.done))
        return false;
      if (aiVoiceSession.getSnapshot().phase !== 'text') {
        setSendError('End the voice call to send a photo.');
        return false;
      }
      sendLock.current = true;
      setSending(true);
      setSendError('');
      try {
        const { isSupported } = await checkIfAIFileSupported({
          fileName: file.name
        });
        if (!isSupported) {
          setSendError(`${assistantName} can’t read this kind of file.`);
          return false;
        }
        dismissWebsiteAgentPrompts();
        const filePath = uuidv1();
        const fileName = generateFileName(file.name);
        const content = caption.trim();
        startAssistantReply(channelId, topicId);
        const meta = await uploadFileOnChat({
          fileName,
          selectedFile: file,
          onUploadProgress: () => {},
          isAIChat: true,
          path: filePath
        });
        if (epoch !== getAssistantAccountEpoch()) return false;
        await saveFileData({
          fileName,
          filePath,
          actualFileName: file.name,
          rootType: 'chat',
          uploadId: meta.uploadId,
          uploadToken: meta.uploadToken
        });
        const saved = await saveChatMessageWithFileAttachment({
          channelId,
          content,
          fileName,
          actualFileName: file.name,
          fileSize: file.size,
          path: filePath,
          recipientId: 0,
          targetMessageId: 0,
          chessState: null as any,
          thumbUrl: '',
          subchannelId: 0,
          topicId,
          isCielChat: assistantName === 'Ciel',
          isZeroChat: assistantName === 'Zero',
          thinkHard: false
        });
        const message = saved?.message;
        if (message?.id) {
          receiveAssistantMessage({
            ...message,
            content: content ? `Sent a photo: ${content}` : 'Sent a photo'
          });
          // The chat page and other tabs hear it the way Chat relays.
          relayChatMessage({
            socket,
            messageId: Number(message.id),
            channelId: Number(message.channelId || channelId)
          });
        }
        return true;
      } catch (error: any) {
        if (epoch !== getAssistantAccountEpoch()) return false;
        setAssistantReply(
          channelId,
          {
            ...EMPTY_ASSISTANT_REPLY,
            done: true,
            error: error?.message || 'The photo didn’t send. Try again?'
          },
          topicId
        );
        return false;
      } finally {
        sendLock.current = false;
        setSending(false);
      }
    },
    // Request helpers are stable context actions, not reactive dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assistantName, channelId, topicId]
  );

  const clear = useCallback(() => {
    const current = getAssistantReply(channelId, topicId);
    if (!current || current.done) setAssistantReply(channelId, null, topicId);
  }, [channelId, topicId]);

  return { reply, replying, sending, send, sendPhoto, clear, sendError };
}
