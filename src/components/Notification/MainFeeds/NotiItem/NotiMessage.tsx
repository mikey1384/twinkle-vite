import React, { useMemo, memo } from 'react';
import { stringIsEmpty, truncateText } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { Link } from 'react-router-dom';
import { User } from '~/types';
import ContentLink from '~/components/ContentLink';

function NotiMessage({
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
    user: User;
  };
  targetSubject: {
    content: string;
    id: number;
    userId: number;
  };
}) {
  const isReply = useMemo(
    () => targetComment?.userId === myId,
    [myId, targetComment?.userId]
  );
  const isSubjectResponse = useMemo(
    () => targetSubject?.userId === myId,
    [myId, targetSubject?.userId]
  );
  const displayedContent = useMemo(() => {
    let result = '';
    if (targetObj.contentType === 'pass') {
      if (targetObj.passType === 'mission') {
        result = targetObj.missionTitle;
      }
      if (targetObj.passType === 'achievement') {
        result = targetObj.achievementTitle;
      }
    } else {
      result = targetObj.content;
    }
    return result;
  }, [
    targetObj.achievementTitle,
    targetObj.content,
    targetObj.contentType,
    targetObj.missionTitle,
    targetObj.passType
  ]);
  const contentPreview = useMemo(() => {
    return `${
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
  }, [displayedContent, targetObj.contentType]);
  const contentString = useMemo(() => {
    return isReply
      ? targetComment.content
      : isSubjectResponse
      ? targetSubject.content
      : targetObj.content;
  }, [
    isReply,
    isSubjectResponse,
    targetComment.content,
    targetObj.content,
    targetSubject.content
  ]);

  const contentLinkColor = useMemo(() => Color[actionColor](), [actionColor]);
  const targetLinkColor = useMemo(() => Color[linkColor](), [linkColor]);
  const missionLinkColor = useMemo(() => Color[missionColor](), [missionColor]);
  const twinkleColor = useMemo(
    () =>
      actionObj.amount >= 10
        ? Color.rose()
        : actionObj.amount >= 5
        ? Color.orange()
        : actionObj.amount >= 3
        ? Color.pink()
        : Color[infoColor](),
    [actionObj.amount, infoColor]
  );
  const contentIsEmpty = useMemo(
    () => stringIsEmpty(actionObj.content),
    [actionObj.content]
  );
  const truncatedActionText = useMemo(
    () =>
      truncateText({
        text: actionObj.content,
        limit: 100
      }),
    [actionObj.content]
  );
  const truncatedContentText = useMemo(
    () =>
      truncateText({
        text: contentString,
        limit: 100
      }),
    [contentString]
  );
  const truncatedTargetObjectText = useMemo(
    () => truncateText({ text: targetObj.content, limit: 100 }),
    [targetObj.content]
  );
  const truncatedTargetSubjectText = useMemo(
    () =>
      targetSubject?.content
        ? truncateText({ text: targetSubject.content, limit: 100 })
        : '',
    [targetSubject?.content]
  );
  const repliedInThread = useMemo(
    () => Boolean(targetComment?.id) && !isReply && !isSubjectResponse,
    [isReply, isSubjectResponse, targetComment?.id]
  );

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
            label=""
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
                label=""
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
          {targetObj.contentType === 'xpChange' ? (
            <b
              style={{
                color: missionLinkColor
              }}
            >
              daily bonus achievement
            </b>
          ) : (
            <ContentLink
              contentType={targetObj.contentType}
              rootType={targetObj.passType}
              content={{
                id: contentPath,
                title: contentPreview
              }}
              label=""
            />
          )}
        </>
      );
    }
    case 'reward': {
      if (rewardType === 'Twinkle') {
        return (
          <>
            <span
              style={{
                color: twinkleColor,
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
              label=""
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
              rewardRootLabel = 'task accomplishment';
            } else {
              rewardRootLabel = 'mission accomplishment';
            }
          }
        } else if (rewardRootType === 'aiStory') {
          rewardRootLabel = 'AI Story';
        } else if (rewardRootType === 'xpChange') {
          rewardRootLabel = 'daily bonus achievement';
        } else {
          rewardRootLabel = rewardRootType;
        }

        return (
          <>
            <b style={{ color: Color[rewardColor]() }}>also recommended</b>{' '}
            {rewardRootType === 'xpChange' ? (
              <b
                style={{ color: missionLinkColor }}
              >{`${targetObj?.user?.username}'s daily bonus achievement`}</b>
            ) : (
              <ContentLink
                style={{
                  color:
                    rewardRootType === 'pass'
                      ? missionLinkColor
                      : contentLinkColor
                }}
                content={{
                  id: rewardRootId,
                  title: `${
                    rewardRootType === 'pass'
                      ? `${targetObj?.user?.username}'s`
                      : 'this'
                  } ${rewardRootLabel}`,
                  missionType: rewardRootMissionType
                }}
                contentType={
                  rewardRootType === 'pass'
                    ? rewardRootTargetType
                    : rewardRootType
                }
                rootType={rewardRootTargetType}
                label=""
              />
            )}{' '}
            <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
              You earn {actionObj.amount} Twinkle Coin
              {actionObj.amount > 1 ? 's' : ''}!
            </p>
          </>
        );
      }
    }
    case 'comment':
      if (repliedInThread) {
        const threadContentType = targetSubject?.id
          ? 'subject'
          : targetObj.contentType;
        const threadLabelBase = threadContentType === 'aiStory'
          ? 'AI Story'
          : threadContentType === 'user'
          ? 'profile'
          : threadContentType === 'url'
          ? 'link'
          : threadContentType;
        const threadLabelSuffix = threadContentType === 'subject'
          ? stringIsEmpty(targetSubject?.content)
            ? ''
            : ` (${truncatedTargetSubjectText})`
          : stringIsEmpty(targetObj.content)
          ? ''
          : ` (${truncatedTargetObjectText})`;
        const threadLabel = `${threadLabelBase}${threadLabelSuffix}`;
        const threadContent = threadContentType === 'subject'
          ? {
              id: targetSubject?.id,
              title: targetSubject?.content
            }
          : threadContentType === 'user'
          ? {
              id: targetObj.id,
              username: targetObj.content
            }
          : {
              id: targetObj.id,
              title: targetObj.content,
              missionType: targetObj.missionType,
              rootMissionType: targetObj.rootMissionType
            };
        return (
          <>
            replied to a comment in your thread on{' '}
            <ContentLink
              contentType={threadContentType}
              content={threadContent}
              style={{
                color: targetLinkColor,
                fontWeight: 'bold'
              }}
              label={threadLabel}
            />
            {!contentIsEmpty && (
              <>
                :{' '}
                <ContentLink
                  contentType="comment"
                  content={{
                    id: actionObj.id,
                    title: `"${truncatedActionText}"`
                  }}
                  style={{
                    color: contentLinkColor,
                    fontWeight: 'bold'
                  }}
                  label=""
                />
              </>
            )}
          </>
        );
      }
      return isNotification ? (
        <>
          viewed your{' '}
          <ContentLink
            contentType="subject"
            content={{
              id: targetSubject.id,
              title: `subject`
            }}
            label=""
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
            label=""
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
              username: targetObj.content
            }}
            label={`${
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
                : ` (${truncatedContentText})`
            }`}
          />
          {!contentIsEmpty && (
            <>
              :{' '}
              <ContentLink
                contentType="comment"
                content={{
                  id: actionObj.id,
                  title: `"${truncatedActionText}"`
                }}
                style={{ color: contentLinkColor }}
                label=""
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
              title: `subject (${truncatedActionText})`
            }}
            style={{ color: contentLinkColor }}
            label=""
          />{' '}
          <span>to your </span>
          <ContentLink
            contentType={targetObj.contentType}
            content={{
              id: targetObj.id,
              title: `${
                targetObj.contentType === 'url' ? 'link' : targetObj.contentType
              } (${truncatedTargetObjectText})`
            }}
            label=""
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
              title: `(${truncatedTargetObjectText})`
            }}
            style={{ color: Color[linkColor]() }}
            label=""
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
              title: `(${truncatedTargetObjectText})`
            }}
            style={{ color: Color[linkColor]() }}
            label=""
          />
        </>
      );
    default:
      return <span>There was an error - report to Mikey!</span>;
  }
}

export default memo(NotiMessage);
