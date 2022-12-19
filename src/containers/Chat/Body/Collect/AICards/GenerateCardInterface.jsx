import PropTypes from 'prop-types';
import Button from '~/components/Button';

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
        <Button
          filled
          loading={posting}
          disabled={loading || !canGenerateAICard}
          color="green"
          onClick={onGenerateAICard}
        >
          Summon Card
        </Button>
      </div>
    </div>
  );
}
