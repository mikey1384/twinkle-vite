import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatContext, useKeyContext } from '~/contexts';
import { parseChannelPath } from '~/helpers';
import { emitAcceptedChatGroupMembership } from '~/helpers/chatGroupMembership';
import { getChatMessageKind } from '~/helpers/chatMessageCapabilities';
import { normalizeAICardOfferMessagePayload } from '~/helpers/aiCardOfferNotice';
import { socket } from '~/constants/sockets/api';
import LocalContext from '../../Context';
import TransactionDetails from '../../TransactionDetails';
import CrewChatCard from '../../CrewChat/CrewChatCard';
import AICardOfferMessage from './AICardOfferMessage';
import ApprovalRequest from './ApprovalRequest';
import BuildCardTarget, { isBuildCardTargetMessage } from './BuildCardTarget';
import DrawOffer from './DrawOffer';
import GameOverMessage from './GameOverMessage';
import Invitation from './Invitation';
import MeetupQuestCard from './MeetupQuestCard';
import ModificationNotice from './ModificationNotice';
import TransferMessage from './TransferMessage';
import WordleResult from './WordleResult';
import { ReplyTargetEnvironmentContext } from './ReplyTargetEnvironment';
import { ReplyCardPresentationContext } from './ReplyCardPresentation';
import { parseMessageSettings } from './messageSettings';
import type { ReplyTargetSummary } from './replyTargetSummary';

// The original card, not a second approximation of its contents. Incomplete
// old records keep their existing summary until their full data is available.
export function hasReplyTargetCard(message: any, summary: ReplyTargetSummary | null, hasEnvironment = true) {
  const kind = getChatMessageKind(message || {});
  switch (kind) {
    case 'buildCard': {
      if (!isBuildCardTargetMessage(message)) return false;
      if (['buildContributionInvite', 'buildCollaborationRequest'].includes(message.rootType)) return true;
      const settings = parseMessageSettings(message.settings);
      if (message.rootType === 'buildProjectLimitRequest') {
        return !!summary && !!Number(settings.buildProjectLimitRequest?.requestId);
      }
      if (message.rootType === 'buildReviewRequest') {
        return !!summary && !!Number(settings.buildReviewRequest?.id);
      }
      return !!summary;
    }
    case 'wordleResult':
      return !!message?.wordleResult && typeof message.wordleResult === 'object';
    case 'tradeOffer':
      return hasEnvironment && !!message?.transactionDetails?.id;
    case 'cardTransfer':
      return hasEnvironment && !!message?.transferDetails?.card?.id;
    case 'aiCardOffer':
      return hasEnvironment && !!normalizeAICardOfferMessagePayload(
        parseMessageSettings(message?.settings)?.aiCardOffer
      );
    case 'gameResult':
      return !!summary;
    case 'drawOffer':
      return hasEnvironment;
    case 'groupInvitation':
      return !!message?.invitePath;
    case 'approvalRequest':
    case 'moderationNotice':
    case 'crewChatCard':
      return Number(message?.rootId || 0) > 0;
    case 'meetupQuestCard':
      return Number(message?.rootId || 0) > 0 &&
        ['meetupQuestInvite', 'meetupStory'].includes(message.rootType);
    default:
      return false;
  }
}

export default function ReplyTargetCard({
  message,
  displayedThemeColor,
  summary
}: {
  message: any;
  displayedThemeColor: string;
  summary: ReplyTargetSummary | null;
}) {
  return (
    <ReplyCardPresentationContext.Provider value>
      <ReplyTargetCardContent
        message={message}
        displayedThemeColor={displayedThemeColor}
        summary={summary}
      />
    </ReplyCardPresentationContext.Provider>
  );
}

function ReplyTargetCardContent({
  message,
  displayedThemeColor,
  summary
}: {
  message: any;
  displayedThemeColor: string;
  summary: ReplyTargetSummary | null;
}) {
  const environment = useContext(ReplyTargetEnvironmentContext);
  const { actions, requests, state } = useContext(LocalContext);
  const navigate = useNavigate();
  const myId = Number(useKeyContext((v) => v.myState.userId));
  const myUsername = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const channelId = Number(message.channelId || environment?.channelId || 0);
  const members = useChatContext((v) => v.state.channelsObj?.[channelId]?.members);
  const kind = getChatMessageKind(message);
  const senderId = Number(message.userId || 0);
  const senderName = String(message.username || '');
  const partnerId = Number(message.transactionDetails
    ? Number(message.transactionDetails.from) === myId
      ? message.transactionDetails.to
      : message.transactionDetails.from
    : message.transferDetails
      ? Number(message.transferDetails.from) === myId
        ? message.transferDetails.to
        : message.transferDetails.from
      : environment?.partner?.id || senderId);
  const partner = Number(environment?.partner?.id) === partnerId
    ? environment!.partner!
    : {
        id: partnerId,
        username: (members || []).find((member: any) => Number(member.id) === partnerId)?.username ||
          (partnerId === senderId ? senderName : '') || 'someone'
      };

  if (!hasReplyTargetCard(message, summary, !!environment)) return null;
  if (kind === 'wordleResult') {
    return <WordleResult myId={myId} userId={senderId} username={senderName}
      timeStamp={message.timeStamp} wordleResult={message.wordleResult} />;
  }
  if (kind === 'buildCard') return <BuildCardTarget message={message} channelId={channelId} />;
  if (kind === 'tradeOffer' && environment) {
    const transaction = message.transactionDetails;
    const canOpen = !(transaction.type === 'send' && Number(transaction.from) === myId) &&
      Number(environment.currentTransactionId) === Number(transaction.id);
    return (
      <TransactionDetails
        channelId={channelId}
        currentTransactionId={environment.currentTransactionId}
        isAICardModalShown={environment.isAICardModalShown}
        partner={partner}
        onClick={canOpen ? () => environment.onSetTransactionModalShown(true) : undefined}
        groupObjs={environment.groupObjs}
        onSetGroupObjs={environment.onSetGroupObjs}
        onSetAICardModalCardId={environment.onSetAICardModalCardId}
        transaction={transaction}
      />
    );
  }
  if (kind === 'cardTransfer' && environment) {
    return <TransferMessage myId={myId} myUsername={myUsername} partner={partner}
      transferDetails={message.transferDetails} onSetAICardModalCardId={environment.onSetAICardModalCardId} />;
  }
  if (kind === 'aiCardOffer' && environment) {
    const offer = normalizeAICardOfferMessagePayload(parseMessageSettings(message.settings)?.aiCardOffer);
    return offer ? <AICardOfferMessage myId={myId} myUsername={myUsername}
      offerDetails={offer} senderUsername={senderName} timeStamp={message.timeStamp}
      onSetAICardModalCardId={environment.onSetAICardModalCardId} /> : null;
  }
  if (kind === 'gameResult') {
    const isOmok = message.gameType === 'omok' || !!message.omokState ||
      (!message.gameType && String(message.content || '').toLowerCase().includes('omok'));
    return <GameOverMessage channelId={channelId} messageId={Number(message.id)}
      myId={myId} opponentName={partner.username} winnerId={Number(message.gameWinnerId || 0)}
      isAbort={!!Number(message.isAbort)} isDraw={!!Number(message.isDraw)}
      isResign={!!Number(message.isResign)} gameType={isOmok ? 'omok' : 'chess'}
      quoteLabel={summary?.label} />;
  }
  if (kind === 'drawOffer' && environment) {
    return <DrawOffer myId={myId} userId={senderId} username={senderName}
      onClick={environment.onChessBoardClick} />;
  }
  if (kind === 'groupInvitation') {
    return <Invitation channelId={channelId} invitationChannelId={Number(message.invitationChannelId || 0)}
      invitePath={String(message.invitePath)} messageId={Number(message.id)}
      sender={{ id: senderId, username: senderName }} onAcceptGroupInvitation={acceptInvitation} />;
  }
  if (kind === 'approvalRequest') {
    return <ApprovalRequest channelId={channelId} cardSettings={parseMessageSettings(message.settings)}
      displayedThemeColor={displayedThemeColor} userId={senderId}
      username={senderName} requestId={Number(message.rootId)} messageId={Number(message.id)} />;
  }
  if (kind === 'moderationNotice') {
    return <ModificationNotice modificationId={Number(message.rootId)} username={senderName} />;
  }
  if (kind === 'crewChatCard') return <CrewChatCard crewId={Number(message.rootId)} inReply />;
  if (kind === 'meetupQuestCard') {
    return <MeetupQuestCard crewId={Number(message.rootId)} username={senderName}
      isStory={message.rootType === 'meetupStory'} />;
  }
  return null;

  async function acceptInvitation(path: string) {
    const id = state.channelPathIdHash?.[path] || parseChannelPath(path);
    if (!state.channelPathIdHash?.[path]) {
      actions.onUpdateChannelPathIdHash({ channelId: id, pathId: path });
    }
    const response = await requests.acceptInvitation(id);
    if (Number(response.channel.id) === Number(id)) {
      emitAcceptedChatGroupMembership({
        response,
        memberId: myId,
        fallbackMember: { id: myId, username: myUsername, profilePicUrl },
        socket
      });
      navigate(`/chat/${path}`);
    }
  }
}
