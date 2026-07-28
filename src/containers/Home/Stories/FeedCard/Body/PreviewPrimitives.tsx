import React, { useEffect, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import { AttachmentCard } from '~/components/Subjects/SubjectMediaPreview';
import WideSubjectEmbedPreview from '~/components/Subjects/WideSubjectEmbedPreview';
import InternalComponent from '~/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent';
import YouTubeVideo from '~/components/Texts/RichText/Markdown/EmbeddedComponent/YouTubeVideo';
import { Color } from '~/constants/css';
import { cardLevelHash, cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { getInternalEmbedPreviewInfo } from '~/helpers/aiCardEmbedHelpers';
import { getEmbedSvgRepairImageUrl } from '~/helpers/embedSvgRepairHelpers';
import { useContentState } from '~/helpers/hooks';
import { processInternalLink } from '~/helpers/stringHelpers';
import {
  getMarkdownEmbedFileInfo,
  getMarkdownImageEmbedPreview,
  removeMarkdownImageEmbeds,
  type MarkdownImageEmbed
} from '../helpers/sizing';

export type HomeFeedNestedNavigate = (
  path: string,
  sourceElement: HTMLElement | null
) => void;

export function MarkdownEmbedPreview({
  className,
  commentPreviewMaxTextLines,
  commentPreviewVariant,
  contentId,
  contentType,
  embed,
  internalPreviewVariant = 'wide',
  onNavigate,
  theme
}: {
  className?: string;
  commentPreviewMaxTextLines?: number;
  commentPreviewVariant?: 'column' | 'compact';
  contentId: number;
  contentType: string;
  embed: MarkdownImageEmbed;
  internalPreviewVariant?: 'compact' | 'wide';
  onNavigate: HomeFeedNestedNavigate;
  theme?: string;
}) {
  if (embed.type === 'internal') {
    const { isInternalLink, replacedLink } = processInternalLink(embed.src);
    const internalSrc = normalizeInternalEmbedSrc(
      (isInternalLink ? replacedLink : embed.src).replace(/<u>|<\/u>/g, '__')
    );
    const internalSrcParts = internalSrc.split('/');
    const internalLinkType = internalSrcParts[1] || '';
    const internalLinkSubType = (internalSrcParts[2] || '').split('?')[0];
    const internalClassName = [
      internalLinkType === 'subjects'
        ? 'home-feed-card__rich-embed-internal--subject'
        : '',
      ['app', 'apps', 'build', 'builds'].includes(internalLinkType)
        ? 'home-feed-card__rich-embed-internal--build'
        : '',
      internalLinkType === 'ai-cards' ||
      (internalLinkType === 'chat' && internalLinkSubType === 'ai-cards')
        ? 'home-feed-card__rich-embed-internal--ai-card'
        : '',
      internalLinkType === 'users'
        ? 'home-feed-card__rich-embed-internal--user'
        : '',
      internalLinkType === 'comments'
        ? 'home-feed-card__rich-embed-internal--comment'
        : '',
      internalLinkType === 'videos'
        ? 'home-feed-card__rich-embed-internal--video'
        : '',
      internalLinkType === 'shared-prompts'
        ? 'home-feed-card__rich-embed-internal--shared-prompt'
        : ''
    ]
      .filter(Boolean)
      .map((className) => ` ${className}`)
      .join('');
    if (internalLinkType === 'subjects' && internalPreviewVariant === 'wide') {
      const subjectId = getSubjectIdFromInternalSrc(internalSrc);
      return (
        <div
          className={`${
            className || ''
          } home-feed-card__rich-embed-internal home-feed-card__rich-embed-internal--subject`}
          data-internal-src={internalSrc}
          onClick={handleInternalPreviewClick}
        >
          <HomeFeedWideSubjectEmbedPreview
            fallbackLabel={embed.alt || 'Subject'}
            onNavigate={onNavigate}
            subjectId={subjectId}
            theme={theme}
          />
        </div>
      );
    }
    return (
      <div
        className={`${
          className || ''
        } home-feed-card__rich-embed-internal${internalClassName}`}
        data-internal-src={internalSrc}
        onClick={handleInternalPreviewClick}
      >
        <InternalComponent
          rootId={contentId}
          rootType={contentType}
          buildPreviewVariant={internalPreviewVariant}
          commentPreviewMaxTextLines={commentPreviewMaxTextLines}
          commentPreviewVariant={commentPreviewVariant}
          embedPreviewMode={
            internalPreviewVariant === 'compact' ? 'thumbnail' : 'fullWidth'
          }
          isPreview
          showCompactCommentTypeLabel={false}
          src={internalSrc}
          theme={theme}
        />
      </div>
    );
  }

  if (embed.type === 'youtube') {
    return (
      <div
        className={`${className || ''} home-feed-card__rich-embed-video`}
        onClick={stopFeedCardNestedClick}
      >
        <YouTubeVideo
          contentId={contentId}
          contentType={contentType}
          isPreview
          src={embed.src}
        />
      </div>
    );
  }

  return <MarkdownImagePreview className={className} imageEmbed={embed} />;

  function handleInternalPreviewClick(event: React.MouseEvent<HTMLElement>) {
    if (
      event.currentTarget.classList.contains(
        'home-feed-card__rich-embed-internal--build'
      )
    ) {
      const targetElement =
        event.target instanceof Element
          ? event.target
          : event.target instanceof Node
            ? event.target.parentElement
            : null;
      const embedContent = event.currentTarget.firstElementChild;
      if (
        embedContent &&
        (!targetElement || !embedContent.contains(targetElement))
      ) {
        return;
      }
    }
    event.stopPropagation();
    const internalSrc = event.currentTarget.dataset.internalSrc;
    if (internalSrc) onNavigate(internalSrc, event.currentTarget);
  }
}

function HomeFeedWideSubjectEmbedPreview({
  fallbackLabel,
  onNavigate,
  subjectId,
  theme
}: {
  fallbackLabel: string;
  onNavigate: HomeFeedNestedNavigate;
  subjectId: number;
  theme?: string;
}) {
  const loadingRef = useRef<string | null>(null);
  const contentState = useContentState({
    contentId: subjectId,
    contentType: 'subject'
  });
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const hasLoadedSubject = Boolean(
    contentState.loaded && !contentState.notFound
  );
  const subject = hasLoadedSubject
    ? contentState
    : {
        contentId: subjectId,
        contentType: 'subject',
        id: subjectId,
        title: fallbackLabel
      };
  const description = String(subject?.description || subject?.content || '');
  const descriptionEmbed = getMarkdownImageEmbedPreview(description);
  const descriptionBuildEmbed =
    descriptionEmbed?.type === 'internal' &&
    getInternalEmbedPreviewInfo(descriptionEmbed.src)?.kind === 'build'
      ? descriptionEmbed
      : null;
  const shouldPromoteDescriptionBuildEmbed = Boolean(
    descriptionBuildEmbed && !getContentAttachmentFilePath(subject)
  );
  // A content embed left inside the description renders as a block that the
  // line-clamped description RichText clips to its header. We strip every embed
  // from the text and promote it to its own slot so it renders in full and
  // nothing is dropped. Build-without-attachment goes to the media slot (below);
  // ANY other embed — internal, image, or YouTube — renders in the content-embed
  // slot via MarkdownEmbedPreview (which handles every type).
  const descriptionContentEmbed =
    descriptionEmbed && !shouldPromoteDescriptionBuildEmbed
      ? descriptionEmbed
      : null;
  const descriptionText = removeMarkdownImageEmbeds(description);
  const descriptionContentEmbedPreview = descriptionContentEmbed ? (
    <MarkdownEmbedPreview
      className="home-feed-card__target-subject-nested-embed"
      contentId={subjectId}
      contentType="subject"
      embed={descriptionContentEmbed}
      internalPreviewVariant="compact"
      onNavigate={onNavigate}
    />
  ) : null;
  const descriptionBuildEmbedPreview =
    shouldPromoteDescriptionBuildEmbed && descriptionBuildEmbed ? (
      <MarkdownEmbedPreview
        className="home-feed-card__target-subject-build-embed-preview"
        contentId={subjectId}
        contentType="subject"
        embed={descriptionBuildEmbed}
        internalPreviewVariant="compact"
        onNavigate={onNavigate}
        theme={theme}
      />
    ) : undefined;

  useEffect(() => {
    const requestKey = `${userId || 0}:${subjectId}:subject`;
    if (
      !subjectId ||
      contentState.loaded ||
      loadingRef.current === requestKey
    ) {
      return;
    }
    const requestUserId = userId;
    loadingRef.current = requestKey;
    loadContent({ contentId: subjectId, contentType: 'subject' })
      .then((data: any) => {
        if (checkUserChange(requestUserId)) return;
        if (!data?.notFound) {
          onInitContent({
            ...data,
            contentId: subjectId,
            contentType: 'subject'
          });
        }
      })
      .catch((error: unknown) => {
        if (checkUserChange(requestUserId)) return;
        console.error(error);
      })
      .finally(() => {
        if (loadingRef.current === requestKey) {
          loadingRef.current = null;
        }
      });
    // checkUserChange/loadContent/onInitContent are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentState.loaded, subjectId, userId]);

  return (
    <WideSubjectEmbedPreview
      contentId={subjectId}
      descriptionEmbedPreview={descriptionContentEmbedPreview}
      descriptionText={descriptionText}
      hasBuildEmbedMedia={Boolean(
        shouldPromoteDescriptionBuildEmbed && descriptionBuildEmbed
      )}
      mediaPreview={descriptionBuildEmbedPreview}
      subject={subject}
      theme={theme}
    />
  );
}

export function getAIStoryDifficultyStyle(
  difficulty: number | string | undefined
) {
  const level = Math.max(1, Number(difficulty || 1));
  const colorKey = cardLevelHash[level]?.color || 'logoBlue';
  const colorGetter = (Color as any)[colorKey] || Color.logoBlue;
  const color = colorGetter();

  return {
    '--home-feed-ai-story-color': color,
    '--home-feed-ai-story-color-soft': colorGetter(0.2),
    '--home-feed-ai-story-color-muted': colorGetter(0.72)
  } as React.CSSProperties & {
    '--home-feed-ai-story-color': string;
    '--home-feed-ai-story-color-soft': string;
    '--home-feed-ai-story-color-muted': string;
  };
}

export function AudioWavePreview({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`home-feed-card__audio-wave${
        small ? ' home-feed-card__audio-wave--small' : ''
      }`}
    >
      {Array.from({ length: 13 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export function getReadableAIStoryPreview(story: unknown) {
  if (typeof story !== 'string') return '';
  const text = story.trim().replace(/\s+/g, ' ');
  if (!text) return '';

  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return '';
      }
      if (parsed && typeof parsed === 'object') {
        return '';
      }
    } catch {
      return text;
    }
  }

  return text;
}

export function getAIStoryImageUrl(aiStory: any) {
  const directUrl =
    typeof aiStory?.imageUrl === 'string' ? aiStory.imageUrl.trim() : '';
  if (directUrl) return directUrl;

  const imagePath =
    typeof aiStory?.imagePath === 'string' ? aiStory.imagePath.trim() : '';
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

function stopFeedCardNestedClick(event: React.MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

function normalizeInternalEmbedSrc(src: string) {
  try {
    const url = new URL(src, 'https://twinkle.local');
    const parts = url.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    const linkType = parts[0] || '';
    if (!['app', 'apps', 'build', 'builds'].includes(linkType)) return src;

    const buildId =
      parts[1] === 'build' || parts[1] === 'builds' ? parts[2] : parts[1];
    const buildIdNumber = Math.floor(Number(buildId || 0));
    if (buildIdNumber <= 0) return src;

    return `/app/${buildIdNumber}${url.search}${url.hash}`;
  } catch {
    return src;
  }
}

function getSubjectIdFromInternalSrc(src: string) {
  try {
    const url = new URL(src, 'https://twinkle.local');
    const parts = url.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts[0] !== 'subjects') return 0;
    return Math.floor(Number(parts[1] || 0));
  } catch {
    return 0;
  }
}

function getContentAttachmentFilePath(source: any) {
  return String(source?.filePath || source?.actualFilePath || '').trim();
}

function MarkdownImagePreview({
  className,
  imageEmbed
}: {
  className?: string;
  imageEmbed: MarkdownImageEmbed;
}) {
  const [src, setSrc] = useState(imageEmbed.src);
  const [failed, setFailed] = useState(false);
  const { extension, fileName, fileType } = getMarkdownEmbedFileInfo(
    imageEmbed.src
  );

  useEffect(() => {
    setSrc(imageEmbed.src);
    setFailed(false);
  }, [imageEmbed.src]);

  if (fileType && fileType !== 'image') {
    return (
      <div className={className}>
        <AttachmentCard
          extension={extension}
          fileName={imageEmbed.alt || fileName}
          fileType={fileType}
        />
      </div>
    );
  }

  if (failed) {
    return (
      <div className={`${className || ''} home-feed-card__embed-fallback`}>
        <Icon icon="image" />
        <span>{imageEmbed.alt || fileName}</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={imageEmbed.alt || 'Image'}
      loading="lazy"
      onError={handleImageError}
    />
  );

  function handleImageError() {
    const repairSrc = getEmbedSvgRepairImageUrl(src);
    if (repairSrc && repairSrc !== src) {
      setSrc(repairSrc);
      return;
    }
    setFailed(true);
  }
}
