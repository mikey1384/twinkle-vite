import React, { memo, useState, useMemo } from 'react';
import YouTubeVideo from './YouTubeVideo';
import InternalComponent from './InternalComponent';
import ImageComponent from './ImageComponent';
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
    if (!src || src?.startsWith('http://') || src?.startsWith('https://')) {
      return src;
    }
    return `http://${src}`;
  }, [src]);

  return (
    <div
      ref={embeddedContentRef}
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: ${replacedLink.split('/')?.[1] === 'users' &&
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
          src={replacedLink}
        />
      ) : isYouTube && src ? (
        <YouTubeVideo
          {...commonProps}
          contentType={contentType}
          contentId={contentId}
          src={src}
        />
      ) : !errorLoadingImage && src ? (
        <ImageComponent
          {...commonProps}
          src={src}
          alt={alt}
          onSetErrorLoadingImage={setErrorLoadingImage}
        />
      ) : href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {alt || 'Link'}
        </a>
      ) : (
        '![]()'
      )}
    </div>
  );
}

export default memo(EmbeddedComponent);
