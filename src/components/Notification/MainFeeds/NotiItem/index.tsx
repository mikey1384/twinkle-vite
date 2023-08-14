import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { timeSince } from '~/helpers/timeStampHelpers';
import { Color } from '~/constants/css';
import { notiFeedListItem } from '../../Styles';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import NotiMessage from './NotiMessage';
import UsernameText from '~/components/Texts/UsernameText';

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
    rewardRootTargetType,
    rewardRootMissionType,
    isNotification,
    isTask,
    rootMissionType
  }
}: {
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
    rewardRootTargetType?: string;
    rewardRootMissionType?: string;
    isNotification?: boolean;
    isTask?: boolean;
    rootMissionType?: string;
  };
}) {
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
          <NotiMessage
            actionColor={actionColor || ''}
            actionObj={actionObj}
            infoColor={infoColor || ''}
            isNotification={isNotification || false}
            isTask={isTask || false}
            linkColor={linkColor}
            mentionColor={mentionColor || ''}
            missionColor={missionColor || ''}
            recommendationColor={recommendationColor || ''}
            rewardColor={rewardColor || ''}
            rewardRootId={rewardRootId || 0}
            rewardType={rewardType || ''}
            rewardRootMissionType={rewardRootMissionType || ''}
            rewardRootType={rewardRootType || ''}
            rewardRootTargetType={rewardRootTargetType || ''}
            rootMissionType={rootMissionType || ''}
            targetObj={targetObj}
            targetComment={targetComment}
            targetSubject={targetSubject}
            myId={userId || 0}
          />
        </div>
        <small style={{ color: Color.gray() }}>{timeSince(timeStamp)}</small>
      </nav>
    </ErrorBoundary>
  );
}
