import React, { memo, useMemo, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import EditTextArea from '~/components/Texts/EditTextArea';
import DropdownButton from '~/components/Buttons/DropdownButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { isSupermod } from '~/helpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';
import RewardStatusLabel from './RewardStatusLabel';

const editLabel = localize('edit');
const revokeLabel = localize('revoke');
const revokeRewardLabel = localize('revokeReward');

function Comment({
  contentType,
  contentId,
  noMarginForEditButton,
  onEditDone = () => null,
  reward
}: {
  contentType: string;
  contentId: number;
  noMarginForEditButton?: boolean;
  onEditDone?: (arg: any) => void;
  reward: any;
}) {
  const editRewardComment = useAppContext(
    (v) => v.requestHelpers.editRewardComment
  );
  const revokeReward = useAppContext((v) => v.requestHelpers.revokeReward);
  const onRevokeReward = useContentContext((v) => v.actions.onRevokeReward);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const { level, userId } = useKeyContext((v) => v.myState);
  const { canEdit } = useMyLevel();
  const { isEditing } = useContentState({
    contentType: 'reward',
    contentId: reward.id
  });
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const userIsUploader = useMemo(
    () => reward.rewarderId === userId,
    [reward.rewarderId, userId]
  );
  const memoizedReward = useMemo(() => reward, [reward]);
  const userCanRevokeReward = useMemo(
    () =>
      isSupermod(level) &&
      ((!!canEdit && level > memoizedReward.rewarderLevel) ||
        memoizedReward.rewarderId === userId),
    [
      level,
      canEdit,
      memoizedReward.rewarderLevel,
      memoizedReward.rewarderId,
      userId
    ]
  );
  const editButtonShown = useMemo(() => {
    return userIsUploader || canEdit || userCanRevokeReward;
  }, [canEdit, userCanRevokeReward, userIsUploader]);
  const editMenuItems = useMemo(() => {
    const items = [];
    if (userIsUploader || canEdit) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () =>
          onSetIsEditing({
            contentId: memoizedReward.id,
            contentType: 'reward',
            isEditing: true
          })
      });
    }
    if (userCanRevokeReward) {
      items.push({
        label: (
          <>
            <Icon icon="ban" />
            <span style={{ marginLeft: '1rem' }}>{revokeLabel}</span>
          </>
        ),
        onClick: () => setConfirmModalShown(true)
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, memoizedReward.id, userIsUploader, userCanRevokeReward]);

  return (
    <ErrorBoundary componentPath="RewardStatus/Comment">
      <div
        className={css`
          padding: 1rem;
          ${noMarginForEditButton ? `padding-right: 0;` : ''} display: flex;
          align-items: space-between;
        `}
      >
        <div>
          <ProfilePic
            userId={reward.rewarderId}
            profilePicUrl={reward.rewarderProfilePicUrl}
            style={{ width: '5rem' }}
          />
        </div>
        <div
          className={css`
            width: 100%;
            margin-left: 1rem;
            font-size: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent:
                stringIsEmpty(reward.rewardComment) && !isEditing
                  ? 'center'
                  : ''
            }}
          >
            <div
              style={{
                width: '100%'
              }}
            >
              <UsernameText
                user={{
                  id: reward.rewarderId,
                  username: reward.rewarderUsername
                }}
              />{' '}
              <RewardStatusLabel rewardAmount={reward.rewardAmount} />{' '}
              <span style={{ fontSize: '1.2rem', color: Color.gray() }}>
                ({timeSince(reward.timeStamp)})
              </span>
            </div>
            <div
              style={{
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
              }}
            >
              {!isEditing && <RichText>{reward.rewardComment}</RichText>}
              {isEditing && (
                <EditTextArea
                  contentId={reward.id}
                  contentType="rewardComment"
                  allowEmptyText
                  rows={3}
                  text={reward.rewardComment || ''}
                  onCancel={() =>
                    onSetIsEditing({
                      contentId: reward.id,
                      contentType: 'reward',
                      isEditing: false
                    })
                  }
                  onEditDone={handleSubmitEdit}
                />
              )}
            </div>
          </div>
          {editButtonShown && !isEditing && (
            <DropdownButton
              skeuomorphic
              icon="chevron-down"
              menuProps={editMenuItems}
            />
          )}
        </div>
      </div>
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          title={revokeRewardLabel}
          onConfirm={handleRevokeReward}
        />
      )}
    </ErrorBoundary>
  );

  async function handleRevokeReward() {
    try {
      const success = await revokeReward(reward.id);
      if (success) {
        onRevokeReward({ contentType, contentId, rewardId: reward.id });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function handleSubmitEdit(editedComment: string) {
    try {
      await editRewardComment({ editedComment, contentId: reward.id });
      onEditDone({ id: reward.id, text: editedComment });
      onSetIsEditing({
        contentId: reward.id,
        contentType: 'reward',
        isEditing: false
      });
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default memo(Comment);
