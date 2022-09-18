import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';
import { priceTable } from '~/constants/defaultValues';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import SwitchButton from './Buttons/SwitchButton';
import localize from '~/constants/localize';

const recommendLabel = localize('recommendQ');
const yesLabel = localize('yes');
const noLabel = localize('no');
const rewardableLabel = localize('rewardable');
const deviceIsMobile = isMobile(navigator);

RecommendationInterface.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  onHide: PropTypes.func.isRequired,
  recommendations: PropTypes.array,
  style: PropTypes.object,
  theme: PropTypes.string,
  uploaderId: PropTypes.number
};

const recommendationRewardDisabledByDefault = ['staff', 'teacher'];

export default function RecommendationInterface({
  contentId,
  contentType,
  onHide,
  recommendations,
  style,
  theme,
  uploaderId
}) {
  const { userId, twinkleCoins, authLevel, userType } = useKeyContext(
    (v) => v.myState
  );
  const [recommending, setRecommending] = useState(false);
  const [rewardDisabled, setRewardDisabled] = useState(
    recommendationRewardDisabledByDefault.includes(userType?.toLowerCase?.())
  );
  const [hidden, setHidden] = useState(false);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const recommendContent = useAppContext(
    (v) => v.requestHelpers.recommendContent
  );
  const onRecommendContent = useContentContext(
    (v) => v.actions.onRecommendContent
  );

  const isOnlyRecommendedByStudents = useMemo(() => {
    let result = recommendations.length > 0;
    for (let recommendation of recommendations) {
      if (recommendation.authLevel > 1) {
        return false;
      }
    }
    return result;
  }, [recommendations]);

  const isRecommendedByUser = useMemo(() => {
    return (
      recommendations.filter(
        (recommendation) => recommendation.userId === userId
      ).length > 0
    );
  }, [recommendations, userId]);

  const disabled = useMemo(() => {
    return !isRecommendedByUser && twinkleCoins < priceTable.recommendation;
  }, [isRecommendedByUser, twinkleCoins]);

  const priceText = useMemo(() => {
    return !isRecommendedByUser ? (
      <>
        <span
          style={{
            marginLeft: authLevel > 1 ? 0 : '0.7rem',
            color: Color.darkBlue(),
            fontSize: '1.3rem'
          }}
        >
          (<Icon icon={['far', 'badge-dollar']} /> {priceTable.recommendation})
        </span>
      </>
    ) : null;
  }, [authLevel, isRecommendedByUser]);

  return hidden ? null : (
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
      {recommending && (
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
            opacity: recommending ? 0 : 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: authLevel ? 'column' : 'row',
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
            <div>{priceText}</div>
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
            {!isRecommendedByUser && authLevel > 1 && (
              <SwitchButton
                small={deviceIsMobile}
                checked={!rewardDisabled}
                label={rewardableLabel}
                theme={theme}
                onChange={() => setRewardDisabled((disabled) => !disabled)}
              />
            )}
          </div>
        </div>
        {!recommending && (
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

  async function handleRecommend() {
    setRecommending(true);
    const currentRecommendations =
      !isRecommendedByUser && isOnlyRecommendedByStudents
        ? recommendations
        : [];
    try {
      const { coins, recommendations } = await recommendContent({
        contentId,
        contentType,
        uploaderId,
        currentRecommendations,
        rewardDisabled
      });
      setHidden(true);
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      if (recommendations) {
        onRecommendContent({ contentId, contentType, recommendations });
      }
      onHide();
    } catch (error) {
      console.error(error);
      onHide();
    }
  }
}
