import { useMemo } from 'react';
import renderEnglishMessage from './localization/english';
import renderKoreanMessage from './localization/korean';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export default function useNotificationMessage({
  actionColor,
  actionObj,
  infoColor,
  linkColor,
  mentionColor,
  missionColor,
  targetObj,
  targetComment,
  targetSubject,
  isNotification,
  isTask,
  recommendationColor,
  rewardColor,
  rewardRootId,
  rewardType,
  rewardRootMissionType,
  rewardRootType,
  rootMissionType,
  user,
  myId
}: {
  actionColor?: string;
  actionObj?: any;
  infoColor?: string;
  isNotification?: boolean;
  isTask?: boolean;
  linkColor?: string;
  mentionColor?: string;
  missionColor?: string;
  recommendationColor?: string;
  rewardColor?: string;
  rewardRootId?: number;
  rewardType?: string;
  rewardRootMissionType?: string;
  rewardRootType?: string;
  rootMissionType?: string;
  targetComment?: any;
  targetObj?: any;
  targetSubject?: any;
  user?: any;
  myId?: number;
}) {
  const NotificationMessage = useMemo(() => {
    const isReply = targetComment?.userId === myId;
    const isSubjectResponse = targetSubject?.userId === myId;
    const params: any = {
      actionObj,
      actionColor,
      infoColor,
      isNotification,
      isReply,
      isSubjectResponse,
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
      targetComment,
      targetObj,
      targetSubject,
      user
    };
    return SELECTED_LANGUAGE === 'kr'
      ? renderKoreanMessage(params)
      : renderEnglishMessage(params);
  }, [
    targetComment,
    myId,
    targetSubject,
    actionObj,
    actionColor,
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
    user
  ]);

  return NotificationMessage;
}
