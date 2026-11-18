import ProfileActionPreview, {
  isProfileActionPreview,
  type ProfileActionPreviewData
} from './ProfileActionPreview';
import React, { useState } from 'react';
import { css } from '@emotion/css';
import { v1 as uuidv1 } from 'uuid';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useContentContext
} from '~/contexts';
import ChoicePromptBubble from '~/containers/Build/Editor/ChatPanel/ChoicePromptBubble';
import {
  isTopicBrainCardPreview,
  type TopicBrainCardPreview
} from '~/helpers/topicBrain';
import TopicBrainProposalPreview from './TopicBrainProposalPreview';
import AssetHandoffPreview from './AssetHandoffPreview';

export interface WebsiteAgentCardData {
  // lumine: sending a request to Lumine on duty, or a project owner's
  // choice of sponsor access; decided on the server like the others.
  type: 'choice' | 'approval' | 'permission' | 'lumine';
  id: string;
  question?: string;
  options?: string[];
  answer?: string;
  summary?: string;
  method?: string;
  path?: string;
  status?:
    'pending' | 'processing' | 'approved' | 'declined' | 'failed' | 'closed';
  result?: any;
  kind?: 'request' | 'owner_access';
  // who the card is for (the server answers only their tap) and, in a
  // Bridge Builder crew chat, the crew it was offered in
  requesterUserId?: number;
  requesterUsername?: string;
  crewId?: number;
  // what kind of change an approval is, when the card can show it (a topic
  // brain proposal: the words Zero or Ciel want to save)
  preview?:
    | TopicBrainCardPreview
    | ProfileActionPreviewData
    | {
        kind: 'asset_handoff';
        proposalId: string;
        destination?: {
          kind: 'avatar' | 'cover' | 'profile_gallery' | 'subject' | 'comment';
          caption?: string;
          position?: string;
        };
      }
    | { kind?: string };
}

// The Build chat's choice bubble reads these from its panel; the main chat
// supplies its own.
const bubbleVariables = css`
  --chat-bg: #f8fafc;
  --chat-text: #2f3747;
  --ui-border: rgba(148, 163, 184, 0.28);
  --build-workshop-message-font-size: 1.5rem;
  --build-workshop-choice-font-size: 1.35rem;
  display: flex;
  margin-top: 0.8rem;
`;

// A card with something to show above its buttons (a topic brain change).
const stackedCard = css`
  flex-direction: column;
  gap: 0.6rem;
`;

// A Zero/Ciel card: a question with tappable answers, or a change on Twinkle
// waiting for the user's approval. The tap is recorded on the server (which
// makes an approved change), then sent as the user's reply. In a crew chat
// the card is the caller's alone: everyone else sees "Waiting for <name>",
// and the caller's answer @mentions the assistant so it carries on.
export default function WebsiteAgentCard({
  card,
  channelId,
  messageId,
  topicId,
  messageText = '',
  assistantName,
  onAnswered,
  onCardUpdated
}: {
  card: WebsiteAgentCardData;
  channelId: number;
  messageId: number;
  topicId?: number | null;
  // The reply the card belongs to; a question it already asks in words is
  // not repeated as the card's title.
  messageText?: string;
  // who wrote the card's reply (Zero or Ciel)
  assistantName?: 'Zero' | 'Ciel';
  // Outside the chat page (Home's ask box) the answer is sent by the caller,
  // which then shows the next reply itself.
  onAnswered?: (reply: string) => void;
  onCardUpdated?: (card: WebsiteAgentCardData) => void;
}) {
  const decideWebsiteAgentCard = useAppContext(
    (v) => v.requestHelpers.decideWebsiteAgentCard
  );
  const onUpdateMessageSettings = useChatContext(
    (v) => v.actions.onUpdateMessageSettings
  );
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loadedProposalId, setLoadedProposalId] = useState('');
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onApplyCanonicalUserSettings = useAppContext(
    (v) => v.user.actions.onApplyCanonicalUserSettings
  );
  const onUpdateNavTabsState = useAppContext(
    (v) => v.user.actions.onUpdateNavTabsState
  );
  const onApplyCanonicalUserProfileState = useAppContext(
    (v) => v.user.actions.onApplyCanonicalUserProfileState
  );
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const imageProposalId =
    card.type === 'approval' &&
    card.preview?.kind === 'asset_handoff' &&
    'proposalId' in card.preview &&
    typeof card.preview.proposalId === 'string'
      ? card.preview.proposalId
      : '';

  const requesterId = Number(card.requesterUserId || 0);
  const isSomeoneElses = !!requesterId && requesterId !== Number(userId);
  const requesterName = card.requesterUsername || 'the member who asked';

  const decided =
    card.type === 'choice'
      ? Boolean(card.answer)
      : card.type === 'lumine'
        ? // A failed tap can be tried again.
          card.status === 'approved' ||
          card.status === 'declined' ||
          card.status === 'closed'
        : card.status !== 'pending' && card.status !== 'processing';

  const options =
    card.type === 'choice' || card.type === 'lumine'
      ? (card.options || []).map((option) => ({
          key: option,
          label: option,
          tone:
            card.answer === option
              ? ('positive' as const)
              : ('neutral' as const),
          disabled: decided || isSomeoneElses
        }))
      : [
          {
            key: 'approve',
            label: 'Yes, go ahead!',
            tone: 'positive' as const,
            disabled:
              decided ||
              isSomeoneElses ||
              (!!imageProposalId && loadedProposalId !== imageProposalId)
          },
          {
            key: 'decline',
            label: 'No thanks',
            tone: 'neutral' as const,
            disabled: decided || isSomeoneElses
          }
        ];

  const profilePreview = isProfileActionPreview(card.preview) ? card.preview : null;
  const brainPreview =
    card.type === 'approval' && isTopicBrainCardPreview(card.preview)
      ? card.preview
      : null;

  return (
    <div
      className={
        brainPreview || imageProposalId || profilePreview
          ? `${bubbleVariables} ${stackedCard}`
          : bubbleVariables
      }
    >
      {imageProposalId && !isSomeoneElses && (
        <AssetHandoffPreview
          key={imageProposalId}
          proposalId={imageProposalId}
          destination={
            card.preview && 'destination' in card.preview
              ? card.preview.destination
              : undefined
          }
          onReady={setLoadedProposalId}
        />
      )}
      {brainPreview && !isSomeoneElses && (
        <TopicBrainProposalPreview preview={brainPreview} decided={decided} />
      )}
      {profilePreview && !isSomeoneElses && <ProfileActionPreview preview={profilePreview} />}
      <ChoicePromptBubble
        question={
          card.type === 'choice' || card.type === 'lumine'
            ? sameWords(card.question, messageText)
              ? ''
              : card.question || ''
            : card.summary || ''
        }
        options={options}
        busyLabel={busyLabel}
        footnote={
          error ||
          (isSomeoneElses
            ? describeOthersCard(card, requesterName, decided)
            : undefined) ||
          (card.type === 'permission'
            ? describePermissionStatus(card)
            : card.type === 'approval'
              ? describeApprovalStatus(card, !!brainPreview)
              : card.type === 'lumine'
                ? describeLumineStatus(card)
                : card.answer
                  ? `You chose "${card.answer}".`
                  : undefined)
        }
        onSelect={handleSelect}
      />
    </div>
  );

  async function handleSelect(key: string) {
    if (busyLabel || decided || isSomeoneElses) return;
    setError('');
    const decision =
      card.type === 'choice' || card.type === 'lumine'
        ? { choice: key }
        : { approved: key === 'approve' };
    setBusyLabel(
      card.type === 'approval' && key === 'approve' ? 'Working on it…' : '…'
    );
    try {
      const data = await decideWebsiteAgentCard({
        messageId,
        cardId: card.id,
        ...(imageProposalId ? { previewedAssetProposalId: loadedProposalId } : {}),
        ...decision
      });
      const nextCard: WebsiteAgentCardData | undefined = data?.card;
      if (!nextCard) throw new Error('No card returned');
      if (
        nextCard.status === 'approved' &&
        nextCard.preview?.kind === 'asset_handoff'
      ) {
        const handoff = nextCard.result?.data;
        const saved = handoff?.saved;
        if (
          (saved?.contentType === 'subject' ||
            saved?.contentType === 'comment') &&
          saved?.contentId
        ) {
          onEditContent({
            contentType: saved.contentType,
            contentId: saved.contentId,
            data: {
              filePath: saved.filePath,
              fileName: saved.fileName,
              fileSize: saved.fileSize,
              thumbUrl: saved.thumbUrl
            }
          });
        }
        if (Number(saved?.userId) === Number(userId)) {
          const kind = handoff?.destination?.kind;
          const newState =
            kind === 'avatar'
              ? { profilePicUrl: saved.profilePicUrl }
              : kind === 'cover'
                ? {
                    profileCoverUrl: saved.profileCoverUrl,
                    profileCoverPosition: saved.profileCoverPosition
                  }
                : kind === 'profile_gallery'
                  ? { pictures: saved.pictures }
                  : null;
          if (newState) onSetUserState({ userId, newState });
        }
      }
      if (nextCard.status === 'approved' && nextCard.preview?.kind === 'profile_action') {
        const saved = nextCard.result?.data;
        if (saved && Number(saved.userId) === Number(userId)) {
          if (saved.userPatch) onSetUserState({ userId, newState: saved.userPatch });
          if (saved.settingsPatch) onApplyCanonicalUserSettings({ userId, settingsPatch: saved.settingsPatch });
          if (saved.navTabs) onUpdateNavTabsState(saved.navTabs);
          if (saved.profileState) onApplyCanonicalUserProfileState({ userId, profileState: saved.profileState });
        }
      }
      onCardUpdated?.(nextCard);
      onUpdateMessageSettings({
        channelId,
        messageId,
        settings: { websiteAgentCard: nextCard }
      });
      // A failed or still-running operation is not the user's completed
      // answer. Keep its canonical state visible and let them retry here.
      if (
        (nextCard.type === 'lumine' || nextCard.type === 'approval') &&
        nextCard.status !== 'approved' &&
        nextCard.status !== 'declined'
      )
        return;
      if (onAnswered) {
        onAnswered(describeReply(nextCard));
        return;
      }
      // In a crew chat a yes or a choice calls the assistant back by name
      // (a new reply on the caller's Energy); "No thanks" just ends it.
      const reply = describeReply(nextCard);
      onSubmitMessage({
        messageId: uuidv1(),
        message: {
          userId,
          username,
          profilePicUrl,
          content: crewCallsBack(nextCard, assistantName)
            ? `@${assistantName} ${reply}`
            : reply,
          channelId,
          subjectId: topicId || null
        },
        selectedTab: topicId ? 'topic' : 'all',
        topicId: topicId || null
      });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusyLabel(null);
    }
  }
}

// Whether a crew card's answer @mentions the assistant to carry on.
export function crewCallsBack(
  card: WebsiteAgentCardData,
  assistantName?: 'Zero' | 'Ciel'
) {
  return !!card.crewId && !!assistantName && card.status !== 'declined';
}

function sameWords(a = '', b = '') {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  return !!normalize(a) && normalize(a) === normalize(b);
}

// Plain words only: many users are 8 to 13.
function describeApprovalStatus(
  card: WebsiteAgentCardData,
  isTopicBrain = false
) {
  if (card.status === 'processing')
    return 'Still working. You can tap again to check.';
  if (card.status === 'approved')
    return isTopicBrain ? 'Saved. It’s in Topic Settings.' : card.preview?.kind === 'profile_action' ? 'Saved.' : 'Done!';
  if (card.status === 'declined') return 'Okay, I won’t.';
  if (card.status === 'failed')
    return (
      (typeof card.result?.error === 'string'
        ? card.result.error
        : isTopicBrain || card.preview?.kind === 'profile_action'
          ? websiteAnswerError(card.result)
          : '') || 'Oops, that didn’t work.'
    );
  return undefined;
}

// Why a topic brain change wasn't saved, in the website's own plain words
// (kept on the card as the route's answer).
function websiteAnswerError(result: any) {
  return typeof result?.data?.error === 'string' ? result.data.error : '';
}

function describeLumineStatus(card: WebsiteAgentCardData) {
  if (card.status === 'processing')
    return 'Still working on your choice. You can tap again to check.';
  if (card.status === 'closed') return card.result || 'This request has ended.';
  if (card.status === 'failed') {
    return typeof card.result === 'string' && card.result
      ? card.result
      : 'Oops, that didn’t work.';
  }
  if (card.status === 'approved') {
    return card.kind === 'owner_access'
      ? card.result || 'Access chosen.'
      : 'Sent to Lumine!';
  }
  if (card.status === 'declined') {
    return card.kind === 'owner_access'
      ? 'Okay, maybe later.'
      : 'Okay, not sent.';
  }
  return undefined;
}

// A card shown to a crew member it is not for.
export function describeOthersCard(
  card: WebsiteAgentCardData,
  requesterName: string,
  decided: boolean
) {
  if (!decided && card.status !== 'processing') {
    return `Waiting for ${requesterName}…`;
  }
  if (card.type === 'choice' || card.type === 'lumine') {
    return card.answer
      ? `${requesterName} chose "${card.answer}".`
      : `Waiting for ${requesterName}…`;
  }
  if (card.status === 'processing')
    return `${requesterName} said yes. Working on it…`;
  if (card.status === 'declined') return `${requesterName} said no thanks.`;
  if (card.status === 'failed') return 'That didn’t work.';
  return `${requesterName} said yes. Done!`;
}

function describePermissionStatus(card: WebsiteAgentCardData) {
  if (card.status === 'approved') return 'You said yes. Thanks!';
  if (card.status === 'declined') return 'Okay, I won’t.';
  return undefined;
}

function describeReply(card: WebsiteAgentCardData) {
  if (card.type === 'choice' || card.type === 'lumine') {
    return card.answer || '';
  }
  return card.status === 'declined' ? 'No thanks' : 'Yes, go ahead!';
}

export function isWebsiteAgentCardData(
  value: unknown
): value is WebsiteAgentCardData {
  const card = value as WebsiteAgentCardData;
  return (
    !!card &&
    (card.type === 'choice' ||
      card.type === 'approval' ||
      card.type === 'permission' ||
      card.type === 'lumine') &&
    typeof card.id === 'string' &&
    // Cards with answers to pick must carry them as a list of words.
    ((card.type !== 'choice' && card.type !== 'lumine') ||
      (Array.isArray(card.options) &&
        card.options.every((option) => typeof option === 'string')))
  );
}
