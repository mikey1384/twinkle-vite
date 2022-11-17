import PropTypes from 'prop-types';
import { Color } from '~/constants/css';

StatusInterface.propTypes = {
  statusMessage: PropTypes.string
};

export default function StatusInterface({ statusMessage }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          width: '100%',
          color: '#fff',
          background: Color.black(),
          padding: '1rem'
        }}
      >
        {statusMessage}
      </div>
    </div>
  );
}
