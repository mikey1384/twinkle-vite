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
  height = '55%',
  onClick,
  src,
  style,
  videoId
}: {
  className?: string;
  height?: string;
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
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <div
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          overFlow: 'hidden',
          paddingBottom: height,
          position: 'relative',
          cursor: onClick && 'pointer',
          ...style
        }}
        onClick={onClick}
      >
        <img
          alt="Thumbnail"
          src={src}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            margin: 'auto'
          }}
        />
        {!!rewardLevel && (
          <div
            className={css`
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
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
          >
            <div style={{ fontSize: '1rem', lineHeight: 1 }}>{Stars}</div>
          </div>
        )}
        {progressBarPercentage > 0 && (
          <WatchProgressBar
            style={{
              position: 'absolute',
              width: '100%',
              background: Color.darkerBorderGray()
            }}
            className={css`
              bottom: 0;
            `}
            percentage={progressBarPercentage}
          />
        )}
      </div>
    </div>
  );
}

export default memo(VideoThumbImage);
