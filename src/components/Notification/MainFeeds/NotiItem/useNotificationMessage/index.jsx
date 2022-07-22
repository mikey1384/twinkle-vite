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
}) {
  const NotificationMessage = useMemo(() => {
    const isReply = targetComment?.userId === myId;
    const isSubjectResponse = targetSubject?.userId === myId;
    const params = {
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
