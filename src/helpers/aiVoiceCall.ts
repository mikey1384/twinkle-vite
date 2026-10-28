import { socket } from '~/constants/sockets/api';
import {
  getAssistantReply,
  getAssistantTranscript,
  seedAssistantTranscript
} from '~/containers/App/AssistantDock/conversationStore';
import { SITE_NAME } from '~/constants/siteBrand';
import { trackEvent } from '~/helpers/analytics';
import {
  createVoiceSessionController,
  type VoiceConversation
} from './voiceSessionController';

let voiceSocketId: string | undefined;

export const AI_VOICE_STOP_LOCAL = 'ai-voice-stop-local';
export const AI_VOICE_RESUME_MICROPHONE = 'ai-voice-resume-microphone';
export const aiVoiceSession = createVoiceSessionController({
  id: () => crypto.randomUUID(),
  microphone: () => {
    if (!navigator.mediaDevices?.getUserMedia)
      return Promise.reject(
        new Error('This browser cannot use a microphone. You can keep typing.')
      );
    return navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true
      }
    });
  },
  connect: (input) =>
    new Promise((resolve, reject) => {
      if (!socket.connected)
        return reject(
          new Error(`Connecting to ${SITE_NAME}. Please try again in a moment.`)
        );
      voiceSocketId = socket.id;
      socket
        .timeout(35_000)
        .emit(
          'ai_start_ai_voice_conversation',
          input,
          (error: Error | null, result: any) => {
            if (error)
              reject(
                new Error(
                  'The call took too long to connect. You can keep typing.'
                )
              );
            else resolve(result || { started: false });
          }
        );
    }),
  disconnect: (callId, handoff) =>
    new Promise((resolve, reject) => {
      if (!socket.connected)
        return reject(
          new Error(
            'Reconnecting. Your draft is kept until the call finishes saving.'
          )
        );
      const recovering = needsVoiceReconciliation();
      const conversation = aiVoiceSession.getSnapshot();
      const previousMessageId =
        getAssistantTranscript(conversation.channelId, conversation.topicId).at(
          -1
        )?.id || 0;
      socket.timeout(35_000).emit(
        recovering
          ? 'ai_reconcile_voice_conversation'
          : 'ai_end_ai_voice_conversation',
        {
          callId,
          handoff,
          channelId: conversation.channelId,
          topicId: conversation.topicId
        },
        (error: Error | null, result: any) => {
          if (error || !result?.ended)
            reject(
              new Error(
                'Still finishing the call. You can keep your draft here and retry.'
              )
            );
          else {
            if (aiVoiceSession.matches(callId) && Array.isArray(result.history))
              seedAssistantTranscript(
                result.history,
                conversation.channelId,
                conversation.topicId,
                previousMessageId
              );
            resolve();
          }
        }
      );
    }),
  stopPlayback: () => window.dispatchEvent(new Event(AI_VOICE_STOP_LOCAL))
});

export async function startAiVoiceCall(
  channelId: number,
  topicId?: number,
  options: Pick<
    VoiceConversation,
    'assistant' | 'askedAbout' | 'continuation'
  > = {}
) {
  const reply = getAssistantReply(channelId, topicId || 0);
  if (
    reply &&
    (!reply.done ||
      (reply.card &&
        !reply.card.answer &&
        (!reply.card.status ||
          ['pending', 'processing'].includes(reply.card.status))))
  )
    throw new Error(
      'Finish the current reply or choice before starting voice.'
    );
  await aiVoiceSession.start({ channelId, topicId, ...options });
  if (aiVoiceSession.getSnapshot().phase === 'voice')
    trackEvent('voice_call_start', { has_topic: Boolean(topicId) });
}

export function needsVoiceReconciliation() {
  return (
    !!aiVoiceSession.getSnapshot().callId &&
    socket.connected &&
    socket.id !== voiceSocketId
  );
}

export function endAiVoiceCall(handoff = true, reason = '') {
  return aiVoiceSession.end(handoff, reason);
}

// A retry of an unacknowledged voice message keeps its nonce. Canonical
// chat receipts can settle it even when the original socket ack is lost.
interface Delivery {
  id: string;
  callId: string;
  confirmed: boolean;
  sequence: number;
  pending?: Promise<boolean>;
}
const deliveries = new Map<string, Delivery>();
let deliveryCallId: string | null = null;
let deliverySequence = 0;
const deliveryKey = (
  message: string,
  channelId: number,
  topicId: number,
  askedAbout?: unknown
) => JSON.stringify([channelId, topicId, message, askedAbout || null]);
function markVoiceDelivery({ message }: any) {
  let settings = message?.settings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch {
      return;
    }
  }
  if (!settings?.voiceMessageId) return;
  for (const entry of deliveries.values())
    if (entry.id === settings.voiceMessageId) entry.confirmed = true;
}
socket.on('new_message_received', markVoiceDelivery);
export function resetVoiceDeliveries() {
  deliveries.clear();
  deliveryCallId = null;
  deliverySequence = 0;
}
export function getVoiceDelivery(
  message: string,
  channelId: number,
  topicId = 0,
  askedAbout?: unknown
) {
  return deliveries.get(deliveryKey(message, channelId, topicId, askedAbout));
}
export function submitAiVoiceText(
  message: string,
  channelId: number,
  topicId = 0,
  askedAbout?: unknown
): Promise<boolean> {
  const key = deliveryKey(message, channelId, topicId, askedAbout);
  let delivery = deliveries.get(key);
  if (delivery?.confirmed) {
    deliveries.delete(key);
    return Promise.resolve(true);
  }
  if (delivery?.pending) return delivery.pending;
  const call = aiVoiceSession.getSnapshot();
  if (
    call.phase !== 'voice' ||
    call.channelId !== channelId ||
    call.topicId !== topicId ||
    (delivery && delivery.callId !== call.callId)
  )
    return Promise.reject(
      new Error(
        delivery
          ? 'Check the full chat before sending this again; its delivery could not be confirmed.'
          : 'Return to this call’s conversation or switch to text to send here.'
      )
    );
  if (deliveryCallId !== call.callId) {
    deliveryCallId = call.callId;
    deliverySequence = 0;
  }
  // The server remembers the last 100 nonces for this call. An older uncertain
  // send must be checked in chat, never silently reissued under an evicted id.
  if (delivery && deliverySequence - delivery.sequence >= 100)
    return Promise.reject(
      new Error(
        'Check the full chat before sending this older message again. Its delivery could not be confirmed.'
      )
    );
  delivery ||= {
    id: crypto.randomUUID(),
    callId: call.callId!,
    confirmed: false,
    sequence: ++deliverySequence
  };
  deliveries.set(key, delivery);
  const entry = delivery;
  const pending = new Promise<boolean>((resolve, reject) => {
    socket.timeout(35_000).emit(
      'ai_call_message_submit',
      {
        message,
        channelId,
        topicId,
        askedAbout,
        callId: call.callId,
        clientMessageId: entry.id
      },
      (error: Error | null, result: any) => {
        if (deliveries.get(key) !== entry) {
          resolve(false);
          return;
        }
        if (entry.confirmed || result?.sent) {
          deliveries.delete(key);
          resolve(true);
        } else if (error)
          reject(
            new Error(
              'Sending is taking longer than expected. Your draft is kept; retrying will check the same message.'
            )
          );
        else {
          deliveries.delete(key);
          reject(
            new Error(
              result?.error ||
                'That message could not be sent. Your draft is kept.'
            )
          );
        }
      }
    );
  });
  entry.pending = pending;
  void pending
    .finally(() => {
      entry.pending = undefined;
    })
    .catch(() => {});
  return pending;
}
export function updateAiVoiceContext(askedAbout: unknown): Promise<void> {
  const callId = aiVoiceSession.getSnapshot().callId;
  return new Promise((resolve, reject) => {
    socket
      .timeout(15_000)
      .emit(
        'ai_voice_context_update',
        { callId, askedAbout },
        (error: Error | null, result: any) => {
          if (error || !result?.updated)
            reject(
              new Error(
                result?.error ||
                  'Unable to share this item with the call. Switch to text to continue.'
              )
            );
          else resolve();
        }
      );
  });
}

export type HomeCallAssistant = 'Zero' | 'Ciel';
// Sent when the pick changes (chosen on Home, or by calling one of them).
export const HOME_CALL_ASSISTANT_EVENT = 'home-call-assistant-changed';

export function getHomeCallAssistant(
  userId: number | null
): HomeCallAssistant | null {
  try {
    const value = localStorage.getItem(
      `homeCallAssistant:${userId || 'guest'}`
    );
    return value === 'Zero' || value === 'Ciel' ? value : null;
  } catch {
    return null;
  }
}

export function saveHomeCallAssistant(
  userId: number | null,
  assistant: HomeCallAssistant
) {
  try {
    localStorage.setItem(`homeCallAssistant:${userId || 'guest'}`, assistant);
  } catch {
    /* The choice still works when browser storage is unavailable. */
  }
  // The choice travels with the event, so it holds even when storage is
  // unavailable.
  window.dispatchEvent(
    new CustomEvent(HOME_CALL_ASSISTANT_EVENT, {
      detail: { userId: userId || null, assistant }
    })
  );
}
