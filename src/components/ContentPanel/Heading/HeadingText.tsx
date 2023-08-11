import React from 'react';
import { Color } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import { cardLevelHash } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { useTheme } from '~/helpers/hooks';

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
  } = useTheme(theme || profileTheme);
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
          />{' '}
        </>
      );
    case 'comment':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} />{' '}
          <ContentLink
            content={{ id, title: action }}
            contentType={contentType}
            style={{ color: contentLinkColor }}
            theme={theme}
          />
          {renderTargetAction()} {contentLabel}:{' '}
          <ContentLink
            content={isSubjectComment ? targetObj?.subject : rootObj}
            contentType={isSubjectComment ? 'subject' : rootType}
            theme={theme}
          />{' '}
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
          />
          {rootObj.id && (
            <>
              on {contentLabel}:{' '}
              <ContentLink
                content={rootObj}
                contentType={rootType}
                theme={theme}
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
                title: `${rootObj.isTask ? 'task' : 'mission'}: ${
                  rootObj.title
                }`,
                missionType: rootObj.missionType,
                rootMissionType: rootObj.rootMission?.missionType
              }}
              contentType="mission"
              style={{ color: Color.orange() }}
              theme={theme}
            />{' '}
          </>
        );
      } else {
        return (
          <>
            <UsernameText user={uploader} color={Color[linkColor]()} />{' '}
            completed an{' '}
            <ContentLink
              content={{
                title: 'achievement'
              }}
              contentType="achievement"
              style={{ color: Color.orange() }}
              theme={theme}
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
          />{' '}
        </>
      );
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
              id: replyId || commentId,
              title: replyId
                ? 'reply '
                : rootType === 'user'
                ? 'message '
                : 'comment '
            }}
            contentType="comment"
            style={{ color: contentLinkColor }}
            theme={theme}
          />
          {!replyId && rootType === 'user' ? 'to' : 'on'}
        </span>
      );
    }
    return null;
  }
}
