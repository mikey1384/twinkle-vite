import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { Color, getThemeStyles, mobileMaxWidth } from '~/constants/css';
import { isMobile, isSupermod } from '~/helpers';
import { expectedResponseLength, priceTable } from '~/constants/defaultValues';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import SwitchButton from '~/components/Buttons/SwitchButton';
import PriceText from './PriceText';

const recommendLabel = 'Recommend?';
const yesLabel = 'Yes';
const noLabel = 'No';
const rewardableLabel = 'anyone can reward';
const deviceIsMobile = isMobile(navigator);

const recommendationSurfaceClass = css`
  position: relative;
  display: flex;
  min-height: 6rem;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--ui-border-strong);
  border-radius: 0.8rem;
  background-color: transparent;
  box-shadow: 0 0.28rem 0.9rem rgba(15, 23, 42, 0.08);
  animation: recommendationBorderGlow 1.6s ease-out 1;

  @keyframes recommendationBorderGlow {
    0% {
      border-color: ${Color.darkGold(0.72)};
      background-color: var(
        --recommendation-surface-start-bg,
        ${Color.logoBlue(0.08)}
      );
      box-shadow:
        0 0 0 0.22rem ${Color.darkGold(0.2)},
        0 0.28rem 0.9rem rgba(15, 23, 42, 0.08);
    }

    45% {
      border-color: ${Color.logoBlue(0.58)};
      background-color: var(
        --recommendation-surface-mid-bg,
        ${Color.logoBlue(0.04)}
      );
      box-shadow:
        0 0 0 0.18rem ${Color.logoBlue(0.16)},
        0 0.28rem 0.9rem rgba(15, 23, 42, 0.08);
    }

    100% {
      border-color: var(--ui-border-strong);
      background-color: transparent;
      box-shadow: 0 0.28rem 0.9rem rgba(15, 23, 42, 0.08);
    }
  }
`;

const recommendationRowClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  column-gap: 1.4rem;
  row-gap: 0.8rem;
`;

const recommendationPromptClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  font-weight: bold;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

const recommendationPromptLineClass = css`
  display: flex;
  align-items: center;
  line-height: 1.3;
`;

const recommendationRewardSwitchClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  align-self: flex-start;
  margin-top: 0.7rem;
`;

const recommendationRewardLabelClass = css`
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  font-weight: 600;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;

const recommendationActionsClass = css`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
`;

const recommendationActionGlowClass = css`
  animation: recommendationActionGlow 1.6s ease-out 1;
  background-color: transparent;

  @keyframes recommendationActionGlow {
    0% {
      background-color: var(--recommendation-action-start-bg);
      border-color: var(--recommendation-action-start-color);
      box-shadow: 0 0 0 0.18rem var(--recommendation-action-start-bg);
    }

    45% {
      background-color: transparent;
      border-color: var(--recommendation-action-start-color);
      box-shadow: 0 0 0 0.12rem transparent;
    }

    100% {
      background-color: transparent;
      box-shadow: none;
    }
  }
`;

function getRecommendationActionGlowStyle({
  color,
  glowColor,
  style = {}
}: {
  color: string;
  glowColor: string;
  style?: React.CSSProperties;
}) {
  return {
    ...style,
    '--recommendation-action-start-color': color,
    '--recommendation-action-start-bg': glowColor
  } as React.CSSProperties;
}

export default function RecommendationInterface({
  contentId,
  contentType,
  onHide,
  recommendations,
  rewardLevel,
  content = '',
  rootType,
  style,
  theme,
  uploaderId
}: {
  contentId: number;
  contentType: string;
  onHide: () => void;
  recommendations: any[];
  rewardLevel: number;
  content?: string;
  rootType?: string;
  style?: React.CSSProperties;
  theme?: string;
  uploaderId?: number;
}) {
  const level = useKeyContext((v) => v.myState.level);
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const recommendContent = useAppContext(
    (v) => v.requestHelpers.recommendContent
  );
  const onRecommendContent = useContentContext(
    (v) => v.actions.onRecommendContent
  );

  const expectedContentLength = useMemo(() => {
    if (contentType !== 'comment') {
      return -1;
    }
    return expectedResponseLength(rewardLevel);
  }, [contentType, rewardLevel]);

  const meetsRequirement = useMemo(() => {
    const cleanedContent = (content || '').replace(/[\W_]+/g, '');
    return (
      cleanedContent.length > expectedContentLength &&
      contentType !== 'pass' &&
      contentType !== 'xpChange' &&
      contentType !== 'sharedTopic' &&
      contentType !== 'aiStory' &&
      contentType !== 'build' &&
      contentType !== 'dailyReflection'
    );
  }, [content, contentType, expectedContentLength]);

  const [state, setState] = useState({
    recommending: false,
    rewardDisabled: !meetsRequirement
  });

  const isOnlyRecommendedByStudents = useMemo(() => {
    if (recommendations.length === 0) return false;
    return recommendations.every(
      (recommendation) => !isSupermod(recommendation.level)
    );
  }, [recommendations]);

  const isRecommendedByUser = useMemo(
    () =>
      recommendations.some(
        (recommendation) => recommendation.userId === userId
      ),
    [recommendations, userId]
  );

  const disabled = useMemo(() => {
    return !isRecommendedByUser && twinkleCoins < priceTable.recommendation;
  }, [isRecommendedByUser, twinkleCoins]);

  const switchButtonShown = useMemo(() => {
    const isPassContent =
      contentType === 'pass' ||
      contentType === 'missionPass' ||
      contentType === 'achievementPass';
    return (
      !isRecommendedByUser &&
      isSupermod(level) &&
      !isPassContent &&
      contentType !== 'aiStory' &&
      contentType !== 'build' &&
      contentType !== 'xpChange' &&
      contentType !== 'dailyReflection' &&
      contentType !== 'sharedTopic'
    );
  }, [isRecommendedByUser, level, contentType]);
  const themeName = useMemo(
    () => theme || profileTheme || 'logoBlue',
    [profileTheme, theme]
  );
  const recommendationSurfaceStyle = useMemo(
    () =>
      ({
        ...style,
        '--recommendation-surface-start-bg': Color.gold(),
        '--recommendation-surface-mid-bg': getThemeStyles(themeName, 0.06).bg
      }) as React.CSSProperties,
    [style, themeName]
  );

  return (
    <ErrorBoundary
      className={recommendationSurfaceClass}
      componentPath="RecommendationInterface"
      style={recommendationSurfaceStyle}
    >
      {state.recommending && (
        <Loading
          theme={theme}
          style={{ position: 'absolute', width: '100%', left: 0 }}
        />
      )}
      <div className={recommendationRowClass}>
        <div
          className={recommendationPromptClass}
          style={{
            opacity: state.recommending ? 0 : 1
          }}
        >
          <div className={recommendationPromptLineClass}>
            <div>
              <span>
                {isRecommendedByUser ? (
                  <>
                    <span style={{ color: Color.rose(), fontWeight: 'bold' }}>
                      Cancel
                    </span>{' '}
                    your recommendation?
                  </>
                ) : (
                  recommendLabel
                )}
              </span>
            </div>
            <PriceText isRecommendedByUser={isRecommendedByUser} />
          </div>
          {switchButtonShown && (
            <div className={recommendationRewardSwitchClass}>
              <span className={recommendationRewardLabelClass}>
                {rewardableLabel}
              </span>
              <SwitchButton
                ariaLabel={rewardableLabel}
                small={deviceIsMobile}
                checked={!state.rewardDisabled}
                theme={theme}
                onChange={() =>
                  setState((prevState) => ({
                    ...prevState,
                    rewardDisabled: !prevState.rewardDisabled
                  }))
                }
              />
            </div>
          )}
        </div>
        {!state.recommending && (
          <div className={recommendationActionsClass}>
            <Button
              className={recommendationActionGlowClass}
              disabled={disabled}
              onClick={handleRecommend}
              color="darkBlue"
              variant="outline"
              style={getRecommendationActionGlowStyle({
                color: Color.darkBlue(),
                glowColor: Color.darkBlue(0.1)
              })}
            >
              {yesLabel}
            </Button>
            <Button
              className={recommendationActionGlowClass}
              onClick={onHide}
              style={getRecommendationActionGlowStyle({
                color: Color.rose(),
                glowColor: Color.rose(0.1),
                style: { marginLeft: '0.7rem' }
              })}
              color="rose"
              variant="outline"
            >
              {noLabel}
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleRecommend(attempt = 1, maxAttempts = 3) {
    const cooldown = 3000;
    let isSuccess = false;
    setState((prevState) => ({ ...prevState, recommending: true }));

    const timeout = (ms: number) =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), ms)
      );

    const currentRecommendations =
      !isRecommendedByUser && isOnlyRecommendedByStudents
        ? recommendations
        : [];

    try {
      const response = await Promise.race([
        recommendContent({
          contentId,
          contentType,
          rootType,
          uploaderId,
          currentRecommendations,
          rewardDisabled: state.rewardDisabled,
          shouldRecommend: !isRecommendedByUser
        }),
        timeout(10000)
      ]);
      const { coins, recommendations } = response;
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      if (recommendations) {
        onRecommendContent({ contentId, contentType, recommendations });
      }
      isSuccess = true;
    } catch (error) {
      console.error(error);
      if (attempt < maxAttempts) {
        setTimeout(() => handleRecommend(attempt + 1, maxAttempts), cooldown);
        return;
      }
    } finally {
      if (isSuccess || attempt >= maxAttempts) {
        onHide();
      }
      setState((prevState) => ({ ...prevState, recommending: false }));
    }
  }
}
