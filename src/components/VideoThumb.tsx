import React, { useEffect, useCallback, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import { Link } from 'react-router-dom';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import ErrorBoundary from '~/components/ErrorBoundary';
import VideoThumbImage from '~/components/VideoThumbImage';
import Icon from '~/components/Icon';
import { borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';
import { textIsOverflown, isMobile } from '~/helpers';
import { useContentState } from '~/helpers/hooks';
import { useRoleColor } from '~/theme/useRoleColor';
const deviceIsMobile = isMobile(navigator);
const addedByLabel = 'Added by';

export default function VideoThumb({
  className,
  style,
  to,
  user,
  video
}: {
  className?: string;
  style?: React.CSSProperties;
  to: string;
  user: any;
  video: any;
}) {
  const { getColor: getLinkColor } = useRoleColor('link', {
    fallback: 'blue'
  });
  const { getColor: getUserLinkColor } = useRoleColor('userLink', {
    fallback: 'logoBlue'
  });
  const linkColor = getLinkColor();
  const userLinkColor = getUserLinkColor();
  const { isDeleted } = useContentState({
    contentType: 'video',
    contentId: video.id
  });
  const [titleContext, setTitleContext] = useState(null);
  const ThumbLabelRef: React.RefObject<any> = useRef(null);
  const ThumbLabelContainerRef: React.RefObject<any> = useRef(null);
  const onMouseOver = useCallback(() => {
    if (textIsOverflown(ThumbLabelRef.current)) {
      const parentElementDimensions =
        ThumbLabelContainerRef.current?.getBoundingClientRect?.() || {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      setTitleContext(parentElementDimensions);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (titleContext && deviceIsMobile) {
      timer = setTimeout(() => {
        setTitleContext(null);
      }, mobileFullTextRevealShowDuration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [titleContext]);

  return (
    <ErrorBoundary componentPath="VideoThumb" style={style}>
      {!isDeleted ? (
        <div
          className={`${className} ${css`
            display: flex;
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            position: relative;
            font-size: 1.5rem;
            gap: 0.6rem;
            box-shadow: none;
            background: transparent;
            p {
              font-weight: 700;
            }
          `}`}
        >
          <ErrorBoundary componentPath="VideoThumb/ImageContainer">
            <div
              style={{
                width: '100%',
                overflow: 'hidden',
                borderRadius
              }}
            >
              <Link to={`/${to}`}>
                <VideoThumbImage
                  videoId={video.id}
                  rewardLevel={video.rewardLevel}
                  src={`https://img.youtube.com/vi/${video.content}/mqdefault.jpg`}
                />
              </Link>
            </div>
          </ErrorBoundary>
          <ErrorBoundary componentPath="VideoThumb.InfoContainer">
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <ErrorBoundary componentPath="VideoThumb/TitleContainer">
                <div
                  onMouseOver={onMouseOver}
                  onMouseLeave={() => setTitleContext(null)}
                  ref={ThumbLabelContainerRef}
                  style={{ width: '100%' }}
                >
                  <p
                    ref={ThumbLabelRef}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      lineHeight: 'normal'
                    }}
                  >
                    <Link
                      style={{
                        display: 'inline',
                        color: video.byUser ? userLinkColor : linkColor
                      }}
                      to={`/${to}`}
                    >
                      {video.title}
                    </Link>
                  </p>
                  {titleContext && (
                    <FullTextReveal
                      textContext={titleContext}
                      text={video.title}
                      style={{ fontSize: '1.3rem' }}
                    />
                  )}
                </div>
              </ErrorBoundary>
              <ErrorBoundary componentPath="VideoThumb/MetadataContainer">
                <div
                  style={{
                    width: '100%',
                    fontSize: '1.2rem',
                    overflowX: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <div style={{ display: 'inline' }}>
                    {addedByLabel} <UsernameText user={user} />
                  </div>
                  {video.likes?.length > 0 && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <Icon icon="thumbs-up" />
                      &nbsp;&times;&nbsp;
                      {video.likes.length}
                    </div>
                  )}
                </div>
              </ErrorBoundary>
            </div>
          </ErrorBoundary>
        </div>
      ) : null}
    </ErrorBoundary>
  );
}
