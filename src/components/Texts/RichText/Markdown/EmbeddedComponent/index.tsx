import React, { memo, useState, useMemo } from 'react';
import YouTubeVideo from './YouTubeVideo';
import InternalComponent from './InternalComponent';
import ImageComponent from './ImageComponent';
import FileDownload from './FileDownload';
import {
  getFileInfoFromUrl,
  isValidYoutubeUrl,
  processInternalLink
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import type {
  RichTextEmbedPreviewMode,
  RichTextSubjectPreviewVariant
} from '../../embedPreviewMode';

function EmbeddedComponent({
  contentType,
  contentId,
  embedPreviewMode,
  src,
  alt,
  isPreview,
  isProfileComponent,
  subjectPreviewVariant,
  disableImageModal,
  theme,
  embeddedContentRef,
  ...commonProps
}: {
  contentType?: string;
  contentId?: number | string;
  embedPreviewMode?: RichTextEmbedPreviewMode;
  src?: string;
  alt?: string;
  isPreview?: boolean;
  isProfileComponent?: boolean;
  subjectPreviewVariant?: RichTextSubjectPreviewVariant;
  disableImageModal?: boolean;
  theme?: string;
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
  const isFullWidthSubjectPreview =
    isInternalLink &&
    subjectPreviewVariant === 'fullWidth' &&
    cleanReplacedLink.split('/')?.[1] === 'subjects';

  const { ext, fileNameFromSrc, fileType } = useMemo(() => {
    const { extension, fileName, fileType } = getFileInfoFromUrl(src);
    return { ext: extension, fileNameFromSrc: fileName, fileType };
  }, [src]);
  const shouldAttemptImage = fileType === 'image' || !ext;

  return (
    <div
      ref={embeddedContentRef}
      className={`rich-text-embedded-component${
        isPreview ? ' rich-text-embedded-component--preview' : ''
      } ${css`
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: ${
            isFullWidthSubjectPreview ||
            (cleanReplacedLink.split('/')?.[1] === 'users' &&
              isProfileComponent)
              ? '0'
              : '1rem'
          };
        width: 100%;
      `}`}
    >
      {isInternalLink ? (
        <InternalComponent
          rootId={contentId}
          rootType={contentType}
          isProfileComponent={isProfileComponent}
          src={cleanReplacedLink}
          embedPreviewMode={embedPreviewMode}
          subjectPreviewVariant={subjectPreviewVariant}
          isPreview={isPreview}
          theme={theme}
        />
      ) : isYouTube && src ? (
        <YouTubeVideo
          {...commonProps}
          contentType={contentType}
          contentId={contentId}
          isPreview={isPreview}
          src={src}
        />
      ) : src && shouldAttemptImage && !errorLoadingImage ? (
        <ImageComponent
          {...commonProps}
          src={src}
          alt={alt}
          isPreview={isPreview}
          disableImageModal={disableImageModal}
          onSetErrorLoadingImage={setErrorLoadingImage}
        />
      ) : src ? (
        <FileDownload
          extension={ext}
          src={href || src}
          fileName={fileNameFromSrc || alt || 'file'}
          fileType={fileType}
          isPreview={isPreview}
          theme={theme}
        />
      ) : href ? (
        <FileDownload
          extension={ext}
          src={href}
          fileName={fileNameFromSrc || alt || 'file'}
          fileType={fileType}
          isPreview={isPreview}
          theme={theme}
        />
      ) : (
        '![]()'
      )}
    </div>
  );
}

export default memo(EmbeddedComponent);
