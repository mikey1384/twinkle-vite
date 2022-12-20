import PropTypes from 'prop-types';
import { useKeyContext } from '~/contexts';
import GradientButton from '~/components/Buttons/GradientButton';
import Icon from '~/components/Icon';

GenerateCardInterface.propTypes = {
  canGenerateAICard: PropTypes.bool,
  loading: PropTypes.bool,
  posting: PropTypes.bool,
  onGenerateAICard: PropTypes.func.isRequired
};

export default function GenerateCardInterface({
  canGenerateAICard,
  loading,
  onGenerateAICard,
  posting
}) {
  const cardPrice = 100;
  const { twinkleCoins } = useKeyContext((v) => v.myState);
  const hasEnoughTwinkleCoins = twinkleCoins >= cardPrice;
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
          disabled={!hasEnoughTwinkleCoins || loading || !canGenerateAICard}
          onClick={onGenerateAICard}
          fontSize="1.5rem"
          mobileFontSize="1.1rem"
        >
          {!canGenerateAICard ? (
            'Need License'
          ) : !hasEnoughTwinkleCoins ? (
            <div>
              <span style={{ marginRight: '0.7rem' }}>Not Enough Coins</span>(
              <Icon
                style={{ fontWeight: 'bold', marginRight: '0.2rem' }}
                icon={['far', 'badge-dollar']}
              />
              {cardPrice})
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
              {cardPrice})
            </div>
          )}
        </GradientButton>
      </div>
    </div>
  );
}
