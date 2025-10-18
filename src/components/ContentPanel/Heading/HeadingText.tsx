import React from 'react';
import { Color } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import { cardLevelHash, wordLevelHash } from '~/constants/defaultValues';
import { useRoleColor } from '~/theme/useRoleColor';
import { resolveColorValue } from '~/theme/resolveColor';

export default function HeadingText({
  action,
  contentObj,
  rootObj,
  theme
}: {
  action: string;
  contentObj: any;
  rootObj: any;
  theme?: string;
}) {
  const {
    id,
    byUser,
    commentId,
    targetObj = {},
    replyId,
    rootType,
    contentType,
    uploader
  } = contentObj;
  const {
    color: linkColor,
    colorKey: linkColorKey,
    themeName
  } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const { color: userLinkColor } = useRoleColor('userLink', {
    themeName,
    fallback: linkColorKey || 'logoBlue'
  });
  const { color: contentLinkColor } = useRoleColor('content', {
    themeName,
    fallback: 'logoBlue'
  });
  let contentLabel =
    rootType === 'aiStory'
      ? 'AI Story'
      : rootType === 'url'
      ? 'link'
      : rootType === 'subject'
      ? 'subject'
      : rootType;
  const isSubjectComment =
    contentType === 'comment' &&
    targetObj?.subject &&
    !targetObj?.subject?.notFound;
  if (isSubjectComment) {
    contentLabel = 'subject';
  }
  switch (contentType) {
    case 'video':
      return (
        <>
          <UsernameText user={uploader} color={linkColor} /> uploaded a
          video:{' '}
          <ContentLink
            content={contentObj}
            contentType={contentType}
            theme={theme}
            label=""
          />{' '}
        </>
      );
    case 'comment':
      return (
        <>
          <UsernameText user={uploader} color={linkColor} />{' '}
          <ContentLink
            content={{ id }}
            contentType={contentType}
            style={{ color: contentLinkColor }}
            theme={theme}
            label={action}
          />
          {renderTargetAction()}{' '}
          {rootType !== 'user' ? (
            <>
              {contentLabel}:{' '}
            <ContentLink
              content={isSubjectComment ? targetObj?.subject : rootObj}
              contentType={isSubjectComment ? 'subject' : rootType}
              theme={theme}
              label=""
            />{' '}
            </>
          ) : null}
        </>
      );
    case 'url':
      return (
        <>
          <UsernameText user={uploader} color={linkColor} /> shared a
          link:&nbsp;
          <ContentLink
            content={contentObj}
            contentType={contentType}
            theme={theme}
            label=""
          />{' '}
        </>
      );
    case 'subject':
      return (
        <>
          <UsernameText user={uploader} color={linkColor} /> started a{' '}
          <ContentLink
            content={{ id, title: 'subject ' }}
            contentType={contentType}
            theme={theme}
            style={{
              color: byUser ? userLinkColor : contentLinkColor
            }}
            label=""
          />
          {rootObj.id && (
            <>
              on {contentLabel}:{' '}
              <ContentLink
                content={rootObj}
                contentType={rootType}
                theme={theme}
                label=""
              />{' '}
            </>
          )}
        </>
      );
    case 'pass': {
      if (contentObj.rootType === 'mission') {
        return (
          <>
            <UsernameText user={uploader} color={linkColor} />{' '}
            completed a{' '}
            <ContentLink
              content={{
                id: rootObj.id,
                missionType: rootObj.missionType,
                rootMissionType: rootObj.rootMission?.missionType
              }}
              contentType="mission"
              style={{ color: Color.orange() }}
              theme={theme}
              label={`${rootObj.isTask ? 'task' : 'mission'}: ${rootObj.title}`}
            />{' '}
          </>
        );
      } else {
        return (
          <>
            <UsernameText user={uploader} color={linkColor} /> unlocked
            an{' '}
            <ContentLink
              content={{
                title: 'achievement'
              }}
              contentType="achievement"
              style={{ color: Color.orange() }}
              theme={theme}
              label=""
            />{' '}
          </>
        );
      }
    }
    case 'aiStory':
      const aiStoryColor =
        resolveColorValue(cardLevelHash?.[contentObj?.difficulty]?.color) ||
        Color.logoBlue();
      return (
        <>
          <UsernameText user={uploader} color={linkColor} /> cleared a{' '}
          <b
            style={{
              color: aiStoryColor
            }}
          >
            Level {contentObj.difficulty} AI Story
          </b>
          :{' '}
          <ContentLink
            content={contentObj}
            contentType={contentType}
            theme={theme}
            label=""
          />{' '}
        </>
      );
    case 'xpChange': {
      const vocabColor =
        resolveColorValue(cardLevelHash?.[contentObj?.level]?.color) ||
        Color.logoBlue();
      return (
        <>
          <UsernameText user={uploader} color={linkColor} /> completed
          all 3 daily goals and correctly answered an{' '}
          <span
            style={{
              fontWeight: 'bold',
              color: vocabColor
            }}
          >
            {wordLevelHash[contentObj?.level]?.label} vocabulary question
          </span>{' '}
        </>
      );
    }
    default:
      return <span>Error</span>;
  }

  function renderTargetAction() {
    if (targetObj?.comment && !targetObj?.comment.notFound) {
      return (
        <span>
          {' '}
          <UsernameText
            user={targetObj.comment.uploader}
            color={linkColor}
          />
          {"'s "}
          <ContentLink
            content={{
              id: replyId || commentId
            }}
            contentType="comment"
            style={{ color: contentLinkColor }}
            theme={theme}
            label={
              replyId
                ? 'reply '
                : rootType === 'user'
                ? 'profile message '
                : 'comment '
            }
          />
          {rootType === 'user' ? '' : 'on'}
        </span>
      );
    }
    return null;
  }
}
