import { socket } from '~/constants/sockets/api';
import { SITE_NAME } from '~/constants/siteBrand';

let pendingStart: Promise<void> | null = null;

export function startAiVoiceCall(channelId: number, topicId?: number) {
  if (pendingStart) return pendingStart;
  if (!socket.connected) {
    return Promise.reject(
      new Error(`Connecting to ${SITE_NAME}. Please try again in a moment.`)
    );
  }
  pendingStart = new Promise<void>((resolve, reject) => {
    socket
      .timeout(35_000)
      .emit(
        'ai_start_ai_voice_conversation',
        { channelId, ...(topicId ? { topicId } : {}) },
        (
          error: Error | null,
          result?: { started: boolean; error?: string }
        ) => {
          if (error) {
            socket.emit('ai_end_ai_voice_conversation');
            reject(
              new Error('The call took too long to connect. Please try again.')
            );
          } else if (!result?.started) {
            reject(
              new Error(
                result?.error || 'Unable to start the call. Please try again.'
              )
            );
          } else {
            resolve();
          }
        }
      );
  }).finally(() => {
    pendingStart = null;
  });
  return pendingStart;
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
