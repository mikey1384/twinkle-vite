import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import { isMobile, isSupermod } from '~/helpers';
import { expectedResponseLength, priceTable } from '~/constants/defaultValues';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import SwitchButton from '~/components/Buttons/SwitchButton';
import localize from '~/constants/localize';
import PriceText from './PriceText';

const recommendLabel = localize('recommendQ');
const yesLabel = localize('yes');
const noLabel = localize('no');
const rewardableLabel = localize('rewardable');
const deviceIsMobile = isMobile(navigator);

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
      contentType !== 'xpChange'
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
    return (
      !isRecommendedByUser &&
      isSupermod(level) &&
      contentType !== 'pass' &&
      contentType !== 'aiStory' &&
      contentType !== 'xpChange'
    );
  }, [isRecommendedByUser, level, contentType]);

  return (
    <ErrorBoundary
      componentPath="RecommendationInterface"
      style={{
        position: 'relative',
        border: `1px ${Color.borderGray()} solid`,
        borderLeft: 'none',
        borderRight: 'none',
        marginBottom: '1rem',
        padding: '1rem',
        display: 'flex',
        minHeight: '6rem',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style
      }}
    >
      {state.recommending && (
        <Loading
          theme={theme}
          style={{ position: 'absolute', width: '100%', left: 0 }}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
            }
          `}
          style={{
            fontWeight: 'bold',
            opacity: state.recommending ? 0 : 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: switchButtonShown ? 'column' : 'row',
              alignItems: 'center',
              lineHeight: 1.3
            }}
          >
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
            <PriceText
              isRecommendedByUser={isRecommendedByUser}
              switchButtonShown={switchButtonShown}
            />
          </div>
          <div
            className={css`
              margin-left: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 2rem;
                margin-right: 1rem;
              }
            `}
          >
            {switchButtonShown && (
              <SwitchButton
                small={deviceIsMobile}
                checked={!state.rewardDisabled}
                label={rewardableLabel}
                theme={theme}
                onChange={() =>
                  setState((prevState) => ({
                    ...prevState,
                    rewardDisabled: !prevState.rewardDisabled
                  }))
                }
              />
            )}
          </div>
        </div>
        {!state.recommending && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              disabled={disabled}
              onClick={handleRecommend}
              color="darkBlue"
              skeuomorphic
            >
              {yesLabel}
            </Button>
            <Button
              onClick={onHide}
              style={{ marginLeft: '0.7rem' }}
              color="rose"
              skeuomorphic
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
          rewardDisabled: state.rewardDisabled
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
