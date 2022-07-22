import React from 'react';
import { stringIsEmpty, truncateText } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';
import ContentLink from '~/components/ContentLink';

export default function renderEnglishMessage({
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
  targetSubject
}) {
  const displayedContent =
    targetObj.contentType === 'pass'
      ? targetObj.missionTitle
      : targetObj.content;

  const contentPreview = `${
    targetObj.contentType === 'url'
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
          <span>님이</span> 회원님이 올리신{' '}
          <ContentLink
            contentType={targetObj.contentType}
            content={{
              id: targetObj.id,
              title: contentPreview
            }}
          />
          에{' '}
          <span style={{ color: Color[infoColor](), fontWeight: 'bold' }}>
            좋아요
          </span>{' '}
          버튼을 눌렀습니다
        </>
      );
    case 'mention':
      return (
        <>
          <span>님이</span> 회원님을{' '}
          <span style={{ color: Color[mentionColor](), fontWeight: 'bold' }}>
            언급
          </span>
          했습니다:{' '}
          <ContentLink
            contentType={targetObj.contentType}
            content={{
              id: targetObj.id,
              title: contentPreview
            }}
          />
        </>
      );
    case 'recommendation':
      return (
        <>
          <span>님이</span> 회원님이 올리신{' '}
          <ContentLink
            contentType={targetObj.contentType}
            content={{
              id:
                targetObj.contentType === 'pass'
                  ? `${rootMissionType ? `${rootMissionType}/` : ''}${
                      targetObj.missionType
                    }`
                  : targetObj.id,
              title: contentPreview
            }}
          />
          {targetObj.contentType === 'url' ||
          targetObj.contentType === 'subject'
            ? '를'
            : '을'}{' '}
          <span
            style={{ color: Color[recommendationColor](), fontWeight: 'bold' }}
          >
            추천했습니다
          </span>
        </>
      );
    case 'reward': {
      if (rewardType === 'Twinkle') {
        return (
          <>
            <span>님이</span> 회원님께{' '}
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
              트윈클 {actionObj.amount}개를 선물했습니다
            </span>
            :{' '}
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
        return (
          <>
            <span>님이</span>{' '}
            <ContentLink
              style={{
                color:
                  rewardRootType === 'pass'
                    ? missionLinkColor
                    : contentLinkColor
              }}
              content={{
                id: rewardRootId,
                title: `이 ${
                  rewardRootType === 'pass'
                    ? isTask
                      ? localize('task')
                      : localize('mission')?.toLowerCase?.()
                    : localize(rewardRootType)
                }`,
                missionType: rewardRootMissionType
              }}
              contentType={
                rewardRootType === 'pass' ? 'mission' : rewardRootType
              }
            />
            에 대한 회원님의 추천을{' '}
            <b style={{ color: Color[rewardColor]() }}>승인했습니다</b>:{' '}
            <p style={{ fontWeight: 'bold', color: Color.brownOrange() }}>
              트윈클 코인 {actionObj.amount}개가 지급되었습니다
            </p>
          </>
        );
      }
    }
    case 'comment':
      return isNotification ? (
        <>
          <span>님이</span> 회원님이 올리신{' '}
          <ContentLink
            contentType="subject"
            content={{
              id: targetSubject.id,
              title: localize('subject')
            }}
          />
          {`의 비밀 메시지를 조회했습니다`}
        </>
      ) : (
        <>
          <span>님이</span> 회원님
          {targetObj.contentType === 'user' ? '의' : '이 올리신'}{' '}
          <ContentLink
            contentType={
              isReply
                ? localize('comment')
                : isSubjectResponse
                ? localize('subject')
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
                  ? localize('comment')
                  : isSubjectResponse
                  ? localize('subject')
                  : targetObj.contentType === 'user'
                  ? localize('profile')
                  : targetObj.contentType === 'url'
                  ? localize('link')
                  : localize(targetObj.contentType)
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
          에{' '}
          <ContentLink
            contentType="comment"
            content={{
              id: actionObj.id,
              title: isReply
                ? '답글'
                : targetObj.contentType === 'user'
                ? '메시지'
                : '댓글'
            }}
            style={{ color: contentLinkColor }}
          />
          {targetObj.contentType === 'user' ? '를' : '을'} 남겼습니다:{' '}
          {!stringIsEmpty(actionObj.content) && (
            <>
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
          <span>님이</span> 회원님이 올리신{' '}
          <ContentLink
            contentType={targetObj.contentType}
            content={{
              id: targetObj.id,
              title: `${
                targetObj.contentType === 'url'
                  ? localize('link')
                  : localize(targetObj.contentType)
              }(${truncateText({ text: targetObj.content, limit: 100 })})`
            }}
          />
          에{' '}
          <ContentLink
            contentType="subject"
            content={{
              id: actionObj.id,
              title: `주제(${truncateText({
                text: actionObj.content,
                limit: 100
              })})`
            }}
            style={{ color: contentLinkColor }}
          />
          <span>를 개설했습니다</span>
        </>
      );
    case 'pass':
      return (
        <>
          <b style={{ color: Color.brownOrange() }}>
            {localize('missionAccomplished')}
          </b>{' '}
          <ContentLink
            contentType="mission"
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
    case 'fail':
      return (
        <>
          <b style={{ color: Color.darkerGray() }}>
            {localize('missionFailed')}...
          </b>{' '}
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
