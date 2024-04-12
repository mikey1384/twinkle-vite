import React, { memo, useEffect, useMemo, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import WatchProgressBar from './WatchProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

VideoThumbImage.propTypes = {
  height: PropTypes.string,
  rewardLevel: PropTypes.number,
  onClick: PropTypes.func,
  src: PropTypes.string.isRequired,
  style: PropTypes.object,
  videoId: PropTypes.number
};

function VideoThumbImage({
  className,
  rewardLevel,
  onClick,
  src,
  style,
  videoId
}: {
  className?: string;
  rewardLevel?: number;
  onClick?: (v: any) => any;
  src: string;
  style?: any;
  videoId?: number;
}) {
  const theme = useKeyContext((v) => v.theme);
  const loadVideoWatchPercentage = useAppContext(
    (v) => v.requestHelpers.loadVideoWatchPercentage
  );
  const { userId } = useKeyContext((v) => v.myState);
  const [progressBarPercentage, setProgressBarPercentage] = useState(0);

  const Stars = useMemo(
    () =>
      deviceIsMobile
        ? `${rewardLevel}-STAR`
        : [...Array(rewardLevel)].map((elem, index) => (
            <Icon key={index} style={{ verticalAlign: 0 }} icon="star" />
          )),
    [rewardLevel]
  );

  useEffect(() => {
    init();

    async function init() {
      if (userId) {
        const percentage = await loadVideoWatchPercentage(videoId);
        setProgressBarPercentage(percentage);
      } else {
        setProgressBarPercentage(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, videoId]);

  const tagColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
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
        {!!rewardLevel && (
          <div
            className={css`
              top: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-width: 4rem;
              position: absolute;
              padding: 0.5rem 0.5rem;
              background: ${Color[tagColor]()};
              font-size: 1.5rem;
              font-weight: bold;
              color: #fff;
              z-index: 2;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
          >
            <div style={{ fontSize: '1rem', lineHeight: 1 }}>{Stars}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(VideoThumbImage);
