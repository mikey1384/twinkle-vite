import React from 'react';
import { stringIsEmpty, truncateText } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { Link } from 'react-router-dom';
import ContentLink from '~/components/ContentLink';

export default function RenderMessage({
  actionObj,
  actionColor,
  infoColor,
  isNotification,
  isTask,
  linkColor,
  mentionColor,
  missionColor,
  myId,
  recommendationColor,
  rewardRootId,
  rewardType,
  rewardColor,
  rewardRootMissionType,
  rewardRootTargetType,
  rewardRootType,
  rootMissionType,
  targetComment,
  targetObj,
  targetSubject
}: {
  actionObj: {
    amount: number;
    content: string;
    contentType: string;
    id: number;
    userId: number;
  };
  actionColor: string;
  infoColor: string;
  isNotification: boolean;
  isTask: boolean;
  linkColor: string;
  mentionColor: string;
  missionColor: string;
  myId: number;
  recommendationColor: string;
  rewardRootId: number;
  rewardType: string;
  rewardColor: string;
  rewardRootMissionType: string;
  rewardRootType: string;
  rootMissionType: string;
  rewardRootTargetType: string;
  targetComment: {
    content: string;
    id: number;
    userId: number;
  };
  targetObj: {
    content: string;
    contentType: string;
    id: number;
    achievementTitle: string;
    missionTitle: string;
    missionType: string;
    passType: string;
    userId: number;
  };
  targetSubject: {
    content: string;
    id: number;
    userId: number;
  };
}) {
  const isReply = targetComment?.userId === myId;
  const isSubjectResponse = targetSubject?.userId === myId;
  let displayedContent = '';
  if (targetObj.contentType === 'pass') {
    if (targetObj.passType === 'mission') {
      displayedContent = targetObj.missionTitle;
    }
    if (targetObj.passType === 'achievement') {
      displayedContent = targetObj.achievementTitle;
    }
  } else {
    displayedContent = targetObj.content;
  }
  const contentPreview = `${
    targetObj.contentType === 'aiStory'
      ? 'AI Story'
      : targetObj.contentType === 'url'
      ? 'link'
      : targetObj.contentType === 'pass'
      ? 'achievement'
      : targetObj.contentType
  } ${
    !stringIsEmpty(displayedContent)
      ? `(${truncateText({
          text: displayedContent,
          limit: 100
        })})`
      : ''
  }`;
  const contentString = isReply
    ? targetComment.content
    : isSubjectResponse
    ? targetSubject.content
    : targetObj.content;

  const contentLinkColor = Color[actionColor]();
  const missionLinkColor = Color[missionColor]();

  switch (actionObj.contentType) {
    case 'like':
      return (
        <>
          <span style={{ color: Color[infoColor](), fontWeight: 'bold' }}>
            likes
          </span>{' '}
          <span>your</span>{' '}
          <ContentLink
            contentType={targetObj.contentType}
            content={{
              id: targetObj.id,
              title: contentPreview
            }}
          />
        </>
      );
    case 'mention':
      return (
        <>
          <span style={{ color: Color[mentionColor](), fontWeight: 'bold' }}>
            mentioned you
          </span>{' '}
          in{' '}
          {targetObj.contentType === 'user' ? (
            <>
              their{' '}
              <Link
                style={{ color: contentLinkColor, fontWeight: 'bold' }}
                to={`/users/${targetObj.content}`}
              >
                profile
              </Link>
            </>
          ) : (
            <>
              a{' '}
              <ContentLink
                contentType={targetObj.contentType}
                content={{
                  id: targetObj.id,
                  title: contentPreview
                }}
                style={{ color: contentLinkColor }}
              />
            </>
          )}
        </>
      );
    case 'recommendation': {
      let contentPath;
      if (targetObj.contentType === 'pass') {
        if (targetObj.passType === 'mission') {
          contentPath = `${rootMissionType ? `${rootMissionType}/` : ''}${
            targetObj.missionType
          }`;
        } else {
          contentPath = '';
        }
      } else {
        contentPath = targetObj.id;
      }
      return (
        <>
          <span
            style={{ color: Color[recommendationColor](), fontWeight: 'bold' }}
          >
            recommended
          </span>{' '}
          <span>your</span>{' '}
          <ContentLink
            contentType={targetObj.contentType}
            rootType={targetObj.passType}
            content={{
              id: contentPath,
              title: contentPreview
            }}
          />
        </>
      );
    }
    case 'reward': {
      if (rewardType === 'Twinkle') {
        return (
          <>
            <span
              style={{
                color:
                  actionObj.amount >= 10
                    ? Color.rose()
                    : actionObj.amount >= 5
                    ? Color.orange()
                    : actionObj.amount >= 3
                    ? Color.pink()
                    : Color[infoColor](),
                fontWeight: 'bold'
              }}
            >
              rewarded you {actionObj.amount === 1 ? 'a' : actionObj.amount}{' '}
              Twinkle
              {actionObj.amount > 1 ? 's' : ''}
            </span>{' '}
            for your{' '}
            <ContentLink
              contentType={targetObj.contentType}
              content={{
                id: targetObj.id,
                title: contentPreview
              }}
            />
          </>
        );
      } else {
        let rewardRootLabel = '';
        if (rewardRootType === 'pass') {
          if (rewardRootTargetType === 'achievement') {
            rewardRootLabel = 'achievement';
          } else {
            if (isTask) {
              rewardRootLabel = 'task';
            } else {
              rewardRootLabel = 'mission';
            }
          }
        } else if (rewardRootType === 'aiStory') {
          rewardRootLabel = 'AI Story';
        } else {
          rewardRootLabel = rewardRootType;
        }

        return (
          <>
            <b style={{ color: Color[rewardColor]() }}>also recommended</b>{' '}
            <ContentLink
              style={{
                color:
                  rewardRootType === 'pass'
                    ? missionLinkColor
                    : contentLinkColor
              }}
              content={{
                id: rewardRootId,
                title: `this ${rewardRootLabel}`,
                missionType: rewardRootMissionType
              }}
              contentType={
                rewardRootType === 'pass'
                  ? rewardRootTargetType
                  : rewardRootType
              }
              rootType={rewardRootTargetType}
            />{' '}
            <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
              You earn {actionObj.amount} Twinkle Coin
              {actionObj.amount > 1 ? 's' : ''}!
            </p>
          </>
        );
      }
    }
    case 'comment':
      return isNotification ? (
        <>
          viewed your{' '}
          <ContentLink
            contentType="subject"
            content={{
              id: targetSubject.id,
              title: `subject`
            }}
          />
          {`'s secret message`}
        </>
      ) : (
        <>
          <ContentLink
            contentType="comment"
            content={{
              id: actionObj.id,
              title: isReply
                ? 'replied to'
                : targetObj.contentType === 'user'
                ? 'left a message on'
                : 'commented on'
            }}
            style={{ color: contentLinkColor }}
          />{' '}
          your{' '}
          <ContentLink
            contentType={
              isReply
                ? 'comment'
                : isSubjectResponse
                ? 'subject'
                : targetObj.contentType
            }
            content={{
              id: isReply
                ? targetComment.id
                : isSubjectResponse
                ? targetSubject.id
                : targetObj.id,
              username: targetObj.content,
              title: `${
                isReply
                  ? 'comment'
                  : isSubjectResponse
                  ? 'subject'
                  : targetObj.contentType === 'aiStory'
                  ? 'AI Story'
                  : targetObj.contentType === 'user'
                  ? 'profile'
                  : targetObj.contentType === 'url'
                  ? 'link'
                  : targetObj.contentType
              }${
                (!isReply && targetObj.contentType === 'user') ||
                stringIsEmpty(contentString)
                  ? ''
                  : ` (${truncateText({
                      text: contentString,
                      limit: 100
                    })})`
              }`
            }}
          />
          {!stringIsEmpty(actionObj.content) && (
            <>
              :{' '}
              <ContentLink
                contentType="comment"
                content={{
                  id: actionObj.id,
                  title: `"${truncateText({
                    text: actionObj.content,
                    limit: 100
                  })}"`
                }}
                style={{ color: contentLinkColor }}
              />
            </>
          )}
        </>
      );
    case 'subject':
      return (
        <>
          <span>added a </span>
          <ContentLink
            contentType="subject"
            content={{
              id: actionObj.id,
              title: `subject (${truncateText({
                text: actionObj.content,
                limit: 100
              })})`
            }}
            style={{ color: contentLinkColor }}
          />{' '}
          <span>to your </span>
          <ContentLink
            contentType={targetObj.contentType}
            content={{
              id: targetObj.id,
              title: `${
                targetObj.contentType === 'url' ? 'link' : targetObj.contentType
              } (${truncateText({ text: targetObj.content, limit: 100 })})`
            }}
          />
        </>
      );
    case 'pass': {
      const message =
        targetObj.contentType === 'mission'
          ? 'Mission accomplished!'
          : 'Achievement unlocked!';
      return (
        <>
          <b style={{ color: Color.brownOrange() }}>{message}</b>{' '}
          <ContentLink
            contentType={targetObj.contentType}
            rootType={targetObj.contentType}
            content={{
              id: targetObj.id,
              missionType: rootMissionType || targetObj.missionType,
              title: `(${truncateText({
                text: targetObj.content,
                limit: 100
              })})`
            }}
            style={{ color: Color[linkColor]() }}
          />
        </>
      );
    }
    case 'fail':
      return (
        <>
          <b style={{ color: Color.darkerGray() }}>Mission failed...</b>{' '}
          <ContentLink
            contentType="mission"
            content={{
              id: targetObj.id,
              missionType: targetObj.missionType,
              title: `(${truncateText({
                text: targetObj.content,
                limit: 100
              })})`
            }}
            style={{ color: Color[linkColor]() }}
          />
        </>
      );
    default:
      return <span>There was an error - report to Mikey!</span>;
  }
}
