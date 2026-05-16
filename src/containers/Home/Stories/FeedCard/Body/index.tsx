import React, { useEffect, useMemo, useRef } from 'react';
import AchievementItem from '~/components/AchievementItem';
import CardThumb from '~/components/CardThumb';
import Embedly from '~/components/Embedly';
import Icon from '~/components/Icon';
import { LINK_PREVIEW_FALLBACK_IMAGE } from '~/components/LinkPreviewImage';
import ProfilePic from '~/components/ProfilePic';
import SecretComment from '~/components/SecretComment';
import RichText from '~/components/Texts/RichText';
import VideoThumbImage from '~/components/VideoThumbImage';
import DailyReflectionMetaBadges from '~/components/DailyReflectionMetaBadges';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import {
  getInternalEmbedCommentLabel,
  getInternalEmbedPreviewInfo
} from '~/helpers/aiCardEmbedHelpers';
import { buildAttachmentUrl } from '~/helpers/attachmentHelpers';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import {
  addCommasToNumber,
  getFileInfoFromFileName,
  getRenderedTextForVocabQuestions,
  stripTextSizeMarkers
} from '~/helpers/stringHelpers';
import {
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/helpers/buildRelationshipHelpers';
import {
  formatBuildCollaboratorCount,
  formatBuildForkCount,
  normalizeBuildCollaborationMode
} from '~/helpers/buildProjectHelpers';
import { bodyClass, homeFeedSecretGuardBannerStyle } from './styles';
import {
  AttachmentSurface,
  AudioWavePreview,
  CompactEffortStrip,
  MarkdownEmbedPreview,
  formatRewardMultiplier,
  getAIStoryDifficultyStyle,
  getAIStoryImageUrl,
  getReadableAIStoryPreview
} from './PreviewPrimitives';
import TargetPreview from './TargetPreview';
import SanitizedHTML from 'react-sanitized-html';
import { useNavigate } from 'react-router-dom';
import { normalizeRootType } from '../helpers/navigation';
import type { Comment } from '~/types';
import {
  type FeedCardSizing,
  getDailyReflectionAnswerPreviewMaxLines,
  getFeedCardSizing,
  getSharedTopicPreviewMaxLines,
  getSubjectPreviewLineLimits,
  hasDailyReflectionMetaBadges,
  getMarkdownImageEmbedPreview,
  removeMarkdownImageEmbeds,
  type MarkdownImageEmbed
} from '../helpers/sizing';

type PreviewCommentMedia =
  | {
      cardId: number;
      kind: 'aiCard';
      label: string;
    }
  | {
      contentId: number;
      kind: 'build';
      label: string;
    }
  | {
      extension: string;
      icon: string;
      kind: 'file';
      label: string;
    }
  | {
      isVideo: boolean;
      kind: 'image';
      label: string;
      src: string;
    };

const primaryPreviewTextClass = 'home-feed-card__primary-preview-text';
const lockedSubjectSecretPreviewLabel =
  'Submit your response to view the secret message';

export default function Body({
  content,
  loading,
  rootObj,
  sizing,
  theme,
  userId
}: {
  content: any;
  loading: boolean;
  rootObj: any;
  sizing?: FeedCardSizing;
  theme?: string;
  userId: number;
}) {
  const navigate = useNavigate();
  const contentId = Number(content?.contentId || content?.id || 0);
  const contentType = String(content?.contentType || '');
  const normalizedRootType = normalizeRootType(content?.rootType);
  const resolvedRootObj =
    rootObj?.id || rootObj?.notFound ? rootObj : content?.rootObj || {};
  const targetSubject = content?.targetObj?.subject;
  const targetComment = content?.targetObj?.comment;
  const targetUser = getTargetUser(content?.targetObj);
  const resolvedSizing =
    sizing || getFeedCardSizing({ content, rootObj: resolvedRootObj, userId });
  const secretHidden = resolvedSizing.flags.secretHidden;
  const panelClassName = resolvedSizing.main.className;
  const targetPanelClassName =
    resolvedSizing.target?.className ||
    'home-feed-card__target-preview home-feed-card__target-preview--size-standard';
  if (loading || !contentId || !contentType) {
    return (
      <div className={`${bodyClass} home-feed-card__body`}>
        <div className="home-feed-card__skeleton title" />
        <div className="home-feed-card__skeleton panel" />
      </div>
    );
  }

  return (
    <div className={`${bodyClass} home-feed-card__body`}>
      <section className={panelClassName}>{renderContentPreview()}</section>
      <TargetPreview
        contentType={contentType}
        normalizedRootType={normalizedRootType}
        resolvedRootObj={resolvedRootObj}
        secretHidden={secretHidden}
        targetComment={targetComment}
        targetPanelClassName={targetPanelClassName}
        targetSubject={targetSubject}
        targetUser={targetUser}
        theme={theme}
        userId={userId}
      />
    </div>
  );

  function renderContentPreview() {
    if (secretHidden && contentType !== 'subject') {
      return (
        <div className="home-feed-card__secret-preview">
          <SecretComment
            label="Respond to unlock this comment"
            style={homeFeedSecretGuardBannerStyle}
          />
        </div>
      );
    }

    if (contentType === 'dailyReflection') {
      return renderDailyReflectionPreview();
    }
    if (contentType === 'xpChange') {
      return renderDailyGoalsPreview();
    }
    if (contentType === 'sharedTopic') {
      return renderSharedTopicPreview();
    }
    if (contentType === 'build') {
      return renderBuildPreview();
    }
    if (contentType === 'pass') {
      return renderPassPreview();
    }
    if (contentType === 'aiStory') {
      return renderAIStoryPreview();
    }
    if (contentType === 'url') {
      return renderUrlPreview();
    }
    if (contentType === 'video') {
      return renderVideoPreview();
    }
    if (contentType === 'subject') {
      return renderSubjectPreview();
    }
    if (contentType === 'comment') {
      return renderCommentPreview();
    }

    return renderTextPreview({
      text: content?.description || content?.content || '',
      title: content?.title || ''
    });
  }

  function renderCommentPreview() {
    return renderTextPreview({
      text: content?.content || '',
      section: 'content',
      showAttachment: true
    });
  }

  function renderSubjectPreview() {
    const attachmentPreview = renderAttachmentPreview('subject');
    const description = String(content?.description || content?.content || '');
    const descriptionEmbed = getMarkdownImageEmbedPreview(description);
    const descriptionText = descriptionEmbed
      ? removeMarkdownImageEmbeds(description)
      : description;
    const hasDescriptionText = Boolean(descriptionText.trim());
    const hasDescriptionEmbed = Boolean(descriptionEmbed);
    const secretAnswer = String(content?.secretAnswer || '');
    const secretAttachment = content?.secretAttachment;
    const hasSecretAnswerText = Boolean(secretAnswer.trim());
    const hasSecretAttachment = Boolean(secretAttachment?.filePath);
    const hasAnySecret = Boolean(
      hasSecretAnswerText ||
        hasSecretAttachment ||
        content?.hasSecretAnswer ||
        content?.hasSecretAttachment
    );
    const secretAnswerDuplicatesDescription =
      hasSecretAnswerText && secretAnswer.trim() === descriptionText.trim();
    const showSecretAnswer =
      !secretHidden &&
      !secretAnswerDuplicatesDescription &&
      (hasSecretAnswerText || hasSecretAttachment);
    const showLockedSecretAnswer = Boolean(secretHidden && hasAnySecret);
    const showSecretPreview = showSecretAnswer || showLockedSecretAnswer;
    const showSecretAttachmentOnly = Boolean(
      showSecretAnswer && hasSecretAttachment && !hasSecretAnswerText
    );
    const subjectLineLimits = getSubjectPreviewLineLimitsForLayout({
      hasDescriptionText,
      hasEffort: Number(content?.rewardLevel || 0) > 0,
      hasSecretAnswer: showSecretPreview,
      hasSecretAnswerText: showSecretAnswer
        ? hasSecretAnswerText
        : showLockedSecretAnswer,
      hasSecretAttachment: showSecretAnswer && hasSecretAttachment,
      hasTitle: Boolean(content?.title)
    });
    const hasAttachedRootContent = Boolean(
      contentType === 'subject' &&
      normalizedRootType &&
      Number(content?.rootId || 0) > 0
    );
    const isMinimalSubject =
      !attachmentPreview &&
      !hasDescriptionText &&
      !hasDescriptionEmbed &&
      !showSecretPreview &&
      !hasAttachedRootContent;
    const isRootCompactSubject =
      hasAttachedRootContent && !attachmentPreview && !hasDescriptionEmbed;
    return (
      <div
        className={`home-feed-card__subject-preview${
          isMinimalSubject ? ' home-feed-card__subject-preview--minimal' : ''
        }${
          hasDescriptionEmbed
            ? ' home-feed-card__subject-preview--with-embed'
            : ''
        }${
          hasAttachedRootContent
            ? ' home-feed-card__subject-preview--with-root'
            : ''
        }${
          isRootCompactSubject
            ? ' home-feed-card__subject-preview--root-compact'
            : ''
        }`}
      >
        <div
          className={`home-feed-card__subject-main${
            attachmentPreview
              ? ' home-feed-card__subject-main--with-attachment'
              : ''
          }${
            hasDescriptionEmbed
              ? ' home-feed-card__subject-main--with-embed'
              : ''
          }`}
        >
          <div
            className={`home-feed-card__subject-copy${
              showLockedSecretAnswer
                ? ' home-feed-card__subject-copy--locked-secret'
                : ''
            }`}
          >
            {Number(content?.rewardLevel || 0) > 0 ? (
              <CompactEffortStrip rewardLevel={Number(content.rewardLevel)} />
            ) : null}
            {content?.title ? (
              <h3 className={primaryPreviewTextClass}>{content.title}</h3>
            ) : null}
            {hasDescriptionText ? (
              <RichText
                className={`home-feed-card__subject-description ${primaryPreviewTextClass}`}
                contentId={contentId}
                contentType={contentType}
                isPreview
                maxLines={subjectLineLimits.desktop.descriptionMaxLines}
                mobileMaxLines={subjectLineLimits.mobile.descriptionMaxLines}
                section="description"
                theme={theme}
              >
                {descriptionText}
              </RichText>
            ) : null}
            {showSecretPreview ? (
              <div
                className={`home-feed-card__subject-secret-answer${
                  showSecretAnswer && hasSecretAttachment
                    ? ' home-feed-card__subject-secret-answer--has-attachment'
                    : ''
                }${
                  showLockedSecretAnswer
                    ? ' home-feed-card__subject-secret-answer--locked'
                    : ''
                }${
                  showSecretAttachmentOnly
                    ? ' home-feed-card__subject-secret-answer--attachment-only'
                    : ''
                }`}
              >
                {showLockedSecretAnswer ? (
                  <SecretComment
                    label={lockedSubjectSecretPreviewLabel}
                    style={homeFeedSecretGuardBannerStyle}
                  />
                ) : null}
                {showSecretAnswer && hasSecretAttachment ? (
                  <AttachmentSurface
                    className="home-feed-card__subject-secret-attachment"
                    source={secretAttachment}
                    sourceContentId={contentId}
                    sourceContentType={contentType}
                    userId={userId}
                  />
                ) : null}
                {showSecretAnswer && hasSecretAnswerText ? (
                  <RichText
                    className={`home-feed-card__subject-secret-text ${primaryPreviewTextClass}`}
                    contentId={contentId}
                    contentType={contentType}
                    isPreview
                    maxLines={subjectLineLimits.desktop.secretMaxLines}
                    mobileMaxLines={subjectLineLimits.mobile.secretMaxLines}
                    section="secret"
                    theme={theme}
                  >
                    {secretAnswer}
                  </RichText>
                ) : null}
              </div>
            ) : null}
          </div>
          {descriptionEmbed ? (
            <MarkdownEmbedPreview
              className="home-feed-card__subject-embed-preview"
              contentId={contentId}
              contentType={contentType}
              embed={descriptionEmbed}
            />
          ) : null}
          {attachmentPreview}
        </div>
      </div>
    );
  }

  function renderTextPreview({
    section = 'description',
    showAttachment = false,
    text,
    title
  }: {
    section?: string;
    showAttachment?: boolean;
    text: string;
    title?: string;
  }) {
    const attachmentFileType = showAttachment
      ? getContentAttachmentFileType(content)
      : '';
    const attachmentIsPreviewMedia =
      attachmentFileType === 'image' || attachmentFileType === 'video';
    const attachment = showAttachment
      ? renderAttachmentPreview(
          attachmentFileType === 'image' || attachmentFileType === 'video'
            ? `comment-${attachmentFileType}`
            : 'comment'
        )
      : null;
    const embedPreview = getMarkdownImageEmbedPreview(text);
    const textWithoutEmbeds = embedPreview
      ? removeMarkdownImageEmbeds(text)
      : text;
    const hasText = Boolean(title || textWithoutEmbeds.trim());

    if (embedPreview && !attachment) {
      return renderRichTextEmbedPreview({
        contentId,
        contentType,
        imageEmbed: embedPreview,
        section,
        text: textWithoutEmbeds,
        title
      });
    }

    if (attachment && !hasText) {
      return (
        <div
          className={`home-feed-card__attachment-only-preview${
            attachmentIsPreviewMedia
              ? ' home-feed-card__attachment-only-preview--media'
              : ''
          }`}
        >
          {attachment}
        </div>
      );
    }

    const textMaxLines = getTextMaxLinesForLayout({
      hasTitle: Boolean(title),
      maxLines: resolvedSizing.main.textMaxLines
    });

    return (
      <div
        className={`home-feed-card__text-preview${
          attachment ? ' home-feed-card__text-preview--with-attachment' : ''
        }${
          attachmentIsPreviewMedia
            ? ' home-feed-card__text-preview--with-media-attachment'
            : ''
        }`}
      >
        <div className="home-feed-card__text-copy">
          {title ? <h3 className={primaryPreviewTextClass}>{title}</h3> : null}
          {textWithoutEmbeds ? (
            <RichText
              className={primaryPreviewTextClass}
              contentId={contentId}
              contentType={contentType}
              isPreview
              maxLines={textMaxLines}
              section={section}
              theme={theme}
            >
              {textWithoutEmbeds}
            </RichText>
          ) : null}
        </div>
        {attachment}
      </div>
    );
  }

  function renderAttachmentPreview(classNameSuffix: string) {
    const filePath = getContentAttachmentFilePath(content);
    if (!filePath) return null;
    return (
      <AttachmentSurface
        className={`home-feed-card__attachment-preview home-feed-card__attachment-preview--${classNameSuffix}`}
        source={{ ...content, filePath }}
        sourceContentId={contentId}
        sourceContentType={contentType}
        userId={userId}
      />
    );
  }

  function getContentAttachmentFileType(source: any) {
    const attachmentName = String(
      source?.fileName ||
        source?.actualFileName ||
        source?.filePath ||
        source?.actualFilePath ||
        ''
    );

    return getFileInfoFromFileName(attachmentName).fileType;
  }

  function getContentAttachmentFilePath(source: any) {
    return String(source?.filePath || source?.actualFilePath || '').trim();
  }

  function renderDailyReflectionPreview() {
    const answerLineLimits = getReflectionAnswerLineLimitsForLayout();
    const hasMetaBadges = hasDailyReflectionMetaBadges(content);

    return (
      <div
        className={`home-feed-card__reflection-preview${
          hasMetaBadges
            ? ' home-feed-card__reflection-preview--with-footer'
            : ''
        }`}
      >
        {content?.question ? (
          <div className="home-feed-card__question-box">
            <b>Question:</b>
            <span className={primaryPreviewTextClass}>{content.question}</span>
          </div>
        ) : null}
        {content?.description ? (
          <RichText
            className={`home-feed-card__reflection-answer ${primaryPreviewTextClass}`}
            contentId={contentId}
            contentType={contentType}
            isPreview
            maxLines={answerLineLimits.desktop}
            mobileMaxLines={answerLineLimits.mobile}
            section="description"
            theme={theme}
          >
            {content.description}
          </RichText>
        ) : null}
        {hasMetaBadges ? (
          <DailyReflectionMetaBadges
            className="home-feed-card__reflection-footer"
            density="compact"
            grade={content?.grade}
            isRefined={content?.isRefined}
            masterpieceType={content?.masterpieceType}
            streak={content?.streakAtTime}
            xpAwarded={content?.xpAwarded}
          />
        ) : null}
      </div>
    );
  }

  function getReflectionAnswerLineLimitsForLayout() {
    const params = {
      content,
      maxLines: resolvedSizing.main.reflectionAnswerMaxLines,
      size: resolvedSizing.main.size
    };

    return {
      desktop: getDailyReflectionAnswerPreviewMaxLines({
        ...params,
        axis: 'desktop'
      }),
      mobile: getDailyReflectionAnswerPreviewMaxLines({
        ...params,
        axis: 'mobile'
      })
    };
  }

  function getSubjectPreviewLineLimitsForLayout({
    hasDescriptionText,
    hasEffort,
    hasSecretAnswer,
    hasSecretAnswerText,
    hasSecretAttachment,
    hasTitle
  }: {
    hasDescriptionText: boolean;
    hasEffort: boolean;
    hasSecretAnswer: boolean;
    hasSecretAnswerText: boolean;
    hasSecretAttachment: boolean;
    hasTitle: boolean;
  }) {
    const params = {
      content,
      hasDescriptionText,
      hasEffort,
      hasSecretAnswer,
      hasSecretAnswerText,
      hasSecretAttachment,
      hasTitle,
      size: resolvedSizing.main.size
    };

    return {
      desktop: getSubjectPreviewLineLimits({
        ...params,
        axis: 'desktop'
      }),
      mobile: getSubjectPreviewLineLimits({
        ...params,
        axis: 'mobile'
      })
    };
  }

  function getTextMaxLinesForLayout({
    hasTitle,
    maxLines
  }: {
    hasTitle: boolean;
    maxLines: number;
  }) {
    return hasTitle ? Math.max(2, maxLines - 2) : maxLines;
  }

  function renderDailyGoalsPreview() {
    const bonusQuestion = content?.bonusQuestion || {};
    const word = content?.word || content?.card?.word || '';
    const level = Number(content?.level || content?.card?.level || 0);
    const levelColor = cardLevelHash[level]?.color || 'logoGreen';
    const renderedQuestion = bonusQuestion?.question
      ? getRenderedTextForVocabQuestions(
          bonusQuestion.question,
          word,
          levelColor
        )
      : '';
    const choices = Array.isArray(bonusQuestion?.choices)
      ? bonusQuestion.choices.slice(0, 4)
      : [];

    return (
      <div className="home-feed-card__daily-goals-preview">
        {content?.card ? (
          <div className="home-feed-card__daily-goals-card">
            <CardThumb card={content.card} />
          </div>
        ) : null}
        <div className="home-feed-card__daily-goals-copy">
          <div className="home-feed-card__reward-chips">
            {content?.dailyTaskReward ? (
              <span className="home-feed-card__reward-chip">
                <Icon icon="bolt" />
                {`x${formatRewardMultiplier(
                  Number(content.dailyTaskReward.finalMultiplier || 1)
                )}`}
              </span>
            ) : null}
            {Number(content?.xpEarned || 0) > 0 ? (
              <span className="home-feed-card__reward-chip xp">
                {addCommasToNumber(Number(content.xpEarned))} XP
              </span>
            ) : null}
            {Number(content?.coinEarned || 0) > 0 ? (
              <span className="home-feed-card__reward-chip coins">
                <Icon icon="coins" />
                {addCommasToNumber(Number(content.coinEarned))}
              </span>
            ) : null}
          </div>
          {word ? (
            <h3 style={{ color: Color[levelColor]?.() || Color.logoGreen() }}>
              {word}
            </h3>
          ) : null}
          {renderedQuestion ? (
            <div className="home-feed-card__bonus-question">
              <SanitizedHTML
                allowedAttributes={{ b: ['style'] }}
                html={renderedQuestion}
              />
            </div>
          ) : null}
          {choices.length > 0 ? (
            <div className="home-feed-card__choice-list">
              {choices.map((choice: string, index: number) => (
                <span key={`${choice}-${index}`}>{choice}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderSharedTopicPreview() {
    return (
      <div className="home-feed-card__shared-topic-preview">
        <h3 className={primaryPreviewTextClass}>
          {content?.title || content?.content || content?.topic}
        </h3>
        {content?.customInstructions ? (
          <div className="home-feed-card__system-prompt-box">
            <b>System Prompt:</b>
            <RichText
              className={primaryPreviewTextClass}
              contentId={contentId}
              contentType={contentType}
              isPreview
              maxLines={getSharedTopicPreviewMaxLines(resolvedSizing.main)}
              section="content"
              theme={theme}
            >
              {content.customInstructions}
            </RichText>
          </div>
        ) : null}
      </div>
    );
  }

  function renderBuildPreview() {
    const displayTitle = getBuildDisplayTitle(content);
    const relationshipLabels = getBuildRelationshipLabels(content);
    const collaboratorCount = Math.max(
      0,
      Math.floor(Number(content?.collaboratorCount) || 0)
    );
    const forkCount = Math.max(0, Math.floor(Number(content?.forkCount) || 0));
    const collaborationMode = normalizeBuildCollaborationMode(
      content?.collaborationMode
    );
    const showOpenSource = collaborationMode === 'open_source';
    const thumbnailUrl = String(
      content?.thumbnailUrl || content?.thumbUrl || ''
    );
    const ownerId = Number(content?.userId || content?.uploader?.id || 0);
    const isOwner = Boolean(userId && ownerId && ownerId === userId);

    return (
      <div
        className={`home-feed-card__build-preview${
          thumbnailUrl ? '' : ' home-feed-card__build-preview--no-thumb'
        }`}
      >
        <div className="home-feed-card__build-copy">
          <div className="home-feed-card__build-badge">
            <Icon icon="rocket" />
            <span>Lumine App</span>
          </div>
          <h3 className={primaryPreviewTextClass}>
            {displayTitle || 'Lumine App'}
          </h3>
          {content?.description ? (
            <p className={primaryPreviewTextClass}>{content.description}</p>
          ) : null}
          <div className="home-feed-card__build-status-row">
            {relationshipLabels.map((label) => (
              <span
                key={label}
                className={`home-feed-card__build-status ${label}`}
              >
                <Icon icon={label === 'fork' ? 'code-branch' : 'users'} />
                {label === 'fork' ? 'Fork' : 'Branch'}
              </span>
            ))}
            {showOpenSource ? (
              <span className="home-feed-card__build-status open-source">
                <Icon icon="code-branch" />
                Open Source
              </span>
            ) : null}
            {collaboratorCount > 0 ? (
              <span className="home-feed-card__build-status team">
                <Icon icon="users" />
                {formatBuildCollaboratorCount(collaboratorCount)}
              </span>
            ) : null}
            {showOpenSource ? (
              <span className="home-feed-card__build-status fork-count">
                <Icon icon="code-branch" />
                {formatBuildForkCount(forkCount)}
              </span>
            ) : null}
          </div>
          <div className="home-feed-card__build-actions">
            {isOwner ? (
              <button
                type="button"
                onClick={() => navigate(`/build/${contentId}`)}
              >
                <Icon icon="wrench" />
                Build
              </button>
            ) : null}
            <button
              className="primary"
              type="button"
              onClick={() => navigate(`/app/${contentId}`)}
            >
              <Icon icon="external-link-alt" />
              Open App
            </button>
          </div>
        </div>
        {thumbnailUrl ? (
          <div className="home-feed-card__build-thumb">
            <div className="home-feed-card__build-thumb-toolbar">
              <span />
              <span />
              <span />
            </div>
            <img src={thumbnailUrl} alt={displayTitle || 'Lumine App'} />
          </div>
        ) : null}
      </div>
    );
  }

  function renderPassPreview() {
    const passRootObj = content?.rootObj || resolvedRootObj;
    const isMission = content?.rootType === 'mission';
    if (!passRootObj?.id) return null;

    if (!isMission) {
      return (
        <div className="home-feed-card__pass-preview home-feed-card__achievement-preview">
          <div className="home-feed-card__achievement-badge">
            <AchievementItem
              isSmall
              isThumb
              thumbSize="7.8rem"
              achievement={passRootObj}
            />
          </div>
          <div className="home-feed-card__achievement-copy">
            <h3 className={primaryPreviewTextClass}>
              {passRootObj.title}
              {passRootObj.ap ? (
                <span>({addCommasToNumber(Number(passRootObj.ap))} AP)</span>
              ) : null}
            </h3>
            {passRootObj.description ? (
              <p className={primaryPreviewTextClass}>
                {passRootObj.description}
              </p>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="home-feed-card__pass-preview home-feed-card__mission-preview">
        <div className="home-feed-card__mission-icon">
          <Icon icon="check" />
        </div>
        <div className="home-feed-card__mission-copy">
          <span className="home-feed-card__mission-status">
            {passRootObj.isTask ? 'Task Complete' : 'Mission Accomplished'}
          </span>
          <h3 className={primaryPreviewTextClass}>{passRootObj.title}</h3>
          {passRootObj.rootMission?.title ? (
            <p className={primaryPreviewTextClass}>
              {passRootObj.rootMission.title}
            </p>
          ) : null}
          <div className="home-feed-card__mission-reward-row">
            {passRootObj.xpReward ? (
              <span className="home-feed-card__mission-reward xp">
                {addCommasToNumber(Number(passRootObj.xpReward))} XP
              </span>
            ) : null}
            {passRootObj.coinReward ? (
              <span className="home-feed-card__mission-reward coins">
                <Icon icon="coins" />
                {addCommasToNumber(Number(passRootObj.coinReward))}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderAIStoryPreview() {
    const difficulty = content?.difficulty || content?.level;
    const difficultyStyle = getAIStoryDifficultyStyle(difficulty);
    const storyPreview = getReadableAIStoryPreview(content?.story);
    const isListening = Boolean(content?.isListening);
    const title = String(content?.title || content?.topic || 'AI Story');
    const imageUrl = getAIStoryImageUrl(content);
    const longTitleClass =
      !isListening && title.length > 56
        ? ' home-feed-card__ai-story-preview--long-title'
        : '';

    return (
      <div
        className={`home-feed-card__ai-story-preview${
          isListening
            ? ' home-feed-card__ai-story-preview--listening'
            : ' home-feed-card__ai-story-preview--reading'
        }${imageUrl ? ' home-feed-card__ai-story-preview--has-image' : ''}${longTitleClass}`}
        style={difficultyStyle}
      >
        <div className="home-feed-card__ai-story-topline">
          <span>
            <Icon icon={isListening ? 'volume-up' : 'book-open'} />
            {isListening ? 'Listening' : 'Reading'}
          </span>
          {difficulty ? (
            <span className="level">Level {difficulty}</span>
          ) : null}
        </div>
        <div className="home-feed-card__ai-story-main">
          <div className="home-feed-card__ai-story-copy">
            <h3 className={primaryPreviewTextClass}>{title}</h3>
            {isListening ? (
              <div className="home-feed-card__ai-story-listening-body">
                <AudioWavePreview />
              </div>
            ) : storyPreview ? (
              <p
                className={`home-feed-card__ai-story-story ${primaryPreviewTextClass}`}
              >
                {storyPreview}
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

  function renderUrlPreview() {
    return (
      <div className="home-feed-card__url-preview">
        <div className="home-feed-card__url-copy">
          <h3 className={primaryPreviewTextClass}>
            {content?.actualTitle ||
              content?.linkTitle ||
              content?.title ||
              content?.content}
          </h3>
          {content?.siteUrl ? <span>{content.siteUrl}</span> : null}
          {content?.actualDescription ||
          content?.linkDescription ||
          content?.description ? (
            <p className={primaryPreviewTextClass}>
              {content.actualDescription ||
                content.linkDescription ||
                content.description}
            </p>
          ) : null}
        </div>
        <div className="home-feed-card__url-thumb">
          <Embedly
            imageOnly
            noLink
            contentId={contentId}
            defaultThumbUrl={content?.thumbUrl || LINK_PREVIEW_FALLBACK_IMAGE}
          />
        </div>
      </div>
    );
  }

  function renderVideoPreview() {
    return (
      <div className="home-feed-card__video-preview">
        <VideoThumbImage
          className="home-feed-card__video-thumb"
          rewardLevel={content?.rewardLevel}
          videoId={contentId}
          noPaddingBottom
          src={`https://img.youtube.com/vi/${content?.content}/mqdefault.jpg`}
        />
        <div className="home-feed-card__video-copy">
          <h3 className={primaryPreviewTextClass}>{content?.title}</h3>
          {content?.description ? (
            <p className={primaryPreviewTextClass}>{content.description}</p>
          ) : null}
        </div>
      </div>
    );
  }

  function renderRichTextEmbedPreview({
    contentId,
    contentType,
    imageEmbed,
    section,
    text,
    title
  }: {
    contentId: number;
    contentType: string;
    imageEmbed: MarkdownImageEmbed;
    section: string;
    text: string;
    title?: string;
  }) {
    const hasText = Boolean(title || text.trim());
    const textMaxLines =
      resolvedSizing.main.size === 'rich-embed-compact'
        ? 3
        : Math.min(resolvedSizing.main.textMaxLines, 6);
    const previewTextMaxLines = getTextMaxLinesForLayout({
      hasTitle: Boolean(title),
      maxLines: textMaxLines
    });
    return (
      <div
        className={`home-feed-card__rich-embed-preview${
          hasText ? ' home-feed-card__rich-embed-preview--with-text' : ''
        }${!hasText ? ' home-feed-card__rich-embed-preview--image-only' : ''}`}
      >
        {hasText ? (
          <div className="home-feed-card__rich-embed-copy">
            {title ? (
              <h3 className={primaryPreviewTextClass}>{title}</h3>
            ) : null}
            {text ? (
              <RichText
                className={primaryPreviewTextClass}
                contentId={contentId}
                contentType={contentType}
                isPreview
                maxLines={previewTextMaxLines}
                section={section}
                theme={theme}
              >
                {text}
              </RichText>
            ) : null}
          </div>
        ) : null}
        <MarkdownEmbedPreview
          className="home-feed-card__rich-embed-image"
          contentId={contentId}
          contentType={contentType}
          embed={imageEmbed}
        />
      </div>
    );
  }
}

function getTargetUser(targetObj: any) {
  if (!targetObj) return null;
  if (targetObj.user) return targetObj.user;
  if (targetObj.contentType === 'user') return targetObj;
  return null;
}

export function HomeFeedCommentPreview({
  comments,
  contentType,
  theme
}: {
  comments?: Comment[];
  contentType: string;
  theme?: string;
}) {
  const navigate = useNavigate();
  const comment = getRenderablePreviewComment(comments);
  if (!comment) return null;

  const uploader = getPreviewCommentUploader(comment);
  const commentText = getPreviewCommentText(comment);
  const commentTextIsMessage = hasPreviewCommentMessageText(comment);
  const previewLabel = getPreviewCommentLabel(comment, contentType);
  const previewMedia = getPreviewCommentMedia(comment);
  const accentColor =
    Color[uploader.profileTheme || theme || 'logoBlue']?.() || Color.logoBlue();

  return (
    <div className={`${bodyClass} home-feed-card__comment-preview-slot`}>
      <button
        className={`home-feed-card__comment-preview${
          previewMedia ? ' home-feed-card__comment-preview--has-media' : ''
        }`}
        data-comment-id={comment.id}
        data-feed-card-interactive="true"
        style={
          {
            '--home-feed-comment-accent': accentColor
          } as React.CSSProperties
        }
        type="button"
        onClick={handlePreviewCommentClick}
      >
        <span className="home-feed-card__comment-preview-avatar">
          <ProfilePic
            profilePicUrl={uploader.profilePicUrl}
            size="100%"
            userId={Number(uploader.id || 0)}
          />
        </span>
        <span className="home-feed-card__comment-preview-body">
          <span className="home-feed-card__comment-preview-meta">
            <b>{uploader.username || 'Someone'}</b>
            {previewLabel ? <span>{previewLabel}</span> : null}
          </span>
          <span
            className={`home-feed-card__comment-preview-text${
              commentTextIsMessage
                ? ' home-feed-card__comment-preview-text--message'
                : ''
            }`}
          >
            {commentText}
          </span>
        </span>
        {previewMedia ? renderPreviewCommentMedia(previewMedia) : null}
        <Icon className="home-feed-card__comment-preview-icon" icon="comment" />
      </button>
    </div>
  );

  function renderPreviewCommentMedia(media: PreviewCommentMedia) {
    if (media.kind === 'aiCard') {
      return <PreviewCommentAICardMedia cardId={media.cardId} />;
    }

    if (media.kind === 'build') {
      return (
        <PreviewCommentBuildMedia
          contentId={media.contentId}
          label={media.label}
        />
      );
    }

    if (media.kind === 'image') {
      return (
        <span className="home-feed-card__comment-preview-media home-feed-card__comment-preview-media--image">
          <img src={media.src} alt={media.label} loading="lazy" />
          {media.isVideo ? (
            <span className="home-feed-card__comment-preview-media-play">
              <Icon icon="play" />
            </span>
          ) : null}
        </span>
      );
    }

    return (
      <span className="home-feed-card__comment-preview-media home-feed-card__comment-preview-media--file">
        <Icon
          className="home-feed-card__comment-preview-media-icon"
          icon={media.icon}
        />
        {media.extension ? (
          <small>{media.extension.toUpperCase()}</small>
        ) : null}
      </span>
    );
  }

  function handlePreviewCommentClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    const commentId = Number(event.currentTarget.dataset.commentId || 0);
    if (commentId > 0) navigate(`/comments/${commentId}`);
  }
}

function PreviewCommentAICardMedia({ cardId }: { cardId: number }) {
  const card = useMemo(() => ({ id: cardId }), [cardId]);

  return (
    <span className="home-feed-card__comment-preview-media home-feed-card__comment-preview-media--ai-card">
      <CardThumb card={card as any} />
    </span>
  );
}

function PreviewCommentBuildMedia({
  contentId,
  label
}: {
  contentId: number;
  label: string;
}) {
  const loadingRef = useRef(false);
  const contentState = useContentState({ contentId, contentType: 'build' });
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const thumbnailUrl = String(
    contentState?.thumbnailUrl || contentState?.thumbUrl || ''
  );
  const title = getBuildDisplayTitle(contentState) || label;

  useEffect(() => {
    if (!contentId || contentState.loaded || loadingRef.current) return;
    loadingRef.current = true;
    loadContent({ contentId, contentType: 'build' })
      .then((data: any) => {
        if (!data?.notFound) {
          onInitContent({
            ...data,
            contentId,
            contentType: 'build'
          });
        }
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => {
        loadingRef.current = false;
      });
    // loadContent/onInitContent are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, contentState.loaded]);

  return (
    <span className="home-feed-card__comment-preview-media home-feed-card__comment-preview-media--build">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title} loading="lazy" />
      ) : (
        <Icon
          className="home-feed-card__comment-preview-media-icon"
          icon="rocket"
        />
      )}
    </span>
  );
}

function getRenderablePreviewComment(comments: Comment[] | undefined) {
  return getRenderableHomeFeedPreviewComments(comments)[0] || null;
}

export function getRenderableHomeFeedPreviewComments(
  comments: Comment[] | undefined
) {
  if (!Array.isArray(comments)) return [];
  return comments.filter(isRenderableHomeFeedPreviewComment);
}

function isRenderableHomeFeedPreviewComment(comment: Comment | undefined) {
  return Boolean(
    comment &&
      !comment.isDeleted &&
      !comment.isDeleteNotification &&
      !comment.isLoadMoreButton &&
      !comment.isNotification &&
      !comment.notFound
  );
}

function getPreviewCommentUploader(comment: Comment) {
  const uploader = comment.uploader || {};
  return {
    id: Number(uploader.id || (comment as any).userId || 0),
    profilePicUrl: uploader.profilePicUrl || (comment as any).profilePicUrl,
    profileTheme: uploader.profileTheme || (comment as any).profileTheme,
    username: uploader.username || (comment as any).username || ''
  };
}

function getPreviewCommentText(comment: Comment) {
  const rawContent = String(comment.content || '');
  const markdownEmbed = getMarkdownImageEmbedPreview(rawContent);
  const content = stripMarkdownForCommentPreview(
    removeMarkdownImageEmbeds(rawContent)
  );
  if (content) return content;
  if (markdownEmbed) return getPreviewCommentEmbedText(markdownEmbed);
  if (comment.filePath || comment.thumbUrl || (comment as any).actualFilePath) {
    return getPreviewCommentAttachmentText(comment);
  }
  return 'View latest comment';
}

function hasPreviewCommentMessageText(comment: Comment) {
  const rawContent = String(comment.content || '');
  const content = stripMarkdownForCommentPreview(
    removeMarkdownImageEmbeds(rawContent)
  );
  return Boolean(content);
}

function getPreviewCommentMedia(comment: Comment): PreviewCommentMedia | null {
  const filePath = String(
    (comment as any).actualFilePath || comment.filePath || ''
  );
  const fileName = getPreviewCommentFileName(comment, filePath);
  const thumbUrl = String(comment.thumbUrl || '');
  if (filePath || thumbUrl) {
    const { extension, fileType } = getFileInfoFromFileName(fileName);
    const src =
      thumbUrl ||
      buildAttachmentUrl({
        fileName,
        filePath,
        contentType: 'comment'
      });

    if ((fileType === 'image' || thumbUrl) && src) {
      return {
        isVideo: fileType === 'video',
        kind: 'image',
        label: fileName || getPreviewCommentAttachmentText(comment),
        src
      };
    }

    return {
      extension,
      icon: getPreviewCommentFileIcon(fileType),
      kind: 'file',
      label: fileName || getPreviewCommentAttachmentText(comment)
    };
  }

  const markdownEmbed = getMarkdownImageEmbedPreview(
    String(comment.content || '')
  );
  if (!markdownEmbed) return null;

  if (markdownEmbed.type === 'image') {
    return {
      isVideo: false,
      kind: 'image',
      label: markdownEmbed.alt || 'Image',
      src: markdownEmbed.src
    };
  }

  if (markdownEmbed.type === 'internal') {
    const internalInfo = getInternalEmbedPreviewInfo(markdownEmbed.src);
    if (internalInfo?.kind === 'aiCard' && internalInfo.cardId) {
      return {
        cardId: internalInfo.cardId,
        kind: 'aiCard',
        label: getInternalEmbedCommentLabel(internalInfo)
      };
    }
    if (internalInfo?.kind === 'build' && internalInfo.contentId) {
      return {
        contentId: internalInfo.contentId,
        kind: 'build',
        label: getInternalEmbedCommentLabel(internalInfo)
      };
    }
    return {
      extension: '',
      icon: internalInfo?.icon || 'globe',
      kind: 'file',
      label: getInternalEmbedCommentLabel(internalInfo)
    };
  }

  return {
    extension: '',
    icon: markdownEmbed.type === 'youtube' ? 'play' : 'link',
    kind: 'file',
    label: getPreviewCommentEmbedText(markdownEmbed)
  };
}

function getPreviewCommentAttachmentText(comment: Comment) {
  const fileName = getPreviewCommentFileName(
    comment,
    String((comment as any).actualFilePath || comment.filePath || '')
  );
  const { fileType } = getFileInfoFromFileName(fileName);
  if (fileType === 'image' || comment.thumbUrl) return 'shared an image';
  if (fileType === 'video') return 'shared a video';
  if (fileType === 'audio') return 'shared audio';
  if (fileType === 'pdf') return 'shared a PDF';
  if (fileType === 'archive') return 'shared a file';
  if (fileType === 'word') return 'shared a document';
  return 'shared a file';
}

function getPreviewCommentEmbedText(embed: MarkdownImageEmbed) {
  if (embed.type === 'youtube') return 'shared a video';
  if (embed.type === 'internal') {
    return getInternalEmbedCommentLabel(getInternalEmbedPreviewInfo(embed.src));
  }
  return 'shared an image';
}

function getPreviewCommentFileName(comment: Comment, filePath: string) {
  if (comment.fileName) return comment.fileName;
  const pathName = String(filePath || '')
    .split('?')[0]
    .split('#')[0];
  const fileName = pathName.split('/').filter(Boolean).pop() || '';
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function getPreviewCommentFileIcon(fileType: string) {
  if (fileType === 'image') return 'file-image';
  if (fileType === 'video') return 'file-video';
  if (fileType === 'audio') return 'file-audio';
  if (fileType === 'pdf') return 'file-pdf';
  if (fileType === 'archive') return 'file-archive';
  if (fileType === 'word') return 'file-word';
  return 'file';
}

function getPreviewCommentLabel(comment: Comment, contentType: string) {
  return contentType === 'comment' || Number(comment.replyId || 0)
    ? 'replied'
    : 'commented';
}

function stripMarkdownForCommentPreview(text: string) {
  return stripTextSizeMarkers(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[`*_>#~-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
