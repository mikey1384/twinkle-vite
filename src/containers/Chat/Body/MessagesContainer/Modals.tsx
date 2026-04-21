import React from 'react';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import BuyTopicsModal from '../../Modals/BuyTopicsModal';
import InviteUsersModal from '../../Modals/InviteUsers';
import SelectNewOwnerModal from '../../Modals/SelectNewOwnerModal';
import SelectVideoModal from '../../Modals/SelectVideoModal';
import SettingsModal from '../../Modals/SettingsModal';
import SubjectMsgsModal from '../../Modals/SubjectMsgsModal';
import TransactionModal from '../../Modals/TransactionModal';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { LEAVE_CHAT_GROUP_LABEL } from './constants';
import GameModals from './GameModals';
import type {
  BoardCountdownState,
  ChatPartner,
  DeleteModalState,
  SubjectMsgsModalState
} from './types';

export default function Modals({
  boardCountdownObj,
  buyTopicModalShown,
  channelName,
  chessModalShown,
  currentChannel,
  currentTransactionId,
  deleteModal,
  displayedThemeColor,
  editCanChangeTopic,
  groupObjs,
  hideModalShown,
  inputText,
  inviteUsersModalShown,
  isAICardModalShown,
  isLeaving,
  leaveConfirmModalShown,
  omokModalShown,
  partner,
  selectNewOwnerModalShown,
  selectVideoModalShown,
  selectingNewOwner,
  selectedChannelId,
  settingsModalShown,
  socketConnected,
  subjectMsgsModal,
  transactionModalShown,
  userId,
  wordleAttemptState,
  wordleGuesses,
  wordleModalShown,
  wordleSolution,
  wordleStats,
  wordleWordLevel,
  onAcceptRewind,
  onBuyTopicDone,
  onCancelRewindRequest,
  onChessSpoilerClick,
  onConfirmChessMove,
  onConfirmDelete,
  onConfirmHideChat,
  onConfirmLeave,
  onConfirmOmokMove,
  onDeclineRewind,
  onHideChessModal,
  onHideDeleteModal,
  onHideHideModal,
  onHideInviteUsersModal,
  onHideLeaveConfirmModal,
  onHideOmokModal,
  onHideSelectNewOwnerModal,
  onHideSelectVideoModal,
  onHideSettingsModal,
  onHideSubjectMessagesModal,
  onHideTransactionModal,
  onHideWordleModal,
  onInviteUsersDone,
  onMessageTextSelected,
  onOmokSpoilerClick,
  onPurchaseSubject,
  onScrollToBottom,
  onSelectNewOwner,
  onSetAICardModalCardId,
  onSetGroupObjs,
  onSetTopicVideoComment,
  onSettingsDone
}: {
  boardCountdownObj: BoardCountdownState;
  buyTopicModalShown: boolean;
  channelName?: string;
  chessModalShown: boolean;
  currentChannel: any;
  currentTransactionId: any;
  deleteModal: DeleteModalState;
  displayedThemeColor: string;
  editCanChangeTopic: (args: any) => Promise<any>;
  groupObjs: any;
  hideModalShown: boolean;
  inputText: string;
  inviteUsersModalShown: boolean;
  isAICardModalShown: boolean;
  isLeaving: boolean;
  leaveConfirmModalShown: boolean;
  omokModalShown: boolean;
  partner?: ChatPartner;
  selectNewOwnerModalShown: boolean;
  selectVideoModalShown: boolean;
  selectingNewOwner: boolean;
  selectedChannelId: number;
  settingsModalShown: boolean;
  socketConnected: boolean;
  subjectMsgsModal: SubjectMsgsModalState;
  transactionModalShown: boolean;
  userId: number;
  wordleAttemptState: any;
  wordleGuesses: any[];
  wordleModalShown: boolean;
  wordleSolution: any;
  wordleStats: any;
  wordleWordLevel: any;
  onAcceptRewind: (...args: any[]) => void;
  onBuyTopicDone: () => void;
  onCancelRewindRequest: (...args: any[]) => void;
  onChessSpoilerClick: (senderId: number) => void;
  onConfirmChessMove: (...args: any[]) => void;
  onConfirmDelete: () => void;
  onConfirmHideChat: () => void;
  onConfirmLeave: () => void;
  onConfirmOmokMove: (...args: any[]) => void;
  onDeclineRewind: (...args: any[]) => void;
  onHideChessModal: () => void;
  onHideDeleteModal: () => void;
  onHideHideModal: () => void;
  onHideInviteUsersModal: () => void;
  onHideLeaveConfirmModal: () => void;
  onHideOmokModal: () => void;
  onHideSelectNewOwnerModal: () => void;
  onHideSelectVideoModal: () => void;
  onHideSettingsModal: () => void;
  onHideSubjectMessagesModal: () => void;
  onHideTransactionModal: () => void;
  onHideWordleModal: () => void;
  onInviteUsersDone: (...args: any[]) => void;
  onMessageTextSelected: (text: string) => void;
  onOmokSpoilerClick: (senderId: number) => void;
  onPurchaseSubject: (topic: string) => void;
  onScrollToBottom: () => void;
  onSelectNewOwner: (...args: any[]) => void;
  onSetAICardModalCardId: (cardId: number) => void;
  onSetGroupObjs: (updater: any) => void;
  onSetTopicVideoComment: (text: string) => void;
  onSettingsDone: (...args: any[]) => void;
}) {
  return (
    <>
      {hideModalShown && (
        <ConfirmModal
          onHide={onHideHideModal}
          title="Hide Chat"
          onConfirm={onConfirmHideChat}
        />
      )}
      {deleteModal.shown && (
        <ConfirmModal
          onHide={onHideDeleteModal}
          title="Remove Message"
          onConfirm={onConfirmDelete}
        />
      )}
      {subjectMsgsModal.shown && (
        <SubjectMsgsModal
          displayedThemeColor={displayedThemeColor}
          subjectId={subjectMsgsModal.subjectId}
          subjectTitle={subjectMsgsModal.content}
          onHide={onHideSubjectMessagesModal}
        />
      )}

      <GameModals
        boardCountdownObj={boardCountdownObj}
        channelName={channelName}
        chessModalShown={chessModalShown}
        currentChannel={currentChannel}
        displayedThemeColor={displayedThemeColor}
        omokModalShown={omokModalShown}
        onAcceptRewind={onAcceptRewind}
        onCancelRewindRequest={onCancelRewindRequest}
        onChessSpoilerClick={onChessSpoilerClick}
        onConfirmChessMove={onConfirmChessMove}
        onConfirmOmokMove={onConfirmOmokMove}
        onDeclineRewind={onDeclineRewind}
        onHideChessModal={onHideChessModal}
        onHideOmokModal={onHideOmokModal}
        onHideWordleModal={onHideWordleModal}
        onOmokSpoilerClick={onOmokSpoilerClick}
        onScrollToBottom={onScrollToBottom}
        partner={partner}
        selectedChannelId={selectedChannelId}
        socketConnected={socketConnected}
        userId={userId}
        wordleAttemptState={wordleAttemptState}
        wordleGuesses={wordleGuesses}
        wordleModalShown={wordleModalShown}
        wordleSolution={wordleSolution}
        wordleStats={wordleStats}
        wordleWordLevel={wordleWordLevel}
      />

      {inviteUsersModalShown && (
        <InviteUsersModal
          onHide={onHideInviteUsersModal}
          currentChannel={currentChannel}
          selectedChannelId={selectedChannelId}
          onDone={onInviteUsersDone}
          isOwner={currentChannel.creatorId === userId}
        />
      )}
      {buyTopicModalShown && (
        <BuyTopicsModal
          canChangeSubject={currentChannel.canChangeSubject}
          onDone={async (canChange) => {
            await editCanChangeTopic({
              channelId: selectedChannelId,
              canChangeTopic: canChange
            });
            onBuyTopicDone();
          }}
          channelId={selectedChannelId}
          onPurchaseSubject={onPurchaseSubject}
          onScrollToBottom={onScrollToBottom}
          userIsChannelOwner={currentChannel.creatorId === userId}
        />
      )}
      {settingsModalShown && (
        <SettingsModal
          canChangeSubject={currentChannel.canChangeSubject}
          channelName={channelName}
          description={currentChannel.description}
          isClass={currentChannel.isClass}
          isClosed={currentChannel.isClosed}
          isPublic={currentChannel.isPublic}
          members={currentChannel.members}
          onlyOwnerCanPost={currentChannel.isOwnerPostingOnly}
          onHide={onHideSettingsModal}
          onDone={onSettingsDone}
          channelId={selectedChannelId}
          onPurchaseSubject={onPurchaseSubject}
          onSelectNewOwner={onSelectNewOwner}
          onScrollToBottom={onScrollToBottom}
          selectingNewOwner={selectingNewOwner}
          theme={currentChannel.theme}
          thumbPath={currentChannel.thumbPath}
          unlockedThemes={currentChannel.unlockedThemes}
          userIsChannelOwner={currentChannel.creatorId === userId}
        />
      )}
      {leaveConfirmModalShown && (
        <ConfirmModal
          title={LEAVE_CHAT_GROUP_LABEL}
          onHide={onHideLeaveConfirmModal}
          onConfirm={onConfirmLeave}
          disabled={isLeaving}
        />
      )}
      {selectVideoModalShown && (
        <SelectVideoModal
          onHide={onHideSelectVideoModal}
          onDone={({ videoId }) => {
            const nextText = !stringIsEmpty(inputText)
              ? `${inputText.trim()} https://www.twin-kle.com/videos/${videoId}`
              : `https://www.twin-kle.com/videos/${videoId}`;
            onMessageTextSelected(nextText);
            onSetTopicVideoComment(nextText);
            onHideSelectVideoModal();
          }}
        />
      )}
      {!!selectNewOwnerModalShown && (
        <SelectNewOwnerModal
          onHide={onHideSelectNewOwnerModal}
          members={currentChannel.members}
          onSubmit={onSelectNewOwner}
          isClass={currentChannel.isClass}
          loading={selectingNewOwner}
          andLeave
          channelId={currentChannel.id}
        />
      )}
      {transactionModalShown && partner && (
        <TransactionModal
          currentTransactionId={currentTransactionId}
          channelId={selectedChannelId}
          groupObjs={groupObjs}
          onSetGroupObjs={onSetGroupObjs}
          partner={partner}
          isAICardModalShown={isAICardModalShown}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onHide={onHideTransactionModal}
        />
      )}
    </>
  );
}
