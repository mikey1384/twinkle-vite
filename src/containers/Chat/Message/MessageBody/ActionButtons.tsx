import React, { useCallback, useMemo } from 'react';
import { css } from '@emotion/css';
import ActionMenu, { type ChatActionItem } from './ActionMenu';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { BOOKMARK_VIEWS, BookmarkView } from '~/constants/defaultValues';
import ReactionButton from './ReactionButton';

const replyLabel = 'Reply';
const rewardLabel = 'Reward';
const removeLabel = 'Remove';
const deleteLabel = 'Delete';
const editLabel = 'Edit';

interface Props {
  currentChannelId: number;
  fileName: string;
  filePath: string;
  invitePath: string;
  isAIChat: boolean;
  isAIMessage: boolean;
  isBanned: boolean;
  isCielMessage?: boolean;
  isChessMsg: boolean;
  isCurrentlyStreaming: boolean;
  isDeleteOnlyBuildSuggestion: boolean;
  isReplyOnlyBuildCard: boolean;
  canReply: boolean;
  isDrawOffer: boolean;
  isMenuButtonsAllowed: boolean;
  isRestricted: boolean;
  message: any;
  messageId: number;
  myId: number;
  onAddReaction: (reaction: any) => void;
  onBookmark: (messageId: number, view: BookmarkView) => void;
  onDelete: (v: any) => void;
  onDropdownShown: (shown: boolean) => void;
  onOpenRewardModal: () => void;
  onReplyClick: (target: any) => void;
  onSetIsEditing: (v: any) => void;
  onSetReactionsMenuShown: (shown: boolean) => void;
  onSetReplyTarget: (v: any) => void;
  reactionsMenuShown: boolean;
  recentThumbUrl: string;
  rewardAmount: number;
  rewardColor: string;
  subchannelId?: number;
  targetMessage: any;
  thumbUrl: string;
  timeStamp: number;
  userCanDeleteThis: boolean;
  userCanEditThis: boolean;
  userCanRewardThis: boolean;
  userId: number;
}

export default function ActionButtons({
  currentChannelId,
  fileName,
  filePath,
  invitePath,
  isAIChat,
  isAIMessage,
  isBanned,
  isCielMessage,
  isChessMsg,
  isCurrentlyStreaming,
  isDeleteOnlyBuildSuggestion,
  isReplyOnlyBuildCard,
  canReply,
  isDrawOffer,
  isMenuButtonsAllowed,
  isRestricted,
  message,
  messageId,
  myId,
  onAddReaction,
  onBookmark,
  onDelete,
  onDropdownShown,
  onOpenRewardModal,
  onReplyClick,
  onSetIsEditing,
  onSetReactionsMenuShown,
  onSetReplyTarget,
  reactionsMenuShown,
  recentThumbUrl,
  rewardAmount,
  rewardColor,
  subchannelId,
  targetMessage,
  thumbUrl,
  timeStamp,
  userCanDeleteThis,
  userCanEditThis,
  userCanRewardThis,
  userId
}: Props) {
  const dropdownMenuItems = useMemo(() => {
    const result: ChatActionItem[] = [];
    if (isBanned) return result;

    // Reply is the one action a Build card keeps: quoting it bumps the card
    // with its live buttons. Everything else stays gated below.
    if (canReply && !isRestricted) {
      result.push({
        id: 'reply',
        label: (
          <>
            <Icon icon="reply" />
            <span>{replyLabel}</span>
          </>
        ),
        onClick: () => {
          const target = rewardAmount
            ? targetMessage
            : {
                ...message,
                thumbUrl: thumbUrl || recentThumbUrl,
                timeStamp
              };
          onSetReplyTarget({
            channelId: currentChannelId,
            subchannelId,
            target
          });
          onReplyClick(target);
        }
      });
    }

    if (!isDeleteOnlyBuildSuggestion && !isReplyOnlyBuildCard && userCanEditThis) {
      result.push({
        id: 'edit',
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span>{editLabel}</span>
          </>
        ),
        onClick: () => {
          onSetIsEditing({
            contentId: messageId,
            contentType: 'chat',
            isEditing: true
          });
        }
      });
    }

    if (userCanDeleteThis) {
      result.push({
        id: 'remove',
        tone: 'danger',
        label: (
          <>
            <Icon icon="trash-alt" />
            <span>
              {isDeleteOnlyBuildSuggestion ? deleteLabel : removeLabel}
            </span>
          </>
        ),
        onClick: () => {
          onDelete({ messageId, filePath, fileName });
        }
      });
    }

    if (
      !isDeleteOnlyBuildSuggestion &&
      !isReplyOnlyBuildCard &&
      userCanRewardThis &&
      !rewardAmount &&
      !isAIMessage
    ) {
      result.push({
        id: 'reward',
        label: (
          <>
            <Icon icon="star" />
            <span>{rewardLabel}</span>
          </>
        ),
        accent: Color[rewardColor](),
        onClick: onOpenRewardModal
      });
    }

    const canBookmark =
      isAIChat && (isAIMessage || (!!myId && userId === myId && !!messageId));
    if (!isDeleteOnlyBuildSuggestion && !isReplyOnlyBuildCard && canBookmark) {
      const bookmarkView = isAIMessage ? BOOKMARK_VIEWS.AI : BOOKMARK_VIEWS.ME;
      result.push({
        id: 'bookmark',
        label: (
          <>
            <Icon icon="bookmark" />
            <span>Bookmark</span>
          </>
        ),
        accent: Color[isCielMessage ? 'magenta' : 'logoBlue'](),
        onClick: () => onBookmark(messageId, bookmarkView)
      });
    }

    return result;
  }, [
    canReply,
    currentChannelId,
    fileName,
    filePath,
    isAIChat,
    isAIMessage,
    isBanned,
    isCielMessage,
    isDeleteOnlyBuildSuggestion,
    isReplyOnlyBuildCard,
    isRestricted,
    message,
    messageId,
    myId,
    onBookmark,
    onDelete,
    onOpenRewardModal,
    onReplyClick,
    onSetIsEditing,
    onSetReplyTarget,
    recentThumbUrl,
    rewardAmount,
    rewardColor,
    subchannelId,
    targetMessage,
    thumbUrl,
    timeStamp,
    userCanDeleteThis,
    userCanEditThis,
    userCanRewardThis,
    userId
  ]);

  const dropdownButtonShown = useMemo(
    () => dropdownMenuItems.length > 0 && !isCurrentlyStreaming,
    [dropdownMenuItems.length, isCurrentlyStreaming]
  );

  const handleActionMenuShown = useCallback(
    (shown: boolean) => {
      onDropdownShown(shown);
      if (shown) onSetReactionsMenuShown(false);
    },
    [onDropdownShown, onSetReactionsMenuShown]
  );

  if (!isMenuButtonsAllowed) {
    return null;
  }

  return (
    <div
      className={css`
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
      `}
    >
      {!isDeleteOnlyBuildSuggestion &&
        !isReplyOnlyBuildCard &&
        !invitePath &&
        !isDrawOffer &&
        !isChessMsg &&
        !isBanned && (
          <ReactionButton
            onReactionClick={onAddReaction}
            reactionsMenuShown={reactionsMenuShown}
            onSetReactionsMenuShown={onSetReactionsMenuShown}
            style={{
              marginRight: dropdownButtonShown ? 4 : 0
            }}
          />
        )}
      {dropdownButtonShown && (
        <ActionMenu
          items={dropdownMenuItems}
          dismissWhen={reactionsMenuShown}
          onShownChange={handleActionMenuShown}
        />
      )}
    </div>
  );
}
