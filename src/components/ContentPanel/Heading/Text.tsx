import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';
import { ForkHistoryTrigger } from '~/components/Modals/BuildForkHistoryModal';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import { cardLevelHash, wordLevelHash } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { returnTheme } from '~/helpers';
import {
  type BuildRelationshipLabel,
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/helpers/buildRelationshipHelpers';

const DAILY_GOAL_COMPLETION_LABEL = 'daily goal completion';
const SHARED_SYSTEM_PROMPT_LABEL = 'shared system prompt';

export default function HeadingText({
  action,
  compactFeed,
  contentObj,
  feedActivityType,
  feedUploader,
  rootObj,
  theme
}: {
  action: string;
  compactFeed?: boolean;
  contentObj: any;
  feedActivityType?: string | null;
  feedUploader?: any;
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
  const {
    link: { color: linkColor },
    userLink: { color: userLinkColor },
    content: { color: contentColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const isPassType =
    rootType === 'pass' ||
    rootType === 'missionPass' ||
    rootType === 'achievementPass';
  const isAchievementPass =
    rootType === 'achievementPass' || rootObj?.rootType === 'achievement';
  let contentLabel =
    rootType === 'aiStory'
      ? 'AI Story'
      : rootType === 'url'
        ? 'link'
        : rootType === 'subject'
          ? 'subject'
          : rootType === 'build'
            ? 'app'
            : isPassType
              ? isAchievementPass
                ? 'achievement unlock'
                : 'mission accomplishment'
              : rootType === 'xpChange'
                ? DAILY_GOAL_COMPLETION_LABEL
                : rootType === 'sharedTopic'
                  ? SHARED_SYSTEM_PROMPT_LABEL
                  : rootType === 'dailyReflection'
                    ? 'daily reflection'
                    : rootType;
  const isSubjectComment =
    contentType === 'comment' &&
    targetObj?.subject &&
    !targetObj?.subject?.notFound;
  if (isSubjectComment) {
    contentLabel = 'subject';
  }
  const contentLinkColor = Color[contentColor]();
  if (compactFeed) {
    return renderCompactFeedHeading();
  }
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
              {(isPassType || rootType === 'xpChange') && rootObj?.uploader ? (
                <>
                  <UsernameText
                    user={rootObj.uploader}
                    color={Color[linkColor]()}
                  />
                  {"'s "}
                </>
              ) : null}
              {rootType === 'dailyReflection' ? (
                <>
                  a{' '}
                  <ContentLink
                    content={rootObj}
                    contentType={rootType}
                    theme={theme}
                    label="daily reflection"
                  />
                </>
              ) : (
                <>
                  {contentLabel}:{' '}
                  <ContentLink
                    content={isSubjectComment ? targetObj?.subject : rootObj}
                    contentType={isSubjectComment ? 'subject' : rootType}
                    rootType={isPassType ? rootObj?.rootType : undefined}
                    theme={theme}
                    label=""
                  />{' '}
                </>
              )}
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
            completed a {rootObj.isTask ? 'task' : 'mission'}:{' '}
            <ContentLink
              content={{
                id: rootObj.id,
                missionType: rootObj.missionType,
                rootMissionType: rootObj.rootMission?.missionType
              }}
              contentType="mission"
              style={{ color: Color.orange() }}
              theme={theme}
              label={rootObj.title}
            />{' '}
          </>
        );
      } else {
        return (
          <>
            <UsernameText user={uploader} color={Color[linkColor]()} /> unlocked
            an{' '}
            <ContentLink
              content={{ id }}
              contentType="pass"
              rootType="achievement"
              style={{ color: Color.orange() }}
              theme={theme}
              label="achievement"
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
    case 'build':
      if (
        feedActivityType === 'buildFork' ||
        feedActivityType === 'buildContributor' ||
        feedActivityType === 'buildCollaborator' ||
        feedActivityType === 'buildUpdate'
      ) {
        const buildActor = feedUploader || uploader;
        const buildAction = getBuildActivityText(feedActivityType);
        return (
          <>
            <UsernameText user={buildActor} color={Color[linkColor]()} />{' '}
            {buildAction}:{' '}
            {renderBuildContentLink()}{' '}
          </>
        );
      }
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> published
          an app: {renderBuildContentLink()}{' '}
        </>
      );
    case 'xpChange': {
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> completed
          Daily Tasks and correctly answered a{' '}
          <span
            style={{
              fontWeight: 'bold',
              color: Color[cardLevelHash[contentObj?.level]?.color]()
            }}
          >
            {wordLevelHash[contentObj?.level]?.label} vocabulary bonus question
          </span>{' '}
        </>
      );
    }
    case 'sharedTopic':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> created a
          system prompt:{' '}
          <ContentLink
            content={contentObj}
            contentType={contentType}
            theme={theme}
            label=""
          />{' '}
        </>
      );
    case 'dailyReflection':
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> shared a{' '}
          <ContentLink
            content={contentObj}
            contentType={contentType}
            theme={theme}
            label="daily reflection"
          />
        </>
      );
    default:
      return <span>Error</span>;
  }

  function renderCompactFeedHeading() {
    switch (contentType) {
      case 'comment':
        return renderCompactCommentHeading();
      case 'url':
        return (
          <>
            {renderCompactUser()} {renderCompactAction('shared link')}:{' '}
            {renderCompactContentLink(contentObj, contentType)}
          </>
        );
      case 'subject':
        return (
          <>
            {renderCompactUser()} started a{' '}
            <ContentLink
              content={{ id, title: 'subject' }}
              contentType={contentType}
              style={{
                color: byUser ? Color[userLinkColor]() : contentLinkColor
              }}
              theme={theme}
              label="subject"
            />
            {rootObj.id ? (
              <>
                {' '}
                on {contentLabel}:{' '}
                {renderCompactContentLink(rootObj, rootType, contentLabel)}
              </>
            ) : null}
          </>
        );
      case 'pass':
        return contentObj.rootType === 'mission' ? (
          <>
            {renderCompactUser()} {renderCompactAction('completed')}:{' '}
            <ContentLink
              content={{
                id: rootObj.id,
                missionType: rootObj.missionType,
                rootMissionType: rootObj.rootMission?.missionType
              }}
              contentType="mission"
              style={{ color: Color.orange() }}
              theme={theme}
              label={rootObj.title || 'mission'}
            />
          </>
        ) : (
          <>
            {renderCompactUser()} {renderCompactAction('unlocked')}:{' '}
            <ContentLink
              content={{ id }}
              contentType="pass"
              rootType="achievement"
              style={{ color: Color.orange() }}
              theme={theme}
              label="achievement"
            />
          </>
        );
      case 'aiStory':
        return (
          <>
            {renderCompactUser()} {renderCompactAction('cleared')}{' '}
            <b
              style={{
                color:
                  Color?.[cardLevelHash?.[contentObj?.difficulty]?.color]?.()
              }}
            >
              Level {contentObj.difficulty} Story
            </b>
            : {renderCompactContentLink(contentObj, contentType, 'AI Story')}
          </>
        );
      case 'build':
        return (
          <>
            {renderCompactUser()}{' '}
            {renderCompactAction(
              feedActivityType
                ? getBuildActivityText(feedActivityType)
                : 'published app'
            )}
            :{' '}
            {renderBuildContentLink()}
          </>
        );
      case 'video':
        return (
          <>
            {renderCompactUser()} {renderCompactAction('uploaded video')}:{' '}
            {renderCompactContentLink(contentObj, contentType, 'video')}
          </>
        );
      case 'xpChange':
        return (
          <>
            {renderCompactUser()} {renderCompactAction('completed daily goals')}
          </>
        );
      case 'sharedTopic':
        return (
          <>
            {renderCompactUser()} {renderCompactAction('created a system prompt')}
            :{' '}
            {renderCompactContentLink(contentObj, contentType, 'system prompt')}
          </>
        );
      case 'dailyReflection':
        return (
          <>
            {renderCompactUser()} {renderCompactAction('shared a reflection')}
          </>
        );
      default:
        return <span>Error</span>;
    }
  }

  function renderCompactCommentHeading() {
    if (targetObj?.comment && !targetObj.comment.notFound) {
      return (
        <>
          {renderCompactUser()} {renderCompactAction('replied to')}{' '}
          {renderCompactUser(targetObj.comment.uploader)}
          {"'s "}
          {targetObj.comment.replyId
            ? 'reply'
            : rootType === 'user'
              ? 'profile message'
              : 'comment'}
          {isSubjectComment ? (
            <>
              {' '}
              on subject:{' '}
              {renderCompactContentLink(targetObj.subject, 'subject', 'subject')}
            </>
          ) : (
            renderCompactRootContext()
          )}
        </>
      );
    }

    if (rootType === 'user') {
      return (
        <>
          {renderCompactUser()} {renderCompactAction('posted a profile message')}
        </>
      );
    }

    if (isSubjectComment) {
      return (
        <>
          {renderCompactUser()} {renderCompactAction('answered')}:{' '}
          {renderCompactContentLink(targetObj.subject, 'subject', 'subject')}
        </>
      );
    }

    return (
      <>
        {renderCompactUser()} {renderCompactAction('commented')}
        {renderCompactRootContext()}
      </>
    );
  }

  function renderCompactRootContext() {
    if (!rootType || rootType === 'user') return null;
    const link = renderCompactContentLink(rootObj, rootType, contentLabel);
    return <>: {link}</>;
  }

  function renderCompactContentLink(
    content: any,
    type: string,
    fallbackLabel?: string
  ) {
    return (
      <ContentLink
        content={content}
        contentType={type}
        rootType={isPassType ? rootObj?.rootType : undefined}
        style={{ color: contentLinkColor }}
        theme={theme}
        label={getCompactContentLabel(content, fallbackLabel)}
      />
    );
  }

  function renderCompactUser(user = uploader) {
    return <UsernameText user={user} color={Color[linkColor]()} />;
  }

  function renderCompactAction(label: string) {
    return <span className="home-feed-heading-action">{label}</span>;
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

  function renderBuildContentLink() {
    const displayTitle = getBuildDisplayTitle(contentObj);
    return (
      <>
        <ContentLink
          content={contentObj}
          contentType={contentType}
          theme={theme}
          label={displayTitle}
        />{' '}
        {renderBuildRelationshipBadges()}
      </>
    );
  }

  function renderBuildRelationshipBadges() {
    const labels = getHeadingBuildRelationshipLabels({
      build: contentObj,
      feedActivityType
    });
    if (labels.length === 0) return null;
    return (
      <>
        {labels.map((label) =>
          label === 'fork' ? (
            <ForkHistoryTrigger
              key={label}
              buildId={Number(contentObj?.id || 0)}
              style={buildRelationshipBadgeStyle(label)}
            >
              <Icon icon="code-branch" />
              Forked
            </ForkHistoryTrigger>
          ) : (
            <span key={label} style={buildRelationshipBadgeStyle(label)}>
              <Icon icon="users" />
              Version
            </span>
          )
        )}
      </>
    );
  }
}

function getBuildActivityText(feedActivityType?: string | null) {
  if (feedActivityType === 'buildFork') return 'forked an app';
  if (feedActivityType === 'buildUpdate') return 'released an app update';
  if (feedActivityType === 'buildCollaborator') {
    return 'joined the team for an app';
  }
  return 'started a version of an app';
}

function getHeadingBuildRelationshipLabels({
  build,
  feedActivityType
}: {
  build: any;
  feedActivityType?: string | null;
}) {
  const labelSet = new Set<BuildRelationshipLabel>(
    getBuildRelationshipLabels(build)
  );
  if (feedActivityType === 'buildFork') {
    labelSet.add('fork');
  }
  return Array.from(labelSet);
}

function buildRelationshipBadgeStyle(
  label: BuildRelationshipLabel
): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.28rem',
    padding: '0.14rem 0.44rem',
    borderRadius: 999,
    border:
      label === 'fork'
        ? '1px solid rgba(147, 51, 234, 0.3)'
        : '1px solid rgba(59, 130, 246, 0.3)',
    background:
      label === 'fork'
        ? 'rgba(147, 51, 234, 0.12)'
        : 'rgba(59, 130, 246, 0.12)',
    color: label === 'fork' ? '#6b21a8' : '#1d4ed8',
    fontSize: '1.1rem',
    fontWeight: 800,
    lineHeight: 1.1,
    verticalAlign: '0.08em',
    whiteSpace: 'nowrap'
  };
}

function getCompactContentLabel(content: any, fallbackLabel = '') {
  return String(
    content?.title ||
      content?.word ||
      content?.content ||
      content?.topic ||
      fallbackLabel
  ).trim();
}
