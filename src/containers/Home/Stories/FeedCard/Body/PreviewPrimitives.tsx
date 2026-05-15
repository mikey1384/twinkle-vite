import React, { useEffect, useState } from 'react';
import ContentFileViewer from '~/components/ContentFileViewer';
import Icon from '~/components/Icon';
import InternalComponent from '~/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent';
import YouTubeVideo from '~/components/Texts/RichText/Markdown/EmbeddedComponent/YouTubeVideo';
import RankBadge from '~/components/RankBadge';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { buildAttachmentUrl } from '~/helpers/attachmentHelpers';
import { getEmbedSvgRepairImageUrl } from '~/helpers/embedSvgRepairHelpers';
import {
  addCommasToNumber,
  getFileInfoFromFileName,
  processInternalLink
} from '~/helpers/stringHelpers';
import type { MarkdownImageEmbed } from '../helpers/sizing';

export function AttachmentSurface({
  className,
  source,
  sourceContentId,
  sourceContentType,
  userId
}: {
  className: string;
  source: any;
  sourceContentId: number;
  sourceContentType: string;
  userId: number;
}) {
  const fileName = source?.fileName || '';
  const { extension, fileType } = getFileInfoFromFileName(fileName);
  if (fileType === 'video') {
    return (
      <div className={className}>
        <HomeVideoAttachmentPreview
          fileName={fileName}
          src={buildAttachmentUrl({
            filePath: source.filePath,
            fileName,
            contentType: sourceContentType
          })}
          thumbUrl={source?.thumbUrl}
        />
      </div>
    );
  }

  const canPreviewInline = fileType === 'image' || Boolean(source?.thumbUrl);

  return (
    <div className={className}>
      {canPreviewInline ? (
        <ContentFileViewer
          compactMode
          isThumb={fileType !== 'image'}
          contentId={sourceContentId}
          contentType={sourceContentType}
          fileName={fileName}
          filePath={source.filePath}
          fileSize={source?.fileSize}
          thumbUrl={source?.thumbUrl}
          userIsUploader={Number(source?.uploader?.id || 0) === userId}
          videoHeight="100%"
          thumbHeight="100%"
        />
      ) : (
        <AttachmentCard
          extension={extension}
          fileName={fileName}
          fileSize={source?.fileSize}
          fileType={fileType}
        />
      )}
    </div>
  );
}

export function formatRewardMultiplier(multiplier: number) {
  if (Math.abs(multiplier - Math.round(multiplier)) < 0.001) {
    return `${Math.round(multiplier)}`;
  }
  return multiplier.toFixed(1).replace(/\.0$/, '');
}

export function MarkdownEmbedPreview({
  className,
  contentId,
  contentType,
  embed
}: {
  className?: string;
  contentId: number;
  contentType: string;
  embed: MarkdownImageEmbed;
}) {
  if (embed.type === 'internal') {
    const { isInternalLink, replacedLink } = processInternalLink(embed.src);
    const internalSrc = (isInternalLink ? replacedLink : embed.src).replace(
      /<u>|<\/u>/g,
      '__'
    );
    return (
      <div
        className={`${className || ''} home-feed-card__rich-embed-internal`}
        onClick={stopFeedCardNestedClick}
      >
        <InternalComponent
          rootId={contentId}
          rootType={contentType}
          isPreview
          showCompactCommentTypeLabel={false}
          src={internalSrc}
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
}

export function CompactEffortStrip({
  className,
  rewardLevel
}: {
  className?: string;
  rewardLevel: number;
}) {
  const level = Math.max(1, Math.floor(Number(rewardLevel || 1)));
  const starCount = Math.min(level, 5);
  const colorKey = cardLevelHash[level]?.color || 'logoBlue';
  const colorGetter = (Color as any)[colorKey];
  const color =
    typeof colorGetter === 'function' ? colorGetter() : Color.logoBlue();
  const starColor = level >= 5 ? '#fff' : '#ffd700';

  return (
    <div
      className={`home-feed-card__compact-effort ${className || ''}`}
      style={
        {
          '--effort-color': color,
          '--effort-star-color': starColor
        } as React.CSSProperties & {
          '--effort-color': string;
          '--effort-star-color': string;
        }
      }
    >
      <span className="home-feed-card__compact-effort-left">
        <span className="home-feed-card__compact-effort-label">
          Effort Level:
        </span>
        <span className="home-feed-card__compact-effort-stars">
          {Array.from({ length: starCount }, (_, index) => (
            <Icon key={index} icon="star" />
          ))}
        </span>
      </span>
      <span className="home-feed-card__compact-effort-xp">
        Earn up to {addCommasToNumber(level * 2000)} XP
      </span>
    </div>
  );
}

export function CompactProfileRankStrip({ profile }: { profile: any }) {
  const rank = Number(profile?.rank || 0);
  if (!rank) return null;

  const isTopRank = rank <= 3;

  return (
    <div
      className={`home-feed-card__mini-profile-rank-strip${
        isTopRank ? ' top-rank' : ''
      }`}
    >
      <div className="home-feed-card__mini-profile-rank-left">
        <Icon icon={isTopRank ? 'trophy' : 'award'} />
        <RankBadge rank={rank} />
      </div>
      <span className="home-feed-card__mini-profile-rank-xp">
        {addCommasToNumber(Number(profile?.twinkleXP || 0))}
        <span> XP</span>
      </span>
    </div>
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
  const text = story.trim();
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

function stopFeedCardNestedClick(event: React.MouseEvent<HTMLElement>) {
  event.stopPropagation();
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
  const fileName = getFileNameFromEmbedSrc(imageEmbed.src);

  useEffect(() => {
    setSrc(imageEmbed.src);
    setFailed(false);
  }, [imageEmbed.src]);

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

function AttachmentCard({
  extension,
  fileName,
  fileSize,
  fileType
}: {
  extension: string;
  fileName: string;
  fileSize?: number | string;
  fileType: string;
}) {
  const kindLabel = getAttachmentKindLabel({ extension, fileType });
  const sizeLabel = formatAttachmentFileSize(fileSize);

  return (
    <div className="home-feed-card__attachment-card">
      <div className="home-feed-card__attachment-card-icon">
        <Icon icon={getAttachmentIcon(fileType)} />
      </div>
      <div className="home-feed-card__attachment-card-copy">
        <span>{kindLabel}</span>
        <strong>{fileName || 'Attached file'}</strong>
        {sizeLabel ? <small>{sizeLabel}</small> : null}
      </div>
      <span className="home-feed-card__attachment-card-extension">
        {extension ? extension.toUpperCase() : 'FILE'}
      </span>
    </div>
  );
}

function HomeVideoAttachmentPreview({
  fileName,
  src,
  thumbUrl
}: {
  fileName: string;
  src: string;
  thumbUrl?: string;
}) {
  return (
    <div className="home-feed-card__video-attachment">
      <video
        src={src}
        poster={thumbUrl || undefined}
        muted
        playsInline
        preload="metadata"
      />
      <div className="home-feed-card__video-attachment-play">
        <Icon icon="play" />
      </div>
      {fileName ? (
        <div className="home-feed-card__video-attachment-title">{fileName}</div>
      ) : null}
    </div>
  );
}

function getFileNameFromEmbedSrc(src: string) {
  const path = String(src || '')
    .split('?')[0]
    .split('#')[0];
  const fileName = path.split('/').pop() || 'Image unavailable';
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

function getAttachmentIcon(fileType: string) {
  if (fileType === 'image') return 'file-image';
  if (fileType === 'video') return 'file-video';
  if (fileType === 'audio') return 'file-audio';
  if (fileType === 'pdf') return 'file-pdf';
  if (fileType === 'archive') return 'file-archive';
  if (fileType === 'word') return 'file-word';
  return 'file';
}

function getAttachmentKindLabel({
  extension,
  fileType
}: {
  extension: string;
  fileType: string;
}) {
  if (['heic', 'heif'].includes(extension)) return 'Image file';
  if (fileType === 'image') return 'Image';
  if (fileType === 'video') return 'Video';
  if (fileType === 'audio') return 'Audio';
  if (fileType === 'pdf') return 'PDF';
  if (fileType === 'archive') return 'Archive';
  if (fileType === 'word') return 'Document';
  return 'File';
}

function formatAttachmentFileSize(fileSize?: number | string) {
  const bytes = Number(fileSize || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
