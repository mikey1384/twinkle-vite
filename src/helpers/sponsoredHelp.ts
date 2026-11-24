// Sponsored Zero/Ciel help requests (SponsoredHelpCard.tsx,
// SponsoredHelpModal.tsx). Kept free of app imports so node tests can load
// it. The view is the server's (twinkle-api helpers/sponsoredHelp/service.ts
// buildView); these are the website's own short UI labels for it.

export type SponsoredHelpStatus =
  | 'sent'
  | 'planning'
  | 'awaiting_confirm'
  | 'running'
  | 'completed'
  | 'failed'
  | 'declined'
  | 'cancelled'
  | 'expired';

export type SponsoredHelpStep =
  | { action: 'create_lumine_project'; title: string; idea: string }
  | { action: 'start_chat_session'; opening_message: string }
  | { action: 'open_page'; path: string };

export interface SponsoredHelpView {
  id: number;
  persona: 'zero' | 'ciel';
  task: string;
  energyPercent: number;
  status: SponsoredHelpStatus;
  senderId: number;
  senderUsername: string;
  recipientId: number;
  recipientUsername: string;
  createdAt: number;
  expiresAt: number;
  summary?: string;
  steps?: SponsoredHelpStep[];
  cannotDo?: string[];
  planHash?: string;
  planRevision?: number;
  changesLeft?: number;
  result?: {
    buildId?: number;
    buildTitle?: string;
    idea?: string;
    path?: string;
    sessionMessageId?: number;
  };
  failureCode?: string | null;
  assistantPathId?: number;
}

export const SPONSORED_HELP_ROOT_TYPE = 'sponsoredHelp';
export const SPONSORED_HELP_CARD_ROOT_TYPE = 'sponsoredHelpCard';

export function sponsoredHelpPersonaName(persona: string) {
  return persona === 'ciel' ? 'Ciel' : 'Zero';
}

export function isSponsoredHelpBusy(status: SponsoredHelpStatus) {
  return status === 'planning' || status === 'running';
}

// A server-issued card only: the rootType can't be written by a member, and
// the server hydrates the view onto exactly those rows.
export function readSponsoredHelpView(message: {
  rootType?: unknown;
  rootId?: unknown;
  settings?: any;
}): { view: SponsoredHelpView; variant: 'dm' | 'assistant' } | null {
  const rootType = String(message?.rootType || '');
  if (
    rootType !== SPONSORED_HELP_ROOT_TYPE &&
    rootType !== SPONSORED_HELP_CARD_ROOT_TYPE
  ) {
    return null;
  }
  const view = message?.settings?.sponsoredHelp;
  if (!view || typeof view !== 'object') return null;
  if (Number(view.id) !== Number(message.rootId)) return null;
  return {
    view: view as SponsoredHelpView,
    variant: rootType === SPONSORED_HELP_CARD_ROOT_TYPE ? 'assistant' : 'dm'
  };
}

export function sponsoredHelpStepLabel(step: SponsoredHelpStep) {
  if (step.action === 'create_lumine_project') {
    return `New Lumine project “${step.title}”, and Lumine gets the idea`;
  }
  if (step.action === 'start_chat_session') {
    return `Start in this chat: “${step.opening_message}”`;
  }
  return `Open ${step.path}`;
}

export function sponsoredHelpStatusLine(
  request: SponsoredHelpView,
  {
    isSender,
    isRecipient,
    variant
  }: { isSender: boolean; isRecipient: boolean; variant: 'dm' | 'assistant' }
) {
  const persona = sponsoredHelpPersonaName(request.persona);
  switch (request.status) {
    case 'sent':
      if (variant === 'assistant' && request.failureCode) return 'Didn’t work this time';
      if (isSender) return `Waiting for ${request.recipientUsername}`;
      return isRecipient ? 'Ready when you are' : '';
    case 'planning':
      return `${persona} is planning`;
    case 'awaiting_confirm':
      return isSender ? `${request.recipientUsername} is deciding` : 'Waiting for your OK';
    case 'running':
      return `${persona} is on it`;
    case 'completed':
      return 'Done';
    case 'failed':
      return 'Something went wrong';
    case 'declined':
      return isSender ? `${request.recipientUsername} said no thanks · unused Energy back` : 'You said no thanks';
    case 'cancelled':
      return isSender ? 'Taken back · unused Energy back' : 'Taken back';
    case 'expired':
      return isSender ? 'Expired · unused Energy back' : 'Expired';
    default:
      return '';
  }
}
