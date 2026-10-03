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

// The assistant this user picked on Home beside the call button (or last
// called); Zero until they pick. The one place that answers "which agent is
// mine": the Ask buttons, the read-aloud voice and the dock all derive from it.
export function userAssistant(
  userId: number | null | undefined
): 'Zero' | 'Ciel' {
  return getHomeCallAssistant(userId || null) || 'Zero';
}

// Everything that is not an assistant's own words is read aloud by that
// assistant.
export function userReadAloudVoice(userId: number | null | undefined) {
  return assistantVoice(userAssistant(userId));
}

// The same, kept current: a new pick (on Home, or by calling one of them)
// changes the voice of Listen buttons and the Ask buttons already on screen.
export function useUserAssistant(userId: number | null | undefined) {
  return useSyncExternalStore(subscribeReadAloudVoice, () =>
    userAssistant(userId)
  );
}

export function useUserReadAloudVoice(userId: number | null | undefined) {
  return assistantVoice(useUserAssistant(userId));
}

function subscribeReadAloudVoice(listener: () => void) {
  window.addEventListener(HOME_CALL_ASSISTANT_EVENT, listener);
  return () => window.removeEventListener(HOME_CALL_ASSISTANT_EVENT, listener);
}
