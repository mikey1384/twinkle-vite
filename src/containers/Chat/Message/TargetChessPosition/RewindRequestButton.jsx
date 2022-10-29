import PropTypes from 'prop-types';
import { Color } from '~/constants/css';

RewindRequestButton.propTypes = {
  isMyMessage: PropTypes.bool.isRequired
};

export default function RewindRequestButton({ isMyMessage }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        border: `1px solid ${Color.black()}`,
        background: '#fff'
      }}
    >
      {isMyMessage ? 'Cancel proposal' : 'Accept?'}
    </div>
  );
}
