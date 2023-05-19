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
  onLoad,
  ...commonProps
}: {
  contentType?: string;
  contentId?: number;
  src?: string;
  alt?: string;
  isProfileComponent?: boolean;
  onLoad: () => void;
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
          isProfileComponent={isProfileComponent}
          src={replacedLink}
        />
      ) : isYouTube && src ? (
        <YouTubeVideo
          {...commonProps}
          contentType={contentType}
          contentId={contentId}
          src={src}
          onReady={onLoad}
        />
      ) : (
        <img {...commonProps} src={src} alt={alt} onLoad={onLoad} />
      )}
    </div>
  );
}
