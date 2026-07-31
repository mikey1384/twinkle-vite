export const SYSTEM_PROMPT_TOPIC_UPDATED_EVENT =
  'twinkle:system-prompt-topic-updated';
export const PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT =
  'twinkle:prompt-studio-share-state-updated';
export const PROMPT_STUDIO_CLONE_CONFIRMED_EVENT =
  'twinkle:prompt-studio-clone-confirmed';

export function emitSystemPromptTopicUpdated(
  detail?: {
    topicId?: number;
    channelId?: number;
  }
) {
  emitPromptStudioEvent(SYSTEM_PROMPT_TOPIC_UPDATED_EVENT, detail);
}

export function emitPromptStudioShareStateUpdated(detail: {
  topicId: number;
  channelId: number;
}) {
  emitPromptStudioEvent(PROMPT_STUDIO_SHARE_STATE_UPDATED_EVENT, detail);
}

export function emitPromptStudioCloneConfirmed(detail: {
  sharedTopicId: number;
  topicId: number;
  channelId: number;
}) {
  emitPromptStudioEvent(PROMPT_STUDIO_CLONE_CONFIRMED_EVENT, detail);
}

function emitPromptStudioEvent(eventName: string, detail?: object) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(eventName, detail ? { detail } : undefined)
  );
}
