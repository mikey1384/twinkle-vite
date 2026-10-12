import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNestedNavigate } from '~/contexts/NestedNavigationContext';
import CardThumb from '~/components/CardThumb';
import { BuildMiniCard } from '~/components/Build/Cards';
import ContentFileViewer from '~/components/ContentFileViewer';
import { getAiEnergyPlaceholderName } from '~/components/Comments/AiEnergySponsorButton';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import RichText from '~/components/Texts/RichText';
import { compactMarkdownPreviewStyles } from '~/components/Texts/RichText/previewTypography';
import {
  getExternalLinkUrl,
  getInternalPath
} from '~/helpers/referenceLinkHelpers';
import UsernameText from '~/components/Texts/UsernameText';
import CompactSubjectEmbedPreview from '~/components/Subjects/CompactSubjectEmbedPreview';
import { Color, mobileMaxWidth } from '~/constants/css';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import {
  getInternalEmbedCommentLabel,
  getInternalEmbedPreviewInfo,
  type InternalEmbedPreviewInfo
} from '~/helpers/aiCardEmbedHelpers';
import { getEmbedSvgRepairImageUrl } from '~/helpers/embedSvgRepairHelpers';
import { useContentState, useLiveComment } from '~/helpers/hooks';
import {
  fetchedVideoCodeFromURL,
  getFileInfoFromFileName,
  getPlainPreviewText,
  isValidYoutubeUrl
} from '~/helpers/stringHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import { css } from '@emotion/css';
import { SITE_NAME } from '~/constants/siteBrand';

interface CompactCommentEmbedPreviewProps {
  className?: string;
  comment: any;
  contentId?: number;
  isNested?: boolean;
  maxTextLines?: number;
  onOpen?: () => void;
  renderInternalEmbedPreview?: (args: {
    commentId: number;
    embed: MarkdownMediaEmbed;
    theme?: string;
    userId?: number;
    variant: 'column' | 'compact' | 'targetRoot';
  }) => React.ReactNode;
  showTypeLabel?: boolean;
  theme?: string;
  userId?: number;
  variant?: 'column' | 'compact' | 'targetRoot';
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
  renderInternalEmbedPreview,
  showTypeLabel = true,
  theme,
  userId,
  variant = 'compact'
}: CompactCommentEmbedPreviewProps) {
  const commentId = Number(comment?.id || comment?.commentId || contentId || 0);
  // Embedded previews are handed a snapshot of the comment (feed payload,
  // target object, markdown embed). The content context holds the copy that
  // stays current, so edits and sponsored AI Energy replies show up here too.
  // `contentId` is only a safe stand-in for this comment's own id when the
  // snapshot carries no ids at all (an embed whose comment has not loaded yet).
  // Where the snapshot has a `commentId`, that is its parent, so never overlay
  // from it.
  const liveComment = useLiveComment(
    comment,
    Number(comment?.id || (comment?.commentId ? 0 : contentId) || 0)
  );
  const isTargetRoot = variant === 'targetRoot';
  const isColumn = variant === 'column';
  const uploader = getCommentUploader(liveComment);
  const isAIMessage = isAICommentAuthor(uploader.id);
  const rawContent = String(liveComment?.content || '');
  const aiEnergyPlaceholderName = getAiEnergyPlaceholderName(liveComment);
  const markdownMedia = useMemo(
    () => getMarkdownMediaEmbeds(rawContent).slice(0, 3),
    [rawContent]
  );
  const textContent = useMemo(
    () =>
      aiEnergyPlaceholderName
        ? `${aiEnergyPlaceholderName} needs AI Energy`
        : removeMarkdownMediaEmbeds(rawContent),
    [aiEnergyPlaceholderName, rawContent]
  );
  const attachment = getAttachmentInfo(liveComment);
  // Embeds that have a picture to show (images, videos, apps, AI cards,
  // subject cards) get a media tile. Everything else, nested comments above
  // all, reads as a one-line reference under the text: a lone icon tile
  // ("Comment", "Link") would carry no content and float beside the comment.
  const canRenderSharedInternal = Boolean(renderInternalEmbedPreview);
  const tileEmbeds = markdownMedia.filter((embed) =>
    isTileEmbed({ canRenderSharedInternal, embed, isColumn })
  );
  const referenceEmbeds = markdownMedia.filter(
    (embed) => !isTileEmbed({ canRenderSharedInternal, embed, isColumn })
  );
  const mediaItems = [
    ...(attachment ? [attachment] : []),
    ...tileEmbeds.map((embed) => ({
      kind: 'markdown' as const,
      embed
    }))
  ];
  const shownMediaItems = mediaItems.slice(0, isTargetRoot || isColumn ? 1 : 2);
  const extraMediaCount = Math.max(
    0,
    mediaItems.length - shownMediaItems.length
  );
  // The column slot has a fixed height: one reference line, and the text
  // gives up lines for it so the reference is never cut off at the bottom.
  const shownReferenceEmbeds = referenceEmbeds.slice(0, isColumn ? 1 : 2);
  const hasText = Boolean(textContent.trim());
  const hasReferences = shownReferenceEmbeds.length > 0;
  const appliedMaxTextLines =
    isColumn && hasReferences ? Math.min(maxTextLines, 2) : maxTextLines;
  const hasMedia = shownMediaItems.length > 0;
  const hasBuildMedia = shownMediaItems.some(
    (item) =>
      item?.kind === 'markdown' &&
      item.embed.type === 'internal' &&
      item.embed.internalInfo?.kind === 'build'
  );
  const interactive = Boolean(onOpen);
  // Reference lines are links. A link may not sit inside role="button", so
  // when the preview has them the outer box stays clickable for pointers but
  // drops the button role, and keyboard and screen-reader users open the
  // comment with a visually hidden "Open comment" button instead.
  const outerIsButton = interactive && !hasReferences;

  return (
    <div
      className={[
        compactCommentEmbedPreviewClass,
        className,
        hasMedia ? 'compact-comment-embed--has-media' : '',
        hasBuildMedia ? 'compact-comment-embed--build-media' : '',
        !hasText && !hasReferences ? 'compact-comment-embed--media-only' : '',
        isNested ? 'compact-comment-embed--nested' : '',
        isTargetRoot ? 'compact-comment-embed--target-root' : '',
        isColumn ? 'compact-comment-embed--column' : '',
        hasReferences ? 'compact-comment-embed--with-reference' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      data-compact-comment-embed="true"
      // Without role="button" the feed card's tap handler must still treat
      // this box as its own target, or a tap on the text would open the card.
      data-feed-card-interactive={interactive ? 'true' : undefined}
      role={outerIsButton ? 'button' : undefined}
      tabIndex={outerIsButton ? 0 : undefined}
      onClick={interactive ? handleOpen : undefined}
      onKeyDown={outerIsButton ? handleKeyDown : undefined}
    >
      {interactive && !outerIsButton ? (
        <button
          className="compact-comment-embed__open"
          type="button"
          onClick={handleOpen}
        >
          Open comment
        </button>
      ) : null}
      <div className="compact-comment-embed__avatar">
        <ProfilePic
          userId={uploader.id}
          profilePicUrl={uploader.profilePicUrl}
          style={{
            width: isTargetRoot
              ? '5.45rem'
              : isColumn
                ? hasReferences
                  ? '4.8rem'
                  : '6rem'
                : isNested
                  ? '3.4rem'
                  : '4.1rem'
          }}
        />
      </div>
      <div className="compact-comment-embed__copy">
        <div className="compact-comment-embed__meta">
          {showTypeLabel ? (
            <span
              aria-label="Comment"
              className="compact-comment-embed__type-cue"
              role="img"
            >
              <Icon icon="comment" />
            </span>
          ) : null}
          {uploader.username ? (
            <UsernameText
              className="compact-comment-embed__username"
              textStyle={isTargetRoot ? targetRootUsernameTextStyle : undefined}
              user={uploader}
            />
          ) : (
            <strong>Unknown user</strong>
          )}
          {liveComment?.timeStamp ? (
            <span className="compact-comment-embed__timestamp">
              {timeSince(liveComment.timeStamp)}
            </span>
          ) : null}
        </div>
        {hasText ? (
          <RichText
            contentId={commentId}
            contentType="comment"
            hideDictation={isAIMessage}
            isAIMessage={isAIMessage}
            isPreview
            lineHeight={isTargetRoot ? 1.22 : isColumn ? 1.35 : undefined}
            maxLines={appliedMaxTextLines}
            section="content"
            theme={theme}
          >
            {textContent}
          </RichText>
        ) : hasReferences ? null : (
          <p className="compact-comment-embed__empty">
            {hasMedia ? getMediaOnlyLabel(shownMediaItems[0]) : 'View comment'}
          </p>
        )}
        {shownReferenceEmbeds.map((embed, index) => (
          <EmbedReferenceLine key={`${embed.src}-${index}`} embed={embed} />
        ))}
      </div>
      {hasMedia ? (
        <div className="compact-comment-embed__media">
          {shownMediaItems.map((item, index) => (
            <CommentMediaPreview
              key={`${item.kind}-${index}`}
              commentId={commentId}
              item={item}
              renderInternalEmbedPreview={renderInternalEmbedPreview}
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

  function handleOpen(event: React.MouseEvent<HTMLElement>) {
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
  renderInternalEmbedPreview,
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
  renderInternalEmbedPreview?: CompactCommentEmbedPreviewProps['renderInternalEmbedPreview'];
  theme?: string;
  userId?: number;
  variant: 'column' | 'compact' | 'targetRoot';
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
    const sharedInternalPreview = renderInternalEmbedPreview?.({
      commentId,
      embed: item.embed,
      theme,
      userId,
      variant
    });
    if (sharedInternalPreview) return <>{sharedInternalPreview}</>;

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
    if (
      item.embed.internalInfo?.kind === 'subject' &&
      item.embed.internalInfo.contentId
    ) {
      return (
        <MarkdownSubjectPreview
          contentId={item.embed.internalInfo.contentId}
          label={item.embed.internalInfo.label}
        />
      );
    }
    if (
      item.embed.internalInfo?.kind === 'video' &&
      item.embed.internalInfo.contentId
    ) {
      return (
        <MarkdownInternalVideoPreview
          alt={item.embed.alt}
          contentId={item.embed.internalInfo.contentId}
        />
      );
    }
  }

  return <MarkdownLinkPreview embed={item.embed} />;
}

function isTileEmbed({
  canRenderSharedInternal,
  embed,
  isColumn
}: {
  canRenderSharedInternal: boolean;
  embed: MarkdownMediaEmbed;
  isColumn: boolean;
}) {
  if (embed.type === 'image' || embed.type === 'video') return true;
  if (embed.type !== 'internal') return false;
  const kind = embed.internalInfo?.kind;
  if (kind === 'comment') return false;
  if (kind === 'aiCard' || kind === 'build' || kind === 'video') return true;
  // The column slot is too narrow for a subject card; its title reads better
  // as a reference line than as a clipped sliver.
  if (kind === 'subject') return !isColumn;
  return canRenderSharedInternal;
}

function EmbedReferenceLine({ embed }: { embed: MarkdownMediaEmbed }) {
  const info = embed.internalInfo;
  if (info?.kind === 'comment' && info.contentId) {
    return <CommentReferenceLine commentId={info.contentId} />;
  }
  if (info?.kind === 'subject' && info.contentId) {
    return (
      <SubjectReferenceLine
        contentId={info.contentId}
        fallbackTitle={embed.alt || info.label}
      />
    );
  }
  if (embed.type === 'internal') {
    return (
      <ReferenceLine
        icon={getMarkdownLinkPreviewIcon(embed)}
        to={getInternalPath(embed.src, info?.normalizedSrc)}
      >
        <span>{embed.alt || getMarkdownMediaLabel(embed)}</span>
      </ReferenceLine>
    );
  }
  const externalUrl = getExternalLinkUrl(embed.src);
  return (
    <ReferenceLine
      href={externalUrl ? externalUrl.href : undefined}
      icon={getMarkdownLinkPreviewIcon(embed)}
    >
      {embed.alt ? <strong>{embed.alt}</strong> : null}
      <span>
        {externalUrl
          ? externalUrl.hostname.replace(/^www\./, '')
          : embed.src || getMarkdownMediaLabel(embed)}
      </span>
    </ReferenceLine>
  );
}

function CommentReferenceLine({ commentId }: { commentId: number }) {
  const { content: comment, status } = useEmbeddedContent({
    contentId: commentId,
    contentType: 'comment'
  });

  if (status !== 'loaded') {
    return (
      <ReferenceLine
        icon="comment"
        label="Comment"
        to={status === 'loading' ? `/comments/${commentId}` : ''}
      >
        <span className="compact-comment-embed__reference-muted">
          {status === 'loading' ? 'Loading comment…' : 'Comment unavailable'}
        </span>
      </ReferenceLine>
    );
  }

  const username = String(
    comment?.uploader?.username || comment?.username || ''
  );
  const rawText = String(comment?.content || '');
  const text = getPlainPreviewText(removeMarkdownMediaEmbeds(rawText));
  const nestedEmbed = getMarkdownMediaEmbeds(rawText)[0];
  const body =
    text ||
    (nestedEmbed
      ? nestedEmbed.type === 'internal'
        ? getInternalEmbedCommentLabel(nestedEmbed.internalInfo || null)
        : `shared ${getMarkdownMediaLabel(nestedEmbed).toLowerCase()}`
      : 'View comment');

  return (
    <ReferenceLine
      ariaLabel={`Comment${username ? ` by ${username}` : ''}: ${truncateLabel(body)}`}
      icon="comment"
      label="Comment"
      to={`/comments/${commentId}`}
    >
      {username ? <strong>{username}</strong> : null}
      <span>{body}</span>
    </ReferenceLine>
  );
}

function SubjectReferenceLine({
  contentId,
  fallbackTitle
}: {
  contentId: number;
  fallbackTitle: string;
}) {
  const { content: subject, status } = useEmbeddedContent({
    contentId,
    contentType: 'subject'
  });
  const title = getPlainPreviewText(subject?.title || '') || fallbackTitle;

  return (
    <ReferenceLine
      icon="comments"
      label="Subject"
      to={status === 'unavailable' ? '' : `/subjects/${contentId}`}
    >
      <strong>{title}</strong>
    </ReferenceLine>
  );
}

// Each reference opens what it names, not the comment around it. It is an
// anchor (so the feed card's nested-interactive check skips it). A plain left
// click navigates through the surface's nested-navigation handler when there
// is one (the home feed card's, which saves the scroll anchor and records the
// owner trace), else the router. Modified and middle clicks are left to the
// browser so they open a new tab. Enter is the anchor's own activation key
// and Space is left alone, as for any link.
function ReferenceLine({
  ariaLabel,
  children,
  href,
  icon,
  label,
  to: rawTo
}: {
  ariaLabel?: string;
  children: React.ReactNode;
  href?: string;
  icon: string;
  label?: string;
  to?: string;
}) {
  const navigate = useNavigate();
  const nestedNavigate = useNestedNavigate();
  // never a protocol-relative "//host" path, whatever the caller passed
  const to =
    rawTo && rawTo.startsWith('/') && !rawTo.startsWith('//') ? rawTo : '';
  const content = (
    <>
      <span
        aria-label={label}
        className="compact-comment-embed__reference-icon"
        role={label ? 'img' : undefined}
      >
        <Icon icon={icon} />
      </span>
      <span className="compact-comment-embed__reference-text">{children}</span>
    </>
  );

  if (!to && !href) {
    return <span className="compact-comment-embed__reference">{content}</span>;
  }

  return (
    <a
      aria-label={ariaLabel}
      className="compact-comment-embed__reference compact-comment-embed__reference--link"
      data-feed-card-interactive="true"
      href={to || href}
      rel={href ? 'noopener noreferrer' : undefined}
      target={href ? '_blank' : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {content}
    </a>
  );

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // The outer preview must never also open.
    event.stopPropagation();
    if (!to || isModifiedClick(event)) return;
    event.preventDefault();
    if (nestedNavigate) {
      nestedNavigate(to, event.currentTarget);
      return;
    }
    navigate(to);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLAnchorElement>) {
    // Enter activates the anchor (a click follows); keep it from also
    // reaching any key handler around the preview.
    if (event.key === 'Enter') event.stopPropagation();
  }
}

function truncateLabel(text: string, max = 80) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function isModifiedClick(event: React.MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function MarkdownInternalVideoPreview({
  alt,
  contentId
}: {
  alt: string;
  contentId: number;
}) {
  const { content: video } = useEmbeddedContent({
    contentId,
    contentType: 'video'
  });
  const videoCode = String(video?.content || '');

  if (!videoCode) {
    return (
      <div className="compact-comment-embed__media-tile fallback">
        <Icon icon="play" />
        <span>{alt || video?.title || 'Video'}</span>
      </div>
    );
  }

  return (
    <div className="compact-comment-embed__media-tile video">
      <img
        src={`https://img.youtube.com/vi/${videoCode}/mqdefault.jpg`}
        alt={alt || video?.title || 'Video preview'}
        loading="lazy"
      />
      <span className="compact-comment-embed__media-play">
        <Icon icon="play" />
      </span>
    </div>
  );
}

// Loads an embedded content into the shared content state, so nested
// previews show live data. Content already in the store is used as is, and
// concurrent loads of the same content share one request.
const embeddedContentLoads = new Map<string, Promise<any>>();
// Not-found contents are remembered for the session, so a deleted nested
// comment is not requested again each time its card remounts.
const unavailableEmbeddedContent = new Set<string>();

function useEmbeddedContent({
  contentId,
  contentType
}: {
  contentId: number;
  contentType: string;
}): {
  content: any;
  status: 'loaded' | 'loading' | 'unavailable';
} {
  const [failedKey, setFailedKey] = useState('');
  const contentState = useContentState({ contentId, contentType });
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const requestKey = `${userId || 0}:${contentType}:${contentId}`;

  useEffect(() => {
    if (
      !contentId ||
      contentState.loaded ||
      failedKey === requestKey ||
      unavailableEmbeddedContent.has(requestKey)
    ) {
      return;
    }
    const requestUserId = userId;
    let cancelled = false;
    let request = embeddedContentLoads.get(requestKey);
    if (!request) {
      request = Promise.resolve(loadContent({ contentId, contentType }))
        .then((data: any) => {
          if (data && !data.notFound && !checkUserChange(requestUserId)) {
            onInitContent({ ...data, contentId, contentType });
          }
          return data;
        })
        .finally(() => {
          embeddedContentLoads.delete(requestKey);
        });
      embeddedContentLoads.set(requestKey, request);
    }
    request
      .then((data: any) => {
        if (cancelled || checkUserChange(requestUserId)) return;
        if (data?.notFound) unavailableEmbeddedContent.add(requestKey);
        if (!data || data.notFound) setFailedKey(requestKey);
      })
      .catch((error: unknown) => {
        if (cancelled || checkUserChange(requestUserId)) return;
        console.error(error);
        setFailedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
    // checkUserChange/loadContent/onInitContent are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentState.loaded, failedKey, requestKey]);

  if (contentState.loaded && !contentState.notFound) {
    return { content: contentState, status: 'loaded' };
  }
  if (
    !contentId ||
    contentState.notFound ||
    failedKey === requestKey ||
    unavailableEmbeddedContent.has(requestKey)
  ) {
    return { content: null, status: 'unavailable' };
  }
  return { content: null, status: 'loading' };
}

function MarkdownSubjectPreview({
  contentId,
  label
}: {
  contentId: number;
  label: string;
}) {
  const { content: subject } = useEmbeddedContent({
    contentId,
    contentType: 'subject'
  });
  const previewContent = subject || {
    contentId,
    contentType: 'subject',
    id: contentId,
    title: label
  };

  return (
    <div className="compact-comment-embed__media-tile subject">
      <CompactSubjectEmbedPreview
        content={previewContent}
        contentId={contentId}
      />
    </div>
  );
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
  const { content: build } = useEmbeddedContent({
    contentId,
    contentType: 'build'
  });
  const previewContent = build || {
    contentId,
    contentType: 'build',
    id: contentId,
    title: label
  };

  return (
    <div className="compact-comment-embed__media-tile build">
      <BuildMiniCard
        build={previewContent}
        cacheInput={Boolean(build)}
        interactiveBadges={false}
        variant="thumbEmbed"
      />
    </div>
  );
}

function MarkdownLinkPreview({ embed }: { embed: MarkdownMediaEmbed }) {
  const videoCode =
    embed.type === 'video' ? fetchedVideoCodeFromURL(embed.src) : '';
  const icon = getMarkdownLinkPreviewIcon(embed);

  if (videoCode) {
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
    id: Number(uploader.id || comment?.userId || comment?.uploaderId || 0),
    profilePicUrl: uploader.profilePicUrl || comment?.profilePicUrl || '',
    profileTheme: uploader.profileTheme || comment?.profileTheme || '',
    realName: uploader.realName || comment?.realName || '',
    username: uploader.username || comment?.username || ''
  };
}

function isAICommentAuthor(uploaderId: number) {
  return (
    uploaderId === Number(ZERO_TWINKLE_ID) ||
    uploaderId === Number(CIEL_TWINKLE_ID)
  );
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
  if (internalInfo) {
    return 'internal';
  }
  if (isValidYoutubeUrl(src)) {
    return 'video';
  }
  if (/\.(apng|avif|gif|hei[cf]|jpe?g|png|webp|svg)(\?|#|$)/i.test(src)) {
    return 'image';
  }
  return 'link';
}

function getMarkdownMediaLabel(embed: MarkdownMediaEmbed) {
  if (embed.type === 'internal') {
    return embed.internalInfo?.label || `${SITE_NAME} content`;
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
  &[role='button'],
  &[data-feed-card-interactive='true'] {
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
    grid-template-columns: 4.8rem minmax(0, 1fr) minmax(12rem, 18.4rem);
    align-items: center;
    gap: 0.72rem;
    padding: 0.68rem;
  }
  &.compact-comment-embed--target-root.compact-comment-embed--media-only {
    grid-template-columns: 4.8rem minmax(0, 1fr) minmax(12rem, 18.4rem);
    align-items: center;
    gap: 0.72rem;
    padding: 0.68rem;
  }
  .compact-comment-embed__avatar {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: center;
  }
  &.compact-comment-embed--target-root > .compact-comment-embed__avatar {
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
  &.compact-comment-embed--target-root.compact-comment-embed--has-media
    > .compact-comment-embed__avatar,
  &.compact-comment-embed--target-root.compact-comment-embed--media-only
    > .compact-comment-embed__avatar {
    grid-column: 1;
    grid-row: auto;
    align-self: center;
    width: 4.8rem;
    height: 4.8rem;
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
  .compact-comment-embed__meta .compact-comment-embed__timestamp {
    color: ${Color.gray()};
    font-size: 1.1rem;
    font-weight: 600;
    white-space: nowrap;
  }
  /* "This is a comment" stays a quiet hint beside the author; the name and
     text carry the preview. */
  .compact-comment-embed__meta .compact-comment-embed__type-cue {
    display: inline-flex;
    flex: 0 0 auto;
    align-self: center;
    color: ${Color.gray()};
    font-size: 1rem;
    line-height: 1;
  }
  .compact-comment-embed__reference {
    display: flex;
    min-width: 0;
    max-width: 100%;
    align-items: center;
    gap: 0.45rem;
    padding: 0.32rem 0.6rem;
    border-left: 2px solid ${Color.borderGray()};
    border-radius: 0.5rem;
    background: ${Color.whiteGray(0.7)};
    color: ${Color.darkGray()};
    font-size: max(1.15rem, 11.5px);
    font-weight: 500;
    line-height: 1.3;
  }
  /* Keyboard and screen-reader way to open a preview whose box holds links
     (see outerIsButton): hidden until focused, then the box shows a ring. */
  .compact-comment-embed__open {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    margin: -1px;
    padding: 0;
    border: 0;
    white-space: nowrap;
  }
  &:has(> .compact-comment-embed__open:focus-visible) {
    outline: 2px solid ${Color.logoBlue(0.6)};
    /* inside the box: hero slots clip anything drawn outside it */
    outline-offset: -2px;
  }
  .compact-comment-embed__reference--link {
    position: relative;
    color: ${Color.darkGray()};
    text-decoration: none;
    cursor: pointer;
  }
  /* The tap target is the line's own box and nothing outside it, so a tap
     on the comment text or a neighbouring line never lands here. It gets
     its height from its own padding, not from an overlay. */
  .compact-comment-embed__reference--link {
    min-height: max(2.8rem, 28px);
    padding-block: 0.4rem;
  }
  @media (hover: hover) and (pointer: fine) {
    .compact-comment-embed__reference--link:hover {
      background: ${Color.whiteGray()};
    }
    .compact-comment-embed__reference--link:hover
      .compact-comment-embed__reference-text
      > span {
      text-decoration: underline;
    }
  }
  .compact-comment-embed__reference--link:focus-visible {
    outline: 2px solid ${Color.logoBlue(0.6)};
    outline-offset: 1px;
  }
  .compact-comment-embed__reference-muted {
    color: ${Color.gray()};
    font-style: italic;
  }
  .compact-comment-embed__reference-icon {
    display: inline-flex;
    flex: 0 0 auto;
    color: ${Color.gray()};
    font-size: 0.9em;
  }
  .compact-comment-embed__reference-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .compact-comment-embed__reference-text strong {
    margin-right: 0.38rem;
    color: ${Color.darkerGray()};
    font-weight: 750;
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
  /* The thumbnail fills whatever box the layout gives the tile and never
     sizes it, so a loaded image cannot grow the embed. */
  .compact-comment-embed__media-tile.video img {
    position: absolute;
    inset: 0;
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
    padding: 0;
    background: color-mix(in srgb, ${Color.logoBlue()} 7%, #ffffff);
    color: ${Color.logoBlue()};
    font-size: 1rem;
    font-weight: 850;
  }
  .compact-comment-embed__media-tile.subject {
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
  }
  .compact-comment-embed__media-tile.subject > * {
    width: 100%;
    height: 100%;
  }
  .compact-comment-embed__media-tile.attachment > div {
    height: 100%;
  }
  /* Internal cards (including error replacements) own their frame. */
  .compact-comment-embed__media-tile.home-feed-card__rich-embed-internal {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    padding: 0;
    border: 0;
    background: transparent;
  }
  .compact-comment-embed__media-tile.home-feed-card__rich-embed-internal > * {
    width: 100%;
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
  &.compact-comment-embed--target-root > .compact-comment-embed__copy {
    grid-column: 2;
    gap: 0.48rem;
    /* Sets the em base inherited by the RichText root, which owns the
       block-preview max-height clamp. Must match the rendered <p> font-size
       below so multi-paragraph previews clamp to exactly maxLines (with
       lineHeight=1.22), not fewer. RichText adds no literal .rich-text class,
       so the root can only be reached via inheritance from here. */
    font-size: max(1.78rem, 17.8px);
  }
  &.compact-comment-embed--target-root.compact-comment-embed--has-media
    > .compact-comment-embed__copy,
  &.compact-comment-embed--target-root.compact-comment-embed--media-only
    > .compact-comment-embed__copy {
    grid-column: 2;
    grid-row: auto;
    align-self: stretch;
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta {
    gap: 0.42rem;
    color: ${Color.gray()};
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta
    > div,
  &.compact-comment-embed--target-root
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta
    strong {
    color: var(--home-feed-target-accent, ${Color.logoBlue()});
    font-size: 1.62rem;
    font-weight: 650;
  }
  &.compact-comment-embed--target-root > .compact-comment-embed__copy p {
    color: ${Color.darkerGray()};
    font-size: max(1.78rem, 17.8px);
    font-weight: 500;
    line-height: 1.22;
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__copy
    > .compact-comment-embed__empty {
    color: ${Color.darkerGray()};
    font-size: max(1.72rem, 17.2px);
    font-weight: 500;
    line-height: 1.2;
  }
  &.compact-comment-embed--target-root > .compact-comment-embed__media {
    grid-column: 3;
    justify-self: end;
    align-self: center;
    width: auto;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    aspect-ratio: 1 / 1;
    min-height: 0;
  }
  &.compact-comment-embed--target-root.compact-comment-embed--has-media
    > .compact-comment-embed__media,
  &.compact-comment-embed--target-root.compact-comment-embed--media-only
    > .compact-comment-embed__media {
    grid-column: 3;
    grid-row: auto;
    justify-self: end;
    align-self: center;
    width: auto;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    aspect-ratio: 1 / 1;
    min-height: 0;
  }
  &.compact-comment-embed--target-root.compact-comment-embed--build-media
    > .compact-comment-embed__media {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
  }
  &.compact-comment-embed--target-root.compact-comment-embed--build-media
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile.home-feed-card__rich-embed-internal--build
    > * {
    height: 100%;
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile {
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile.home-feed-card__rich-embed-internal {
    border: 0;
    background: transparent;
    box-shadow: none;
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile.home-feed-card__rich-embed-internal--subject {
    box-sizing: border-box;
    align-self: center;
    justify-self: end;
    width: calc(100% - 0.72rem);
    height: auto;
    max-width: calc(100% - 0.72rem);
    max-height: calc(100% - 0.72rem);
    aspect-ratio: 1 / 1;
    margin: 0.36rem 0.36rem 0.36rem 0;
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile.image,
  &.compact-comment-embed--target-root
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile.video
    img,
  &.compact-comment-embed--target-root
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile.attachment
    img {
    object-fit: cover;
  }
  &.compact-comment-embed--target-root
    > .compact-comment-embed__media
    > .compact-comment-embed__media-tile.fallback {
    gap: 0.48rem;
    padding: 0.7rem;
    background: linear-gradient(180deg, #fff 0%, ${Color.whiteGray(0.65)} 100%);
    font-size: 1.08rem;
  }
  .home-feed-card__rich-embed-image & {
    border: 0;
    border-radius: 0;
    background: transparent;
  }
  .home-feed-card__rich-embed-image & .compact-comment-embed__media-tile {
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  &.compact-comment-embed--target-root .compact-main-content-embed__label,
  &.compact-comment-embed--target-root
    .compact-main-content-embed__effort-badge {
    font-weight: 650;
  }
  &.compact-comment-embed--target-root
    .home-feed-card__rich-embed-internal--subject
    .compact-main-content-embed__effort-xp {
    display: none;
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
      grid-template-columns: 4.2rem minmax(0, 1fr) minmax(6.8rem, 9.2rem);
    }
    &.compact-comment-embed--target-root
      > .compact-comment-embed__copy
      > .compact-comment-embed__meta
      > div,
    &.compact-comment-embed--target-root
      > .compact-comment-embed__copy
      > .compact-comment-embed__meta
      strong {
      font-size: 1.34rem;
    }
    &.compact-comment-embed--target-root > .compact-comment-embed__avatar {
      width: 5rem;
      height: 5rem;
    }
    &.compact-comment-embed--target-root.compact-comment-embed--has-media
      > .compact-comment-embed__avatar,
    &.compact-comment-embed--target-root.compact-comment-embed--media-only
      > .compact-comment-embed__avatar {
      width: 4.2rem;
      height: 4.2rem;
    }
    &.compact-comment-embed--target-root > .compact-comment-embed__copy {
      font-size: max(1.42rem, 14.2px);
    }
    &.compact-comment-embed--target-root > .compact-comment-embed__copy p {
      font-size: max(1.42rem, 14.2px);
    }
    &.compact-comment-embed--target-root
      > .compact-comment-embed__copy
      > .compact-comment-embed__empty {
      font-size: max(1.42rem, 14.2px);
    }
  }
  @container (max-width: 28rem) {
    &.compact-comment-embed--has-media:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column),
    &.compact-comment-embed--media-only:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column) {
      grid-template-columns: 4.2rem minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) auto;
      align-items: stretch;
      gap: 0.55rem 0.7rem;
      padding: 0.6rem;
    }
    &.compact-comment-embed--has-media:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column)
      > .compact-comment-embed__avatar,
    &.compact-comment-embed--media-only:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column)
      > .compact-comment-embed__avatar {
      grid-column: 1;
      grid-row: 2;
      align-self: center;
    }
    &.compact-comment-embed--has-media:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column)
      > .compact-comment-embed__copy,
    &.compact-comment-embed--media-only:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column)
      > .compact-comment-embed__copy {
      grid-column: 2;
      grid-row: 2;
      align-self: center;
    }
    &.compact-comment-embed--has-media:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column)
      > .compact-comment-embed__media,
    &.compact-comment-embed--media-only:not(
        .compact-comment-embed--target-root
      ):not(.compact-comment-embed--column)
      > .compact-comment-embed__media {
      grid-column: 1 / -1;
      grid-row: 1;
      width: 100%;
      min-height: 0;
    }
  }
  /* Home feed only: with media, the comment (author + text) comes first and
     the media sits under it as a strip of evenly sized tiles. In the feed's
     fixed-height slots a third grid column squeezed tiles into tall, clipped
     slivers beside a short row of text and left the rest of the slot empty.
     Other surfaces (comments drawer, Earn, preview comments) keep the
     content-height side-by-side row above. */
  .home-feed-card__body
    &.compact-comment-embed--has-media:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column),
  .home-feed-card__body
    &.compact-comment-embed--media-only:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column) {
    grid-template-columns: 4.2rem minmax(0, 1fr);
    grid-template-rows: auto minmax(7rem, 1fr);
    align-items: center;
    align-content: center;
    gap: 0.6rem 0.7rem;
    padding: 0.6rem;
  }
  .home-feed-card__body
    &.compact-comment-embed--has-media:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column)
    > .compact-comment-embed__avatar,
  .home-feed-card__body
    &.compact-comment-embed--media-only:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column)
    > .compact-comment-embed__avatar {
    grid-column: 1;
    grid-row: 1;
    align-self: start;
  }
  .home-feed-card__body
    &.compact-comment-embed--has-media:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column)
    > .compact-comment-embed__copy,
  .home-feed-card__body
    &.compact-comment-embed--media-only:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column)
    > .compact-comment-embed__copy {
    grid-column: 2;
    grid-row: 1;
    align-self: center;
  }
  .home-feed-card__body
    &.compact-comment-embed--has-media:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column)
    > .compact-comment-embed__media,
  .home-feed-card__body
    &.compact-comment-embed--media-only:not(
      .compact-comment-embed--target-root
    ):not(.compact-comment-embed--column)
    > .compact-comment-embed__media {
    grid-template-columns: none;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    grid-column: 1 / -1;
    grid-row: 2;
    width: 100%;
    height: 100%;
    min-height: 7rem;
    max-height: 16rem;
  }
  /* Column variant: fills the home-feed rich-embed hero column (a tall,
     narrow slot sized for image/build heroes). The default horizontal row
     is content-height and leaves the column mostly empty, so stack instead:
     avatar on top, username under it, then timestamp, then the text.
     Kept last in this block so it wins equal-specificity rules above, and
     the frame is dropped because the slot (rich-embed-image) draws its own
     border. align-content centers the whole stack in any leftover slack. */
  &.compact-comment-embed--column {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-auto-rows: auto;
    align-items: start;
    align-content: center;
    justify-items: center;
    gap: 0.6rem;
    height: 100%;
    min-height: 0;
    padding: 1rem 0.9rem;
    border: 0;
    border-radius: inherit;
  }
  &.compact-comment-embed--column.compact-comment-embed--has-media,
  &.compact-comment-embed--column.compact-comment-embed--media-only {
    grid-template-columns: minmax(0, 1fr);
    padding: 1rem 0.9rem;
  }
  &.compact-comment-embed--column > .compact-comment-embed__avatar {
    grid-column: 1;
    grid-row: auto;
    width: auto;
    height: auto;
    align-self: start;
  }
  &.compact-comment-embed--column.compact-comment-embed--with-reference {
    gap: 0.4rem;
    padding-block: 0.8rem;
  }
  &.compact-comment-embed--column.compact-comment-embed--with-reference
    > .compact-comment-embed__copy {
    gap: 0.6rem;
  }
  &.compact-comment-embed--column > .compact-comment-embed__copy {
    grid-column: 1;
    grid-row: auto;
    width: 100%;
    min-height: 0;
    align-self: start;
    justify-content: flex-start;
    /* meta (username + time) reads as part of the avatar block above, so the
       meta -> content gap is larger than the avatar -> meta grid gap */
    gap: 1.1rem;
    font-size: max(1.25rem, 12.5px);
  }
  &.compact-comment-embed--column
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta {
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.18rem 0.32rem;
  }
  /* Cue stays beside the name; the time takes the next line. */
  &.compact-comment-embed--column
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta
    > .compact-comment-embed__timestamp {
    flex-basis: 100%;
    text-align: center;
  }
  &.compact-comment-embed--column
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta
    a,
  &.compact-comment-embed--column
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta
    > div,
  &.compact-comment-embed--column
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta
    strong {
    max-width: 100%;
    font-size: 1.3rem;
  }
  &.compact-comment-embed--column
    > .compact-comment-embed__copy
    > .compact-comment-embed__meta
    .compact-comment-embed__timestamp {
    font-size: max(1.1rem, 11px);
    font-weight: 600;
  }
  &.compact-comment-embed--column > .compact-comment-embed__copy p {
    font-size: max(1.25rem, 12.5px);
    line-height: 1.35;
  }
  &.compact-comment-embed--column
    > .compact-comment-embed__copy
    > .compact-comment-embed__empty {
    white-space: normal;
    text-align: center;
  }
  &.compact-comment-embed--column > .compact-comment-embed__media {
    grid-column: 1;
    grid-row: auto;
    width: 100%;
    height: auto;
    min-height: 4.5rem;
    max-height: 9rem;
    align-self: start;
    justify-self: stretch;
    aspect-ratio: auto;
  }

  /* Media embeds are rendered separately from this text root. */
  ${compactMarkdownPreviewStyles(
    '&& > .compact-comment-embed__copy > [data-rich-text-body]'
  )}
`;
