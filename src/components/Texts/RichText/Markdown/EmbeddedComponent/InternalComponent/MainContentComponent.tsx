import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import ContentListItem from '~/components/ContentListItem';
import CompactCommentEmbedPreview from '~/components/Comments/CompactCommentEmbedPreview';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import VideoThumbnail from '~/components/ContentListItem/VideoThumbnail';
import { Color, borderRadius } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import InvalidContent from '../InvalidContent';
import { css } from '@emotion/css';

const displayIsMobile = isMobile(navigator);

export default function MainContentComponent({
  contentId,
  contentType,
  isPreview,
  showCompactCommentTypeLabel = true
}: {
  contentId: string;
  contentType: string;
  isPreview?: boolean;
  showCompactCommentTypeLabel?: boolean;
}) {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const loadingRef = useRef(false);
  const appliedContentType = useMemo(() => {
    if (contentType === 'ai-storie') {
      return 'aiStory';
    }
    if (contentType === 'daily-reflection') {
      return 'dailyReflection';
    }
    return contentType === 'link' ? 'url' : contentType;
  }, [contentType]);
  const contentState = useContentState({
    contentType: appliedContentType,
    contentId: Number(contentId)
  });
  const { loaded, content, notFound, rewardLevel } = contentState;
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);

  useEffect(() => {
    if (!loaded && !loadingRef.current && !isNaN(Number(contentId))) {
      onMount();
    }
    async function onMount() {
      try {
        loadingRef.current = true;
        const data = await loadContent({
          contentId,
          contentType: appliedContentType
        });
        if (data.notFound) {
          return setHasError(true);
        }
        onInitContent({
          ...data,
          feedId: contentState.feedId
        });
        if (data.rootObj) {
          onInitContent({
            contentId: data.rootId,
            contentType: data.rootType === 'url' ? 'link' : data.rootType,
            ...data.rootObj
          });
        }
      } catch (_error) {
        setHasError(true);
      } finally {
        loadingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (hasError || notFound || isNaN(Number(contentId))) {
    return <InvalidContent />;
  }
  if (!loaded) {
    return <Loading />;
  }

  if (isPreview) {
    return (
      <CompactMainContentEmbedPreview
        contentId={Number(contentId)}
        contentType={appliedContentType}
        content={contentState}
        navigate={navigate}
        showCompactCommentTypeLabel={showCompactCommentTypeLabel}
      />
    );
  }

  switch (appliedContentType) {
    case 'video':
      return (
        <XPVideoPlayer
          style={{ minWidth: displayIsMobile ? '100%' : '80%' }}
          isLink={displayIsMobile}
          videoId={Number(contentId)}
          videoCode={content}
          rewardLevel={rewardLevel}
        />
      );
    case 'url':
    case 'subject':
    case 'comment':
    case 'aiStory':
    case 'dailyReflection':
    case 'build':
      return (
        <ContentListItem
          style={{ minWidth: displayIsMobile ? '100%' : '80%' }}
          contentObj={contentState}
        />
      );
    default:
      return <InvalidContent />;
  }
}

function CompactMainContentEmbedPreview({
  content,
  contentId,
  contentType,
  navigate,
  showCompactCommentTypeLabel
}: {
  content: any;
  contentId: number;
  contentType: string;
  navigate: (path: string) => void;
  showCompactCommentTypeLabel: boolean;
}) {
  const label = getContentLabel(contentType, content);
  const title = getContentTitle(contentType, content);
  const body = getContentBody(contentType, content);
  const path = getContentPath(contentType, contentId);
  const accent = getContentAccent(contentType);
  const thumbUrl = String(content?.thumbUrl || content?.thumbnailUrl || '');
  const hasVideoThumb = contentType === 'video' && content?.content;
  const hasImageThumb = !hasVideoThumb && thumbUrl;
  const hasAttachment = Boolean(content?.fileName || content?.filePath);
  const isSubject = contentType === 'subject';
  const subjectRewardLevel = isSubject ? Number(content?.rewardLevel || 0) : 0;

  if (contentType === 'aiStory') {
    return (
      <CompactAIStoryEmbedPreview
        body={body}
        content={content}
        onClick={handleClick}
        title={title}
      />
    );
  }

  if (contentType === 'comment') {
    return (
      <CompactCommentEmbedPreview
        comment={content}
        contentId={contentId}
        maxTextLines={2}
        onOpen={() => navigate(path)}
        showTypeLabel={showCompactCommentTypeLabel}
      />
    );
  }

  return (
    <button
      type="button"
      className={[
        compactMainContentPreviewClass,
        `compact-main-content-embed--${contentType}`,
        hasVideoThumb || hasImageThumb
          ? 'compact-main-content-embed--has-media'
          : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--embed-accent': accent } as React.CSSProperties}
      onClick={handleClick}
    >
      <div className="compact-main-content-embed__copy">
        {isSubject ? (
          subjectRewardLevel > 0 ? (
            <CompactSubjectEffortBadge rewardLevel={subjectRewardLevel} />
          ) : (
            <span className="compact-main-content-embed__label compact-main-content-embed__label--neutral">
              Subject
            </span>
          )
        ) : (
          <span className="compact-main-content-embed__label">{label}</span>
        )}
        {title ? <strong>{title}</strong> : null}
        {body ? <p>{body}</p> : null}
        {hasAttachment ? (
          <span className="compact-main-content-embed__attachment">
            {content.fileName || 'Attachment'}
          </span>
        ) : null}
      </div>
      {hasVideoThumb ? (
        <VideoThumbnail
          className="compact-main-content-embed__media"
          content={content.content}
          contentId={contentId}
          rewardLevel={Number(content.rewardLevel || 0)}
        />
      ) : hasImageThumb ? (
        <img
          className="compact-main-content-embed__media"
          src={thumbUrl}
          alt={title || label}
          loading="lazy"
        />
      ) : null}
    </button>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    navigate(path);
  }
}

function CompactAIStoryEmbedPreview({
  body,
  content,
  onClick,
  title
}: {
  body: string;
  content: any;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
}) {
  const isListening = Boolean(content?.isListening);
  const level = Number(
    content?.difficulty || content?.level || content?.storyLevel || 0
  );

  return (
    <button
      type="button"
      className={`${compactMainContentPreviewClass} compact-main-content-embed--ai-story-card`}
      style={{ '--embed-accent': Color.logoBlue() } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="compact-main-content-embed__story-topline">
        <span>
          <Icon icon={isListening ? 'volume-up' : 'book-open'} />
          {isListening ? 'Listening' : 'Reading'}
        </span>
        {level ? (
          <span className="compact-main-content-embed__story-level">
            Level {level}
          </span>
        ) : null}
      </div>
      {title ? (
        <strong className="compact-main-content-embed__story-title">
          {title}
        </strong>
      ) : null}
      {body ? (
        <p className="compact-main-content-embed__story-body">{body}</p>
      ) : null}
    </button>
  );
}

function CompactSubjectEffortBadge({ rewardLevel }: { rewardLevel: number }) {
  const level = Math.max(1, Math.floor(Number(rewardLevel || 1)));
  const starCount = Math.min(level, 5);
  const colorKey = cardLevelHash[level]?.color || 'logoBlue';
  const colorGetter = (Color as any)[colorKey];
  const color =
    typeof colorGetter === 'function' ? colorGetter() : Color.logoBlue();

  return (
    <span
      className="compact-main-content-embed__effort-badge"
      style={
        { '--subject-effort-color': color } as React.CSSProperties & {
          '--subject-effort-color': string;
        }
      }
    >
      <span>Effort</span>
      <span className="compact-main-content-embed__effort-stars">
        {Array.from({ length: starCount }, (_, index) => (
          <Icon key={index} icon="star" />
        ))}
      </span>
      <span className="compact-main-content-embed__effort-xp">
        {addCommasToNumber(level * 2000)} XP
      </span>
    </span>
  );
}

function getContentLabel(contentType: string, content: any) {
  if (contentType === 'aiStory') {
    return content?.isListening ? 'Listening Story' : 'AI Story';
  }
  if (contentType === 'dailyReflection') return 'Daily Reflection';
  if (contentType === 'url') return 'Link';
  if (contentType === 'build') return 'Lumine App';
  return contentType.charAt(0).toUpperCase() + contentType.slice(1);
}

function getContentTitle(contentType: string, content: any) {
  if (contentType === 'url') {
    return getPlainPreviewText(
      content?.actualTitle || content?.linkTitle || content?.title || content?.content
    );
  }
  if (contentType === 'dailyReflection') {
    return getPlainPreviewText(content?.question || 'Daily Reflection');
  }
  if (contentType === 'comment') {
    return getPlainPreviewText(content?.uploader?.username || 'Comment');
  }
  if (contentType === 'aiStory') {
    return getPlainPreviewText(content?.title || content?.topic || 'AI Story');
  }
  return getPlainPreviewText(content?.title || content?.topic || '');
}

function getContentBody(contentType: string, content: any) {
  if (contentType === 'url') {
    return getPlainPreviewText(
      content?.actualDescription ||
        content?.linkDescription ||
        content?.description ||
        content?.siteUrl
    );
  }
  if (contentType === 'comment') {
    return getPlainPreviewText(content?.content || '');
  }
  if (contentType === 'aiStory') {
    if (content?.isListening) return 'Audio listening activity';
    return getPlainPreviewText(content?.story || content?.description || '');
  }
  return getPlainPreviewText(content?.description || content?.content || '');
}

function getContentPath(contentType: string, contentId: number) {
  if (contentType === 'build') return `/app/${contentId}`;
  if (contentType === 'aiStory') return `/ai-stories/${contentId}`;
  if (contentType === 'dailyReflection') return `/daily-reflections/${contentId}`;
  if (contentType === 'url') return `/links/${contentId}`;
  return `/${contentType}s/${contentId}`;
}

function getContentAccent(contentType: string) {
  if (contentType === 'dailyReflection') return Color.pink();
  if (contentType === 'build' || contentType === 'video') return Color.logoBlue();
  if (contentType === 'subject') return Color.orange();
  if (contentType === 'aiStory') return Color.purple();
  if (contentType === 'url') return Color.orange();
  return Color.darkGray();
}

function getPlainPreviewText(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const compactMainContentPreviewClass = css`
  appearance: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  min-height: 8.2rem;
  overflow: hidden;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--embed-accent);
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: left;
  cursor: pointer;
  &.compact-main-content-embed--has-media {
    grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 28%);
  }
  .compact-main-content-embed__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 0.3rem;
  }
  .compact-main-content-embed__label {
    align-self: flex-start;
    color: var(--embed-accent);
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
  }
  .compact-main-content-embed__label--neutral {
    padding: 0.15rem 0.55rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: 999px;
    color: ${Color.darkGray()};
    background: #fff;
  }
  &.compact-main-content-embed--subject {
    min-height: 7.6rem;
    border-color: ${Color.borderGray()};
    box-shadow: inset 0 0 0 1px ${Color.whiteGray()};
  }
  &.compact-main-content-embed--subject .compact-main-content-embed__copy {
    gap: 0.35rem;
  }
  &.compact-main-content-embed--ai-story-card {
    align-content: center;
    gap: 0.38rem;
    min-height: 8.8rem;
    border-color: ${Color.borderGray()};
    background: #fff;
    box-shadow: inset 0 0 0 1px ${Color.whiteGray()};
  }
  .compact-main-content-embed__story-topline {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.7rem;
  }
  .compact-main-content-embed__story-topline span {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 0.34rem;
    overflow: hidden;
    padding: 0.18rem 0.58rem;
    border: 1px solid ${Color.logoBlue(0.32)};
    border-radius: 999px;
    background: ${Color.logoBlue(0.08)};
    color: ${Color.logoBlue()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact-main-content-embed__story-topline .compact-main-content-embed__story-level {
    flex-shrink: 0;
    border-color: ${Color.logoBlue()};
    background: ${Color.logoBlue()};
    color: #fff;
  }
  .compact-main-content-embed__story-title {
    margin-top: 0.08rem;
  }
  .compact-main-content-embed__story-body {
    -webkit-line-clamp: 3;
  }
  .compact-main-content-embed__effort-badge {
    align-self: flex-start;
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    gap: 0.35rem;
    overflow: hidden;
    padding: 0.17rem 0.6rem;
    border: 1px solid var(--subject-effort-color);
    border-radius: 999px;
    color: var(--subject-effort-color);
    background: #fff;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
    white-space: nowrap;
  }
  .compact-main-content-embed__effort-stars {
    display: inline-flex;
    align-items: center;
    gap: 0.12rem;
    color: ${Color.gold()};
    font-size: 0.92em;
  }
  .compact-main-content-embed__effort-xp {
    color: var(--subject-effort-color);
  }
  strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.25rem;
    font-weight: 900;
    line-height: 1.15;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  p {
    margin: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .compact-main-content-embed__attachment {
    max-width: 100%;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact-main-content-embed__media {
    width: 100%;
    height: 100%;
    min-height: 6.5rem;
    max-height: 8.8rem;
    object-fit: cover;
    overflow: hidden;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.65rem;
    background: ${Color.whiteGray()};
  }
`;
