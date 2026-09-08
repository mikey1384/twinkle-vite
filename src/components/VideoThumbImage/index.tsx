import React, { memo, useMemo } from 'react';
import useScopedRead from '~/helpers/hooks/useScopedRead';
import { useAppContext, useKeyContext } from '~/contexts';
import Icon from '~/components/Icon';
import WatchProgressBar from './WatchProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

function VideoThumbImage({
  className,
  noPaddingBottom,
  rewardLevel,
  onClick,
  src,
  style,
  videoId
}: {
  className?: string;
  noPaddingBottom?: boolean;
  rewardLevel?: number;
  onClick?: (v: any) => any;
  src: string;
  style?: any;
  videoId?: number;
}) {
  const tagColor =
    useKeyContext((v) => v.theme[`level${rewardLevel}`]?.color) || 'logoBlue';
  const loadVideoWatchPercentage = useAppContext(
    (v) => v.requestHelpers.loadVideoWatchPercentage
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const progress = useScopedRead(`${userId}:${videoId}`, async () => {
    if (!userId || !Number.isSafeInteger(videoId) || Number(videoId) <= 0)
      return 0;
    const value = Number(await loadVideoWatchPercentage(videoId));
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  });
  const progressBarPercentage = progress.data || 0;
  const stars = Number.isInteger(rewardLevel)
    ? Math.max(0, Math.min(5, Number(rewardLevel)))
    : 0;

  const Stars = useMemo(
    () =>
      deviceIsMobile
        ? `${stars}-STAR`
        : [...Array(stars)].map((elem, index) => (
            <Icon key={index} style={{ verticalAlign: 0 }} icon="star" />
          )),
    [stars]
  );

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      <div
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: onClick && 'pointer',
          ...style
        }}
        onClick={onClick}
      >
        <div
          style={{
            display: 'block',
            paddingBottom: noPaddingBottom ? 0 : '56.25%',
            position: 'relative',
            width: '100%',
            height: '100%',
            margin: 'auto',
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {progressBarPercentage > 0 && (
            <WatchProgressBar
              style={{
                position: 'absolute',
                width: '100%',
                bottom: 0,
                background: Color.darkerBorderGray(),
                zIndex: 1
              }}
              percentage={progressBarPercentage}
            />
          )}
        </div>
        {!!stars && (
          <div
            className={css`
              top: 0;
              left: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              position: absolute;
              margin: 0.6rem;
              padding: 0.3rem 0.6rem;
              border-radius: 9999px;
              background: ${Color[tagColor]?.()};
              font-size: 1.5rem;
              font-weight: bold;
              color: #fff;
              z-index: 2;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
          >
            <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>{Stars}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(VideoThumbImage);
