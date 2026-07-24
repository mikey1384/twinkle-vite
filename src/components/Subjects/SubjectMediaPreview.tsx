import React from 'react';
import ContentFileViewer from '~/components/ContentFileViewer';
import Embedly from '~/components/Embedly';
import Icon from '~/components/Icon';
import { LINK_PREVIEW_FALLBACK_IMAGE } from '~/components/LinkPreviewImage';
import VideoThumbImage from '~/components/VideoThumbImage';
import { buildAttachmentUrl } from '~/helpers/attachmentHelpers';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import type { WideSubjectMediaDescriptor } from './wideSubjectMedia';

export default function SubjectMediaPreview({
  className,
  descriptor,
  subject,
  subjectId,
  userId
}: {
  className: string;
  descriptor: WideSubjectMediaDescriptor;
  subject: any;
  subjectId: number;
  userId: number;
}) {
  if (descriptor.kind === 'attachment') {
    return (
      <AttachmentSurface
        className={className}
        source={{ ...subject, filePath: descriptor.filePath }}
        sourceContentId={subjectId}
        sourceContentType="subject"
        userId={userId}
      />
    );
  }

  if (descriptor.kind === 'videoRoot') {
    return (
      <div className={className} data-subject-media-kind="video-root">
        <VideoThumbImage
          noPaddingBottom
          rewardLevel={descriptor.rewardLevel}
          src={`https://img.youtube.com/vi/${descriptor.videoCode}/mqdefault.jpg`}
          videoId={descriptor.videoId}
        />
      </div>
    );
  }

  return (
    <div className={className} data-subject-media-kind="url-root">
      <Embedly
        contentId={descriptor.urlId}
        contentType="url"
        defaultActualDescription={descriptor.actualDescription}
        defaultActualTitle={descriptor.actualTitle}
        defaultSiteUrl={descriptor.siteUrl}
        defaultThumbUrl={descriptor.thumbUrl || LINK_PREVIEW_FALLBACK_IMAGE}
        extractedUrl={descriptor.url}
        imageOnly
        noLink
      />
    </div>
  );
}

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
  const filePath = source?.filePath || source?.actualFilePath || '';
  const fileName = getAttachmentSurfaceFileName(source, filePath);
  const { extension, fileType } = getFileInfoFromFileName(fileName);
  if (fileType === 'video') {
    return (
      <div className={className} data-attachment-preview-kind={fileType}>
        <VideoAttachmentPreview
          fileName={fileName}
          src={buildAttachmentUrl({
            filePath,
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
    <div className={className} data-attachment-preview-kind={fileType}>
      {canPreviewInline ? (
        <ContentFileViewer
          compactMode
          isThumb={fileType !== 'image'}
          contentId={sourceContentId}
          contentType={sourceContentType}
          fileName={fileName}
          filePath={filePath}
          fileSize={source?.fileSize}
          fillPreview={fileType === 'image'}
          fillUnavailablePreview
          previewObjectFit={fileType === 'image' ? 'contain' : undefined}
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

function getAttachmentSurfaceFileName(source: any, filePath: string) {
  const fileName = source?.fileName || source?.actualFileName;
  if (fileName) return String(fileName);

  const pathName = String(filePath || '')
    .split('?')[0]
    .split('#')[0];
  const pathFileName = pathName.split('/').filter(Boolean).pop() || '';
  try {
    return decodeURIComponent(pathFileName);
  } catch {
    return pathFileName;
  }
}

export function AttachmentCard({
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

function VideoAttachmentPreview({
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
      {thumbUrl ? (
        <img
          alt={fileName ? `${fileName} video preview` : 'Video preview'}
          loading="lazy"
          src={thumbUrl}
        />
      ) : (
        <video src={src} muted playsInline preload="metadata" />
      )}
      <div className="home-feed-card__video-attachment-play">
        <Icon icon="play" />
      </div>
      {fileName ? (
        <div className="home-feed-card__video-attachment-title">{fileName}</div>
      ) : null}
    </div>
  );
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
