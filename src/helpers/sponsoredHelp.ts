import type { WandActionModel } from '../components/SponsoredHelp/wandActions';
// Sponsored Zero/Ciel help requests (SponsoredHelpCard.tsx,
// SponsoredHelpModal.tsx). Kept free of app imports so node tests can load
// it. The view is the server's (twinkle-api helpers/sponsoredHelp/service.ts
// buildView); these are the website's own short UI labels for it.

export type SponsoredHelpStatus =
  | 'sent'
  | 'planning'
  | 'asking'
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
  | { action: 'open_page'; path: string }
  // the member's own app's web-address screens (twinkle-api actions.ts)
  | { action: 'open_app_address'; build_id: number; screen: 'find' | 'buy' | 'connect' | 'status'; domain?: string };

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
  // the new-member welcome (sponsored by Twinkle; the greeting is the card)
  isWelcome?: boolean;
  greeting?: string;
  // a press on an open wand card: sender is the card's author; paidBy says
  // whether the author's Energy or the member's own pays for it
  openCardId?: number;
  paidBy?: 'sponsor' | 'self';
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
    appAddress?: { buildId: number; title: string; screen: string; domain: string | null };
  };
  failureCode?: string | null;
  assistantPathId?: number;
  // the card's actions (twinkle-api helpers/sponsoredHelp/wandActions.ts)
  actions?: Partial<WandActionModel>;
}

export const SPONSORED_HELP_ROOT_TYPE = 'sponsoredHelp';
export const SPONSORED_HELP_CARD_ROOT_TYPE = 'sponsoredHelpCard';

export function sponsoredHelpPersonaName(persona: string) {
  return persona === 'ciel' ? 'Ciel' : 'Zero';
}

export function isSponsoredHelpBusy(status: SponsoredHelpStatus | string) {
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
  if (step.action === 'open_app_address') {
    if (step.screen === 'buy') return `Open the buy screen for ${step.domain} on your app (you or your parent finish it)`;
    if (step.screen === 'connect') return `Open “I already have one”${step.domain ? ` for ${step.domain}` : ''} on your app`;
    if (step.screen === 'status') return 'Show how your app’s address is going';
    return `Open name ideas for your app’s address${step.domain ? `, starting with “${step.domain}”` : ''}`;
  }
  return `Open ${step.path}`;
}

// The button on a finished objective that opened an app's address screens.
export function sponsoredHelpResultLabel(result: SponsoredHelpView['result']) {
  if (result?.appAddress) return 'Open your app’s address';
  return 'Open the page';
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
      if (request.isWelcome) return '';
      if (isSender) return `Waiting for ${request.recipientUsername}`;
      return isRecipient ? 'Ready when you are' : '';
    case 'planning':
      return `${persona} is planning`;
    case 'asking':
      return isSender ? `${request.recipientUsername} is choosing` : `${persona} has a question`;
    case 'awaiting_confirm':
      return isSender ? `${request.recipientUsername} is deciding` : 'Waiting for your OK';
    case 'running':
      return `${persona} is on it`;
    case 'completed':
      return 'Done';
    case 'failed':
      return 'Something went wrong';
    case 'declined':
      if (request.isWelcome) return 'Maybe later';
      return isSender ? `${request.recipientUsername} said no thanks · unused Energy back` : 'You said no thanks';
    case 'cancelled':
      return isSender ? 'Taken back · unused Energy back' : 'Taken back';
    case 'expired':
      return isSender ? 'Expired · unused Energy back' : 'Expired';
    default:
      return '';
  }
}

// ---- wand cards: 1 to 3 objectives, in DMs and on comments --------------------
// (twinkle-api helpers/sponsoredHelp/cards.ts, cardRules.ts buildCardView)

export const SPONSORED_HELP_GROUP_ROOT_TYPE = 'sponsoredHelpGroup';
export const SPONSORED_HELP_GROUP_CARD_ROOT_TYPE = 'sponsoredHelpGroupCard';
export const SPONSORED_HELP_MAX_OBJECTIVES = 3;
export const SPONSORED_HELP_OBJECTIVE_MAX = 300;

export type SponsoredHelpObjectiveState =
  | 'pending'
  | 'working'
  | 'asking'
  | 'deciding'
  | 'done'
  | 'declined'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface MemberChoiceQuestion {
  key: string;
  question: string;
  options: string[];
  ownHint: string;
}

export interface SponsoredHelpObjectiveView {
  index: number;
  text: string;
  requestId: number;
  status: SponsoredHelpStatus;
  state: SponsoredHelpObjectiveState;
  energyPercent: number;
  attempts: number;
  isAgain: boolean;
  againAvailable?: boolean;
  // a session objective's follow-up: whether the sender's leftover share is
  // paying the member's next text and voice turns
  followUp?: 'sponsored' | 'low' | 'used_up' | 'none';
  question?: MemberChoiceQuestion | null;
  questionsLeft?: number;
  summary?: string;
  steps?: SponsoredHelpStep[];
  cannotDo?: string[];
  planHash?: string;
  planRevision?: number;
  changesLeft?: number;
  result?: SponsoredHelpView['result'];
  failureCode?: string | null;
}

export interface SponsoredHelpCardView {
  cardId: number;
  surface: 'dm' | 'comment';
  persona: 'zero' | 'ciel';
  senderId: number;
  senderUsername: string;
  recipientId: number;
  recipientUsername: string;
  createdAt: number;
  expiresAt: number;
  commentId?: number;
  energyPercent?: number;
  senderSummary?: string;
  objectives: SponsoredHelpObjectiveView[];
  assistantPathId?: number;
  canRunAll?: boolean;
  canConfirmAll?: boolean;
  runAll?: boolean;
  viewer: 'recipient' | 'sender' | 'bystander';
  // on a secret post this viewer hasn't unlocked: no text, plans or amounts
  locked?: boolean;
  actions?: Partial<WandActionModel>;
}

export interface SponsoredHelpPreview {
  previewId: number;
  recipientUsername: string;
  surface: 'dm' | 'comment';
  persona: 'zero' | 'ciel';
  summary: string;
  objectives: {
    text: string;
    kind: 'lumine_build' | 'chat_session' | 'open_page' | 'app_address' | 'not_possible' | 'not_right';
    line: string;
    estimatePercent: number;
  }[];
  estimatePercent: number;
  budgetPercent: number;
  enough: boolean;
  canSend: boolean;
}

export interface SponsoredHelpAgainEstimate {
  requestId: number;
  available: boolean;
  openRequestId: number;
  estimatePercent: number;
  remainingPercent: number;
  enough: boolean;
}

// A server-issued wand card row only (members can't write these rootTypes).
export function readSponsoredHelpCardView(message: {
  rootType?: unknown;
  rootId?: unknown;
  settings?: any;
}): { view: SponsoredHelpCardView; variant: 'dm' | 'assistant' } | null {
  const rootType = String(message?.rootType || '');
  if (rootType !== SPONSORED_HELP_GROUP_ROOT_TYPE && rootType !== SPONSORED_HELP_GROUP_CARD_ROOT_TYPE) {
    return null;
  }
  const view = message?.settings?.sponsoredHelpCard;
  if (!view || typeof view !== 'object' || !Array.isArray(view.objectives)) return null;
  if (Number(view.cardId) !== Number(message.rootId)) return null;
  return {
    view: view as SponsoredHelpCardView,
    variant: rootType === SPONSORED_HELP_GROUP_CARD_ROOT_TYPE ? 'assistant' : 'dm'
  };
}

// The card a comment carries (its settings are server-written only). The
// card itself is loaded per viewer; this is only its id.
export function readCommentWandCardId(comment: { settings?: any } | null | undefined) {
  let settings = comment?.settings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch {
      return 0;
    }
  }
  const id = Number(settings?.sponsoredHelpCard?.cardId);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
}

// "about 3%" / "less than 1%": no internal units on screen
export function energyPercentLabel(percent: number) {
  const value = Number(percent) || 0;
  if (value < 1) return 'less than 1%';
  return `about ${Math.round(value)}%`;
}

export function againConfirmText(estimate: Pick<SponsoredHelpAgainEstimate, 'estimatePercent'>) {
  return `This uses ${energyPercentLabel(estimate.estimatePercent)} of your battery.`;
}

export function againRefusalText(estimate: Pick<SponsoredHelpAgainEstimate, 'estimatePercent' | 'remainingPercent'>) {
  return `Your battery is too low for this right now. It needs ${energyPercentLabel(
    estimate.estimatePercent
  )} and you have ${Math.max(0, Math.floor(estimate.remainingPercent))}% left today.`;
}

// One short line per objective state, for whoever is looking.
export function objectiveStateLabel(
  objective: Pick<SponsoredHelpObjectiveView, 'state' | 'status' | 'isAgain'>,
  { persona, viewer, recipientUsername }: { persona: string; viewer: SponsoredHelpCardView['viewer']; recipientUsername: string }
) {
  const name = sponsoredHelpPersonaName(persona);
  const mine = viewer === 'recipient';
  switch (objective.state) {
    case 'pending':
      return mine ? 'Ready' : `Waiting for ${recipientUsername}`;
    case 'working':
      return objective.status === 'running' ? `${name} is on it` : `${name} is planning`;
    case 'asking':
      return mine ? `${name} has a question` : `${recipientUsername} is choosing`;
    case 'deciding':
      return mine ? 'Waiting for your OK' : `${recipientUsername} is deciding`;
    case 'done':
      return objective.isAgain ? 'Done again' : 'Done';
    case 'declined':
      return mine ? 'You said no thanks' : 'No thanks';
    case 'failed':
      return 'Didn’t work';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Taken back';
    default:
      return '';
  }
}

export type ObjectiveAction =
  | 'press'
  | 'open_chat'
  | 'answer'
  | 'confirm'
  | 'change'
  | 'decline'
  | 'again'
  | 'open_result'
  | 'talk';

/**
 * Which buttons an objective shows. Only the person the card is for gets
 * any; the sender and everyone else only read. On the DM message or the
 * comment, the recipient starts things (and goes to their Zero/Ciel chat
 * for the rest); the full controls live on the Zero/Ciel chat card, and on
 * a comment card the recipient loads their own full view.
 */
export function objectiveActions(
  objective: SponsoredHelpObjectiveView,
  { viewer, place }: { viewer: SponsoredHelpCardView['viewer']; place: 'dm' | 'comment' | 'assistant' }
): ObjectiveAction[] {
  if (viewer !== 'recipient') return [];
  const full = place === 'assistant' || place === 'comment';
  switch (objective.status) {
    case 'sent':
      return objective.failureCode && place === 'assistant' ? ['press', 'decline'] : ['press'];
    case 'planning':
      return place === 'assistant' ? [] : ['open_chat'];
    case 'asking':
      return place === 'assistant' ? ['answer', 'decline'] : ['open_chat'];
    case 'awaiting_confirm':
      if (place !== 'assistant') return ['open_chat'];
      return [
        ...((objective.steps?.length || 0) > 0 ? (['confirm'] as const) : []),
        ...((objective.changesLeft || 0) > 0 ? (['change'] as const) : []),
        'decline'
      ];
    case 'running':
      return place === 'assistant' ? ['talk'] : ['open_chat'];
    case 'completed':
      return [
        ...(objective.result?.buildId || objective.result?.path ? (['open_result'] as const) : []),
        // a finished session goes on: text or voice, the share pays first
        ...(place === 'assistant' && objective.followUp && objective.followUp !== 'none' ? (['talk'] as const) : []),
        ...(full && objective.againAvailable ? (['again'] as const) : [])
      ];
    case 'declined':
    case 'failed':
      return full && objective.againAvailable ? ['again'] : [];
    default:
      return [];
  }
}

// The card-wide buttons.
export function cardActions(
  card: SponsoredHelpCardView,
  { place }: { place: 'dm' | 'comment' | 'assistant' }
) {
  const recipient = card.viewer === 'recipient';
  const waiting = card.objectives.filter((objective) => objective.status === 'sent');
  return {
    doAll: recipient && card.objectives.length > 1 && waiting.length > 0,
    confirmAll: recipient && place === 'assistant' && !!card.canConfirmAll,
    noThanks:
      recipient &&
      card.objectives.some((objective) => ['sent', 'asking', 'awaiting_confirm'].includes(objective.status)) &&
      place !== 'assistant',
    takeBack: card.viewer === 'sender' && waiting.some((objective) => !objective.isAgain)
  };
}

// Confirm all quotes the hash of every plan the member is looking at.
export function confirmAllPlanHashes(card: SponsoredHelpCardView) {
  const hashes: Record<string, string> = {};
  for (const objective of card.objectives) {
    if (objective.status === 'awaiting_confirm' && objective.planHash && (objective.steps?.length || 0) > 0) {
      hashes[String(objective.requestId)] = objective.planHash;
    }
  }
  return hashes;
}

// What the text/voice switch tells Zero/Ciel the member is on (the
// AssistantDock's ask context; the server re-reads the card itself).
export function wandTalkContext(card: SponsoredHelpCardView, objective?: SponsoredHelpObjectiveView | null) {
  return {
    kind: 'sponsoredHelp',
    id: card.cardId,
    ...(objective ? { no: objective.index + 1 } : {}),
    label: objective ? `help card: ${objective.text.slice(0, 40)}` : 'this help card'
  };
}

// The card is being worked on right now (the card polls while it is).
export function cardIsBusy(card: SponsoredHelpCardView) {
  return card.objectives.some((objective) => objective.status === 'planning' || objective.status === 'running');
}

// Who is looking, from the member's own id (the DM message carries one
// shared view for both people in the chat).
export function wandViewerFor(card: Pick<SponsoredHelpCardView, 'senderId' | 'recipientId'>, myId: number) {
  if (myId > 0 && myId === Number(card.recipientId)) return 'recipient' as const;
  if (myId > 0 && myId === Number(card.senderId)) return 'sender' as const;
  return 'bystander' as const;
}

// Who pays the member's next turn with Zero/Ciel on a running or finished
// session objective, said the way the welcome tour says its free talk.
export function followUpNotice(
  objective: Pick<SponsoredHelpObjectiveView, 'followUp'>,
  senderUsername: string
) {
  switch (objective.followUp) {
    case 'sponsored':
      return `${senderUsername}’s Energy covers this · text or call`;
    case 'low':
      return `${senderUsername}’s Energy for this is nearly used`;
    case 'used_up':
      return `${senderUsername}’s Energy for this is used up · now uses yours`;
    default:
      return '';
  }
}

// ---- open wand cards (twinkle-api helpers/sponsoredHelp/openCards.ts) -------
//
// A wand card with no addressee, embedded in rich text as
// ![Wand card](https://www.twin-kle.com/wand/<id>). Anyone who reads it can
// press it once; each press is help for the presser from the author's AI
// Energy, up to the author's cap.

// sponsored: a sponsored spot is free; own_energy: it still works, on the
// reader's own AI Energy (reason: no sponsorship, spots used up, or the
// author's battery is out today)
export type OpenWandCardState = 'sponsored' | 'own_energy' | 'coming_soon' | 'closed';
export type OpenWandOwnEnergyReason = 'not_sponsored' | 'used_up' | 'author_out' | '';

export interface OpenWandCardView {
  openCardId: number;
  persona: 'zero' | 'ciel';
  senderId: number;
  senderUsername: string;
  task: string;
  taskKind: string;
  sponsorCap: number;
  sponsoredLeft: number;
  presses: number;
  state: OpenWandCardState;
  reason: OpenWandOwnEnergyReason;
  viewer: 'author' | 'member' | 'guest';
  createdAt: number;
  perPersonPercent: number;
  mine?: { requestId: number; status: string; paidBy: 'sponsor' | 'self'; assistantPathId: number } | null;
  // the author only: false while it is a draft (only they can see it until
  // a posted Subject or Copy link publishes it)
  published?: boolean;
  sponsoredUsed?: number;
  spentPercent?: number;
  actions?: Partial<WandActionModel>;
}

// Mikey 11-26: "for this promotion i will sponsor up to 10"; 0 is allowed
export const OPEN_WAND_DEFAULT_SPONSOR_CAP = 10;
export const OPEN_WAND_MAX_SPONSOR_CAP = 50;
export const OPEN_WAND_PER_PERSON_PERCENT = 5;
export const OPEN_WAND_SITE = 'https://www.twin-kle.com';

// What members pick from (or type their own). The first is preselected:
// Mikey's "you can too" domain announcement. Keys and texts match the API's
// OPEN_CARD_PRESETS (helpers/sponsoredHelp/openCardRules.ts).
export const OPEN_WAND_PRESETS: { key: string; text: string }[] = [
  { key: 'domain', text: 'Get your own web address (domain) for your app' },
  { key: 'first_game', text: 'Make your first game with Lumine' },
  { key: 'quiz', text: 'Quiz you on something you’re learning' }
];

// The pick a task text is (its key goes to the server, which fixes the
// task and what it needs), or '' for words the member typed.
export function openWandPresetKey(task: string) {
  return OPEN_WAND_PRESETS.find((preset) => preset.text === task)?.key || '';
}

export function openWandPath(openCardId: number) {
  return `/wand/${openCardId}`;
}

export function openWandEmbedMarkdown(openCardId: number) {
  return `![Wand card](${OPEN_WAND_SITE}${openWandPath(openCardId)})`;
}

// Every open wand card embedded in a text, in order (each once).
const OPEN_WAND_EMBED = /!\[[^\]]*\]\((?:https?:\/\/)?(?:www\.)?(?:twin-kle\.com|twinkle\.network|localhost:3000)\/wand\/(\d+)\)/g;
export function openWandIdsInText(text: string) {
  const ids: number[] = [];
  for (const match of String(text || '').matchAll(OPEN_WAND_EMBED)) {
    const id = Number(match[1]);
    if (id > 0 && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

// The text without that card's embed line (and the blank line it leaves).
export function removeOpenWandEmbed(text: string, openCardId: number) {
  return String(text || '')
    .replace(OPEN_WAND_EMBED, (whole, id) => (Number(id) === openCardId ? '\u0000' : whole))
    .replace(/\n*\u0000\n*/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

// The text with the card's embed on a line of its own at the end.
export function appendOpenWandEmbed(text: string, openCardId: number) {
  const current = String(text || '').replace(/\s+$/, '');
  return `${current ? `${current}\n\n` : ''}${openWandEmbedMarkdown(openCardId)}`;
}

export function openWandSpotsLine(card: Pick<OpenWandCardView, 'sponsoredLeft' | 'sponsorCap'>) {
  if (card.sponsorCap <= 0) return '';
  if (card.sponsoredLeft <= 0) return 'Sponsored spots used up';
  return `${card.sponsoredLeft} of ${card.sponsorCap} sponsored spot${card.sponsorCap === 1 ? '' : 's'} left`;
}

// The sheet's honest worst case for the author.
export function openWandEnergyLine(sponsorCap: number, perPersonPercent: number) {
  if (sponsorCap <= 0) return 'Only making the card uses a little of your AI Energy';
  return `Up to ${perPersonPercent}% of your AI Energy per sponsored person (up to ${sponsorCap * perPersonPercent}% in total)`;
}

// What opening a Twinkle-made project sends Lumine by itself (review 11-26
// P0): the idea only while Twinkle's free first run is the one it would
// start; otherwise nothing, and generation waits for the member's own build
// action. The editor sends it only while the project has no chat yet.
export function projectOpenPrompt(
  from: { idea?: unknown; lumineRunSponsored?: unknown; autoStart?: unknown } | null | undefined
) {
  if (!from) return '';
  const free = from.autoStart === true || from.lumineRunSponsored === true;
  const idea = typeof from.idea === 'string' ? from.idea.trim() : '';
  return free && idea ? idea : '';
}

// The editor's navigation state for opening such a project: the idea sent
// (Twinkle's unused free run), or waiting unsent in the message box with an
// optional plain line, or nothing.
export function projectOpenNavState(
  from: { idea?: unknown; lumineRunSponsored?: unknown; autoStart?: unknown } | null | undefined,
  notice = ''
): { initialPrompt: string } | { initialDraft: string; initialNotice?: string } | undefined {
  const prompt = projectOpenPrompt(from);
  if (prompt) return { initialPrompt: prompt };
  const idea = typeof from?.idea === 'string' ? from.idea.trim() : '';
  if (!idea && !notice) return undefined;
  return { initialDraft: idea, ...(notice ? { initialNotice: notice } : {}) };
}

// Confirm's "open the project" (twinkle-api SponsoredHelpClientAction): the
// confirmed idea sent, or (a welcome build that turned out not to be free)
// waiting unsent with the server's plain line.
export function confirmOpenState(action: {
  initialPrompt?: string;
  draft?: string;
  notice?: string;
}) {
  if (action.initialPrompt) return { initialPrompt: action.initialPrompt };
  return {
    initialDraft: String(action.draft || ''),
    ...(action.notice ? { initialNotice: String(action.notice) } : {})
  };
}
