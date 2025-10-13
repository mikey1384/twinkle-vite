import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import { cardLevelHash, wordLevelHash } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { getThemeRoles, ThemeName } from '~/theme/themes';

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
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((theme || profileTheme || 'logoBlue') as ThemeName),
    [profileTheme, theme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const linkColorKey = useMemo(
    () => themeRoles.link?.color || 'logoBlue',
    [themeRoles]
  );
  const userLinkColorKey = useMemo(
    () => themeRoles.userLink?.color || linkColorKey,
    [themeRoles, linkColorKey]
  );
  const contentColorKey = useMemo(
    () => themeRoles.content?.color || 'logoBlue',
    [themeRoles]
  );
  const linkColor = useMemo(() => {
    const fn = Color[linkColorKey as keyof typeof Color];
    return fn ? fn() : linkColorKey;
  }, [linkColorKey]);
  const userLinkColor = useMemo(() => {
    const fn = Color[userLinkColorKey as keyof typeof Color];
    return fn ? fn() : userLinkColorKey;
  }, [userLinkColorKey]);
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
  const contentLinkColor = useMemo(() => {
    const fn = Color[contentColorKey as keyof typeof Color];
    return fn ? fn() : contentColorKey;
  }, [contentColorKey]);
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
      return (
        <>
          <UsernameText user={uploader} color={linkColor} /> cleared a{' '}
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
          <UsernameText user={uploader} color={linkColor} /> completed
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
