import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import { cardLevelHash, wordLevelHash } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { returnTheme } from '~/helpers';

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
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor },
    userLink: { color: userLinkColor },
    content: { color: contentColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
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
  const contentLinkColor = Color[contentColor]();
  switch (contentType) {
    case 'video':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> uploaded a
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
          <UsernameText user={uploader} color={Color[linkColor]()} />{' '}
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
          <UsernameText user={uploader} color={Color[linkColor]()} /> shared a
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
          <UsernameText user={uploader} color={Color[linkColor]()} /> started a{' '}
          <ContentLink
            content={{ id, title: 'subject ' }}
            contentType={contentType}
            theme={theme}
            style={{
              color: byUser ? Color[userLinkColor]() : contentLinkColor
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
            <UsernameText user={uploader} color={Color[linkColor]()} />{' '}
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
            <UsernameText user={uploader} color={Color[linkColor]()} /> unlocked
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
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> cleared a{' '}
          <b
            style={{
              color: Color?.[cardLevelHash?.[contentObj?.difficulty]?.color]?.()
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
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> completed
          all 3 daily goals and correctly answered an{' '}
          <span
            style={{
              fontWeight: 'bold',
              color: Color[cardLevelHash[contentObj?.level]?.color]()
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
            color={Color[linkColor]()}
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
