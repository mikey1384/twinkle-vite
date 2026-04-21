import React from 'react';
import { cx } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { timeSince } from '~/helpers/timeStampHelpers';
import MessagesButton from './MessagesButton';
import {
  actionButtonClass,
  actionButtonFlexLargeClass,
  actionButtonFlexMediumClass,
  actionButtonFullWidthClass,
  actionButtonsLayoutClass,
  actionsContainerClass,
  cardsButtonClass,
  cardsLabel,
  changePicLabel,
  chatButtonClass,
  chatLabel,
  editBioLabel,
  lastActiveClass,
  lastOnlineLabel,
  messageButtonClass,
  profileButtonClass,
  profileLabel
} from './styles';

export default function ActionButtons({
  banned,
  canEdit,
  chatLoading,
  commentsShown,
  expandable,
  isOnline,
  lastActive,
  loadingComments,
  noBio,
  numMessages,
  onMessagesButtonClick,
  onOpenBioEditModal,
  onOpenCards,
  onOpenProfile,
  onOpenProfilePicModal,
  onTalkClick,
  profileId,
  profileUsername,
  userId
}: {
  banned?: any;
  canEdit: boolean;
  chatLoading: boolean;
  commentsShown: boolean;
  expandable?: boolean;
  isOnline: boolean;
  lastActive?: any;
  loadingComments: boolean;
  noBio: boolean;
  numMessages: number;
  onMessagesButtonClick: () => void;
  onOpenBioEditModal: () => void;
  onOpenCards: () => void;
  onOpenProfile: () => void;
  onOpenProfilePicModal: () => void;
  onTalkClick: () => void;
  profileId: number;
  profileUsername: string;
  userId: number;
}) {
  return (
    <>
      {canEdit ? (
        <div className={actionsContainerClass}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.6rem',
              justifyContent: 'flex-start'
            }}
          >
            <Button
              onClick={onOpenProfilePicModal}
              className={cx(actionButtonClass, actionButtonFlexLargeClass)}
              color="logoBlue"
              hoverColor="mediumBlue"
              variant="solid"
              tone="raised"
              uppercase={false}
            >
              <Icon icon="camera" />
              <span>{changePicLabel}</span>
            </Button>
            <Button
              onClick={handleEditBioClick}
              className={cx(actionButtonClass, actionButtonFlexMediumClass)}
              variant="solid"
              tone="raised"
              color="purple"
              hoverColor="mediumPurple"
              uppercase={false}
            >
              {editBioLabel}
            </Button>
            <MessagesButton
              commentsShown={commentsShown}
              loading={loadingComments}
              profileId={profileId}
              myId={userId}
              onMessagesButtonClick={onMessagesButtonClick}
              numMessages={numMessages}
              className={cx(
                actionButtonClass,
                messageButtonClass,
                actionButtonFullWidthClass
              )}
              iconColor="rgba(255,255,255,0.92)"
              textColor="rgba(255,255,255,0.95)"
              buttonColor="orange"
              buttonHoverColor="mediumOrange"
              buttonVariant="solid"
              buttonTone="raised"
            />
          </div>
        </div>
      ) : null}
      {expandable && userId !== profileId ? (
        <div
          className={actionButtonsLayoutClass}
          style={{ marginTop: noBio ? '2rem' : '1rem' }}
        >
          <Button
            className={cx(
              actionButtonClass,
              profileButtonClass,
              actionButtonFlexMediumClass
            )}
            variant="solid"
            tone="raised"
            color="logoBlue"
            hoverColor="mediumBlue"
            uppercase={false}
            disabled={!profileUsername}
            onClick={onOpenProfile}
          >
            <Icon icon="user" color="rgba(255,255,255,0.92)" />
            <span>{profileLabel}</span>
          </Button>
          <Button
            className={cx(
              actionButtonClass,
              cardsButtonClass,
              actionButtonFlexMediumClass
            )}
            variant="solid"
            tone="raised"
            color="purple"
            hoverColor="mediumPurple"
            uppercase={false}
            disabled={!profileUsername}
            onClick={onOpenCards}
          >
            <Icon icon="cards-blank" color="rgba(255,255,255,0.92)" />
            <span>{cardsLabel}</span>
          </Button>
          <Button
            className={cx(
              actionButtonClass,
              chatButtonClass,
              actionButtonFlexMediumClass
            )}
            variant="solid"
            tone="raised"
            color="green"
            hoverColor="lightGreen"
            uppercase={false}
            loading={chatLoading}
            disabled={chatLoading || !profileUsername}
            onClick={onTalkClick}
          >
            <Icon icon="comments" color="rgba(255,255,255,0.92)" />
            <span>{chatLabel}</span>
          </Button>
          <MessagesButton
            className={cx(
              actionButtonClass,
              messageButtonClass,
              actionButtonFullWidthClass
            )}
            commentsShown={commentsShown}
            loading={loadingComments}
            profileId={profileId}
            myId={userId}
            onMessagesButtonClick={onMessagesButtonClick}
            numMessages={numMessages}
            iconColor="rgba(255,255,255,0.92)"
            textColor="rgba(255,255,255,0.95)"
            buttonColor="orange"
            buttonHoverColor="mediumOrange"
            buttonVariant="solid"
            buttonTone="raised"
          />
        </div>
      ) : null}
      {lastActive && !isOnline && profileId !== userId ? (
        <div className={lastActiveClass}>
          <p>
            {lastOnlineLabel} {timeSince(lastActive)}
          </p>
        </div>
      ) : null}
    </>
  );

  function handleEditBioClick() {
    if (banned?.posting) {
      return;
    }
    onOpenBioEditModal();
  }
}
