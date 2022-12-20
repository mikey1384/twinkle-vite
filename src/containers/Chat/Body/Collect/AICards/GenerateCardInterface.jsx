import PropTypes from 'prop-types';
import GradientButton from '~/components/Buttons/GradientButton';

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
          disabled={loading || !canGenerateAICard}
          onClick={onGenerateAICard}
          fontSize="1.5rem"
          mobileFontSize="1.1rem"
        >
          {posting ? 'Summoning...' : 'Summon Card'}
        </GradientButton>
      </div>
    </div>
  );
}
