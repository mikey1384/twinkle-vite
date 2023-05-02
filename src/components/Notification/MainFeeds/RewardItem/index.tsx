import React, { useMemo } from 'react';
import renderEnglishText from './localization/english';
import renderKoreanText from './localization/korean';
import { timeSince } from '~/helpers/timeStampHelpers';
import { notiFeedListItem } from '../../Styles';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export default function RewardItem({
  actionColor,
  infoColor,
  linkColor,
  rewardColor,
  missionColor,
  reward: {
    id,
    isTask,
    contentId,
    contentType,
    rootId,
    rootType,
    rootMissionType,
    rewardAmount,
    rewardType,
    rewarderId,
    rewarderUsername,
    targetObj,
    timeStamp
  }
}: {
  actionColor: string;
  contentId?: number;
  contentType?: string;
  infoColor: string;
  isTask?: boolean;
  linkColor: string;
  reward: any;
  rewardColor: string;
  missionColor: string;
}) {
  const NotiText = useMemo(() => {
    const params = {
      actionColor,
      contentId,
      contentType,
      infoColor,
      isTask,
      linkColor,
      missionColor,
      rewardColor,
      rewardAmount,
      rewardType,
      rewarderId,
      rewarderUsername,
      rootId,
      rootMissionType,
      rootType,
      targetObj
    };
    return SELECTED_LANGUAGE === 'kr'
      ? renderKoreanText(params)
      : renderEnglishText(params);
  }, [
    actionColor,
    contentId,
    contentType,
    infoColor,
    isTask,
    linkColor,
    missionColor,
    rewardAmount,
    rewardColor,
    rewardType,
    rewarderId,
    rewarderUsername,
    rootId,
    rootMissionType,
    rootType,
    targetObj
  ]);

  return (
    <nav style={{ background: '#fff' }} className={notiFeedListItem} key={id}>
      {NotiText}
      <small>{timeSince(timeStamp)}</small>
    </nav>
  );
}
