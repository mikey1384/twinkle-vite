import React, { useMemo } from 'react';
import BuildContributionInvite from './BuildContributionInvite';
import BuildCollaborationRequest from './BuildCollaborationRequest';
import BuildContributionSubmission from './BuildContributionSubmission';
import BuildThumbnailSuggestion from './BuildThumbnailSuggestion';
import BuildProjectLimitRequest from './BuildProjectLimitRequest';
import BuildRewardReview from './BuildRewardReview';
import { parseMessageSettings } from './messageSettings';
import { useKeyContext } from '~/contexts';
import { isReplyableBuildCardRootType } from '~/helpers/chatMessageCapabilities';

// A Build card quoted inside a reply. The quoted copy is the real card — the
// same component as the original message, reading the same shared state — so
// the owner can merge, adopt the thumbnail or review right from the bump.
export function isBuildCardTargetMessage(message: any) {
  return (
    !!message &&
    Number(message.rootId || 0) > 0 &&
    isReplyableBuildCardRootType(message.rootType)
  );
}

// These cards print the sender's note inside the card, so the quote must not
// repeat it underneath; the review and limit-request cards do not.
export function buildCardRendersContent(rootType: unknown) {
  return [
    'buildContributionInvite',
    'buildCollaborationRequest',
    'buildContributionSubmission',
    'buildThumbnailSuggestion'
  ].includes(String(rootType || ''));
}

export default function BuildCardTarget({
  message,
  channelId
}: {
  message: any;
  channelId?: number;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const settings = useMemo(
    () => parseMessageSettings(message?.settings),
    [message?.settings]
  );
  const rootType = String(message?.rootType || '');
  const rootId = Number(message?.rootId || 0);
  const content = String(message?.content || '');
  const messageId = Number(message?.id || 0);
  const sender = {
    id: Number(message?.userId || 0),
    username: String(message?.username || ''),
    profileTheme: message?.profileTheme || null
  };
  if (!rootId) return null;
  if (rootType === 'buildContributionInvite') {
    return (
      <BuildContributionInvite
        channelId={Number(channelId || message?.channelId || 0)}
        content={content}
        invite={settings?.buildContributionInvite}
        myId={myId}
        sender={sender}
      />
    );
  }
  if (rootType === 'buildCollaborationRequest') {
    return (
      <BuildCollaborationRequest
        content={content}
        request={settings?.buildCollaborationRequest}
        myId={myId}
        sender={sender}
      />
    );
  }
  if (rootType === 'buildThumbnailSuggestion') {
    return (
      <BuildThumbnailSuggestion
        content={content}
        messageId={messageId}
        suggestion={settings?.buildThumbnailSuggestion}
        myId={myId}
        sender={sender}
      />
    );
  }
  if (rootType === 'buildContributionSubmission') {
    return (
      <BuildContributionSubmission
        content={content}
        submission={settings?.buildContributionSubmission}
        myId={myId}
        sender={sender}
      />
    );
  }
  if (rootType === 'buildProjectLimitRequest') {
    return (
      <BuildProjectLimitRequest
        request={settings?.buildProjectLimitRequest}
        myId={myId}
        sender={sender}
      />
    );
  }
  if (rootType === 'buildRewardReview') {
    return (
      <BuildRewardReview
        review={settings?.buildRewardReview}
        myId={myId}
        sender={sender}
      />
    );
  }
  return null;
}
