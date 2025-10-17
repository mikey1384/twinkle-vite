import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color, wideBorderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import { addCommasToNumber, stringIsEmpty } from '~/helpers/stringHelpers';
import { returnMaxRewards } from '~/constants/defaultValues';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Comment from './Comment';
import ErrorBoundary from '~/components/ErrorBoundary';
import Starmarks from './Starmarks';
import { useKeyContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';

const INITIAL_LOAD_COUNT = 1;
const LOAD_MORE_COUNT = 3;

function RewardStatus({
  contentType,
  contentId,
  className,
  rewardLevel,
  noMarginForEditButton,
  onCommentEdit,
  rewards = [],
  style,
  theme
}: {
  contentType: string;
  contentId: number;
  className?: string;
  rewardLevel: number;
  noMarginForEditButton?: boolean;
  onCommentEdit?: () => void;
  rewards?: any[];
  style?: React.CSSProperties;
  theme?: any;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((theme || profileTheme || 'logoBlue') as ThemeName),
    [profileTheme, theme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const infoColor = useMemo(
    () => themeRoles.info?.color || 'logoBlue',
    [themeRoles]
  );
  const rewardHue = useMemo(
    () => themeRoles.reward?.color || 'orange',
    [themeRoles]
  );
  const starHue = useMemo(
    () => themeRoles.recommendation?.color || 'gold',
    [themeRoles]
  );
  const containerBg = useMemo(
    () =>
      (Color[rewardHue as keyof typeof Color]
        ? Color[rewardHue as keyof typeof Color](0.1)
        : Color.logoBlue(0.1)),
    [rewardHue]
  );
  const containerBorder = useMemo(
    () =>
      (Color[rewardHue as keyof typeof Color]
        ? Color[rewardHue as keyof typeof Color](0.28)
        : Color.logoBlue(0.28)),
    [rewardHue]
  );
  const scopedTheme = themeName;

  const [numLoaded, setNumLoaded] = useState(INITIAL_LOAD_COUNT);

  const sortedRewards = useMemo(() => {
    if (!Array.isArray(rewards)) return [];
    return [...rewards].sort((a, b) => {
      const aHasComment = !stringIsEmpty(a.rewardComment);
      const bHasComment = !stringIsEmpty(b.rewardComment);
      return aHasComment === bHasComment ? 0 : aHasComment ? 1 : -1;
    });
  }, [rewards]);

  const maxRewards = useMemo(
    () => returnMaxRewards({ rewardLevel }),
    [rewardLevel]
  );

  const amountRewarded = useMemo(() => {
    if (!Array.isArray(rewards)) return 0;
    const total = rewards.reduce(
      (prev, reward) => prev + (reward.rewardAmount || 0),
      0
    );
    return Math.min(total, maxRewards);
  }, [maxRewards, rewards]);

  const handleLoadMore = useCallback(() => {
    setNumLoaded((prev) => prev + LOAD_MORE_COUNT);
  }, []);

  useEffect(() => {
    const rewardsWithComment = sortedRewards.filter(
      (reward) => !stringIsEmpty(reward.rewardComment)
    );
    if (rewardsWithComment.length > INITIAL_LOAD_COUNT) {
      setNumLoaded((numLoaded) => Math.max(numLoaded, INITIAL_LOAD_COUNT + 2));
    }
  }, [sortedRewards]);

  if (!Array.isArray(rewards) || rewards.length === 0) return null;

  return (
    <ErrorBoundary componentPath="RewardStatus/index">
      <ScopedTheme theme={scopedTheme}>
        <div
          style={style}
          className={`${className || ''} ${css`
            font-size: 1.3rem;
            padding: 0.6rem 1rem;
            width: calc(100% - 1.2rem);
            margin: 0.6rem;
            color: ${Color.darkBlueGray()};
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            min-height: 3.6rem;
            background: ${containerBg};
            border: 1px solid ${containerBorder};
            border-radius: ${wideBorderRadius};
            @media (max-width: ${mobileMaxWidth}) {
              grid-template-columns: 1fr;
              row-gap: 0.4rem;
              justify-items: center;
            }
          `}`}
        >
          <div
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              background: linear-gradient(
                135deg,
                ${Color[rewardHue as keyof typeof Color](0.9)} 0%,
                ${Color[rewardHue as keyof typeof Color]()} 100%
              );
              color: #fff;
              border-radius: 999px;
              padding: 0.3rem 0.8rem;
              font-weight: 700;
              letter-spacing: 0.2px;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
              background-size: 200% 200%;
              animation: shimmer 6s ease infinite;
              grid-column: 1;
              justify-self: start;

              @keyframes shimmer {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
              @media (max-width: ${mobileMaxWidth}) {
                justify-self: center;
              }
            `}
          >
            <Icon icon={['far', 'badge-dollar']} />
            <span>
              {addCommasToNumber(amountRewarded)} Twinkle
              {amountRewarded === 1 ? '' : 's'}
            </span>
          </div>
          <div
            className={css`
              grid-column: 2;
              justify-self: center;
            `}
          >
            <Starmarks
              stars={amountRewarded}
              color={Color[starHue as keyof typeof Color]()}
              fullWidth={false}
            />
          </div>
        </div>
      </ScopedTheme>
      {numLoaded < sortedRewards.length && (
        <LoadMoreButton
          color={infoColor}
          label={
            sortedRewards.length - numLoaded === 1
              ? 'Show more'
              : `Show more (${sortedRewards.length - numLoaded})`
          }
          filled
          style={{
            fontSize: '1.3rem',
            marginTop: '1rem'
          }}
          onClick={handleLoadMore}
        />
      )}
      {sortedRewards.slice(-numLoaded).map((reward) => (
        <Comment
          key={reward.id}
          contentType={contentType}
          contentId={contentId}
          noMarginForEditButton={noMarginForEditButton}
          reward={reward}
          onEditDone={onCommentEdit}
        />
      ))}
    </ErrorBoundary>
  );
}

export default memo(RewardStatus);
