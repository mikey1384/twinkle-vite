import React, { memo, useState, useMemo } from 'react';
import YouTubeVideo from './YouTubeVideo';
import InternalComponent from './InternalComponent';
import ImageComponent from './ImageComponent';
import FileDownload from './FileDownload';
import {
  isValidYoutubeUrl,
  processInternalLink
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

function EmbeddedComponent({
  contentType,
  contentId,
  src,
  alt,
  isProfileComponent,
  embeddedContentRef,
  ...commonProps
}: {
  contentType?: string;
  contentId?: number | string;
  src?: string;
  alt?: string;
  isProfileComponent?: boolean;
  embeddedContentRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { isInternalLink, replacedLink } = useMemo(
    () => processInternalLink(src),
    [src]
  );
  const isYouTube = useMemo(() => isValidYoutubeUrl(src), [src]);
  const [errorLoadingImage, setErrorLoadingImage] = useState(false);

  const href = useMemo(() => {
    const cleanSrc = src?.replace(/<u>|<\/u>/g, '__') || src;
    if (!cleanSrc) return cleanSrc;
    const hasScheme = /^(https?:\/\/|data:|blob:)/i.test(cleanSrc);
    return hasScheme ? cleanSrc : `http://${cleanSrc}`;
  }, [src]);

  const cleanReplacedLink = useMemo(() => {
    return replacedLink?.replace(/<u>|<\/u>/g, '__') || replacedLink;
  }, [replacedLink]);

  // Infer file extension/type when the src looks like a file URL
  const { fileType } = useMemo(() => {
    const url = (src || '').split('?')[0].split('#')[0];
    const last = url.split('/').pop() || '';
    let decoded = last;
    try {
      decoded = decodeURIComponent(last);
    } catch {
      decoded = last;
    }
    const dotIdx = decoded.lastIndexOf('.');
    const ext = dotIdx > -1 ? decoded.slice(dotIdx + 1).toLowerCase() : '';
    const imageExts = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'heic',
      'heif',
      'bmp',
      'svg'
    ];
    const audioExts = [
      'mp3',
      'wav',
      'ogg',
      'm4a',
      'aac',
      'flac',
      'opus',
      'weba'
    ];
    const videoExts = ['mp4', 'webm', 'ogv', 'ogg', 'mov', 'm4v', 'avi', 'mkv'];
    const pdfExts = ['pdf'];
    const textExts = ['txt', 'md', 'csv', 'json', 'log'];
    let type: 'image' | 'audio' | 'video' | 'pdf' | 'text' | 'other' = 'other';
    if (imageExts.includes(ext)) type = 'image';
    else if (audioExts.includes(ext)) type = 'audio';
    else if (videoExts.includes(ext)) type = 'video';
    else if (pdfExts.includes(ext)) type = 'pdf';
    else if (textExts.includes(ext)) type = 'text';
    return { ext, fileType: type };
  }, [src]);

  const fileNameFromSrc = useMemo(() => {
    const url = (src || '').split('?')[0].split('#')[0];
    const last = url.split('/').pop() || '';
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  }, [src]);

  return (
    <div
      ref={embeddedContentRef}
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: ${cleanReplacedLink.split('/')?.[1] === 'users' &&
        isProfileComponent
          ? 'none'
          : '1rem'};
        width: 100%;
      `}
    >
      {isInternalLink ? (
        <InternalComponent
          rootId={contentId}
          rootType={contentType}
          isProfileComponent={isProfileComponent}
          src={cleanReplacedLink}
        />
      ) : isYouTube && src ? (
        <YouTubeVideo
          {...commonProps}
          contentType={contentType}
          contentId={contentId}
          src={src}
        />
      ) : src && !errorLoadingImage ? (
        <ImageComponent
          {...commonProps}
          src={src}
          alt={alt}
          onSetErrorLoadingImage={setErrorLoadingImage}
        />
      ) : src ? (
        <FileDownload
          src={href || src}
          fileName={fileNameFromSrc || alt || 'file'}
          fileType={fileType}
        />
      ) : href ? (
        <FileDownload
          src={href}
          fileName={fileNameFromSrc || alt || 'file'}
          fileType={fileType}
        />
      ) : (
        '![]()'
      )}
    </div>
  );
}

export default memo(EmbeddedComponent);
