import { memo, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import LongText from '~/components/Texts/LongText';
import EditTextArea from '~/components/Texts/EditTextArea';
import DropdownButton from '~/components/Buttons/DropdownButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const editLabel = localize('edit');
const revokeLabel = localize('revoke');
const revokeRewardLabel = localize('revokeReward');

Comment.propTypes = {
  contentType: PropTypes.string,
  contentId: PropTypes.number,
  maxRewardables: PropTypes.number.isRequired,
  noMarginForEditButton: PropTypes.bool,
  onEditDone: PropTypes.func,
  reward: PropTypes.object.isRequired
};

function Comment({
  contentType,
  contentId,
  maxRewardables,
  noMarginForEditButton,
  onEditDone = () => {},
  reward
}) {
  const editRewardComment = useAppContext(
    (v) => v.requestHelpers.editRewardComment
  );
  const revokeReward = useAppContext((v) => v.requestHelpers.revokeReward);
  const onRevokeReward = useContentContext((v) => v.actions.onRevokeReward);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const { authLevel, canEdit, userId } = useKeyContext((v) => v.myState);
  const { isEditing } = useContentState({
    contentType: 'reward',
    contentId: reward.id
  });
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const userIsUploader = useMemo(
    () => reward.rewarderId === userId,
    [reward.rewarderId, userId]
  );
  const userCanRevokeReward = useMemo(
    () =>
      authLevel > 1 &&
      ((!!canEdit && authLevel > reward.rewarderAuthLevel) ||
        reward.rewarderId === userId),
    [authLevel, canEdit, reward.rewarderAuthLevel, reward.rewarderId, userId]
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
            contentId: reward.id,
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
  }, [canEdit, onSetIsEditing, reward.id, userIsUploader]);

  const rewardStatusLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          님이{' '}
          <span
            style={{
              fontWeight: 'bold',
              color:
                reward.rewardAmount >= maxRewardables ||
                reward.rewardAmount >= 10
                  ? Color.gold()
                  : reward.rewardAmount >= 5
                  ? Color.pink()
                  : Color.logoBlue()
            }}
          >
            트윈클 {reward.rewardAmount}개를 보상했습니다
          </span>
        </>
      );
    }
    return (
      <>
        {' '}
        <span
          style={{
            fontWeight: 'bold',
            color:
              reward.rewardAmount >= maxRewardables || reward.rewardAmount >= 10
                ? Color.gold()
                : reward.rewardAmount >= 5
                ? Color.pink()
                : Color.logoBlue()
          }}
        >
          rewarded {reward.rewardAmount === 1 ? 'a' : reward.rewardAmount}{' '}
          Twinkle
          {reward.rewardAmount > 1 ? 's' : ''}
        </span>
      </>
    );
  }, [maxRewardables, reward.rewardAmount]);

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
                stringIsEmpty(reward.rewardComment) && !isEditing && 'center'
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
                userId={userId}
              />
              {rewardStatusLabel}{' '}
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
              {!isEditing && <LongText>{reward.rewardComment}</LongText>}
              {isEditing && (
                <EditTextArea
                  contentId={reward.id}
                  contentType="reward"
                  allowEmptyText
                  rows={3}
                  text={reward.rewardComment}
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
              color="darkerGray"
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
    const success = await revokeReward(reward.id);
    if (success) {
      onRevokeReward({ contentType, contentId, rewardId: reward.id });
    }
  }

  async function handleSubmitEdit(editedComment) {
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
