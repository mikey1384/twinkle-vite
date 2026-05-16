import React, { useEffect, useMemo, useRef, useState } from 'react';
import CardThumb from '~/components/CardThumb';
import ContentFileViewer from '~/components/ContentFileViewer';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import RichText from '~/components/Texts/RichText';
import UsernameText from '~/components/Texts/UsernameText';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useContentContext } from '~/contexts';
import {
  getInternalEmbedCommentLabel,
  getInternalEmbedPreviewInfo,
  type InternalEmbedPreviewInfo
} from '~/helpers/aiCardEmbedHelpers';
import { getBuildDisplayTitle } from '~/helpers/buildRelationshipHelpers';
import { getEmbedSvgRepairImageUrl } from '~/helpers/embedSvgRepairHelpers';
import { useContentState } from '~/helpers/hooks';
import {
  fetchedVideoCodeFromURL,
  getFileInfoFromFileName
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

interface CompactCommentEmbedPreviewProps {
  className?: string;
  comment: any;
  contentId?: number;
  isNested?: boolean;
  maxTextLines?: number;
  onOpen?: () => void;
  showTypeLabel?: boolean;
  theme?: string;
  userId?: number;
  variant?: 'compact' | 'targetRoot';
}

interface MarkdownMediaEmbed {
  alt: string;
  internalInfo?: InternalEmbedPreviewInfo;
  src: string;
  type: 'image' | 'internal' | 'link' | 'video';
}

const targetRootUsernameTextStyle: React.CSSProperties = {
  fontWeight: 600
};

export default function CompactCommentEmbedPreview({
  className = '',
  comment,
  contentId,
  isNested = false,
  maxTextLines = 3,
  onOpen,
  showTypeLabel = true,
  theme,
  userId,
  variant = 'compact'
}: CompactCommentEmbedPreviewProps) {
  const commentId = Number(comment?.id || comment?.commentId || contentId || 0);
  const isTargetRoot = variant === 'targetRoot';
  const uploader = getCommentUploader(comment);
  const rawContent = String(comment?.content || '');
  const markdownMedia = useMemo(
    () => getMarkdownMediaEmbeds(rawContent).slice(0, 3),
    [rawContent]
  );
  const textContent = useMemo(
    () => removeMarkdownMediaEmbeds(rawContent),
    [rawContent]
  );
  const attachment = getAttachmentInfo(comment);
  const mediaItems = [
    ...(attachment ? [attachment] : []),
    ...markdownMedia.map((embed) => ({
      kind: 'markdown' as const,
      embed
    }))
  ];
  const shownMediaItems = mediaItems.slice(0, isTargetRoot ? 1 : 2);
  const extraMediaCount = Math.max(
    0,
    mediaItems.length - shownMediaItems.length
  );
  const hasText = Boolean(textContent.trim());
  const hasMedia = shownMediaItems.length > 0;
  const interactive = Boolean(onOpen);

  return (
    <div
      className={[
        compactCommentEmbedPreviewClass,
        className,
        hasMedia ? 'compact-comment-embed--has-media' : '',
        !hasText ? 'compact-comment-embed--media-only' : '',
        isNested ? 'compact-comment-embed--nested' : '',
        isTargetRoot ? 'compact-comment-embed--target-root' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      data-compact-comment-embed="true"
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? handleOpen : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      <div className="compact-comment-embed__avatar">
        <ProfilePic
          userId={uploader.id}
          profilePicUrl={uploader.profilePicUrl}
          style={{
            width: isTargetRoot ? '5.45rem' : isNested ? '3.4rem' : '4.1rem'
          }}
        />
      </div>
      <div className="compact-comment-embed__copy">
        <div className="compact-comment-embed__meta">
          {showTypeLabel ? <span>Comment</span> : null}
          {uploader.username ? (
            <UsernameText
              textStyle={isTargetRoot ? targetRootUsernameTextStyle : undefined}
              user={{
                id: uploader.id,
                username: uploader.username
              }}
            />
          ) : (
            <strong>Unknown user</strong>
          )}
        </div>
        {hasText ? (
          <RichText
            contentId={commentId}
            contentType="comment"
            isPreview
            maxLines={maxTextLines}
            section="content"
            theme={theme}
          >
            {textContent}
          </RichText>
        ) : (
          <p className="compact-comment-embed__empty">
            {hasMedia ? getMediaOnlyLabel(shownMediaItems[0]) : 'View comment'}
          </p>
        )}
      </div>
      {hasMedia ? (
        <div className="compact-comment-embed__media">
          {shownMediaItems.map((item, index) => (
            <CommentMediaPreview
              key={`${item.kind}-${index}`}
              commentId={commentId}
              item={item}
              theme={theme}
              userId={userId}
              variant={variant}
            />
          ))}
          {extraMediaCount > 0 ? (
            <span className="compact-comment-embed__media-more">
              +{extraMediaCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  function handleOpen(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    onOpen?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    onOpen?.();
  }
}

function CommentMediaPreview({
  commentId,
  item,
  theme,
  userId,
  variant
}: {
  commentId: number;
  item:
    | ReturnType<typeof getAttachmentInfo>
    | {
        embed: MarkdownMediaEmbed;
        kind: 'markdown';
      };
  theme?: string;
  userId?: number;
  variant: 'compact' | 'targetRoot';
}) {
  if (!item) return null;

  if (item.kind === 'attachment') {
    return (
      <div className="compact-comment-embed__media-tile attachment">
        <ContentFileViewer
          compactMode
          isThumb={item.fileType !== 'image'}
          contentId={commentId}
          contentType="comment"
          fileName={item.fileName}
          filePath={item.filePath}
          fileSize={item.fileSize}
          fillPreview={item.fileType === 'image'}
          thumbHeight="100%"
          thumbUrl={item.thumbUrl}
          userIsUploader={Number(item.uploaderId || 0) === Number(userId || 0)}
          videoHeight="100%"
          theme={theme}
        />
      </div>
    );
  }

  if (item.embed.type === 'image') {
    return <MarkdownImagePreview alt={item.embed.alt} src={item.embed.src} />;
  }

  if (item.embed.type === 'internal') {
    if (
      item.embed.internalInfo?.kind === 'aiCard' &&
      item.embed.internalInfo.cardId
    ) {
      return <MarkdownAICardPreview cardId={item.embed.internalInfo.cardId} />;
    }
    if (
      item.embed.internalInfo?.kind === 'build' &&
      item.embed.internalInfo.contentId
    ) {
      return (
        <MarkdownBuildPreview
          contentId={item.embed.internalInfo.contentId}
          label={item.embed.internalInfo.label}
        />
      );
    }
  }

  return <MarkdownLinkPreview embed={item.embed} variant={variant} />;
}

function MarkdownAICardPreview({ cardId }: { cardId: number }) {
  const card = useMemo(() => ({ id: cardId }), [cardId]);

  return (
    <div className="compact-comment-embed__media-tile ai-card">
      <CardThumb card={card as any} />
    </div>
  );
}

function MarkdownBuildPreview({
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
    <div className="compact-comment-embed__media-tile build">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title} loading="lazy" />
      ) : (
        <>
          <Icon icon="rocket" />
          <span>{label}</span>
        </>
      )}
    </div>
  );
}

function MarkdownLinkPreview({
  embed,
  variant
}: {
  embed: MarkdownMediaEmbed;
  variant: 'compact' | 'targetRoot';
}) {
  const videoCode =
    embed.type === 'video' ? fetchedVideoCodeFromURL(embed.src) : '';
  const icon = getMarkdownLinkPreviewIcon(embed);

  if (variant === 'targetRoot' && videoCode) {
    return (
      <div className="compact-comment-embed__media-tile video">
        <img
          src={`https://img.youtube.com/vi/${videoCode}/mqdefault.jpg`}
          alt={embed.alt || 'Video preview'}
          loading="lazy"
        />
        <span className="compact-comment-embed__media-play">
          <Icon icon="play" />
        </span>
      </div>
    );
  }

  return (
    <div className="compact-comment-embed__media-tile fallback">
      <Icon icon={icon} />
      <span>{embed.alt || getMarkdownMediaLabel(embed)}</span>
    </div>
  );
}

function getMarkdownLinkPreviewIcon(embed: MarkdownMediaEmbed) {
  if (embed.type === 'video') return 'play';
  if (embed.type === 'internal') return embed.internalInfo?.icon || 'globe';
  return 'link';
}

function MarkdownImagePreview({ alt, src }: { alt: string; src: string }) {
  const [appliedSrc, setAppliedSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="compact-comment-embed__media-tile fallback">
        <Icon icon="image" />
        <span>{alt || 'Image unavailable'}</span>
      </div>
    );
  }

  return (
    <img
      className="compact-comment-embed__media-tile image"
      src={appliedSrc}
      alt={alt || 'Comment image'}
      loading="lazy"
      onError={handleImageError}
    />
  );

  function handleImageError() {
    const repairSrc = getEmbedSvgRepairImageUrl(appliedSrc);
    if (repairSrc && repairSrc !== appliedSrc) {
      setAppliedSrc(repairSrc);
      return;
    }
    setFailed(true);
  }
}

function getCommentUploader(comment: any) {
  const uploader = comment?.uploader || {};
  return {
    id: Number(uploader.id || comment?.userId || 0),
    profilePicUrl: uploader.profilePicUrl || comment?.profilePicUrl || '',
    username: uploader.username || comment?.username || ''
  };
}

function getAttachmentInfo(comment: any) {
  const filePath = String(comment?.actualFilePath || comment?.filePath || '');
  const thumbUrl = String(comment?.thumbUrl || '');
  if (!filePath && !thumbUrl) return null;
  if (!filePath && thumbUrl) {
    return {
      embed: {
        alt: comment?.fileName || 'Comment image',
        src: thumbUrl,
        type: 'image' as const
      },
      kind: 'markdown' as const
    };
  }

  const fileName = getAttachmentFileName(comment, filePath);
  const { fileType } = getFileInfoFromFileName(fileName);

  return {
    fileName,
    filePath,
    fileSize: comment?.fileSize,
    fileType,
    kind: 'attachment' as const,
    thumbUrl,
    uploaderId: comment?.uploader?.id || comment?.userId
  };
}

function getAttachmentFileName(comment: any, filePath: string) {
  if (comment?.fileName) return String(comment.fileName);
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

function getMarkdownMediaEmbeds(text: string): MarkdownMediaEmbed[] {
  if (!text) return [];
  return Array.from(
    text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g)
  ).map((match) => {
    const src = match[2]?.trim() || '';
    const internalInfo = getInternalEmbedPreviewInfo(src) || undefined;
    return {
      alt: match[1]?.trim() || '',
      internalInfo,
      src,
      type: getMarkdownMediaType(src, internalInfo)
    };
  });
}

function removeMarkdownMediaEmbeds(text: string) {
  return String(text || '')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g, '')
    .trim();
}

function getMarkdownMediaType(
  src: string,
  internalInfo?: InternalEmbedPreviewInfo
): MarkdownMediaEmbed['type'] {
  const normalizedSrc = src.toLowerCase();
  if (internalInfo) {
    return 'internal';
  }
  if (
    normalizedSrc.includes('youtube.com') ||
    normalizedSrc.includes('youtu.be')
  ) {
    return 'video';
  }
  if (/\.(apng|avif|gif|hei[cf]|jpe?g|png|webp|svg)(\?|#|$)/i.test(src)) {
    return 'image';
  }
  return 'link';
}

function getMarkdownMediaLabel(embed: MarkdownMediaEmbed) {
  if (embed.type === 'internal') {
    return embed.internalInfo?.label || 'Twinkle content';
  }
  if (embed.type === 'video') return 'Video';
  if (embed.type === 'image') return 'Image';
  return 'Link';
}

function getMediaOnlyLabel(
  item:
    | ReturnType<typeof getAttachmentInfo>
    | {
        embed: MarkdownMediaEmbed;
        kind: 'markdown';
      }
    | undefined
) {
  if (!item) return 'View comment';
  if (item.kind === 'attachment') {
    if (item.fileType === 'image') return 'shared an image';
    if (item.fileType === 'video') return 'shared a video';
    if (item.fileType === 'audio') return 'shared audio';
    return 'shared a file';
  }
  if (item.embed.type === 'internal') {
    return getInternalEmbedCommentLabel(item.embed.internalInfo || null);
  }
  return `shared ${getMarkdownMediaLabel(item.embed).toLowerCase()}`;
}

const compactCommentEmbedPreviewClass = css`
  display: grid;
  grid-template-columns: 4.8rem minmax(0, 1fr);
  align-items: center;
  gap: 0.72rem;
  width: 100%;
  min-height: 8.4rem;
  overflow: hidden;
  padding: 0.72rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 0.8rem;
  background: #fff;
  color: ${Color.darkerGray()};
  text-align: left;
  &[role='button'] {
    cursor: pointer;
  }
  &.compact-comment-embed--has-media {
    grid-template-columns: 4.8rem minmax(0, 1fr) minmax(8.5rem, 30%);
  }
  &.compact-comment-embed--media-only {
    grid-template-columns: 4.8rem minmax(0, 0.74fr) minmax(10rem, 1fr);
  }
  &.compact-comment-embed--nested {
    min-height: 7rem;
    padding: 0;
    border: 0;
    border-radius: 0;
  }
  &.compact-comment-embed--target-root {
    grid-template-columns: 6rem minmax(0, 1fr);
    height: 100%;
    min-height: 0;
    align-items: center;
    gap: 1rem;
    padding: 0.82rem 0.95rem;
    border: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, #fff 0%, ${Color.whiteGray(0.42)} 100%);
    box-shadow: none;
  }
  &.compact-comment-embed--target-root.compact-comment-embed--has-media {
    grid-template-columns: 6rem minmax(0, 1fr) minmax(8.8rem, 12.4rem);
  }
  &.compact-comment-embed--target-root.compact-comment-embed--media-only {
    grid-template-columns: 6rem minmax(0, 1fr) minmax(9.4rem, 13rem);
  }
  .compact-comment-embed__avatar {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
  }
  &.compact-comment-embed--target-root .compact-comment-embed__avatar {
    grid-column: 1;
    width: 6rem;
    height: 6rem;
    overflow: hidden;
    border: 2px solid #fff;
    border-radius: 999px;
    box-shadow: 0 0 0 1px
      color-mix(
        in srgb,
        var(--home-feed-target-accent, ${Color.logoBlue()}) 48%,
        #ffffff
      );
  }
  .compact-comment-embed__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 0.32rem;
  }
  .compact-comment-embed__meta {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: 0.4rem;
    line-height: 1.1;
  }
  .compact-comment-embed__meta span {
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 850;
  }
  .compact-comment-embed__meta a,
  .compact-comment-embed__meta > div,
  .compact-comment-embed__meta strong {
    min-width: 0;
    overflow: hidden;
    font-size: 1.2rem;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact-comment-embed__copy .rich-text,
  .compact-comment-embed__copy p {
    margin: 0;
  }
  .compact-comment-embed__empty {
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1.08rem;
    font-weight: 800;
    line-height: 1.18;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact-comment-embed__media {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    align-items: stretch;
    gap: 0.32rem;
    min-width: 0;
    height: 100%;
    min-height: 6.5rem;
    overflow: hidden;
  }
  .compact-comment-embed__media-tile {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid ${Color.borderGray()};
    border-radius: 0.68rem;
    background: ${Color.whiteGray()};
  }
  .compact-comment-embed__media-tile.image {
    object-fit: cover;
  }
  .compact-comment-embed__media-tile.video {
    position: relative;
  }
  .compact-comment-embed__media-tile.video img,
  .compact-comment-embed__media-tile.build img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .compact-comment-embed__media-tile.ai-card,
  .compact-comment-embed__media-tile.build {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .compact-comment-embed__media-tile.ai-card {
    background: color-mix(in srgb, ${Color.pink()} 7%, #ffffff);
  }
  .compact-comment-embed__media-tile.ai-card > div {
    transform: scale(0.82);
    transform-origin: center;
  }
  .compact-comment-embed__media-tile.build {
    gap: 0.35rem;
    background: color-mix(in srgb, ${Color.logoBlue()} 7%, #ffffff);
    color: ${Color.logoBlue()};
    font-size: 1rem;
    font-weight: 850;
  }
  .compact-comment-embed__media-tile.build svg {
    color: ${Color.logoBlue()};
    font-size: 1.55rem;
  }
  .compact-comment-embed__media-tile.attachment > div {
    height: 100%;
  }
  .compact-comment-embed__media-tile.attachment img {
    width: 100%;
    height: 100%;
    max-height: none;
    object-fit: cover;
  }
  .compact-comment-embed__media-tile.fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.6rem;
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.1;
    text-align: center;
  }
  .compact-comment-embed__media-tile.fallback svg {
    font-size: 1.55rem;
  }
  .compact-comment-embed__media-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.18);
    color: #fff;
  }
  .compact-comment-embed__media-play svg {
    color: #fff;
    font-size: 1.7rem;
  }
  .compact-comment-embed__media-more {
    position: absolute;
    right: 0.42rem;
    bottom: 0.42rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.48rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.68);
    color: #fff;
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
  }
  &.compact-comment-embed--target-root .compact-comment-embed__copy {
    grid-column: 2;
    gap: 0.48rem;
  }
  &.compact-comment-embed--target-root .compact-comment-embed__meta {
    gap: 0.42rem;
    color: ${Color.gray()};
  }
  &.compact-comment-embed--target-root .compact-comment-embed__meta > div,
  &.compact-comment-embed--target-root .compact-comment-embed__meta strong {
    color: var(--home-feed-target-accent, ${Color.logoBlue()});
    font-size: 1.62rem;
    font-weight: 650;
  }
  &.compact-comment-embed--target-root .compact-comment-embed__copy p {
    color: ${Color.darkerGray()};
    font-size: max(1.78rem, 17.8px);
    font-weight: 500;
    line-height: 1.22;
  }
  &.compact-comment-embed--target-root .compact-comment-embed__empty {
    color: ${Color.darkerGray()};
    font-size: max(1.72rem, 17.2px);
    font-weight: 500;
    line-height: 1.2;
  }
  &.compact-comment-embed--target-root .compact-comment-embed__media {
    grid-column: 3;
    justify-self: end;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  &.compact-comment-embed--target-root .compact-comment-embed__media-tile {
    border-color: color-mix(
      in srgb,
      var(--home-feed-target-accent, ${Color.logoBlue()}) 22%,
      #ffffff
    );
    border-radius: 0.82rem;
    background: #fff;
    box-shadow: 0 0.12rem 0 rgba(15, 23, 42, 0.05);
  }
  &.compact-comment-embed--target-root .compact-comment-embed__media-tile.image,
  &.compact-comment-embed--target-root
    .compact-comment-embed__media-tile.video
    img,
  &.compact-comment-embed--target-root
    .compact-comment-embed__media-tile.attachment
    img {
    object-fit: cover;
  }
  &.compact-comment-embed--target-root
    .compact-comment-embed__media-tile.fallback {
    gap: 0.48rem;
    padding: 0.7rem;
    background: linear-gradient(180deg, #fff 0%, ${Color.whiteGray(0.65)} 100%);
    font-size: 1.08rem;
  }
  &.compact-comment-embed--target-root .compact-main-content-embed__label,
  &.compact-comment-embed--target-root
    .compact-main-content-embed__effort-badge {
    font-weight: 650;
  }
  &.compact-comment-embed--target-root
    .compact-main-content-embed__copy
    strong {
    font-weight: 600;
  }
  &.compact-comment-embed--target-root .compact-main-content-embed__copy p,
  &.compact-comment-embed--target-root .compact-main-content-embed__attachment {
    font-weight: 500;
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 4.2rem minmax(0, 1fr);
    min-height: 8rem;
    padding: 0.62rem;
    &.compact-comment-embed--has-media,
    &.compact-comment-embed--media-only {
      grid-template-columns: 4.2rem minmax(0, 1fr) minmax(7rem, 28%);
    }
    &.compact-comment-embed--target-root {
      grid-template-columns: 5rem minmax(0, 1fr);
    }
    .compact-comment-embed__media {
      min-height: 5.6rem;
    }
    .compact-comment-embed__meta a,
    .compact-comment-embed__meta > div,
    .compact-comment-embed__meta strong {
      font-size: 1.1rem;
    }
    &.compact-comment-embed--target-root.compact-comment-embed--has-media,
    &.compact-comment-embed--target-root.compact-comment-embed--media-only {
      grid-template-columns: 5rem minmax(0, 1fr) minmax(6.8rem, 9.2rem);
    }
    &.compact-comment-embed--target-root .compact-comment-embed__meta > div,
    &.compact-comment-embed--target-root .compact-comment-embed__meta strong {
      font-size: 1.34rem;
    }
    &.compact-comment-embed--target-root .compact-comment-embed__avatar {
      width: 5rem;
      height: 5rem;
    }
    &.compact-comment-embed--target-root .compact-comment-embed__copy p {
      font-size: max(1.42rem, 14.2px);
    }
    &.compact-comment-embed--target-root .compact-comment-embed__empty {
      font-size: max(1.42rem, 14.2px);
    }
  }
`;
