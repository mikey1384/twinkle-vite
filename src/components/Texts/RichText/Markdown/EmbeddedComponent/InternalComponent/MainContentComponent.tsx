import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BuildMiniCard, BuildWideCard } from '~/components/Build/Cards';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import ContentListItem from '~/components/ContentListItem';
import ForkHistoryModal from '~/components/Modals/BuildForkHistoryModal';
import CompactCommentEmbedPreview from '~/components/Comments/CompactCommentEmbedPreview';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import CompactSubjectEmbedPreview from '~/components/Subjects/CompactSubjectEmbedPreview';
import VideoThumbnail from '~/components/ContentListItem/VideoThumbnail';
import { Color, borderRadius } from '~/constants/css';
import { cardLevelHash, cloudFrontURL } from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { getBuildDisplayTitle } from '~/helpers/buildRelationshipHelpers';
import { getPlainPreviewText } from '~/helpers/stringHelpers';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';
import InvalidContent from '../InvalidContent';
import UnpublishedBuildContent from '../UnpublishedBuildContent';
import { css } from '@emotion/css';

const displayIsMobile = isMobile(navigator);

function getBuildOwnerProfileTheme(build?: any) {
  const owner = build?.owner && typeof build.owner === 'object' ? build.owner : {};
  const uploader =
    build?.uploader && typeof build.uploader === 'object' ? build.uploader : {};
  return String(
    owner.profileTheme ||
      build?.ownerProfileTheme ||
      build?.profileTheme ||
      uploader.profileTheme ||
      ''
  ).trim();
}

export default function MainContentComponent({
  contentId,
  contentType,
  buildPreviewVariant = 'compact',
  isPreview,
  showCompactCommentTypeLabel = true,
  theme
}: {
  contentId: string;
  contentType: string;
  buildPreviewVariant?: 'compact' | 'wide';
  isPreview?: boolean;
  showCompactCommentTypeLabel?: boolean;
  theme?: string;
}) {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [isUnpublished, setIsUnpublished] = useState(false);
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
  const userId = useKeyContext((v) => v.myState.userId);

  // Reset locally-derived load state when this embed instance is reused for a
  // different target (e.g. the markdown src is edited). Without this, a prior
  // unpublished/error result would keep rendering for the new contentId.
  const embedKey = `${appliedContentType}:${contentId}`;
  const embedKeyRef = useRef(embedKey);
  if (embedKeyRef.current !== embedKey) {
    embedKeyRef.current = embedKey;
    loadingRef.current = false;
    if (hasError) setHasError(false);
    if (isUnpublished) setIsUnpublished(false);
  }

  useEffect(() => {
    if (!loaded && !loadingRef.current && !isNaN(Number(contentId))) {
      onMount();
    }
    async function onMount() {
      const requestKey = embedKey;
      try {
        loadingRef.current = true;
        const data = await loadContent({
          contentId,
          contentType: appliedContentType
        });
        if (embedKeyRef.current !== requestKey) return;
        if (data.unpublished) {
          return setIsUnpublished(true);
        }
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
        if (embedKeyRef.current === requestKey) {
          setHasError(true);
        }
      } finally {
        if (embedKeyRef.current === requestKey) {
          loadingRef.current = false;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, contentId, appliedContentType]);

  // Read the unpublished flag from shared content state too (not just this
  // component's own request) so a cached unpublished placeholder never falls
  // through to the notFound -> Invalid Content branch below.
  if (isUnpublished || contentState.unpublished) {
    return <UnpublishedBuildContent bare={isPreview} />;
  }
  if (hasError || notFound || isNaN(Number(contentId))) {
    return (
      <InvalidContent bare={isPreview && appliedContentType === 'build'} />
    );
  }
  if (!loaded) {
    return <Loading />;
  }

  if (isPreview) {
    return (
      <CompactMainContentEmbedPreview
        buildPreviewVariant={buildPreviewVariant}
        contentId={Number(contentId)}
        contentType={appliedContentType}
        content={contentState}
        navigate={navigate}
        showCompactCommentTypeLabel={showCompactCommentTypeLabel}
        theme={theme}
        userId={userId}
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
      return (
        <ContentListItem
          style={{ minWidth: displayIsMobile ? '100%' : '80%' }}
          contentObj={contentState}
        />
      );
    case 'build':
      return (
        <BuildRichTextEmbed
          build={contentState}
          contentId={Number(contentId)}
        />
      );
    default:
      return <InvalidContent />;
  }
}

function BuildRichTextEmbed({
  build,
  contentId
}: {
  build: any;
  contentId: number;
}) {
  const [forkHistoryBuildId, setForkHistoryBuildId] = useState(0);
  const uploader = build?.uploader || {};
  const ownerProfileTheme = String(
    build?.owner?.profileTheme ||
      build?.ownerProfileTheme ||
      build?.profileTheme ||
      uploader?.profileTheme ||
      ''
  ).trim();
  const buildCardInput = {
    ...build,
    id: contentId,
    contentId,
    contentType: 'build',
    userId: Number(build?.userId || uploader?.id || 0),
    username: build?.username || uploader?.username || '',
    profilePicUrl: build?.profilePicUrl || uploader?.profilePicUrl || '',
    profileTheme: ownerProfileTheme || null,
    owner: {
      ...(build?.owner || {}),
      profileTheme: ownerProfileTheme || build?.owner?.profileTheme || null
    },
    thumbnailUrl: build?.thumbnailUrl || build?.thumbUrl || ''
  };

  if (!contentId) return null;

  return (
    <>
      <BuildWideCard
        build={buildCardInput}
        showFavoriteAction
        to={`/app/${contentId}`}
        onOpenForkHistory={setForkHistoryBuildId}
      />
      {forkHistoryBuildId ? (
        <ForkHistoryModal
          buildId={forkHistoryBuildId}
          isOpen
          onClose={() => setForkHistoryBuildId(0)}
        />
      ) : null}
    </>
  );
}

function CompactMainContentEmbedPreview({
  content,
  contentId,
  contentType,
  buildPreviewVariant,
  navigate,
  showCompactCommentTypeLabel,
  theme,
  userId
}: {
  content: any;
  contentId: number;
  contentType: string;
  buildPreviewVariant: 'compact' | 'wide';
  navigate: (path: string) => void;
  showCompactCommentTypeLabel: boolean;
  theme?: string;
  userId?: number;
}) {
  const label = getContentLabel(contentType, content);
  const title = getContentTitle(contentType, content);
  const body = getContentBody(contentType, content);
  const path = getContentPath(contentType, contentId);
  const accent = getContentAccent(contentType);
  const isSubject = contentType === 'subject';
  const isBuild = contentType === 'build';
  const buildOwnerThemeName = getBuildOwnerProfileTheme(content);
  const previewThemeName = String(
    isBuild
      ? buildOwnerThemeName
      : content?.uploader?.profileTheme || content?.profileTheme || theme || ''
  ).trim();
  const { accentColor: themedAccentColor, borderColor: themedBorderColor } =
    useThemedCardVars({
      role: 'sectionPanel',
      themeName: previewThemeName || undefined
    });
  const thumbUrl = String(content?.thumbUrl || content?.thumbnailUrl || '');
  const hasVideoThumb = contentType === 'video' && content?.content;
  const hasImageThumb = !hasVideoThumb && thumbUrl;
  const hasAttachment = Boolean(content?.fileName || content?.filePath);
  const previewAccent = isBuild ? themedAccentColor : accent;
  const previewStyle = {
    '--embed-accent': previewAccent,
    '--embed-accent-border': isBuild
      ? themedBorderColor
      : setAlphaExact(previewAccent, 0.35),
    '--embed-accent-soft': setAlphaExact(previewAccent, 0.1),
    '--home-feed-build-accent': previewAccent
  } as React.CSSProperties & {
    '--embed-accent': string;
    '--embed-accent-border': string;
    '--embed-accent-soft': string;
    '--home-feed-build-accent': string;
  };

  if (isBuild) {
    const buildPreview = {
      ...content,
      contentId,
      contentType: 'build',
      id: contentId,
      thumbnailUrl: thumbUrl
    };

    if (buildPreviewVariant === 'wide') {
      const ownerId = Number(content?.userId || content?.uploader?.id || 0);
      const isOwner = Boolean(userId && ownerId && ownerId === Number(userId));

      return (
        <BuildMiniCard
          build={buildPreview}
          className="home-feed-card__build-preview"
          showActions
          style={previewStyle}
          onBuild={isOwner ? () => navigate(`/build/${contentId}`) : undefined}
          onOpen={() => navigate(path)}
        />
      );
    }

    return (
      <BuildMiniCard
        build={buildPreview}
        interactiveBadges={false}
        onOpen={() => navigate(path)}
        variant="compactEmbed"
      />
    );
  }

  if (isSubject) {
    return (
      <CompactSubjectEmbedPreview
        content={content}
        contentId={contentId}
        onClick={handleSubjectClick}
        showThumbnail={Boolean(thumbUrl)}
        thumbnailUrl={thumbUrl}
      />
    );
  }

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
        theme={theme}
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
      style={previewStyle}
      onClick={handleClick}
    >
      <div className="compact-main-content-embed__copy">
        <span className="compact-main-content-embed__label">
          {isBuild ? <Icon icon="rocket" /> : null}
          <span>{label}</span>
        </span>
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

  function handleSubjectClick(event: React.MouseEvent<HTMLElement>) {
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
  const imageUrl = getCompactAIStoryImageUrl(content);
  const storyPreview = isListening
    ? ''
    : getReadableCompactAIStoryPreview(body);
  const levelStyle = getCompactAIStoryLevelStyle(level);

  return (
    <button
      type="button"
      className={[
        compactMainContentPreviewClass,
        'compact-main-content-embed--ai-story-card',
        isListening
          ? 'compact-main-content-embed--ai-story-listening'
          : 'compact-main-content-embed--ai-story-reading',
        imageUrl ? 'compact-main-content-embed--ai-story-has-image' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={levelStyle}
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
      <div className="compact-main-content-embed__story-main">
        <span className="compact-main-content-embed__story-copy">
          {title ? (
            <strong className="compact-main-content-embed__story-title">
              {title}
            </strong>
          ) : null}
          {isListening ? (
            <CompactAIStoryAudioWave />
          ) : storyPreview ? (
            <p className="compact-main-content-embed__story-body">
              {storyPreview}
            </p>
          ) : null}
        </span>
        {imageUrl ? (
          <span className="compact-main-content-embed__story-image-frame">
            <img
              alt={`${title || 'AI Story'} image`}
              className="compact-main-content-embed__story-image"
              decoding="async"
              loading="lazy"
              src={imageUrl}
            />
          </span>
        ) : null}
      </div>
    </button>
  );
}

function CompactAIStoryAudioWave() {
  return (
    <span className="compact-main-content-embed__story-wave">
      {Array.from({ length: 13 }, (_, index) => (
        <span key={index} />
      ))}
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
  if (contentType === 'build') {
    return getPlainPreviewText(getBuildDisplayTitle(content) || 'Lumine App');
  }
  if (contentType === 'url') {
    return getPlainPreviewText(
      content?.actualTitle ||
        content?.linkTitle ||
        content?.title ||
        content?.content
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
  if (contentType === 'dailyReflection')
    return `/daily-reflections/${contentId}`;
  if (contentType === 'url') return `/links/${contentId}`;
  return `/${contentType}s/${contentId}`;
}

function getContentAccent(contentType: string) {
  if (contentType === 'dailyReflection') return Color.pink();
  if (contentType === 'build' || contentType === 'video')
    return Color.logoBlue();
  if (contentType === 'subject') return Color.orange();
  if (contentType === 'aiStory') return Color.purple();
  if (contentType === 'url') return Color.orange();
  return Color.darkGray();
}

function setAlphaExact(rgba: string, alpha: number) {
  const match = rgba.match(
    /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
  );
  if (!match) return rgba;
  const [, red, green, blue] = match;
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

function getCompactAIStoryLevelStyle(levelValue: number) {
  const level = Math.max(1, Math.floor(Number(levelValue || 1)));
  const colorKey = cardLevelHash[level]?.color || 'logoBlue';
  const colorGetter = (Color as any)[colorKey] || Color.logoBlue;

  return {
    '--embed-accent': colorGetter(),
    '--embed-accent-soft': colorGetter(0.2),
    '--embed-accent-muted': colorGetter(0.72)
  } as React.CSSProperties & {
    '--embed-accent': string;
    '--embed-accent-soft': string;
    '--embed-accent-muted': string;
  };
}

function getCompactAIStoryImageUrl(content: any) {
  const directUrl =
    typeof content?.imageUrl === 'string' ? content.imageUrl.trim() : '';
  if (directUrl) return directUrl;

  const imagePath =
    typeof content?.imagePath === 'string' ? content.imagePath.trim() : '';
  if (!imagePath) return '';
  if (
    imagePath.startsWith('data:') ||
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://')
  ) {
    return imagePath;
  }

  const normalizedPath = imagePath.replace(/^\/+/, '');
  if (normalizedPath.startsWith('ai-story/')) {
    return `${cloudFrontURL}/${normalizedPath}`;
  }
  return `${cloudFrontURL}/ai-story/${normalizedPath}`;
}

function getReadableCompactAIStoryPreview(value: unknown) {
  const text = getPlainPreviewText(value);
  if (!text) return '';

  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return '';
      if (parsed && typeof parsed === 'object') return '';
    } catch {
      return text;
    }
  }

  return text;
}

const compactMainContentPreviewClass = css`
  appearance: none;
  box-sizing: border-box;
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
  &.compact-main-content-embed--build {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    height: 100%;
    min-height: 10.5rem;
    padding: 0.85rem;
    border: 1px solid ${Color.borderGray()};
    border-left: 0.35rem solid var(--embed-accent);
    box-shadow: none;
  }
  &.compact-main-content-embed--build.compact-main-content-embed--has-media {
    grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 32%);
  }
  &.compact-main-content-embed--build-card {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    height: 100%;
    min-height: 10.5rem;
    padding: 0.85rem;
    border: 1px solid ${Color.borderGray()};
    border-left: 0.35rem solid var(--embed-accent);
    box-shadow: none;
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
  &.compact-main-content-embed--build .compact-main-content-embed__copy {
    justify-content: center;
    gap: 0.42rem;
  }
  &.compact-main-content-embed--build .compact-main-content-embed__label {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    min-height: 1.9rem;
    max-width: 100%;
    overflow: hidden;
    padding: 0.32rem 0.58rem;
    border: 1px solid ${Color.logoBlue(0.25)};
    border-radius: 999px;
    background: ${Color.logoBlue(0.1)};
    color: ${Color.logoBlue()};
    font-size: 1.05rem;
    font-weight: 850;
    line-height: 1;
    white-space: nowrap;
  }
  &.compact-main-content-embed--build .compact-main-content-embed__label svg {
    flex: 0 0 auto;
    font-size: 0.98em;
  }
  &.compact-main-content-embed--build .compact-main-content-embed__label span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .compact-main-content-embed__build-card {
    height: 100%;
    min-height: 0;
  }
  .compact-main-content-embed__build-card p {
    font-size: 1.1rem;
    font-weight: 400;
    line-height: 1.3;
  }
  &.compact-main-content-embed--ai-story-card {
    box-sizing: border-box;
    grid-template-rows: auto minmax(0, 1fr);
    align-content: stretch;
    align-items: stretch;
    gap: 0.72rem;
    height: 100%;
    min-height: 13.6rem;
    max-height: 100%;
    padding: 0.9rem 1rem;
    border-color: var(--embed-accent-soft);
    border-radius: 1rem;
    background: #fff;
    color: ${Color.darkerGray()};
    box-shadow: none;
  }
  &.compact-main-content-embed--ai-story-listening {
    text-align: center;
  }
  .compact-main-content-embed__story-topline {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 2.25rem;
  }
  .compact-main-content-embed__story-topline span {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 0.36rem;
    overflow: hidden;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--embed-accent);
    font-size: 1.18rem;
    font-weight: 900;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact-main-content-embed__story-topline span:first-child {
    overflow: visible;
    padding-block: 0.08rem;
    line-height: 1.35;
  }
  .compact-main-content-embed__story-topline
    .compact-main-content-embed__story-level {
    flex-shrink: 0;
    padding: 0.32rem 0.62rem;
    background: var(--embed-accent);
    color: #fff;
  }
  .compact-main-content-embed__story-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.7rem;
    min-height: 0;
    overflow: hidden;
  }
  &.compact-main-content-embed--ai-story-has-image
    .compact-main-content-embed__story-main {
    grid-template-columns: minmax(0, 1fr) minmax(8.5rem, 34%);
    align-items: stretch;
  }
  .compact-main-content-embed__story-copy {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.65rem;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  &.compact-main-content-embed--ai-story-listening
    .compact-main-content-embed__story-copy {
    align-content: center;
    grid-template-rows: auto auto;
    gap: 0.82rem;
  }
  &.compact-main-content-embed--ai-story-listening.compact-main-content-embed--ai-story-has-image {
    text-align: left;
  }
  .compact-main-content-embed__story-title {
    display: -webkit-box;
    margin-top: 0.08rem;
    max-height: calc(2 * 1.34em);
    min-height: 0;
    overflow: hidden;
    color: ${Color.black()};
    font-size: max(1.6rem, 16px);
    line-height: 1.34;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  &.compact-main-content-embed--ai-story-listening
    .compact-main-content-embed__story-title {
    color: ${Color.darkGray()};
    font-size: max(1.52rem, 15.2px);
    line-height: 1.3;
  }
  .compact-main-content-embed__story-body {
    display: -webkit-box;
    max-height: calc(3 * 1.46em);
    min-height: 0;
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: max(1.38rem, 13.8px);
    font-weight: 600;
    line-height: 1.46;
    text-overflow: ellipsis;
    white-space: pre-line;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
  .compact-main-content-embed__story-wave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.24rem;
    width: 100%;
    min-width: 0;
    min-height: 3.05rem;
    overflow: hidden;
    padding: 0.58rem;
    border: 1px solid var(--embed-accent-soft);
    border-radius: 0.76rem;
    background: #fff;
  }
  .compact-main-content-embed__story-wave span {
    width: 0.3rem;
    height: 0.85rem;
    border-radius: 999px;
    background: var(--embed-accent-muted);
  }
  .compact-main-content-embed__story-wave span:nth-child(2n) {
    height: 1.45rem;
  }
  .compact-main-content-embed__story-wave span:nth-child(3n) {
    height: 2.12rem;
    background: var(--embed-accent);
  }
  .compact-main-content-embed__story-wave span:nth-child(5n) {
    height: 1.15rem;
  }
  .compact-main-content-embed__story-image-frame {
    display: block;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--embed-accent-soft);
    border-radius: 0.78rem;
    background: ${Color.whiteGray()};
    box-shadow: inset 0 0 0 1px ${Color.white(0.72)};
  }
  .compact-main-content-embed__story-image {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    object-fit: cover;
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
  &.compact-main-content-embed--build strong {
    font-size: max(1.9rem, 19px);
    font-weight: 850;
    line-height: 1.18;
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
  &.compact-main-content-embed--build p {
    color: ${Color.darkGray()};
    font-size: max(1.8rem, 18px);
    font-weight: 400;
    line-height: 1.34;
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
  &.compact-main-content-embed--build .compact-main-content-embed__media {
    min-height: 0;
    max-height: none;
    object-fit: contain;
    border-radius: 0.7rem;
    background: ${Color.whiteGray()};
  }
`;
