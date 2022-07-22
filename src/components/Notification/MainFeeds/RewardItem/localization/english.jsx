import React from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import { Color } from '~/constants/css';
import { truncateText } from '~/helpers/stringHelpers';

export default function renderEnglishText({
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
  rootMissionType,
  targetObj
}) {
  const missionLinkColor = Color[missionColor]();
  const contentLinkColor = Color[actionColor]();

  if (rewardType === 'Twinkle') {
    return (
      <div>
        <UsernameText
          user={{ id: rewarderId, username: rewarderUsername }}
          color={Color[linkColor]()}
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
                : Color[infoColor](),
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
            id: contentId,
            title: `${contentType}${
              !targetObj ||
              targetObj.notFound ||
              (contentType === 'comment' && targetObj?.filePath)
                ? ''
                : contentType === 'comment'
                ? ` (${truncateText({
                    text: targetObj.content,
                    limit: 100
                  })})`
                : ` (${truncateText({
                    text: targetObj.title,
                    limit: 100
                  })})`
            }`
          }}
          contentType={contentType}
        />
      </div>
    );
  }
  return (
    <div>
      <UsernameText
        user={{ id: rewarderId, username: rewarderUsername }}
        color={Color[linkColor]()}
      />{' '}
      <b style={{ color: Color[rewardColor]() }}>also recommended</b>{' '}
      <ContentLink
        style={{
          color: rootType === 'pass' ? missionLinkColor : contentLinkColor
        }}
        content={{
          id: rootId,
          title: `this ${
            rootType === 'pass' ? (isTask ? 'task' : 'mission') : rootType
          }`,
          missionType: rootMissionType
        }}
        contentType={rootType === 'pass' ? 'mission' : rootType}
      />{' '}
      <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
        You earn {rewardAmount} Twinkle Coin
        {rewardAmount > 1 ? 's' : ''}!
      </p>
    </div>
  );
}
