import React from 'react';
import { useNavigate } from 'react-router-dom';
import AchievementItem from '~/components/AchievementItem';
import CardThumb from '~/components/CardThumb';
import CompactCommentEmbedPreview from '~/components/Comments/CompactCommentEmbedPreview';
import Icon from '~/components/Icon';
import LinkPreviewImage from '~/components/LinkPreviewImage';
import Loading from '~/components/Loading';
import RichText from '~/components/Texts/RichText';
import VideoThumbImage from '~/components/VideoThumbImage';
import DailyReflectionMetaBadges from '~/components/DailyReflectionMetaBadges';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { getBuildDisplayTitle } from '~/helpers/buildRelationshipHelpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';
import {
  AttachmentSurface,
  AudioWavePreview,
  CompactEffortStrip,
  getAIStoryDifficultyStyle,
  getAIStoryImageUrl,
  getReadableAIStoryPreview
} from './PreviewPrimitives';
import { getHomeFeedContentPath } from '../helpers/navigation';
import ProfilePanelPreview from './ProfilePanelPreview';

function resolveTargetPreviewTheme({
  resolvedRootObj,
  targetComment,
  targetUser,
  targetSubject
}: {
  resolvedRootObj: any;
  targetComment: any;
  targetUser: any;
  targetSubject: any;
}) {
  return String(
    targetUser?.profileTheme ||
      targetComment?.uploader?.profileTheme ||
      targetComment?.profileTheme ||
      targetSubject?.uploader?.profileTheme ||
      targetSubject?.profileTheme ||
      resolvedRootObj?.uploader?.profileTheme ||
      resolvedRootObj?.profileTheme ||
      ''
  ).trim();
}

function setAlphaExact(rgba: string, alpha: number) {
  const match = rgba.match(
    /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
  );
  if (!match) return rgba;
  const [, red, green, blue] = match;
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

export default function TargetPreview({
  contentType,
  normalizedRootType,
  resolvedRootObj,
  secretHidden,
  targetComment,
  targetPanelClassName,
  targetSubject,
  targetUser,
  theme,
  userId
}: {
  contentType: string;
  normalizedRootType: string;
  resolvedRootObj: any;
  secretHidden: boolean;
  targetComment: any;
  targetPanelClassName: string;
  targetSubject: any;
  targetUser: any;
  theme?: string;
  userId: number;
}) {
  const navigate = useNavigate();
  const targetThemeName =
    resolveTargetPreviewTheme({
      resolvedRootObj,
      targetComment,
      targetUser,
      targetSubject
    }) || 'logoBlue';
  const { accentColor: targetAccentColor, borderColor: targetBorderColor } =
    useThemedCardVars({
      role: 'sectionPanel',
      themeName: targetThemeName
    });
  const targetThemeVars = React.useMemo(
    () =>
      ({
        ['--home-feed-target-accent' as const]: targetAccentColor,
        ['--home-feed-target-accent-border' as const]: targetBorderColor,
        ['--home-feed-target-accent-soft' as const]: setAlphaExact(
          targetAccentColor,
          0.1
        ),
        ['--home-feed-target-accent-faint' as const]: setAlphaExact(
          targetAccentColor,
          0.16
        )
      }) as React.CSSProperties,
    [targetAccentColor, targetBorderColor]
  );
  if (contentType === 'comment' && normalizedRootType === 'user') {
    const profile = targetUser?.id ? targetUser : resolvedRootObj;
    if (!profile?.id || profile?.notFound) return null;

    return renderTargetPanel({
      children: <ProfilePanelPreview profile={profile} theme={theme} />,
      target: {
        contentId: Number(profile.id || 0),
        contentType: 'user',
        username: profile.username || profile.content
      }
    });
  }

  if (targetComment && !targetComment.notFound) {
    if (secretHidden) return null;

    return renderTargetPanel({
      children: renderTargetCommentPreview(targetComment),
      target: {
        contentId: Number(targetComment.id || targetComment.commentId || 0),
        contentType: 'comment'
      }
    });
  }

  if (targetSubject?.id && !targetSubject.notFound) {
    return renderTargetPanel({
      children: renderTargetContentPreview({
        ...targetSubject,
        contentType: 'subject'
      }),
      target: {
        contentId: Number(targetSubject.id || 0),
        contentType: 'subject'
      }
    });
  }

  if (!resolvedRootObj?.id || resolvedRootObj?.notFound) return null;

  if (contentType === 'comment' && normalizedRootType === 'pass') {
    return renderRootPanel(renderTargetPassPreview(resolvedRootObj));
  }

  if (contentType === 'comment' && normalizedRootType === 'xpChange') {
    return renderRootPanel(renderTargetDailyGoalsPreview(resolvedRootObj));
  }

  if (contentType === 'comment' && normalizedRootType === 'sharedTopic') {
    return renderRootPanel(renderTargetSharedTopicPreview(resolvedRootObj));
  }

  if (contentType === 'comment' && normalizedRootType === 'dailyReflection') {
    return renderRootPanel(renderTargetDailyReflectionPreview(resolvedRootObj));
  }

  if (
    (contentType === 'comment' || contentType === 'subject') &&
    normalizedRootType === 'url'
  ) {
    return renderRootPanel(
      resolvedRootObj.loaded ? (
        renderTargetUrlPreview(resolvedRootObj)
      ) : (
        <Loading theme={theme} />
      )
    );
  }

  if (
    (contentType === 'comment' || contentType === 'subject') &&
    ['aiStory', 'build', 'subject', 'video'].includes(normalizedRootType)
  ) {
    return renderRootPanel(
      renderTargetContentPreview({
        ...resolvedRootObj,
        contentType: normalizedRootType
      })
    );
  }

  return null;

  function renderRootPanel(children: React.ReactNode) {
    return renderTargetPanel({
      children,
      target: {
        contentId: Number(resolvedRootObj.id || 0),
        contentType: normalizedRootType,
        rootType: resolvedRootObj.rootType || normalizedRootType
      }
    });
  }

  function renderTargetPanel({
    children,
    target
  }: {
    children: React.ReactNode;
    target: {
      contentId: number;
      contentType: string;
      rootType?: string;
      username?: string;
    };
  }) {
    const targetPath = getTargetPath(target);
    if (!targetPath) {
      return <div className={targetPanelClassName}>{children}</div>;
    }
    return (
      <div
        className={targetPanelClassName}
        data-feed-card-interactive="true"
        role="link"
        style={targetThemeVars}
        tabIndex={0}
        onClick={(event) => handleTargetPanelClick(event, targetPath)}
        onKeyDown={(event) => handleTargetPanelKeyDown(event, targetPath)}
      >
        {children}
      </div>
    );
  }

  function getTargetPath(target: {
    contentId: number;
    contentType: string;
    rootType?: string;
    username?: string;
  }) {
    const targetContentId = Number(target.contentId || 0);
    const targetContentType = String(target.contentType || '').trim();
    if (!targetContentId || !targetContentType) return '';
    if (targetContentType === 'user') {
      return target.username ? `/users/${target.username}` : '';
    }
    return getHomeFeedContentPath({
      contentId: targetContentId,
      contentType: targetContentType,
      rootType: target.rootType
    });
  }

  function handleTargetPanelClick(
    event: React.MouseEvent<HTMLDivElement>,
    targetPath: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    navigate(targetPath);
  }

  function handleTargetPanelKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    targetPath: string
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    navigate(targetPath);
  }

  function renderTargetCommentPreview(comment: any) {
    const commentId = Number(comment.id || comment.commentId || 0);

    return (
      <CompactCommentEmbedPreview
        className="home-feed-card__target-comment-preview"
        comment={comment}
        contentId={commentId}
        isNested
        maxTextLines={3}
        showTypeLabel={false}
        theme={theme}
        userId={userId}
        variant="targetRoot"
      />
    );
  }

  function renderTargetPassPreview(passContent: any) {
    const passRootObj = passContent?.rootObj || passContent;
    const isMission = passContent?.rootType === 'mission';
    if (!passRootObj?.id) return null;

    if (!isMission) {
      return (
        <div className="home-feed-card__target-content home-feed-card__target-achievement has-media">
          <div className="home-feed-card__target-achievement-badge">
            <AchievementItem
              isSmall
              isThumb
              thumbSize="5.8rem"
              achievement={passRootObj}
            />
          </div>
          <div className="home-feed-card__target-copy">
            <span className="home-feed-card__target-chip achievement">
              <Icon icon="certificate" />
              Achievement
            </span>
            <h4>
              {passRootObj.title}
              {passRootObj.ap ? (
                <span>({addCommasToNumber(Number(passRootObj.ap))} AP)</span>
              ) : null}
            </h4>
            {passRootObj.description ? <p>{passRootObj.description}</p> : null}
          </div>
        </div>
      );
    }

    return (
      <div className="home-feed-card__target-content home-feed-card__target-mission">
        <div className="home-feed-card__target-mission-icon">
          <Icon icon="check" />
        </div>
        <div className="home-feed-card__target-copy">
          <span className="home-feed-card__target-chip mission">
            {passRootObj.isTask ? 'Task Complete' : 'Mission Accomplished'}
          </span>
          <h4>{passRootObj.title}</h4>
          {passRootObj.rootMission?.title ? (
            <p>{passRootObj.rootMission.title}</p>
          ) : null}
          <div className="home-feed-card__target-reward-row">
            {passRootObj.xpReward ? (
              <span className="home-feed-card__target-reward xp">
                {addCommasToNumber(Number(passRootObj.xpReward))} XP
              </span>
            ) : null}
            {passRootObj.coinReward ? (
              <span className="home-feed-card__target-reward coins">
                <Icon icon="coins" />
                {addCommasToNumber(Number(passRootObj.coinReward))}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderTargetDailyGoalsPreview(dailyGoals: any) {
    const word = dailyGoals?.word || dailyGoals?.card?.word || '';
    const level = Number(dailyGoals?.level || dailyGoals?.card?.level || 0);
    const levelColor = cardLevelHash[level]?.color || 'logoGreen';

    return (
      <div
        className={`home-feed-card__target-content home-feed-card__target-daily-goals${
          dailyGoals?.card ? ' has-media' : ''
        }`}
      >
        {dailyGoals?.card ? (
          <div className="home-feed-card__target-card-thumb">
            <CardThumb card={dailyGoals.card} />
          </div>
        ) : null}
        <div className="home-feed-card__target-copy">
          <span className="home-feed-card__target-chip daily-goals">
            <Icon icon="bolt" />
            Daily Goals
          </span>
          {word ? (
            <h4 style={{ color: Color[levelColor]?.() || Color.logoGreen() }}>
              {word}
            </h4>
          ) : null}
          <div className="home-feed-card__target-reward-row">
            {Number(dailyGoals?.xpEarned || 0) > 0 ? (
              <span className="home-feed-card__target-reward xp">
                {addCommasToNumber(Number(dailyGoals.xpEarned))} XP
              </span>
            ) : null}
            {Number(dailyGoals?.coinEarned || 0) > 0 ? (
              <span className="home-feed-card__target-reward coins">
                <Icon icon="coins" />
                {addCommasToNumber(Number(dailyGoals.coinEarned))}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderTargetSharedTopicPreview(sharedTopic: any) {
    return (
      <div className="home-feed-card__target-content home-feed-card__target-shared-topic">
        <div className="home-feed-card__target-copy">
          <span className="home-feed-card__target-chip shared-topic">
            <Icon icon="comment-alt" />
            System Prompt
          </span>
          <h4>
            {sharedTopic?.title || sharedTopic?.content || 'Shared Prompt'}
          </h4>
          {sharedTopic?.customInstructions ? (
            <RichText
              contentId={Number(sharedTopic.id || 0)}
              contentType="sharedTopic"
              isPreview
              maxLines={3}
              section="content"
              theme={theme}
            >
              {sharedTopic.customInstructions}
            </RichText>
          ) : null}
        </div>
      </div>
    );
  }

  function renderTargetDailyReflectionPreview(reflection: any) {
    const answer =
      reflection?.description ||
      reflection?.answer ||
      reflection?.reflection ||
      '';
    const streak = Number(reflection?.streakAtTime || 0);
    return (
      <div
        className={`home-feed-card__target-content home-feed-card__target-daily-reflection${
          answer
            ? ''
            : ' home-feed-card__target-daily-reflection--question-only'
        }`}
      >
        <div className="home-feed-card__target-daily-reflection-question">
          <span>
            <Icon icon="edit" />
            Question
          </span>
          <h4>{reflection?.question || 'Daily Reflection'}</h4>
        </div>
        {answer ? (
          <div className="home-feed-card__target-daily-reflection-answer">
            <RichText
              contentId={Number(reflection.id || 0)}
              contentType="dailyReflection"
              isPreview
              maxLines={reflection?.question ? 3 : 4}
              section="description"
              theme={theme}
            >
              {answer}
            </RichText>
          </div>
        ) : null}
        <DailyReflectionMetaBadges
          className="home-feed-card__target-reflection-footer"
          density="compact"
          grade={reflection?.grade}
          isRefined={reflection?.isRefined}
          masterpieceType={reflection?.masterpieceType}
          streak={streak}
          xpAwarded={Number(reflection?.xpAwarded || 0)}
        />
      </div>
    );
  }

  function renderTargetContentPreview(target: any) {
    const targetType = String(target?.contentType || '');
    if (targetType === 'build') {
      return renderTargetBuildPreview(target);
    }
    if (targetType === 'video') {
      return renderTargetVideoPreview(target);
    }
    if (targetType === 'aiStory') {
      return renderTargetAIStoryPreview(target);
    }
    return renderTargetSubjectPreview(target);
  }

  function renderTargetSubjectPreview(target: any) {
    const attachmentPreview = renderTargetAttachmentPreview(target);
    const hasReward = Number(target?.rewardLevel || 0) > 0;
    const uploaderName = getTargetUploaderName(target);
    return (
      <div
        className={`home-feed-card__target-content home-feed-card__target-subject${
          attachmentPreview ? ' has-media' : ''
        }${hasReward ? ' has-reward' : ''}`}
      >
        <div className="home-feed-card__target-copy">
          {hasReward ? (
            <CompactEffortStrip
              rewardLevel={Number(target.rewardLevel)}
              className="home-feed-card__target-reward-bar"
            />
          ) : null}
          {target?.title ? <h4>{target.title}</h4> : null}
          {uploaderName ? (
            <span className="home-feed-card__target-subject-meta">
              Posted by {uploaderName}
            </span>
          ) : null}
          {target?.description ? (
            <div className="home-feed-card__target-subject-description-slot">
              <RichText
                className="home-feed-card__target-subject-description"
                contentId={Number(target.id || 0)}
                contentType="subject"
                isPreview
                maxLines={2}
                section="description"
                theme={theme}
              >
                {target.description}
              </RichText>
            </div>
          ) : null}
        </div>
        {attachmentPreview}
      </div>
    );
  }

  function renderTargetBuildPreview(target: any) {
    const displayTitle = getBuildDisplayTitle(target);
    const thumbnailUrl = String(target?.thumbnailUrl || target?.thumbUrl || '');
    return (
      <div
        className={`home-feed-card__target-content home-feed-card__target-build${
          thumbnailUrl ? ' has-media' : ''
        }`}
      >
        <div className="home-feed-card__target-copy">
          <span className="home-feed-card__target-chip build">
            <Icon icon="rocket" />
            Lumine App
          </span>
          <h4>{displayTitle || 'Lumine App'}</h4>
          {target?.description ? <p>{target.description}</p> : null}
        </div>
        {thumbnailUrl ? (
          <img
            className="home-feed-card__target-media"
            src={thumbnailUrl}
            alt={displayTitle || 'Lumine App'}
            loading="lazy"
          />
        ) : null}
      </div>
    );
  }

  function renderTargetVideoPreview(target: any) {
    return (
      <div className="home-feed-card__target-content home-feed-card__target-video has-media">
        <VideoThumbImage
          className="home-feed-card__target-media"
          rewardLevel={target?.rewardLevel}
          videoId={Number(target.id || 0)}
          noPaddingBottom
          src={`https://img.youtube.com/vi/${target?.content}/mqdefault.jpg`}
        />
        <div className="home-feed-card__target-copy">
          <span className="home-feed-card__target-chip">
            <Icon icon="play" />
            Video
          </span>
          {target?.title ? <h4>{target.title}</h4> : null}
          {target?.description ? <p>{target.description}</p> : null}
        </div>
      </div>
    );
  }

  function renderTargetUrlPreview(target: any) {
    const title =
      target?.actualTitle ||
      target?.linkTitle ||
      target?.title ||
      target?.content ||
      'Link';
    const description =
      target?.actualDescription ||
      target?.linkDescription ||
      target?.description ||
      '';
    const siteLabel =
      target?.siteUrl ||
      target?.linkUrl ||
      getTargetUrlSiteLabel(target?.content || target?.url);
    const imageUrl = getTargetUrlImageUrl(target);

    return (
      <div className="home-feed-card__target-content home-feed-card__target-url has-media">
        <LinkPreviewImage
          className="home-feed-card__target-media"
          src={imageUrl}
          alt={`${title} preview`}
          loading="lazy"
        />
        <div className="home-feed-card__target-copy">
          <span className="home-feed-card__target-chip url">
            <Icon icon="link" />
            Link
          </span>
          <h4>{title}</h4>
          {description ? <p>{description}</p> : null}
          {siteLabel ? (
            <span className="home-feed-card__target-site">{siteLabel}</span>
          ) : null}
        </div>
      </div>
    );
  }

  function renderTargetAIStoryPreview(target: any) {
    const difficulty = target?.difficulty || target?.level;
    const difficultyStyle = getAIStoryDifficultyStyle(difficulty);
    const title = target?.title || target?.topic || 'AI Story';
    const imageUrl = getAIStoryImageUrl(target);

    return (
      <div
        className={`home-feed-card__ai-story-preview home-feed-card__ai-story-preview--target${
          target?.isListening
            ? ' home-feed-card__ai-story-preview--listening'
            : ''
        }${imageUrl ? ' home-feed-card__ai-story-preview--has-image' : ''}`}
        style={difficultyStyle}
      >
        <div className="home-feed-card__ai-story-topline">
          <span>
            <Icon icon={target?.isListening ? 'volume-up' : 'book-open'} />
            {target?.isListening ? 'Listening' : 'Reading'}
          </span>
          {difficulty ? (
            <span className="level">Level {difficulty}</span>
          ) : null}
        </div>
        <div className="home-feed-card__ai-story-main">
          <div className="home-feed-card__ai-story-copy">
            <h3>{title}</h3>
            {target?.isListening ? (
              <div className="home-feed-card__ai-story-listening-body">
                <AudioWavePreview small />
              </div>
            ) : getReadableAIStoryPreview(target?.story) ? (
              <p className="home-feed-card__ai-story-story">
                {getReadableAIStoryPreview(target.story)}
              </p>
            ) : null}
          </div>
          {imageUrl ? (
            <div className="home-feed-card__ai-story-image-frame">
              <img
                alt={`${title} image`}
                className="home-feed-card__ai-story-image"
                decoding="async"
                loading="lazy"
                src={imageUrl}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderTargetAttachmentPreview(target: any) {
    if (!target?.filePath) return null;
    return (
      <AttachmentSurface
        className="home-feed-card__target-media-wrap"
        source={target}
        sourceContentId={Number(target.id || 0)}
        sourceContentType={target.contentType || 'subject'}
        userId={userId}
      />
    );
  }
}

function getTargetUploaderName(target: any) {
  const uploader = target?.uploader;
  if (typeof uploader === 'string') return uploader.trim();
  return String(
    uploader?.username ||
      target?.username ||
      target?.uploaderUsername ||
      target?.author?.username ||
      ''
  ).trim();
}

function getTargetUrlImageUrl(target: any) {
  return String(
    target?.thumbUrl || target?.thumbnailUrl || target?.imageUrl || ''
  ).trim();
}

function getTargetUrlSiteLabel(value: any) {
  const rawUrl = String(value || '').trim();
  if (!rawUrl) return '';
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}
