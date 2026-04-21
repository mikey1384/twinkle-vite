import React, { useMemo, useRef } from 'react';
import { css } from '@emotion/css';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import {
  BOOKMARK_VIEWS,
  BookmarkView
} from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import ReactionButton from './ReactionButton';

const deviceIsMobile = isMobile(navigator);

const replyLabel = 'Reply';
const rewardLabel = 'Reward';
const removeLabel = 'Remove';
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
  const dropdownButtonRef = useRef(null);

  const dropdownMenuItems = useMemo(() => {
    const result: any[] = [];
    if (isBanned) return result;

    if (!isRestricted) {
      result.push({
        label: (
          <>
            <Icon icon="reply" />
            <span style={{ marginLeft: '1rem' }}>{replyLabel}</span>
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

    if (userCanEditThis) {
      result.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
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
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{removeLabel}</span>
          </>
        ),
        onClick: () => {
          onDelete({ messageId, filePath, fileName });
        }
      });
    }

    if (userCanRewardThis && !rewardAmount && !isAIMessage) {
      result.push({
        label: (
          <>
            <Icon icon="star" />
            <span style={{ marginLeft: '1rem' }}>{rewardLabel}</span>
          </>
        ),
        style: { color: '#fff', background: Color[rewardColor]() },
        className: css`
          opacity: 0.9;
          &:hover {
            opacity: 1 !important;
          }
        `,
        onClick: onOpenRewardModal
      });
    }

    const canBookmark =
      isAIChat && (isAIMessage || (!!myId && userId === myId && !!messageId));
    if (canBookmark) {
      const bookmarkView = isAIMessage ? BOOKMARK_VIEWS.AI : BOOKMARK_VIEWS.ME;
      result.push({
        label: (
          <>
            <Icon icon="bookmark" />
            <span style={{ marginLeft: '1rem' }}>Bookmark</span>
          </>
        ),
        style: {
          color: '#fff',
          background: Color[isCielMessage ? 'magenta' : 'logoBlue']()
        },
        className: css`
          opacity: 0.9;
          &:hover {
            opacity: 1 !important;
          }
        `,
        onClick: () => onBookmark(messageId, bookmarkView)
      });
    }

    return result;
  }, [
    currentChannelId,
    fileName,
    filePath,
    isAIChat,
    isAIMessage,
    isBanned,
    isCielMessage,
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
      {!invitePath && !isDrawOffer && !isChessMsg && !isBanned && (
        <ReactionButton
          onReactionClick={onAddReaction}
          reactionsMenuShown={reactionsMenuShown}
          onSetReactionsMenuShown={onSetReactionsMenuShown}
          style={{
            marginRight: dropdownButtonShown ? '0.5rem' : 0
          }}
        />
      )}
      {dropdownButtonShown && (
        <DropdownButton
          variant="solid"
          tone="raised"
          buttonStyle={{
            fontSize: '1rem',
            lineHeight: 1
          }}
          className="menu-button"
          innerRef={dropdownButtonRef}
          color="darkerGray"
          icon={deviceIsMobile ? 'chevron-down' : 'ellipsis-h'}
          menuProps={dropdownMenuItems}
          onDropdownShown={onDropdownShown}
        />
      )}
    </div>
  );
}
