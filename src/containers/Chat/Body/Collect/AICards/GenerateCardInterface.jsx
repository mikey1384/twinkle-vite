import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useKeyContext } from '~/contexts';
import { priceTable } from '~/constants/defaultValues';
import GradientButton from '~/components/Buttons/GradientButton';
import Icon from '~/components/Icon';

GenerateCardInterface.propTypes = {
  numSummoned: PropTypes.number.isRequired,
  canGenerateAICard: PropTypes.bool,
  loading: PropTypes.bool,
  posting: PropTypes.bool,
  onGenerateAICard: PropTypes.func.isRequired
};

export default function GenerateCardInterface({
  numSummoned,
  canGenerateAICard,
  loading,
  onGenerateAICard,
  posting
}) {
  const maxSummoned = useMemo(() => numSummoned >= 20, [numSummoned]);
  const { twinkleCoins } = useKeyContext((v) => v.myState);
  const hasEnoughTwinkleCoins = twinkleCoins >= priceTable.card;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GradientButton
          loading={posting}
          disabled={
            !hasEnoughTwinkleCoins ||
            loading ||
            !canGenerateAICard ||
            maxSummoned
          }
          onClick={onGenerateAICard}
          fontSize="1.5rem"
          mobileFontSize="1.1rem"
        >
          {!canGenerateAICard ? (
            'Need License'
          ) : maxSummoned ? (
            'Daily Limit Reached'
          ) : !hasEnoughTwinkleCoins ? (
            <div>
              <span style={{ marginRight: '0.7rem' }}>Not Enough Coins</span>(
              <Icon
                style={{ fontWeight: 'bold', marginRight: '0.2rem' }}
                icon={['far', 'badge-dollar']}
              />
              {priceTable.card})
            </div>
          ) : posting ? (
            'Summoning...'
          ) : (
            <div>
              <span style={{ marginRight: '0.7rem' }}>Summon Card</span>(
              <Icon
                style={{ fontWeight: 'bold', marginRight: '0.2rem' }}
                icon={['far', 'badge-dollar']}
              />
              {priceTable.card})
            </div>
          )}
        </GradientButton>
      </div>
    </div>
  );
}
