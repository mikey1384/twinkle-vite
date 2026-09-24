import React, { useState } from 'react';
import { css } from '@emotion/css';
import { v1 as uuidv1 } from 'uuid';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import ChoicePromptBubble from '~/containers/Build/Editor/ChatPanel/ChoicePromptBubble';

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
  status?: 'pending' | 'approved' | 'declined' | 'failed';
  result?: any;
  kind?: 'request' | 'owner_access';
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

// A Zero/Ciel card: a question with tappable answers, or a change on Twinkle
// waiting for the user's approval. The tap is recorded on the server (which
// makes an approved change), then sent as the user's reply.
export default function WebsiteAgentCard({
  card,
  channelId,
  messageId,
  topicId,
  messageText = '',
  onAnswered
}: {
  card: WebsiteAgentCardData;
  channelId: number;
  messageId: number;
  topicId?: number | null;
  // The reply the card belongs to; a question it already asks in words is
  // not repeated as the card's title.
  messageText?: string;
  // Outside the chat page (Home's ask box) the answer is sent by the caller,
  // which then shows the next reply itself.
  onAnswered?: (reply: string) => void;
}) {
  const decideWebsiteAgentCard = useAppContext(
    (v) => v.requestHelpers.decideWebsiteAgentCard
  );
  const onUpdateMessageSettings = useChatContext(
    (v) => v.actions.onUpdateMessageSettings
  );
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const { userId, username, profilePicUrl } = useKeyContext((v) => v.myState);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState('');

  const decided =
    card.type === 'choice'
      ? Boolean(card.answer)
      : card.type === 'lumine'
        ? // A failed tap can be tried again.
          card.status === 'approved' || card.status === 'declined'
        : card.status !== 'pending';

  async function handleSelect(key: string) {
    if (busyLabel || decided) return;
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
        ...decision
      });
      const nextCard: WebsiteAgentCardData | undefined = data?.card;
      if (!nextCard) throw new Error('No card returned');
      onUpdateMessageSettings({
        channelId,
        messageId,
        settings: { websiteAgentCard: nextCard }
      });
      if (onAnswered) {
        onAnswered(describeReply(nextCard));
        return;
      }
      onSubmitMessage({
        messageId: uuidv1(),
        message: {
          userId,
          username,
          profilePicUrl,
          content: describeReply(nextCard),
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

  const options =
    card.type === 'choice' || card.type === 'lumine'
      ? (card.options || []).map((option) => ({
          key: option,
          label: option,
          tone:
            card.answer === option
              ? ('positive' as const)
              : ('neutral' as const),
          disabled: decided
        }))
      : [
          {
            key: 'approve',
            label: 'Yes, go ahead!',
            tone: 'positive' as const,
            disabled: decided
          },
          {
            key: 'decline',
            label: 'No thanks',
            tone: 'neutral' as const,
            disabled: decided
          }
        ];

  return (
    <div className={bubbleVariables}>
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
          (card.type === 'permission'
            ? describePermissionStatus(card)
            : card.type === 'approval'
              ? describeApprovalStatus(card)
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
function describeApprovalStatus(card: WebsiteAgentCardData) {
  if (card.status === 'approved') return 'Done!';
  if (card.status === 'declined') return 'Okay, I won’t.';
  if (card.status === 'failed') return 'Oops, that didn’t work.';
  return undefined;
}

function describeLumineStatus(card: WebsiteAgentCardData) {
  if (card.status === 'failed') {
    return typeof card.result === 'string' && card.result
      ? card.result
      : 'Oops, that didn’t work.';
  }
  if (card.status === 'approved') {
    return card.kind === 'owner_access' ? 'Thanks, done!' : 'Sent to Lumine!';
  }
  if (card.status === 'declined') {
    return card.kind === 'owner_access'
      ? 'Okay, maybe later.'
      : 'Okay, not sent.';
  }
  return undefined;
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
