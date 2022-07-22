import React, { memo, useEffect, useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import Link from '~/components/Link';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import ErrorBoundary from '~/components/ErrorBoundary';
import VideoThumbImage from '~/components/VideoThumbImage';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';
import { textIsOverflown, isMobile } from '~/helpers';
import { useContentState } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const addedByLabel = localize('addedBy');

VideoThumb.propTypes = {
  className: PropTypes.string,
  clickSafe: PropTypes.bool,
  style: PropTypes.object,
  to: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  video: PropTypes.shape({
    byUser: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    content: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    rewardLevel: PropTypes.number,
    likes: PropTypes.array,
    title: PropTypes.string.isRequired
  }).isRequired
};

function VideoThumb({ className, clickSafe, style, to, user, video }) {
  const timerRef = useRef(null);
  const {
    link: { color: linkColor },
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);
  const { isDeleted } = useContentState({
    contentType: 'video',
    contentId: video.id
  });
  const [titleContext, setTitleContext] = useState(null);
  const ThumbLabelRef = useRef(null);
  const ThumbLabelContainerRef = useRef(null);
  const onLinkClick = useCallback(
    () => Promise.resolve(clickSafe),
    [clickSafe]
  );
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
    if (titleContext && deviceIsMobile) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setTitleContext(null);
      }, mobileFullTextRevealShowDuration);
    }
  }, [titleContext]);

  return !isDeleted ? (
    <ErrorBoundary componentPath="VideoThumb" style={style}>
      <div
        className={`${className} ${css`
          display: flex;
          width: 100%;
          flex-direction: column;
          align-items: flex-end;
          position: relative;
          font-size: 1.5rem;
          box-shadow: 0 0 5px ${Color.darkerGray()};
          background: ${Color.whiteGray()};
          border-radius: 1px;
          p {
            font-weight: bold;
          }
        `}`}
      >
        <div style={{ width: '100%' }}>
          <Link to={`/${to}`} onClickAsync={onLinkClick}>
            <VideoThumbImage
              height="65%"
              videoId={video.id}
              rewardLevel={video.rewardLevel}
              src={`https://img.youtube.com/vi/${video.content}/mqdefault.jpg`}
            />
          </Link>
        </div>
        <div
          style={{
            height: '8rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            padding: '0 1rem'
          }}
        >
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
              <a
                style={{
                  color: video.byUser
                    ? Color[userLinkColor]()
                    : Color[linkColor]()
                }}
                href={`/${to}`}
                onClick={onLinkClick}
              >
                {video.title}
              </a>
            </p>
            {titleContext && (
              <FullTextReveal
                textContext={titleContext}
                text={video.title}
                style={{ fontSize: '1.3rem' }}
              />
            )}
          </div>
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
              <div style={{ marginTop: '0.5rem' }}>
                <Icon icon="thumbs-up" />
                &nbsp;&times;&nbsp;
                {video.likes.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  ) : null;
}

export default memo(VideoThumb);
