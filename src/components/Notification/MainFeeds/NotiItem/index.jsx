import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { timeSince } from '~/helpers/timeStampHelpers';
import { Color } from '~/constants/css';
import { notiFeedListItem } from '../../Styles';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import useNotificationMessage from './useNotificationMessage';
import UsernameText from '~/components/Texts/UsernameText';

NotiItem.propTypes = {
  actionColor: PropTypes.string,
  infoColor: PropTypes.string,
  linkColor: PropTypes.string,
  mentionColor: PropTypes.string,
  missionColor: PropTypes.string,
  recommendationColor: PropTypes.string,
  rewardColor: PropTypes.string,
  userId: PropTypes.number,
  notification: PropTypes.object.isRequired
};

export default function NotiItem({
  actionColor,
  infoColor,
  linkColor,
  mentionColor,
  missionColor,
  recommendationColor,
  rewardColor,
  userId,
  notification: {
    id,
    actionObj = {},
    targetComment = {},
    targetObj = {},
    targetSubject = {},
    timeStamp,
    user = {},
    rewardType,
    rewardRootId,
    rewardRootType,
    rewardRootMissionType,
    isNotification,
    isTask,
    rootMissionType
  }
}) {
  const NotificationMessage = useNotificationMessage({
    actionColor,
    actionObj,
    infoColor,
    isNotification,
    isTask,
    linkColor,
    mentionColor,
    missionColor,
    recommendationColor,
    rewardColor,
    rewardRootId,
    rewardType,
    rewardRootMissionType,
    rewardRootType,
    rootMissionType,
    targetObj,
    targetComment,
    targetSubject,
    user,
    myId: userId
  });

  const userLabel = useMemo(() => {
    if (actionObj.contentType !== 'pass' && actionObj.contentType !== 'fail') {
      return (
        <div style={{ display: 'inline' }}>
          <UsernameText user={user} color={Color[linkColor]()} />
          {SELECTED_LANGUAGE === 'kr' ? '' : ' '}
        </div>
      );
    }
    return '';
  }, [actionObj.contentType, linkColor, user]);

  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/NotiItem/index">
      <nav style={{ background: '#fff' }} className={notiFeedListItem} key={id}>
        <div>
          {userLabel}
          {NotificationMessage}
        </div>
        <small style={{ color: Color.gray() }}>{timeSince(timeStamp)}</small>
      </nav>
    </ErrorBoundary>
  );
}
