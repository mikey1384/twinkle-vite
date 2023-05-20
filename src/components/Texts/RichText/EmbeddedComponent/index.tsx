import React, { useMemo } from 'react';
import YouTubeVideo from './YouTubeVideo';
import InternalComponent from './InternalComponent';
import {
  isValidYoutubeUrl,
  processInternalLink
} from '~/helpers/stringHelpers';

export default function EmbeddedComponent({
  contentType,
  contentId,
  src,
  alt,
  isProfileComponent,
  ...commonProps
}: {
  contentType?: string;
  contentId?: number;
  src?: string;
  alt?: string;
  isProfileComponent?: boolean;
}) {
  const { isInternalLink, replacedLink } = useMemo(
    () => processInternalLink(src),
    [src]
  );
  const isYouTube = useMemo(() => isValidYoutubeUrl(src), [src]);
  return (
    <div
      style={{
        padding:
          replacedLink.split('/')?.[1] === 'users' && isProfileComponent
            ? 'none'
            : '1rem',
        width: '100%'
      }}
    >
      {isInternalLink ? (
        <InternalComponent
          {...commonProps}
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
      ) : (
        <img {...commonProps} src={src} alt={alt} />
      )}
    </div>
  );
}
