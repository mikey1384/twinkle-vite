import React, { useMemo, useState } from 'react';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import Icon from '~/components/Icon';
import { useContentState } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const deviceIsMobile = isMobile(navigator);

export default function RewardLevelInfo({
  playing,
  isMaxReached,
  reasonForDisable,
  rewardLevel,
  videoId,
  xpWarningShown
}: {
  playing?: boolean;
  isMaxReached?: boolean;
  reasonForDisable?: string;
  rewardLevel: number;
  videoId: number;
  xpWarningShown?: boolean;
}) {
  const theme = useKeyContext((v) => v.theme);
  const { numCoinsEarned = 0, numXpEarned = 0 } = useContentState({
    contentType: 'video',
    contentId: videoId
  });
  const [xpHovered, setXPHovered] = useState(false);
  const canEarnCoins = rewardLevel >= 3;
  const numXpEarnedWithComma = useMemo(
    () => addCommasToNumber(numXpEarned),
    [numXpEarned]
  );
  const numCoinsEarnedWithComma = useMemo(
    () => addCommasToNumber(numCoinsEarned),
    [numCoinsEarned]
  );
  const xpLevelColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
  );
  const warningColor = useMemo(() => theme.fail?.color, [theme]);
  const Stars = useMemo(
    () =>
      [...Array(rewardLevel)].map((elem, index) => (
        <Icon key={index} style={{ verticalAlign: 0 }} icon="star" />
      )),
    [rewardLevel]
  );

  return rewardLevel ? (
    <div
      className={css`
        height: 2.7rem;
        margin-left: 1rem;
        display: flex;
        @media (max-width: ${mobileMaxWidth}) {
          min-width: 0;
          max-width: 8.5rem;
          height: 2rem;
        }
      `}
      onClick={
        deviceIsMobile && isMaxReached
          ? () => setXPHovered((hovered) => !hovered)
          : () => null
      }
      onMouseEnter={
        !deviceIsMobile && isMaxReached ? () => setXPHovered(true) : () => null
      }
      onMouseLeave={() => setXPHovered(false)}
    >
      <div
        className={css`
          height: 100%;
          flex-grow: 1;
        `}
      >
        <div
          className={css`
            height: 100%;
            width: 100%;
            min-width: 6rem;
            display: flex;
            position: relative;
            justify-content: center;
            align-items: center;
            color: #fff;
            padding: 0 1rem;
            font-size: 1.3rem;
            font-weight: bold;
            background: ${Color[
              playing && xpWarningShown ? warningColor : xpLevelColor
            ](isMaxReached ? 0.3 : 1)};
            cursor: default;
            @media (max-width: ${mobileMaxWidth}) {
              flex-grow: 0;
              width: 5rem;
              font-size: ${numXpEarned > 0 ? '0.7rem' : '1rem'};
            }
          `}
        >
          {numXpEarned > 0 && !isMaxReached
            ? `+ ${numXpEarnedWithComma}`
            : deviceIsMobile
            ? `${rewardLevel}-STAR`
            : Stars}
        </div>
      </div>
      {canEarnCoins && (
        <div>
          <div
            className={css`
              height: 100%;
              position: relative;
              min-width: 5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #fff;
              font-size: ${numCoinsEarned > 0 ? '1.3rem' : '1.5rem'};
              background: ${Color.brownOrange(isMaxReached ? 0.3 : 1)};
              @media (max-width: ${mobileMaxWidth}) {
                flex-grow: 1;
                min-width: 3.5rem;
                font-size: ${numCoinsEarned > 0 && !isMaxReached
                  ? '0.7rem'
                  : '1.2rem'};
              }
            `}
          >
            {numCoinsEarned > 0 && !isMaxReached ? (
              `+ ${numCoinsEarnedWithComma}`
            ) : (
              <Icon size="lg" icon={['far', 'badge-dollar']} />
            )}
          </div>
        </div>
      )}
      {xpHovered ? (
        <FullTextReveal
          show
          direction="left"
          style={{
            marginTop: '0.5rem',
            color: '#000',
            width: '30rem',
            fontSize: '1.2rem',
            position: 'absolute'
          }}
          text={reasonForDisable || ''}
        />
      ) : null}
    </div>
  ) : null;
}
