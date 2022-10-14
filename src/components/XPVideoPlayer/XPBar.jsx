import { memo, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import ProgressBar from '~/components/ProgressBar';
import Icon from '~/components/Icon';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { videoRewardHash } from '~/constants/defaultValues';
import { useContentState } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const continueLabel = localize('continue');
const notGainXPLabel = localize('notGainXP');
const watchingLabel = localize('watching');
const perMinuteLabel = localize('perMinute');

XPBar.propTypes = {
  isChat: PropTypes.bool,
  playing: PropTypes.bool,
  rewardLevel: PropTypes.number,
  reachedMaxWatchDuration: PropTypes.bool,
  started: PropTypes.bool,
  startingPosition: PropTypes.number,
  userId: PropTypes.number,
  videoId: PropTypes.number.isRequired,
  xpWarningShown: PropTypes.bool
};

function XPBar({
  isChat,
  playing,
  rewardLevel,
  started,
  startingPosition,
  userId,
  reachedMaxWatchDuration,
  videoId,
  xpWarningShown
}) {
  const [coinHovered, setCoinHovered] = useState(false);
  const [xpHovered, setXPHovered] = useState(false);
  const watching = startingPosition > 0;
  const { rewardBoostLvl, twinkleCoins } = useKeyContext((v) => v.myState);
  const theme = useKeyContext((v) => v.theme);
  const xpLevelColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
  );
  const warningColor = useMemo(() => theme.fail?.color, [theme]);
  const xpRewardAmount = useMemo(
    () => rewardLevel * (videoRewardHash?.[rewardBoostLvl]?.xp || 20),
    [rewardBoostLvl, rewardLevel]
  );
  const coinRewardAmount = useMemo(
    () => videoRewardHash?.[rewardBoostLvl]?.coin || 2,
    [rewardBoostLvl]
  );
  const canEarnCoins = rewardLevel >= 3;
  const {
    videoProgress = 0,
    numCoinsEarned = 0,
    numXpEarned = 0
  } = useContentState({
    contentType: 'video',
    contentId: videoId
  });

  const numXpEarnedWithComma = useMemo(
    () => addCommasToNumber(numXpEarned),
    [numXpEarned]
  );
  const numCoinsEarnedWithComma = useMemo(
    () => addCommasToNumber(numCoinsEarned),
    [numCoinsEarned]
  );

  const continuingStatusShown = useMemo(
    () => watching && !started,
    [started, watching]
  );

  const Bar = useMemo(() => {
    if (!userId || !rewardLevel) {
      return null;
    }
    if (started) {
      return playing && xpWarningShown ? (
        <div
          className={css`
            height: 2.7rem;
            font-size: 1.3rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
              height: ${isChat ? '2rem' : '2.7rem'};
            }
          `}
          style={{
            background: Color[warningColor](),
            color: '#fff',
            fontWeight: 'bold',
            display: 'flex',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ marginLeft: '0.7rem' }}>{notGainXPLabel}</div>
        </div>
      ) : (
        <ProgressBar
          className={css`
            margin-top: 0;
            flex-grow: 1;
            height: 2.7rem !important;
            margin-top: 0 !important;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${isChat ? '1rem' : '1.2rem'};
              height: ${isChat ? '2rem' : '2.7rem'} !important;
              font-size: ${isChat ? '0.8rem' : '1.2rem'}!important;
            }
          `}
          progress={videoProgress}
          color={Color[xpLevelColor]()}
          noBorderRadius
        />
      );
    } else {
      return (
        <div
          className={css`
            height: 2.7rem;
            font-size: 1.3rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
              height: ${isChat ? '2rem' : '2.7rem'};
            }
          `}
          style={{
            background: continuingStatusShown
              ? Color.darkBlue()
              : Color[xpLevelColor](),
            color: '#fff',
            fontWeight: 'bold',
            display: 'flex',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ marginLeft: '0.7rem' }}>
            {continuingStatusShown && (
              <span>
                {continueLabel}
                {deviceIsMobile && isChat ? '' : ` ${watchingLabel}`} (
              </span>
            )}
            <span>{addCommasToNumber(xpRewardAmount)} XP</span>
            {rewardLevel > 2 ? (
              <>
                {' '}
                <span>&</span>
                <Icon
                  style={{ marginLeft: '0.5rem' }}
                  icon={['far', 'badge-dollar']}
                />
                <span style={{ marginLeft: '0.2rem' }}>{coinRewardAmount}</span>
              </>
            ) : (
              ''
            )}
            {continuingStatusShown ? (
              <span>{`)`}</span>
            ) : (
              <span> {perMinuteLabel}</span>
            )}
          </div>
        </div>
      );
    }
  }, [
    userId,
    rewardLevel,
    started,
    playing,
    xpWarningShown,
    isChat,
    warningColor,
    videoProgress,
    xpLevelColor,
    continuingStatusShown,
    xpRewardAmount,
    coinRewardAmount
  ]);

  const Stars = useMemo(
    () =>
      [...Array(rewardLevel)].map((elem, index) => (
        <Icon key={index} style={{ verticalAlign: 0 }} icon="star" />
      )),
    [rewardLevel]
  );

  return userId ? (
    <ErrorBoundary componentPath="XPVideoPlayer/XPBar">
      <div
        className={css`
          display: flex;
          margin-top: 1rem;
          align-items: center;
          width: 100%;
          justify-content: space-between;
        `}
      >
        {Bar}
        {rewardLevel ? (
          <div
            className={css`
              height: 2.7rem;
              min-width: ${canEarnCoins ? `1${rewardLevel - 1}rem` : '7rem'};
              margin-left: 1rem;
              display: flex;
              @media (max-width: ${mobileMaxWidth}) {
                min-width: 0;
                max-width: 8.5rem;
                height: ${isChat ? '2rem' : '2.7rem'};
              }
            `}
          >
            <div
              className={css`
                flex-grow: 1;
              `}
            >
              <div
                className={css`
                  height: 100%;
                  width: 100%;
                  display: flex;
                  position: relative;
                  justify-content: center;
                  align-items: center;
                  color: #fff;
                  font-size: 1.3rem;
                  font-weight: bold;
                  background: ${Color[
                    playing && xpWarningShown ? warningColor : xpLevelColor
                  ](reachedMaxWatchDuration ? 0.3 : 1)};
                  cursor: default;
                  @media (max-width: ${mobileMaxWidth}) {
                    flex-grow: 0;
                    width: 5rem;
                    font-size: ${numXpEarned > 0 ? '0.7rem' : '1rem'};
                  }
                `}
                onMouseEnter={
                  reachedMaxWatchDuration ? () => setXPHovered(true) : () => {}
                }
                onMouseLeave={() => setXPHovered(false)}
              >
                {numXpEarned > 0 && !reachedMaxWatchDuration
                  ? `+ ${numXpEarnedWithComma}`
                  : deviceIsMobile
                  ? `${rewardLevel}-STAR`
                  : Stars}
              </div>
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
                  text={`You have earned all the XP you can earn from this video`}
                />
              ) : null}
            </div>
            {canEarnCoins && (
              <div>
                <div
                  onClick={() =>
                    deviceIsMobile ? setCoinHovered((hovered) => !hovered) : {}
                  }
                  onMouseEnter={
                    twinkleCoins > 1000 ? () => setCoinHovered(true) : () => {}
                  }
                  onMouseLeave={() => setCoinHovered(false)}
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
                    background: ${Color.brownOrange(
                      twinkleCoins > 1000 ? 0.3 : 1
                    )};
                    @media (max-width: ${mobileMaxWidth}) {
                      flex-grow: 1;
                      min-width: 3.5rem;
                      font-size: ${numCoinsEarned > 0 && twinkleCoins <= 1000
                        ? '0.7rem'
                        : '1.2rem'};
                    }
                  `}
                >
                  {numCoinsEarned > 0 && twinkleCoins <= 1000 ? (
                    `+ ${numCoinsEarnedWithComma}`
                  ) : (
                    <Icon size="lg" icon={['far', 'badge-dollar']} />
                  )}
                </div>
                {coinHovered && (
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
                    text={`You can no longer earn Twinkle Coins by watching videos because you have more than 1,000 coins`}
                  />
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  ) : null;
}

export default memo(XPBar);
