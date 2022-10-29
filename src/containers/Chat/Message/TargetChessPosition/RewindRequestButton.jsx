import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

RewindRequestButton.propTypes = {
  isMyMessage: PropTypes.bool.isRequired
};

export default function RewindRequestButton({ isMyMessage }) {
  return (
    <div
      style={{
        padding: '0.5rem',
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        border: `1px solid ${Color.black()}`,
        background: Color.white(0.9)
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>
        {isMyMessage
          ? 'Proposing a new game from this position'
          : 'Proposed a new game from this position'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isMyMessage ? (
          <Button style={{ paddingBottom: '0.5rem' }} transparent color="red">
            Cancel
          </Button>
        ) : (
          <div style={{ display: 'flex' }}>
            <Button
              style={{ paddingBottom: '0.5rem' }}
              transparent
              color="green"
            >
              <Icon icon="check" />
              <span style={{ marginLeft: '0.7rem' }}>Accept</span>
            </Button>
            <Button style={{ paddingBottom: '0.5rem' }} transparent color="red">
              <Icon icon="xmark" />
              <span style={{ marginLeft: '0.7rem' }}>Decline</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
