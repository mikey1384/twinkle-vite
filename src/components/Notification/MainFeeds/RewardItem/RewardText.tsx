import React, { useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import { Color } from '~/constants/css';
import { truncateText } from '~/helpers/stringHelpers';
import { resolveColorValue } from '~/theme/resolveColor';
import {
  getNotificationContentTypeLabel,
  getRecommendationTargetLabel,
  shouldShowNotificationContentDetail
} from '../../notificationLabels';

export default function RewardText({
  actionColor,
  contentId,
  contentType,
  infoColor,
  isTask,
  linkColor,
  missionColor,
  rewardColor,
  rewardType,
  rewardAmount,
  rewarderId,
  rewarderUsername,
  rootId,
  rootType,
  rootTargetType,
  rootMissionType,
  targetObj
}: {
  actionColor: string;
  contentId: number;
  contentType: string;
  infoColor: string;
  isTask: boolean;
  linkColor: string;
  missionColor: string;
  rewardColor: string;
  rewardType: string;
  rewardAmount: number;
  rewarderId: number;
  rewarderUsername: string;
  rootId: number;
  rootType: string;
  rootTargetType: string;
  rootMissionType: string;
  targetObj: any;
}) {
  const missionLinkColor =
    resolveColorValue(missionColor) || Color.logoBlue();
  const contentLinkColor =
    resolveColorValue(actionColor) || Color.logoBlue();
  const linkColorValue =
    resolveColorValue(linkColor) || Color.logoBlue();
  const infoColorValue =
    resolveColorValue(infoColor) || Color.logoBlue();
  const rewardColorValue =
    resolveColorValue(rewardColor) || Color.pink();
  const recommendationTargetLabel = useMemo(() => {
    const target = getRecommendationTargetLabel({
      rootTargetType,
      rootType,
      isTask
    });
    return `${
      rootType === 'pass' || rootType === 'xpChange'
        ? `${targetObj?.user?.username}'s`
        : 'this'
    } ${target}`;
  }, [isTask, rootTargetType, rootType, targetObj?.user?.username]);
  const rewardContentLabel = getRewardContentLabel();

  if (rewardType === 'Twinkle') {
    return (
      <div>
        <UsernameText
          user={{ id: rewarderId, username: rewarderUsername }}
          color={linkColorValue}
        />{' '}
        <span
          style={{
            color:
              rewardAmount >= 10
                ? Color.gold()
                : rewardAmount >= 5
                ? Color.rose()
                : rewardAmount >= 3
                ? Color.pink()
                : infoColorValue,
            fontWeight: 'bold'
          }}
        >
          rewarded you {rewardAmount === 1 ? 'a' : rewardAmount} {rewardType}
          {rewardAmount > 1 ? 's' : ''}
        </span>{' '}
        for your{' '}
        <ContentLink
          style={{ color: contentLinkColor }}
          content={{
            id: contentId
          }}
          contentType={contentType}
          label={rewardContentLabel}
        />
      </div>
    );
  }
  return (
    <div>
      <UsernameText
        user={{ id: rewarderId, username: rewarderUsername }}
        color={linkColorValue}
      />{' '}
      <b style={{ color: rewardColorValue }}>also recommended</b>{' '}
      {rootType === 'xpChange' ? (
        <b
          style={{
            color: missionLinkColor
          }}
        >{`${targetObj?.user?.username}${`'s`} Daily Tasks bonus`}</b>
      ) : (
        <ContentLink
          style={{
            color: rootType === 'pass' ? missionLinkColor : contentLinkColor
          }}
          content={{
            id: rootId,
            missionType: rootMissionType
          }}
          contentType={rootType === 'pass' ? rootTargetType : rootType}
          rootType={rootTargetType}
          label={recommendationTargetLabel}
        />
      )}{' '}
      <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
        You earn {rewardAmount} Twinkle Coin
        {rewardAmount > 1 ? 's' : ''}!
      </p>
    </div>
  );

  function getRewardContentLabel() {
    const label = getNotificationContentTypeLabel({
      contentType,
      isTask
    });
    if (
      !targetObj ||
      targetObj.notFound ||
      !shouldShowNotificationContentDetail(contentType) ||
      (contentType === 'comment' && targetObj?.filePath)
    ) {
      return label;
    }
    if (contentType === 'comment') {
      return `${label} (${truncateText({
        text: targetObj.content,
        limit: 100
      })})`;
    }
    return `${label} (${truncateText({
      text: targetObj.title,
      limit: 100
    })})`;
  }
}
