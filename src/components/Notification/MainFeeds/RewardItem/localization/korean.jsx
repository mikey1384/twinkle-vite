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
        />
        <span>님이</span> 회원님께{' '}
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
          트윈클 {rewardAmount}개를 선물했습니다
        </span>
        :{' '}
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
      />
      <span>님이</span>{' '}
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
      에 대한 회원님의 추천을{' '}
      <b style={{ color: Color[rewardColor]() }}>승인했습니다</b>:{' '}
      <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
        트윈클 코인 {rewardAmount}개가 지급되었습니다
      </p>
    </div>
  );
}
