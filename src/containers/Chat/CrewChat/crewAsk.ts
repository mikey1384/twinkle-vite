// Calling Zero or Ciel into a crew chat is an @mention, as in a Home feed
// post (Mikey, 10-12); the server decides who replies. The crew panel's Ask
// buttons only write that mention and a short ask about the current step into
// the chat's own message box, for the member to edit and send.
export const CREW_CHAT_ASK_EVENT = 'twinkle:crew-chat-ask';

export type CrewAssistantName = 'Zero' | 'Ciel';

export interface CrewChatAskDetail {
  channelId: number;
  text: string;
}

// The words put in the box: the mention first, then where the crew is.
export function buildCrewAskText({
  assistant,
  stepNumber,
  stepLabel,
  blocking,
  isDone
}: {
  assistant: CrewAssistantName;
  stepNumber?: number;
  stepLabel?: string;
  blocking?: string;
  isDone?: boolean;
}) {
  if (isDone) {
    return `@${assistant} Our meetup is done! Can you help us think of what to plan next? `;
  }
  const nextText = String(blocking || '')
    .replace(/^Next:\s*/, '')
    .trim();
  const next = nextText && !/[.!?]$/.test(nextText) ? `${nextText}.` : nextText;
  const step =
    stepLabel && stepNumber
      ? `We're on step ${stepNumber} (${stepLabel}).`
      : stepLabel
        ? `We're on "${stepLabel}".`
        : '';
  return `@${assistant} ${step}${next ? ` Next up: ${next}` : ''} Can you help us figure out this step? `.replace(
    /\s+/g,
    ' '
  );
}

export function requestCrewChatAsk(detail: CrewChatAskDetail) {
  window.dispatchEvent(new CustomEvent(CREW_CHAT_ASK_EVENT, { detail }));
}
