import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { timeSince } from '~/helpers/timeStampHelpers';
import { Color } from '~/constants/css';
import { notiFeedListItem } from '../../Styles';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import useNotificationMessage from './useNotificationMessage';
import UsernameText from '~/components/Texts/UsernameText';

interface Props {
  actionColor?: string;
  infoColor?: string;
  linkColor: string;
  mentionColor?: string;
  missionColor?: string;
  recommendationColor?: string;
  rewardColor?: string;
  userId?: number;
  notification: {
    id: number;
    actionObj?: any;
    targetComment?: any;
    targetObj?: any;
    targetSubject?: any;
    timeStamp: string;
    user?: any;
    rewardType?: string;
    rewardRootId?: number;
    rewardRootType?: string;
    rewardRootMissionType?: string;
    isNotification?: boolean;
    isTask?: boolean;
    rootMissionType?: string;
  };
}
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
}: Props) {
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
