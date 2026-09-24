import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { useSyncExternalStore } from 'react';
import {
  HOME_CALL_ASSISTANT_EVENT,
  getHomeCallAssistant
} from '~/helpers/aiVoiceCall';

// Read-aloud voices, named by assistant rather than provider voice: the
// server keeps the one voice table for calls, narration and read-aloud
// (twinkle-api helpers/ai/assistantVoice.ts), so each assistant sounds the
// same everywhere and a voice change is made there once.
export function assistantVoice(assistant: 'Zero' | 'Ciel' | null | undefined) {
  return assistant === 'Ciel' ? 'ciel' : 'zero';
}

// Zero's and Ciel's own posts and comments in their own voices; anyone
// else's are read in the user's voice (below).
export function assistantVoiceForUserId(userId: unknown) {
  const id = Number(userId);
  if (id && id === Number(CIEL_TWINKLE_ID)) return 'ciel';
  if (id && id === Number(ZERO_TWINKLE_ID)) return 'zero';
  return undefined;
}

// Everything else is read by the assistant this user picked on Home (or last
// called); Zero until they pick.
export function userReadAloudVoice(userId: number | null | undefined) {
  return assistantVoice(getHomeCallAssistant(userId || null) || 'Zero');
}

// The same, kept current: a new pick (on Home, or by calling one of them)
// changes the voice of Listen buttons already on screen.
export function useUserReadAloudVoice(userId: number | null | undefined) {
  return useSyncExternalStore(subscribeReadAloudVoice, () =>
    userReadAloudVoice(userId)
  );
}

function subscribeReadAloudVoice(listener: () => void) {
  window.addEventListener(HOME_CALL_ASSISTANT_EVENT, listener);
  return () => window.removeEventListener(HOME_CALL_ASSISTANT_EVENT, listener);
}
