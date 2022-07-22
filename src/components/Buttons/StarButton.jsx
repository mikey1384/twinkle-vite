import React, { useMemo, useRef, useState } from 'react';
import { useContentState } from '~/helpers/hooks';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import DropdownList from '~/components/DropdownList';
import RewardLevelModal from '~/components/Modals/RewardLevelModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import AlertModal from '~/components/Modals/AlertModal';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  DESCRIPTION_LENGTH_FOR_EXTRA_REWARD_LEVEL,
  SELECTED_LANGUAGE
} from '~/constants/defaultValues';
import localize from '~/constants/localize';

const setRewardLevelLabel = localize('setRewardLevel');
const settingCannotBeChangedLabel = localize('settingCannotBeChanged');

StarButton.propTypes = {
  byUser: PropTypes.bool,
  contentId: PropTypes.number,
  rewardLevel: PropTypes.number,
  defaultDescription: PropTypes.string,
  filePath: PropTypes.string,
  filled: PropTypes.bool,
  onSetRewardLevel: PropTypes.func,
  onToggleByUser: PropTypes.func,
  style: PropTypes.object,
  contentType: PropTypes.string.isRequired,
  skeuomorphic: PropTypes.bool,
  uploader: PropTypes.object
};

export default function StarButton({
  byUser,
  contentId,
  contentType,
  defaultDescription,
  filePath,
  rewardLevel,
  filled,
  onSetRewardLevel,
  onToggleByUser,
  uploader,
  skeuomorphic,
  style = {}
}) {
  const { canReward, canEditRewardLevel, userId } = useKeyContext(
    (v) => v.myState
  );
  const setByUser = useAppContext((v) => v.requestHelpers.setByUser);
  const { description } = useContentState({ contentId, contentType });
  const [cannotChangeModalShown, setCannotChangeModalShown] = useState(false);
  const [moderatorName, setModeratorName] = useState('');
  const [rewardLevelModalShown, setRewardLevelModalShown] = useState(false);
  const [dropdownContext, setDropdownContext] = useState(null);
  const coolDownRef = useRef(null);

  const writtenByButtonShown = useMemo(
    () =>
      contentType === 'subject' &&
      !filePath &&
      (byUser ||
        (description || defaultDescription)?.length >
          DESCRIPTION_LENGTH_FOR_EXTRA_REWARD_LEVEL),
    [byUser, contentType, defaultDescription, description, filePath]
  );
  const showsDropdownWhenClicked = useMemo(() => {
    return (
      uploader &&
      (contentType === 'video' ||
        contentType === 'url' ||
        (contentType === 'subject' && (filePath || writtenByButtonShown)))
    );
  }, [contentType, filePath, uploader, writtenByButtonShown]);
  const StarButtonRef = useRef(null);
  const byUserLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      const makerLabel =
        uploader?.id === userId ? '내가' : `${uploader?.username}님이`;
      return (
        <>
          {byUser
            ? `${makerLabel} ${
                writtenByButtonShown ? '작성하지' : '제작하지'
              } 않았음`
            : `${makerLabel} ${writtenByButtonShown ? '작성했음' : '제작함'}`}
        </>
      );
    }
    const makerLabel = uploader?.id === userId ? 'me' : uploader?.username;
    return (
      <>
        {byUser
          ? `This wasn't ${
              writtenByButtonShown ? 'written' : 'made'
            } by ${makerLabel}`
          : `This was ${
              writtenByButtonShown ? 'written' : 'made'
            } by ${makerLabel}`}
      </>
    );
  }, [byUser, uploader?.id, uploader?.username, userId, writtenByButtonShown]);
  const moderatorHasDisabledChangeLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <span>
          <b>{moderatorName}</b>님이 이 설정을 변경하지 못하도록 설정하였습니다
        </span>
      );
    }
    return (
      <span>
        <b>{moderatorName}</b> has disabled users from changing this setting for
        this post
      </span>
    );
  }, [moderatorName]);
  const buttonShown = useMemo(() => {
    return (
      canEditRewardLevel ||
      (showsDropdownWhenClicked && (uploader?.id === userId || canReward))
    );
  }, [
    canEditRewardLevel,
    canReward,
    showsDropdownWhenClicked,
    uploader?.id,
    userId
  ]);

  const { marginLeft, ...otherStyles } = useMemo(() => style, [style]);

  return buttonShown ? (
    <ErrorBoundary componentPath="StarButton">
      <div
        style={{ position: 'relative', height: '100%', marginLeft }}
        ref={StarButtonRef}
      >
        <Button
          style={otherStyles}
          skeuomorphic={!(!!rewardLevel || byUser || filled) && skeuomorphic}
          color={
            !!rewardLevel && byUser ? 'gold' : byUser ? 'orange' : 'brownOrange'
          }
          filled={!!rewardLevel || byUser || filled}
          onClick={onClick}
        >
          <Icon icon="star" />
        </Button>
        {!!dropdownContext && (
          <DropdownList
            dropdownContext={dropdownContext}
            onHideMenu={handleHideMenuWithCoolDown}
            style={{ minWidth: '20rem' }}
          >
            {(contentType === 'video' || contentType === 'subject') &&
              !!canEditRewardLevel && (
                <li onClick={handleShowRewardLevelModal}>
                  {setRewardLevelLabel}
                </li>
              )}
            <li onClick={toggleByUser}>{byUserLabel}</li>
          </DropdownList>
        )}
      </div>
      {rewardLevelModalShown && (
        <RewardLevelModal
          contentType={contentType}
          contentId={contentId}
          rewardLevel={rewardLevel}
          onSubmit={(data) => {
            onSetRewardLevel({ ...data, contentType, contentId });
            setRewardLevelModalShown(false);
          }}
          onHide={() => setRewardLevelModalShown(false)}
        />
      )}
      {cannotChangeModalShown && (
        <AlertModal
          title={settingCannotBeChangedLabel}
          content={moderatorHasDisabledChangeLabel}
          onHide={() => setCannotChangeModalShown(false)}
        />
      )}
    </ErrorBoundary>
  ) : null;

  function onClick() {
    if (showsDropdownWhenClicked) {
      if (coolDownRef.current) return;
      const menuDisplayed = !!dropdownContext;
      const parentElementDimensions =
        StarButtonRef.current?.getBoundingClientRect?.() || {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      return setDropdownContext(menuDisplayed ? null : parentElementDimensions);
    }
    return setRewardLevelModalShown(true);
  }

  function handleHideMenuWithCoolDown() {
    setDropdownContext(null);
    coolDownRef.current = true;
    setTimeout(() => {
      coolDownRef.current = false;
    }, 10);
  }

  function handleShowRewardLevelModal() {
    setRewardLevelModalShown(true);
    setDropdownContext(null);
  }

  async function toggleByUser() {
    const {
      byUser,
      cannotChange,
      moderatorName: modName
    } = await setByUser({
      contentType,
      contentId
    });
    if (cannotChange) {
      setModeratorName(modName);
      setDropdownContext(null);
      return setCannotChangeModalShown(true);
    }
    onToggleByUser(byUser);
    setDropdownContext(null);
  }
}
